import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../../../src/main/services/database';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
  });

  afterEach(() => {
    dbManager.close();
  });

  // -----------------------------------------------------------------------
  // Initialisation
  // -----------------------------------------------------------------------

  describe('initialise', () => {
    it('creates all tables and returns a passing integrity check', () => {
      const result = dbManager.initialise();
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('is idempotent — calling initialise twice does not throw', () => {
      dbManager.initialise();
      const result = dbManager.initialise();
      expect(result.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Schema — all 11 tables exist
  // -----------------------------------------------------------------------

  describe('schema', () => {
    const expectedTables = [
      'settings',
      'documents',
      'document_reviews',
      'certifications',
      'module_completions',
      'articles',
      'article_reads',
      'journal_entries',
      'journal_tags',
      'ai_sessions',
      'ai_messages',
    ];

    beforeEach(() => {
      dbManager.initialise();
    });

    it.each(expectedTables)('creates the "%s" table', (table) => {
      const db = dbManager.getDatabase();
      const row = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        )
        .get(table) as { name: string } | undefined;
      expect(row).toBeDefined();
      expect(row!.name).toBe(table);
    });

    it('creates exactly 11 application tables', () => {
      const db = dbManager.getDatabase();
      const rows = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
        )
        .all() as Array<{ name: string }>;
      expect(rows.map((r) => r.name).sort()).toEqual(
        [...expectedTables].sort(),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Integrity check
  // -----------------------------------------------------------------------

  describe('checkIntegrity', () => {
    it('returns ok for a healthy in-memory database', () => {
      dbManager.initialise();
      const result = dbManager.checkIntegrity();
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Table constraints — verify CHECK and UNIQUE constraints work
  // -----------------------------------------------------------------------

  describe('constraints', () => {
    beforeEach(() => {
      dbManager.initialise();
    });

    it('rejects documents with invalid format', () => {
      const db = dbManager.getDatabase();
      expect(() =>
        db
          .prepare(
            `INSERT INTO documents (id, filename, format, file_path) VALUES (?, ?, ?, ?)`,
          )
          .run('d1', 'file.md', 'md', '/path/file.md'),
      ).toThrow();
    });

    it('accepts documents with valid formats', () => {
      const db = dbManager.getDatabase();
      for (const fmt of ['pdf', 'docx', 'txt']) {
        db.prepare(
          `INSERT INTO documents (id, filename, format, file_path) VALUES (?, ?, ?, ?)`,
        ).run(`d-${fmt}`, `file.${fmt}`, fmt, `/path/file.${fmt}`);
      }
      const count = db.prepare('SELECT COUNT(*) as c FROM documents').get() as {
        c: number;
      };
      expect(count.c).toBe(3);
    });

    it('rejects document_reviews with invalid mode', () => {
      const db = dbManager.getDatabase();
      db.prepare(
        `INSERT INTO documents (id, filename, format, file_path) VALUES (?, ?, ?, ?)`,
      ).run('d1', 'file.pdf', 'pdf', '/path');

      expect(() =>
        db
          .prepare(
            `INSERT INTO document_reviews (id, document_id, mode, result_json) VALUES (?, ?, ?, ?)`,
          )
          .run('r1', 'd1', 'summary', '{}'),
      ).toThrow();
    });

    it('rejects module_completions with invalid module_type', () => {
      const db = dbManager.getDatabase();
      expect(() =>
        db
          .prepare(
            `INSERT INTO module_completions (id, module_id, module_type) VALUES (?, ?, ?)`,
          )
          .run('mc1', 'mod1', 'quiz'),
      ).toThrow();
    });

    it('enforces UNIQUE(module_id, module_type) on module_completions', () => {
      const db = dbManager.getDatabase();
      db.prepare(
        `INSERT INTO module_completions (id, module_id, module_type) VALUES (?, ?, ?)`,
      ).run('mc1', 'mod1', 'learning');

      expect(() =>
        db
          .prepare(
            `INSERT INTO module_completions (id, module_id, module_type) VALUES (?, ?, ?)`,
          )
          .run('mc2', 'mod1', 'learning'),
      ).toThrow();
    });

    it('allows same module_id with different module_type', () => {
      const db = dbManager.getDatabase();
      db.prepare(
        `INSERT INTO module_completions (id, module_id, module_type) VALUES (?, ?, ?)`,
      ).run('mc1', 'mod1', 'learning');
      db.prepare(
        `INSERT INTO module_completions (id, module_id, module_type) VALUES (?, ?, ?)`,
      ).run('mc2', 'mod1', 'diagram');

      const count = db
        .prepare('SELECT COUNT(*) as c FROM module_completions')
        .get() as { c: number };
      expect(count.c).toBe(2);
    });

    it('enforces UNIQUE url on articles', () => {
      const db = dbManager.getDatabase();
      db.prepare(
        `INSERT INTO articles (id, title, source, url, published_date, category) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run('a1', 'Title', 'Source', 'https://example.com/1', '2024-01-01', 'cloud');

      expect(() =>
        db
          .prepare(
            `INSERT INTO articles (id, title, source, url, published_date, category) VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run('a2', 'Title 2', 'Source', 'https://example.com/1', '2024-01-02', 'cloud'),
      ).toThrow();
    });

    it('rejects ai_messages with invalid role', () => {
      const db = dbManager.getDatabase();
      db.prepare(
        `INSERT INTO ai_sessions (id) VALUES (?)`,
      ).run('s1');

      expect(() =>
        db
          .prepare(
            `INSERT INTO ai_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)`,
          )
          .run('m1', 's1', 'admin', 'hello'),
      ).toThrow();
    });

    it('accepts ai_messages with valid roles', () => {
      const db = dbManager.getDatabase();
      db.prepare(`INSERT INTO ai_sessions (id) VALUES (?)`).run('s1');

      for (const role of ['user', 'assistant', 'system']) {
        db.prepare(
          `INSERT INTO ai_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)`,
        ).run(`m-${role}`, 's1', role, 'hello');
      }
      const count = db
        .prepare('SELECT COUNT(*) as c FROM ai_messages')
        .get() as { c: number };
      expect(count.c).toBe(3);
    });

    it('enforces composite primary key on journal_tags', () => {
      const db = dbManager.getDatabase();
      db.prepare(`INSERT INTO journal_entries (id, content) VALUES (?, ?)`).run(
        'j1',
        'Entry',
      );
      db.prepare(
        `INSERT INTO journal_tags (journal_id, tag) VALUES (?, ?)`,
      ).run('j1', 'career');

      expect(() =>
        db
          .prepare(
            `INSERT INTO journal_tags (journal_id, tag) VALUES (?, ?)`,
          )
          .run('j1', 'career'),
      ).toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Foreign keys
  // -----------------------------------------------------------------------

  describe('foreign keys', () => {
    beforeEach(() => {
      dbManager.initialise();
    });

    it('rejects document_reviews referencing non-existent document', () => {
      const db = dbManager.getDatabase();
      expect(() =>
        db
          .prepare(
            `INSERT INTO document_reviews (id, document_id, mode, result_json) VALUES (?, ?, ?, ?)`,
          )
          .run('r1', 'nonexistent', 'quick', '{}'),
      ).toThrow();
    });

    it('rejects article_reads referencing non-existent article', () => {
      const db = dbManager.getDatabase();
      expect(() =>
        db
          .prepare(
            `INSERT INTO article_reads (id, article_id) VALUES (?, ?)`,
          )
          .run('ar1', 'nonexistent'),
      ).toThrow();
    });

    it('rejects journal_tags referencing non-existent journal entry', () => {
      const db = dbManager.getDatabase();
      expect(() =>
        db
          .prepare(
            `INSERT INTO journal_tags (journal_id, tag) VALUES (?, ?)`,
          )
          .run('nonexistent', 'tag'),
      ).toThrow();
    });

    it('rejects ai_messages referencing non-existent session', () => {
      const db = dbManager.getDatabase();
      expect(() =>
        db
          .prepare(
            `INSERT INTO ai_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)`,
          )
          .run('m1', 'nonexistent', 'user', 'hello'),
      ).toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // getDatabase
  // -----------------------------------------------------------------------

  describe('getDatabase', () => {
    it('returns a usable database instance', () => {
      dbManager.initialise();
      const db = dbManager.getDatabase();
      const result = db.prepare('SELECT 1 as val').get() as { val: number };
      expect(result.val).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // close
  // -----------------------------------------------------------------------

  describe('close', () => {
    it('closes the database so further queries throw', () => {
      dbManager.initialise();
      dbManager.close();
      expect(() => dbManager.getDatabase().prepare('SELECT 1').get()).toThrow();
      // Prevent afterEach from double-closing
      dbManager = new DatabaseManager(':memory:');
    });
  });
});
