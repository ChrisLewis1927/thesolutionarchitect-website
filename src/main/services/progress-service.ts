// ArchLens — Progress Dashboard service
// Implemented in Task 12.1

import Database from 'better-sqlite3';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LearningCategory =
  | 'aws-well-architected'
  | 'azure-well-architected'
  | 'togaf'
  | 'gds-service-standard'
  | 'secure-by-design'
  | 'zero-trust'
  | 'enterprise-architecture'
  | 'solution-architecture';

export const ALL_CATEGORIES: LearningCategory[] = [
  'aws-well-architected',
  'azure-well-architected',
  'togaf',
  'gds-service-standard',
  'secure-by-design',
  'zero-trust',
  'enterprise-architecture',
  'solution-architecture',
];

export interface ProgressSummary {
  totalModulesCompleted: number;
  totalCertificationsEarned: number;
  totalArticlesRead: number;
  completionRates: Record<LearningCategory, number>;
  diagramModulesCompleted: number;
}

export interface TimelineEntry {
  date: Date;
  type: 'module' | 'certification' | 'article' | 'journal' | 'diagram-module';
  title: string;
  category?: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

export interface JournalFilter {
  tags?: string[];
  from?: Date;
  to?: Date;
}

// ---------------------------------------------------------------------------
// Internal row types
// ---------------------------------------------------------------------------

interface CountRow {
  count: number;
}

interface CategoryCountRow {
  category: string;
  count: number;
}

interface ModuleCompletionRow {
  module_id: string;
  module_type: string;
  completed_at: string;
}

interface CertificationRow {
  id: string;
  name: string;
  date_earned: string;
}

interface ArticleReadRow {
  article_id: string;
  read_at: string;
  title: string;
}

interface JournalRow {
  id: string;
  content: string;
  created_at: string;
}

interface JournalTagRow {
  tag: string;
}

// ---------------------------------------------------------------------------
// ProgressService
// ---------------------------------------------------------------------------

export class ProgressService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Aggregates progress counts from module_completions, certifications,
   * and article_reads tables.
   */
  getSummary(): ProgressSummary {
    const totalModulesCompleted = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM module_completions WHERE module_type = 'learning'")
        .get() as CountRow
    ).count;

    const totalCertificationsEarned = (
      this.db.prepare('SELECT COUNT(*) as count FROM certifications').get() as CountRow
    ).count;

    const totalArticlesRead = (
      this.db.prepare('SELECT COUNT(*) as count FROM article_reads').get() as CountRow
    ).count;

