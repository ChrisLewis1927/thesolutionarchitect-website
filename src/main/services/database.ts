// ArchLens — SQLite database manager
// Implemented in Task 1.4

import Database from 'better-sqlite3';

/**
 * Result of a database integrity check.
 */
export interface IntegrityCheckResult {
  ok: boolean;
  errors: string[];
}

/**
 * Manages the SQLite database lifecycle: creation, schema migration,
 * integrity checking, and safe shutdown.
 *
 * Accepts either a file path (production — Electron userData) or ':memory:'
 * for testing.
 */
export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    this.db.pragma('journal_mode = WAL');
    // Enable foreign key enforcement
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Initialises the database: creates tables if they don't exist and
   * runs an integrity check.
   *
   * @throws Error if the integrity check fails.
   */
  initialise(): IntegrityCheckResult {
    this.createTables();
    const result = this.checkIntegrity();
    return result;
  }

  /**
   * Returns the underlying better-sqlite3 Database instance.
   * Useful for services that need direct query access.
   */
  getDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Runs SQLite's built-in integrity check.
   * Returns an object indicating whether the database is healthy.
   */
  checkIntegrity(): IntegrityCheckResult {
    const rows = this.db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    const errors = rows
      .map((r) => r.integrity_check)
      .filter((msg) => msg !== 'ok');

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  /**
   * Closes the database connection. Should be called on app shutdown.
   */
  close(): void {
    this.db.close();
  }

  /**
   * Creates all application tables if they do not already exist.
   * Wrapped in a transaction for atomicity.
   */
  private createTables(): void {
    this.db.exec(`
      -- User settings and preferences
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Uploaded documents and their parsed metadata
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'txt')),
        file_path TEXT NOT NULL,
        page_count INTEGER,
        word_count INTEGER,
        has_diagrams INTEGER NOT NULL DEFAULT 0,
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Document review results (both quick and deep)
      CREATE TABLE IF NOT EXISTS document_reviews (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id),
        mode TEXT NOT NULL CHECK (mode IN ('quick', 'deep')),
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- User certifications and qualifications
      CREATE TABLE IF NOT EXISTS certifications (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        date_earned TEXT NOT NULL,
        expiry_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Learning module completion tracking
      CREATE TABLE IF NOT EXISTS module_completions (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL,
        module_type TEXT NOT NULL CHECK (module_type IN ('learning', 'diagram')),
        completed_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(module_id, module_type)
      );

      -- Cached articles from RSS feeds
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        published_date TEXT NOT NULL,
        summary TEXT,
        category TEXT NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Articles the user has read (clicked through)
      CREATE TABLE IF NOT EXISTS article_reads (
        id TEXT PRIMARY KEY,
        article_id TEXT NOT NULL REFERENCES articles(id),
        read_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Personal development journal entries
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Journal entry tags (many-to-many)
      CREATE TABLE IF NOT EXISTS journal_tags (
        journal_id TEXT NOT NULL REFERENCES journal_entries(id),
        tag TEXT NOT NULL,
        PRIMARY KEY (journal_id, tag)
      );

      -- AI conversation sessions
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_message_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- AI conversation messages
      CREATE TABLE IF NOT EXISTS ai_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES ai_sessions(id),
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        tokens_used INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Academy lessons metadata
      CREATE TABLE IF NOT EXISTS academy_lessons (
        id TEXT PRIMARY KEY,
        lesson_number INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('foundation', 'intermediate', 'advanced')),
        theme TEXT NOT NULL,
        objectives TEXT NOT NULL,
        estimated_minutes INTEGER NOT NULL DEFAULT 45,
        prerequisites TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Academy lesson progress tracking
      CREATE TABLE IF NOT EXISTS academy_progress (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL REFERENCES academy_lessons(id),
        status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
        quiz_score INTEGER,
        confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
        notes TEXT,
        started_at TEXT,
        completed_at TEXT,
        UNIQUE(lesson_id)
      );

      -- Academy skill tracking
      CREATE TABLE IF NOT EXISTS academy_skills (
        id TEXT PRIMARY KEY,
        skill_name TEXT NOT NULL UNIQUE,
        current_score INTEGER NOT NULL DEFAULT 0 CHECK (current_score BETWEEN 0 AND 100),
        lessons_contributing TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Academy exercise responses
      CREATE TABLE IF NOT EXISTS academy_exercises (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL REFERENCES academy_lessons(id),
        exercise_type TEXT NOT NULL CHECK (exercise_type IN ('quiz', 'scenario', 'reflection')),
        question TEXT NOT NULL,
        user_answer TEXT,
        model_answer TEXT,
        score INTEGER,
        feedback TEXT,
        submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
}
