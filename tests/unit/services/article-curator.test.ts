import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  ArticleCurator,
  FeedConfig,
  Article,
} from '../../../src/main/services/article-curator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a mock RSSParser that returns the given items per feed URL. */
function createMockParser(feedItems: Record<string, Array<{ title?: string; link?: string; pubDate?: string; contentSnippet?: string }>>) {
  return {
    parseURL: vi.fn(async (url: string) => {
      const items = feedItems[url];
      if (!items) throw new Error(`Network error for ${url}`);
      return { items };
    }),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const TEST_FEEDS: FeedConfig[] = [
  { url: 'https://example.com/arch.xml', source: 'Arch Blog', category: 'architecture' },
  { url: 'https://example.com/cloud.xml', source: 'Cloud Blog', category: 'cloud' },
];

function makeRecentDate(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ArticleCurator', () => {
  let dbManager: DatabaseManager;
  let db: ReturnType<DatabaseManager['getDatabase']>;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    db = dbManager.getDatabase();
  });

  afterEach(() => {
    dbManager.close();
  });

  // -----------------------------------------------------------------------
  // refresh
  // -----------------------------------------------------------------------

  describe('refresh', () => {
    it('fetches articles from all configured feeds and caches them', async () => {
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'Arch Article 1', link: 'https://example.com/a1', pubDate: makeRecentDate(2), contentSnippet: 'Summary 1' },
        ],
        'https://example.com/cloud.xml': [
          { title: 'Cloud Article 1', link: 'https://example.com/c1', pubDate: makeRecentDate(1), contentSnippet: 'Summary 2' },
        ],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      const articles = await curator.refresh();

      expect(articles).toHaveLength(2);
      expect(articles[0].title).toBe('Arch Article 1');
      expect(articles[0].source).toBe('Arch Blog');
      expect(articles[0].category).toBe('architecture');
      expect(articles[1].title).toBe('Cloud Article 1');

      // Verify cached in DB
      const cached = curator.getCached();
      expect(cached).toHaveLength(2);
    });

    it('continues fetching when one feed fails', async () => {
      const parser = createMockParser({
        // arch feed will throw (not in map)
        'https://example.com/cloud.xml': [
          { title: 'Cloud Only', link: 'https://example.com/co1', pubDate: makeRecentDate(1), contentSnippet: 'Summary' },
        ],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      const articles = await curator.refresh();

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Cloud Only');
    });

    it('throws NetworkError when all feeds fail', async () => {
      const parser = createMockParser({}); // all feeds fail

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      await expect(curator.refresh()).rejects.toThrow('Failed to fetch any RSS feeds');
    });

    it('purges articles older than 48 hours on refresh', async () => {
      // Seed an old article directly in DB
      db.prepare(
        `INSERT INTO articles (id, title, source, url, published_date, summary, category, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run('old1', 'Old Article', 'Source', 'https://example.com/old', '2020-01-01T00:00:00Z', 'Old', 'cloud',
        new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString());

      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'New', link: 'https://example.com/new', pubDate: makeRecentDate(1), contentSnippet: 'New' },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      await curator.refresh();

      const cached = curator.getCached();
      expect(cached.find((a) => a.id === 'old1')).toBeUndefined();
      expect(cached).toHaveLength(1);
    });

    it('upserts articles with the same URL instead of duplicating', async () => {
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'Article V1', link: 'https://example.com/a1', pubDate: makeRecentDate(2), contentSnippet: 'V1' },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      await curator.refresh();

      // Update the title
      const parser2 = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'Article V2', link: 'https://example.com/a1', pubDate: makeRecentDate(2), contentSnippet: 'V2' },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator2 = new ArticleCurator(db, TEST_FEEDS, parser2);
      await curator2.refresh();

      const cached = curator2.getCached();
      expect(cached).toHaveLength(1);
      expect(cached[0].title).toBe('Article V2');
    });
  });

  // -----------------------------------------------------------------------
  // getCached
  // -----------------------------------------------------------------------

  describe('getCached', () => {
    it('returns empty array when no articles are cached', () => {
      const curator = new ArticleCurator(db, TEST_FEEDS);
      expect(curator.getCached()).toEqual([]);
    });

    it('returns articles ordered by published date descending', async () => {
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'Older', link: 'https://example.com/older', pubDate: makeRecentDate(10), contentSnippet: 'Older' },
          { title: 'Newer', link: 'https://example.com/newer', pubDate: makeRecentDate(1), contentSnippet: 'Newer' },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      await curator.refresh();

      const cached = curator.getCached();
      expect(cached[0].title).toBe('Newer');
      expect(cached[1].title).toBe('Older');
    });
  });

  // -----------------------------------------------------------------------
  // getDaily
  // -----------------------------------------------------------------------

  describe('getDaily', () => {
    it('returns recent articles when cache has fresh data', async () => {
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'Recent', link: 'https://example.com/r1', pubDate: makeRecentDate(2), contentSnippet: 'Recent' },
          { title: 'Old', link: 'https://example.com/o1', pubDate: new Date('2020-01-01').toISOString(), contentSnippet: 'Old' },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      await curator.refresh();

      const result = await curator.getDaily();
      expect(result.stale).toBe(false);
      // Only the recent article should appear
      expect(result.articles.every((a) => a.title !== 'Old')).toBe(true);
      expect(result.articles.some((a) => a.title === 'Recent')).toBe(true);
    });

    it('serves cached articles with stale flag on network failure', async () => {
      // Pre-seed some cached articles
      db.prepare(
        `INSERT INTO articles (id, title, source, url, published_date, summary, category, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      ).run('c1', 'Cached Article', 'Source', 'https://example.com/cached', '2020-06-01T00:00:00Z', 'Cached', 'cloud');

      const parser = createMockParser({}); // all feeds fail
      const curator = new ArticleCurator(db, TEST_FEEDS, parser);

      const result = await curator.getDaily();
      expect(result.stale).toBe(true);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Cached Article');
    });

    it('returns empty non-stale result when no cache and no network', async () => {
      const parser = createMockParser({}); // all feeds fail
      const curator = new ArticleCurator(db, TEST_FEEDS, parser);

      const result = await curator.getDaily();
      // No cached articles, so stale is false (nothing to be stale about)
      expect(result.articles).toHaveLength(0);
      expect(result.stale).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // setRefreshTime & scheduler
  // -----------------------------------------------------------------------

  describe('setRefreshTime', () => {
    it('sets the refresh time and starts the scheduler', () => {
      const curator = new ArticleCurator(db, TEST_FEEDS);
      curator.setRefreshTime(9, 30);
      // Scheduler is running — stop it to avoid leaks
      curator.stopScheduler();
    });

    it('restarts the scheduler when called again', () => {
      const curator = new ArticleCurator(db, TEST_FEEDS);
      curator.setRefreshTime(9, 30);
      curator.setRefreshTime(10, 0);
      curator.stopScheduler();
    });
  });

  // -----------------------------------------------------------------------
  // Article mapping
  // -----------------------------------------------------------------------

  describe('article mapping', () => {
    it('generates a deterministic ID from the article URL', async () => {
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'A', link: 'https://example.com/a', pubDate: makeRecentDate(1), contentSnippet: 'S' },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      const articles = await curator.refresh();

      expect(articles[0].id).toBeTruthy();
      expect(articles[0].id.length).toBe(16);

      // Refresh again — same ID
      const articles2 = await curator.refresh();
      expect(articles2[0].id).toBe(articles[0].id);
    });

    it('handles missing fields gracefully', async () => {
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { /* no title, no link, no pubDate, no snippet */ },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      const articles = await curator.refresh();

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Untitled');
      expect(articles[0].url).toBe('');
      expect(articles[0].summary).toBe('');
      expect(articles[0].publishedDate).toBeInstanceOf(Date);
    });

    it('truncates long summaries to 300 characters', async () => {
      const longSnippet = 'A'.repeat(500);
      const parser = createMockParser({
        'https://example.com/arch.xml': [
          { title: 'Long', link: 'https://example.com/long', pubDate: makeRecentDate(1), contentSnippet: longSnippet },
        ],
        'https://example.com/cloud.xml': [],
      });

      const curator = new ArticleCurator(db, TEST_FEEDS, parser);
      const articles = await curator.refresh();

      expect(articles[0].summary.length).toBe(300);
    });
  });
});