    const diagramModulesCompleted = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM module_completions WHERE module_type = 'diagram'")
        .get() as CountRow
    ).count;

    // Completion rates per learning category.
    // module_id format is "category/filename", so we extract the category prefix.
    const categoryRows = this.db
      .prepare(
        `SELECT SUBSTR(module_id, 1, INSTR(module_id, '/') - 1) as category, COUNT(*) as count
         FROM module_completions
         WHERE module_type = 'learning' AND INSTR(module_id, '/') > 0
         GROUP BY category`,
      )
      .all() as CategoryCountRow[];

    const completionRates = {} as Record<LearningCategory, number>;
    for (const cat of ALL_CATEGORIES) {
      completionRates[cat] = 0;
    }
    for (const row of categoryRows) {
      if (ALL_CATEGORIES.includes(row.category as LearningCategory)) {
        completionRates[row.category as LearningCategory] = row.count;
      }
    }

    return {
      totalModulesCompleted,
      totalCertificationsEarned,
      totalArticlesRead,
      completionRates,
      diagramModulesCompleted,
    };
  }

  /**
   * Returns a timeline of learning activity filtered by period.
   * Aggregates entries from module_completions, certifications,
   * article_reads, and journal_entries.
   */
  getTimeline(period: 'weekly' | 'monthly' | 'quarterly'): TimelineEntry[] {
    const cutoff = this.getPeriodCutoff(period);
    const cutoffISO = cutoff.toISOString();
    const entries: TimelineEntry[] = [];

    // Learning module completions
    const moduleRows = this.db
      .prepare(
        `SELECT module_id, module_type, completed_at
         FROM module_completions
         WHERE completed_at >= ?
         ORDER BY completed_at DESC`,
      )
      .all(cutoffISO) as ModuleCompletionRow[];

    for (const row of moduleRows) {
      const category = row.module_id.includes('/')
        ? row.module_id.split('/')[0]
        : undefined;
      entries.push({
        date: new Date(row.completed_at),
        type: row.module_type === 'diagram' ? 'diagram-module' : 'module',
        title: row.module_id,
        category,
      });
    }

    // Certifications
    const certRows = this.db
      .prepare(
        `SELECT id, name, date_earned
         FROM certifications
         WHERE date_earned >= ?
         ORDER BY date_earned DESC`,
      )
      .all(cutoffISO) as CertificationRow[];

    for (const row of certRows) {
      entries.push({
        date: new Date(row.date_earned),
        type: 'certification',
        title: row.name,
      });
    }

    // Article reads
    const articleRows = this.db
      .prepare(
        `SELECT ar.article_id, ar.read_at, a.title
         FROM article_reads ar
         LEFT JOIN articles a ON ar.article_id = a.id
         WHERE ar.read_at >= ?
         ORDER BY ar.read_at DESC`,
      )
      .all(cutoffISO) as ArticleReadRow[];

    for (const row of articleRows) {
      entries.push({
        date: new Date(row.read_at),
        type: 'article',
        title: row.title ?? row.article_id,
      });
    }

    // Journal entries
    const journalRows = this.db
      .prepare(
        `SELECT id, content, created_at
         FROM journal_entries
         WHERE created_at >= ?
         ORDER BY created_at DESC`,
      )
      .all(cutoffISO) as JournalRow[];

    for (const row of journalRows) {
      entries.push({
        date: new Date(row.created_at),
        type: 'journal',
        title: row.content.length > 80 ? row.content.slice(0, 80) + '…' : row.content,
      });
    }

    // Sort all entries by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    return entries;
  }

  /**
   * Creates a new journal entry with optional tags.
   */
  addJournalEntry(content: string, tags: string[]): JournalEntry {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    const createdAtISO = createdAt.toISOString();

    const insertEntry = this.db.prepare(
      `INSERT INTO journal_entries (id, content, created_at) VALUES (?, ?, ?)`,
    );
    const insertTag = this.db.prepare(
      `INSERT INTO journal_tags (journal_id, tag) VALUES (?, ?)`,
    );

    const runAll = this.db.transaction(() => {
      insertEntry.run(id, content, createdAtISO);
      for (const tag of tags) {
        insertTag.run(id, tag);
      }
    });

    runAll();

    return { id, content, createdAt, tags };
  }

  /**
   * Retrieves journal entries with optional filtering by tags and date range.
   */
  getJournalEntries(filter?: JournalFilter): JournalEntry[] {
    let query = 'SELECT id, content, created_at FROM journal_entries';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.from) {
      conditions.push('created_at >= ?');
      params.push(filter.from.toISOString());
    }
    if (filter?.to) {
      conditions.push('created_at <= ?');
      params.push(filter.to.toISOString());
    }
    if (filter?.tags && filter.tags.length > 0) {
      const placeholders = filter.tags.map(() => '?').join(', ');
      conditions.push(
        `id IN (SELECT journal_id FROM journal_tags WHERE tag IN (${placeholders}))`,
      );
      params.push(...filter.tags);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const rows = this.db.prepare(query).all(...params) as JournalRow[];

    return rows.map((row) => {
      const tagRows = this.db
        .prepare('SELECT tag FROM journal_tags WHERE journal_id = ?')
        .all(row.id) as JournalTagRow[];

      return {
        id: row.id,
        content: row.content,
        createdAt: new Date(row.created_at),
        tags: tagRows.map((t) => t.tag),
      };
    });
  }

  /**
   * Generates a formatted text report summarising progress for the given period.
   */
  exportReport(period: 'monthly' | 'quarterly' | 'yearly'): string {
    const summary = this.getSummary();
    const periodLabel = this.getPeriodLabel(period);
    const timeline = this.getTimeline(
      period === 'yearly' ? 'quarterly' : period,
    );

    const lines: string[] = [
      '='.repeat(60),
      `ArchLens Progress Report — ${periodLabel}`,
      '='.repeat(60),
      '',
      'Summary',
      '-'.repeat(40),
      `Total modules completed: ${summary.totalModulesCompleted}`,
      `Total certifications earned: ${summary.totalCertificationsEarned}`,
      `Total articles read: ${summary.totalArticlesRead}`,
      `Diagram modules completed: ${summary.diagramModulesCompleted}`,
      '',
      'Completion Rates by Category',
      '-'.repeat(40),
    ];

    for (const cat of ALL_CATEGORIES) {
      lines.push(`  ${cat}: ${summary.completionRates[cat]} modules`);
    }

    lines.push('');
    lines.push('Activity Timeline');
    lines.push('-'.repeat(40));

    if (timeline.length === 0) {
      lines.push('  No activity recorded in this period.');
    } else {
      for (const entry of timeline) {
        const dateStr = entry.date.toISOString().split('T')[0];
        lines.push(`  [${dateStr}] ${entry.type}: ${entry.title}`);
      }
    }

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('Generated by ArchLens');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Returns the cutoff date for the given period. */
  private getPeriodCutoff(period: 'weekly' | 'monthly' | 'quarterly'): Date {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
  }

  /** Returns a human-readable label for the report period. */
  private getPeriodLabel(period: 'monthly' | 'quarterly' | 'yearly'): string {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    switch (period) {
      case 'monthly':
        return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      case 'quarterly': {
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        return `Q${quarter} ${now.getFullYear()}`;
      }
      case 'yearly':
        return `${now.getFullYear()}`;
    }
  }
}
