// ArchLens — Application settings service
// Implemented in Task 1.5

import Database from 'better-sqlite3';

/**
 * Application-wide settings stored as key-value pairs in the `settings` table.
 * API keys are encrypted at rest using Electron's safeStorage API.
 */
export interface AppSettings {
  aiProvider: 'openai' | 'gemini';
  openaiApiKey: string;
  geminiApiKey: string;
  articleRefreshHour: number;
  articleRefreshMinute: number;
  targetRole: string;
  theme: 'light' | 'dark';
}

/**
 * Default settings applied when no value exists in the database.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openai',
  openaiApiKey: '',
  geminiApiKey: '',
  articleRefreshHour: 7,
  articleRefreshMinute: 0,
  targetRole: '',
  theme: 'light',
};

/** Keys whose values are encrypted at rest. */
const ENCRYPTED_KEYS: ReadonlySet<string> = new Set([
  'openaiApiKey',
  'geminiApiKey',
]);

/**
 * Abstraction over Electron's `safeStorage` so the service can be tested
 * without a running Electron app.
 */
export interface SafeStorageAdapter {
  isEncryptionAvailable(): boolean;
  encryptString(plainText: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

/**
 * Manages reading and writing application settings via the SQLite `settings`
 * table. Sensitive values (API keys) are encrypted/decrypted transparently
 * through the provided `SafeStorageAdapter`.
 */
export class SettingsService {
  private db: Database.Database;
  private safeStorage: SafeStorageAdapter;

  constructor(db: Database.Database, safeStorage: SafeStorageAdapter) {
    this.db = db;
    this.safeStorage = safeStorage;
  }

  /**
   * Retrieves all application settings, merging stored values over defaults.
   * Encrypted values are decrypted before returning.
   */
  get(): AppSettings {
    const rows = this.db
      .prepare('SELECT key, value FROM settings')
      .all() as Array<{ key: string; value: string }>;

    const stored: Record<string, string> = {};
    for (const row of rows) {
      stored[row.key] = row.value;
    }

    const settings: AppSettings = { ...DEFAULT_SETTINGS };

    for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof AppSettings>) {
      if (stored[key] === undefined) continue;

      const raw = stored[key];

      if (ENCRYPTED_KEYS.has(key)) {
        settings[key] = this.decrypt(raw) as never;
      } else if (key === 'articleRefreshHour' || key === 'articleRefreshMinute') {
        (settings as unknown as Record<string, unknown>)[key] = Number(raw);
      } else {
        (settings as unknown as Record<string, unknown>)[key] = raw;
      }
    }

    return settings;
  }

  /**
   * Persists a partial settings update. Only the provided keys are written.
   * Encrypted keys are encrypted before storage.
   */
  update(partial: Partial<AppSettings>): void {
    const upsert = this.db.prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    );

    const runAll = this.db.transaction(() => {
      for (const [key, value] of Object.entries(partial)) {
        if (value === undefined) continue;

        let storedValue: string;
        if (ENCRYPTED_KEYS.has(key)) {
          storedValue = this.encrypt(String(value));
        } else {
          storedValue = String(value);
        }

        upsert.run(key, storedValue);
      }
    });

    runAll();
  }

  // ---------------------------------------------------------------------------
  // Encryption helpers
  // ---------------------------------------------------------------------------

  private encrypt(plainText: string): string {
    if (!plainText) return '';
    if (!this.safeStorage.isEncryptionAvailable()) {
      return plainText;
    }
    const encrypted = this.safeStorage.encryptString(plainText);
    return encrypted.toString('base64');
  }

  private decrypt(stored: string): string {
    if (!stored) return '';
    if (!this.safeStorage.isEncryptionAvailable()) {
      return stored;
    }
    const buffer = Buffer.from(stored, 'base64');
    return this.safeStorage.decryptString(buffer);
  }
}
