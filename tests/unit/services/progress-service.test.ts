import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  ProgressService,
  ProgressSummary,
  TimelineEntry,
  JournalEntry,
  ALL_CATEGORIES,
} from '../../../src/main/services/progress-service';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function insertModuleCompletion(
  db: ReturnType<DatabaseManager['getDatabase']>,
  moduleId: string,
  moduleType: 'learning' | 'diagram',
  completedAt?: string,
): void {
  db.prepare(
    `INSERT INTO module_completions (id, module_id, module_type, completed_at)
     VALUES (?, ?, ?, ?)`,
  ).run(crypto.randomUUID(), moduleId, moduleType, completedAt ?? new Date().toISOString());
}

function insertCertification(
  db: ReturnType<DatabaseManager['getDatabase']>,
  name: string,
  dateEarned?: string,
): void {
  db.prepare(
    `INSERT INTO certifications (id, name, provider, date_earned)
     VALUES (?, ?, ?, ?)`,
  ).run(crypto.randomUUID(), name, 'AWS', dateEarned ?? new Date().toISOString());
}

function insertArticleAndRead(
  db: ReturnType<DatabaseManager['getDatabase']>,
  title: string,
  readAt?: string,
): void {
  const articleId = crypto.randomUUID();
  const url = `https://example.com/${articleId}`;
  db.prepare(
    `INSERT INTO articles (id, title, source, url, published_date, summary, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(articleId, title, 'Test Source', url, new Date().toISOString(), 'Summary', 'architecture');

  db.prepare(
    `INSERT INTO article_reads (id, article_id, read_at)
     VALUES (?, ?, ?)`,
  ).run(crypto.randomUUID(), articleId, readAt ?? new Date().toISOString());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProgressService', () => {
  let dbManager: DatabaseManager;
  let service: ProgressService;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    service = new ProgressService(dbManager.getDatabase());
  });

  afterEach(() => {
    dbManager.close();
  });

  // -----------------------------------------------------------------------
  // getSummary
  // -----------------------------------------------------------------------

  describe('getSummary', () => {
    it('returns zero counts when database is empty', () => {
      const summary = service.getSummary();
      expect(summary.totalModulesCompleted).toBe(0);
      expect(summary.totalCertificationsEarned).toBe(0);
      expect(summary.totalArticlesRead).toBe(0);
      expect(summary.diagramModulesCompleted).toBe(0);
      for (const cat of ALL_CATEGORIES) {
        expect(summary.completionRates[cat]).toBe(0);
      }
    });

    it('counts learning module completions', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning');
      insertModuleCompletion(db, 'aws-well-architected/02-sec', 'learning');
      insertModuleCompletion(db, 'gds-service-standard/01-users', 'learning');

      const summary = service.getSummary();
      expect(summary.totalModulesCompleted).toBe(3);
    });

    it('counts diagram module completions separately', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'archimate/01-intro', 'diagram');
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning');

      const summary = service.getSummary();
      expect(summary.totalModulesCompleted).toBe(1);
      expect(summary.diagramModulesCompleted).toBe(1);
    });

    it('counts certifications', () => {
      const db = dbManager.getDatabase();
      insertCertification(db, 'AWS Solutions Architect');
      insertCertification(db, 'TOGAF 9');

      const summary = service.getSummary();
      expect(summary.totalCertificationsEarned).toBe(2);
    });

    it('counts article reads', () => {
      const db = dbManager.getDatabase();
      insertArticleAndRead(db, 'Article 1');
      insertArticleAndRead(db, 'Article 2');
      insertArticleAndRead(db, 'Article 3');

      const summary = service.getSummary();
      expect(summary.totalArticlesRead).toBe(3);
    });

    it('computes completion rates per learning category', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning');
      insertModuleCompletion(db, 'aws-well-architected/02-sec', 'learning');
      insertModuleCompletion(db, 'gds-service-standard/01-users', 'learning');

      const summary = service.getSummary();
      expect(summary.completionRates['aws-well-architected']).toBe(2);
      expect(summary.completionRates['gds-service-standard']).toBe(1);
      expect(summary.completionRates['togaf']).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getTimeline
  // -----------------------------------------------------------------------

  describe('getTimeline', () => {
    it('returns empty array when no activity exists', () => {
      const timeline = service.getTimeline('monthly');
      expect(timeline).toEqual([]);
    });

    it('includes module completions within the period', () => {
      const db = dbManager.getDatabase();
      const recent = new Date().toISOString();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning', recent);

      const timeline = service.getTimeline('weekly');
      expect(timeline.length).toBe(1);
      expect(timeline[0].type).toBe('module');
      expect(timeline[0].title).toBe('aws-well-architected/01-ops');
      expect(timeline[0].category).toBe('aws-well-architected');
    });

    it('includes diagram module completions with correct type', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'archimate/01-intro', 'diagram', new Date().toISOString());

      const timeline = service.getTimeline('weekly');
      expect(timeline.length).toBe(1);
      expect(timeline[0].type).toBe('diagram-module');
    });

    it('includes certifications within the period', () => {
      const db = dbManager.getDatabase();
      insertCertification(db, 'AWS SA Pro', new Date().toISOString());

      const timeline = service.getTimeline('monthly');
      const certEntries = timeline.filter((e) => e.type === 'certification');
      expect(certEntries.length).toBe(1);
      expect(certEntries[0].title).toBe('AWS SA Pro');
    });

    it('includes article reads within the period', () => {
      const db = dbManager.getDatabase();
      insertArticleAndRead(db, 'Cloud Architecture Trends', new Date().toISOString());

      const timeline = service.getTimeline('monthly');
      const articleEntries = timeline.filter((e) => e.type === 'article');
      expect(articleEntries.length).toBe(1);
      expect(articleEntries[0].title).toBe('Cloud Architecture Trends');
    });

    it('includes journal entries within the period', () => {
      service.addJournalEntry('Learned about TOGAF ADM', ['togaf']);

      const timeline = service.getTimeline('weekly');
      const journalEntries = timeline.filter((e) => e.type === 'journal');
      expect(journalEntries.length).toBe(1);
      expect(journalEntries[0].title).toContain('Learned about TOGAF ADM');
    });

    it('excludes entries outside the period', () => {
      const db = dbManager.getDatabase();
      // Insert a completion dated 60 days ago
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning', oldDate);

      const timeline = service.getTimeline('weekly');
      expect(timeline.length).toBe(0);

      const monthlyTimeline = service.getTimeline('monthly');
      expect(monthlyTimeline.length).toBe(0);

      // But quarterly should include it
      const quarterlyTimeline = service.getTimeline('quarterly');
      expect(quarterlyTimeline.length).toBe(1);
    });

    it('returns entries sorted by date descending', () => {
      const db = dbManager.getDatabase();
      const now = Date.now();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning', new Date(now - 3000).toISOString());
      insertCertification(db, 'TOGAF 9', new Date(now - 1000).toISOString());
      insertArticleAndRead(db, 'Article', new Date(now - 2000).toISOString());

      const timeline = service.getTimeline('weekly');
      expect(timeline.length).toBe(3);
      // Most recent first
      for (let i = 0; i < timeline.length - 1; i++) {
        expect(timeline[i].date.getTime()).toBeGreaterThanOrEqual(timeline[i + 1].date.getTime());
      }
    });
  });

  // -----------------------------------------------------------------------
  // addJournalEntry
  // -----------------------------------------------------------------------

  describe('addJournalEntry', () => {
    it('creates a journal entry with tags', () => {
      const entry = service.addJournalEntry('Completed TOGAF module', ['togaf', 'learning']);
      expect(entry.id).toBeTruthy();
      expect(entry.content).toBe('Completed TOGAF module');
      expect(entry.tags).toEqual(['togaf', 'learning']);
      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('creates a journal entry with no tags', () => {
      const entry = service.addJournalEntry('Quick note', []);
      expect(entry.id).toBeTruthy();
      expect(entry.content).toBe('Quick note');
      expect(entry.tags).toEqual([]);
    });

    it('persists the entry in the database', () => {
      const entry = service.addJournalEntry('Persisted note', ['test']);

      const row = dbManager.getDatabase()
        .prepare('SELECT * FROM journal_entries WHERE id = ?')
        .get(entry.id) as { id: string; content: string; created_at: string } | undefined;

      expect(row).toBeDefined();
      expect(row!.content).toBe('Persisted note');
    });

    it('persists tags in the journal_tags table', () => {
      const entry = service.addJournalEntry('Tagged note', ['alpha', 'beta']);

      const tags = dbManager.getDatabase()
        .prepare('SELECT tag FROM journal_tags WHERE journal_id = ? ORDER BY tag')
        .all(entry.id) as Array<{ tag: string }>;

      expect(tags.map((t) => t.tag)).toEqual(['alpha', 'beta']);
    });
  });

  // -----------------------------------------------------------------------
  // getJournalEntries
  // -----------------------------------------------------------------------

  describe('getJournalEntries', () => {
    it('returns all entries when no filter is provided', () => {
      service.addJournalEntry('Entry 1', ['a']);
      service.addJournalEntry('Entry 2', ['b']);

      const entries = service.getJournalEntries();
      expect(entries.length).toBe(2);
    });

    it('returns entries ordered by created_at descending', () => {
      const db = dbManager.getDatabase();
      const older = new Date(Date.now() - 10_000).toISOString();
      const newer = new Date(Date.now()).toISOString();

      db.prepare('INSERT INTO journal_entries (id, content, created_at) VALUES (?, ?, ?)').run('j1', 'First', older);
      db.prepare('INSERT INTO journal_entries (id, content, created_at) VALUES (?, ?, ?)').run('j2', 'Second', newer);

      const entries = service.getJournalEntries();
      // Most recent first
      expect(entries[0].content).toBe('Second');
      expect(entries[1].content).toBe('First');
    });

    it('filters by tags', () => {
      service.addJournalEntry('Tagged A', ['alpha']);
      service.addJournalEntry('Tagged B', ['beta']);
      service.addJournalEntry('Tagged Both', ['alpha', 'beta']);

      const alphaEntries = service.getJournalEntries({ tags: ['alpha'] });
      expect(alphaEntries.length).toBe(2);
      expect(alphaEntries.every((e) => e.tags.includes('alpha'))).toBe(true);
    });

    it('filters by date range', () => {
      const now = new Date();
      service.addJournalEntry('Recent', []);

      const future = new Date(now.getTime() + 60_000);
      const past = new Date(now.getTime() - 60_000);

      const entries = service.getJournalEntries({ from: past, to: future });
      expect(entries.length).toBe(1);
    });

    it('returns empty array when no entries match filter', () => {
      service.addJournalEntry('Entry', ['x']);

      const entries = service.getJournalEntries({ tags: ['nonexistent'] });
      expect(entries.length).toBe(0);
    });

    it('includes tags for each returned entry', () => {
      service.addJournalEntry('With tags', ['tag1', 'tag2']);

      const entries = service.getJournalEntries();
      expect(entries[0].tags).toContain('tag1');
      expect(entries[0].tags).toContain('tag2');
    });
  });

  // -----------------------------------------------------------------------
  // exportReport
  // -----------------------------------------------------------------------

  describe('exportReport', () => {
    it('generates a non-empty report string', () => {
      const report = service.exportReport('monthly');
      expect(report.length).toBeGreaterThan(0);
    });

    it('includes key metrics in the report', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning');
      insertCertification(db, 'AWS SA');
      insertArticleAndRead(db, 'Article 1');

      const report = service.exportReport('monthly');
      expect(report).toContain('Total modules completed: 1');
      expect(report).toContain('Total certifications earned: 1');
      expect(report).toContain('Total articles read: 1');
    });

    it('includes the period label', () => {
      const report = service.exportReport('quarterly');
      const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
      expect(report).toContain(`Q${quarter}`);
    });

    it('includes category completion rates', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning');

      const report = service.exportReport('monthly');
      expect(report).toContain('aws-well-architected: 1 modules');
    });

    it('includes activity timeline entries', () => {
      const db = dbManager.getDatabase();
      insertModuleCompletion(db, 'aws-well-architected/01-ops', 'learning', new Date().toISOString());

      const report = service.exportReport('monthly');
      expect(report).toContain('module:');
      expect(report).toContain('aws-well-architected/01-ops');
    });

    it('shows no activity message when period is empty', () => {
      const report = service.exportReport('monthly');
      expect(report).toContain('No activity recorded in this period.');
    });

    it('includes ArchLens branding', () => {
      const report = service.exportReport('monthly');
      expect(report).toContain('ArchLens Progress Report');
      expect(report).toContain('Generated by ArchLens');
    });

    it('generates yearly report', () => {
      const report = service.exportReport('yearly');
      expect(report).toContain(String(new Date().getFullYear()));
    });
  });
});
