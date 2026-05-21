// ArchLens — Article Curator service
// Implemented in Task 7.1

import Database from 'better-sqlite3';
import RSSParser from 'rss-parser';
import * as crypto from 'crypto';
import { NetworkError } from '../errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArticleCategory =
  | 'architecture'
  | 'cloud'
  | 'cybersecurity'
  | 'government-digital'
  | 'enterprise-tech';

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedDate: Date;
  summary: string;
  category: ArticleCategory;
}

export interface FeedConfig {
  url: string;
  source: string;
  category: ArticleCategory;
}

export interface FeedsFile {
  feeds: FeedConfig[];
}

/** Returned alongside cached articles when the data may be stale. */
export interface CachedResult {
  articles: Article[];
  stale: boolean;
  lastFetchedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Articles older than this are purged from the cache. */
const CACHE_RETENTION_HOURS = 48;

/** Default daily refresh time: 07:00. */
const DEFAULT_REFRESH_HOUR = 7;
const DEFAULT_REFRESH_MINUTE = 0;

// ---------------------------------------------------------------------------
// ArticleCurator
// ---------------------------------------------------------------------------

export class ArticleCurator {
  private db: Database.Database;
  private parser: RSSParser;
  private feeds: FeedConfig[];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private refreshHour: number = DEFAULT_REFRESH_HOUR;
  private refreshMinute: number = DEFAULT_REFRESH_MINUTE;

  constructor(db: Database.Database, feeds: FeedConfig[], parser?: RSSParser) {
    this.db = db;
    this.feeds = feeds;
    this.parser = parser ?? new RSSParser();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Returns articles published within the last 24 hours.
   * Attempts a refresh if the cache is empty or stale, falling back to
   * cached data with a staleness indicator on network failure.
   */
  async getDaily(): Promise<CachedResult> {
    const cached = this.getCachedRecent();
    if (cached.length > 0) {
      return { articles: cached, stale: false, lastFetchedAt: this.getLastFetchedAt() };
    }

    // Cache is empty — try fetching
    try {
      const articles = await this.refresh();
      const recent = this.filterRecent(articles);
      return { articles: recent, stale: false, lastFetchedAt: this.getLastFetchedAt() };
    } catch {
      // Network failure — serve whatever we have
      const all = this.getCached();
      return {
        articles: all,
        stale: all.length > 0,
        lastFetchedAt: this.getLastFetchedAt(),
      };
    }
  }

  /**
   * Fetches articles from all configured RSS feeds, caches them in SQLite,
   * and purges entries older than 48 hours.
   *
   * @throws NetworkError if all feeds fail.
   */
  async refresh(): Promise<Article[]> {
    const allArticles: Article[] = [];
    let anySuccess = false;

    for (const feed of this.feeds) {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        const articles = (parsed.items ?? []).map((item) =>
          this.mapFeedItem(item, feed),
        );
        allArticles.push(...articles);
        anySuccess = true;
      } catch {
        // Individual feed failure — continue with others
      }
    }

    if (!anySuccess) {
      throw new NetworkError('Failed to fetch any RSS feeds');
    }

    this.cacheArticles(allArticles);
    this.purgeOldArticles();

    return allArticles;
  }

  /**
   * Returns all cached articles (no date filter), ordered by published date
   * descending.
   */
  getCached(): Article[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, source, url, published_date, summary, category
         FROM articles
         ORDER BY published_date DESC`,
      )
      .all() as ArticleRow[];

    return rows.map(rowToArticle);
  }

  /**
   * Configures the daily auto-refresh time and (re)starts the scheduler.
   */
  setRefreshTime(hour: number, minute: number): void {
    this.refreshHour = hour;
    this.refreshMinute = minute;
    this.startScheduler();
  }

  /**
   * Starts the daily auto-refresh scheduler. Checks every 60 seconds
   * whether the configured refresh time has been reached.
   */
  startScheduler(): void {
    this.stopScheduler();

    this.refreshTimer = setInterval(() => {
      const now = new Date();
      if (
        now.getHours() === this.refreshHour &&
        now.getMinutes() === this.refreshMinute
      ) {
        this.refresh().catch(() => {
          // Swallow — cached articles remain available
        });
      }
    }, 60_000);
  }

  /**
   * Stops the auto-refresh scheduler.
   */
  stopScheduler(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Returns cached articles published within the last 24 hours. */
  private getCachedRecent(): Article[] {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = this.db
      .prepare(
        `SELECT id, title, source, url, published_date, summary, category
         FROM articles
         WHERE published_date >= ?
         ORDER BY published_date DESC`,
      )
      .all(cutoff) as ArticleRow[];

    return rows.map(rowToArticle);
  }

  /** Filters an in-memory article list to the last 24 hours. */
  private filterRecent(articles: Article[]): Article[] {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return articles.filter((a) => a.publishedDate.getTime() >= cutoff);
  }

  /** Returns the most recent `fetched_at` timestamp, or null. */
  private getLastFetchedAt(): Date | null {
    const row = this.db
      .prepare('SELECT MAX(fetched_at) as latest FROM articles')
      .get() as { latest: string | null } | undefined;

    return row?.latest ? new Date(row.latest) : null;
  }

  /** Upserts articles into the cache table. */
  private cacheArticles(articles: Article[]): void {
    const upsert = this.db.prepare(
      `INSERT INTO articles (id, title, source, url, published_date, summary, category, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(url) DO UPDATE SET
         title = excluded.title,
         summary = excluded.summary,
         fetched_at = excluded.fetched_at`,
    );

    const runAll = this.db.transaction(() => {
      for (const article of articles) {
        upsert.run(
          article.id,
          article.title,
          article.source,
          article.url,
          article.publishedDate.toISOString(),
          article.summary,
          article.category,
        );
      }
    });

    runAll();
  }

  /** Removes articles older than 48 hours from the cache. */
  private purgeOldArticles(): void {
    const cutoff = new Date(
      Date.now() - CACHE_RETENTION_HOURS * 60 * 60 * 1000,
    ).toISOString();

    this.db
      .prepare('DELETE FROM articles WHERE fetched_at < ?')
      .run(cutoff);
  }

  /** Maps an RSS feed item to an Article. */
  private mapFeedItem(
    item: RSSParser.Item,
    feed: FeedConfig,
  ): Article {
    const url = item.link ?? '';
    return {
      id: crypto
        .createHash('sha256')
        .update(url || item.title || crypto.randomUUID())
        .digest('hex')
        .slice(0, 16),
      title: item.title ?? 'Untitled',
      source: feed.source,
      url,
      publishedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      summary: item.contentSnippet?.slice(0, 300) ?? item.content?.slice(0, 300) ?? '',
      category: feed.category,
    };
  }
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

interface ArticleRow {
  id: string;
  title: string;
  source: string;
  url: string;
  published_date: string;
  summary: string | null;
  category: string;
}

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    url: row.url,
    publishedDate: new Date(row.published_date),
    summary: row.summary ?? '',
    category: row.category as ArticleCategory,
  };
}
