import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  SettingsService,
  SafeStorageAdapter,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../../../src/main/services/settings-service';

// ---------------------------------------------------------------------------
// Mock safeStorage — simple base64 round-trip to simulate encrypt/decrypt
// ---------------------------------------------------------------------------

function createMockSafeStorage(available = true): SafeStorageAdapter {
  return {
    isEncryptionAvailable: () => available,
    encryptString: (plainText: string) => Buffer.from(`enc:${plainText}`),
    decryptString: (encrypted: Buffer) => {
      const str = encrypted.toString();
      return str.startsWith('enc:') ? str.slice(4) : str;
    },
  };
}

describe('SettingsService', () => {
  let dbManager: DatabaseManager;
  let service: SettingsService;
  let safeStorage: SafeStorageAdapter;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    safeStorage = createMockSafeStorage();
    service = new SettingsService(dbManager.getDatabase(), safeStorage);
  });

  afterEach(() => {
    dbManager.close();
  });

  // -----------------------------------------------------------------------
  // get — defaults
  // -----------------------------------------------------------------------

  describe('get', () => {
    it('returns default settings when the database is empty', () => {
      const settings = service.get();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns stored values merged over defaults', () => {
      service.update({ theme: 'dark', targetRole: 'lead-sa' });
      const settings = service.get();
      expect(settings.theme).toBe('dark');
      expect(settings.targetRole).toBe('lead-sa');
      // Unchanged defaults
      expect(settings.aiProvider).toBe('openai');
      expect(settings.articleRefreshHour).toBe(7);
    });

    it('returns numeric values as numbers for refresh hour/minute', () => {
      service.update({ articleRefreshHour: 9, articleRefreshMinute: 30 });
      const settings = service.get();
      expect(settings.articleRefreshHour).toBe(9);
      expect(settings.articleRefreshMinute).toBe(30);
      expect(typeof settings.articleRefreshHour).toBe('number');
      expect(typeof settings.articleRefreshMinute).toBe('number');
    });
  });

  // -----------------------------------------------------------------------
  // update — basic CRUD
  // -----------------------------------------------------------------------

  describe('update', () => {
    it('persists a single setting', () => {
      service.update({ aiProvider: 'gemini' });
      expect(service.get().aiProvider).toBe('gemini');
    });

    it('persists multiple settings at once', () => {
      service.update({
        aiProvider: 'gemini',
        theme: 'dark',
        articleRefreshHour: 12,
      });
      const s = service.get();
      expect(s.aiProvider).toBe('gemini');
      expect(s.theme).toBe('dark');
      expect(s.articleRefreshHour).toBe(12);
    });

    it('overwrites an existing setting', () => {
      service.update({ theme: 'dark' });
      service.update({ theme: 'light' });
      expect(service.get().theme).toBe('light');
    });

    it('ignores undefined values in partial', () => {
      service.update({ theme: 'dark' });
      service.update({ aiProvider: undefined } as Partial<AppSettings>);
      const s = service.get();
      expect(s.theme).toBe('dark');
      expect(s.aiProvider).toBe('openai'); // default, not overwritten
    });
  });

  // -----------------------------------------------------------------------
  // Encryption — API keys
  // -----------------------------------------------------------------------

  describe('API key encryption', () => {
    it('encrypts API keys before storing and decrypts on retrieval', () => {
      service.update({ openaiApiKey: 'sk-test-key-123' });

      // Verify the raw stored value is encrypted (base64 of "enc:sk-test-key-123")
      const db = dbManager.getDatabase();
      const row = db
        .prepare("SELECT value FROM settings WHERE key = 'openaiApiKey'")
        .get() as { value: string };
      expect(row.value).not.toBe('sk-test-key-123');

      // Verify decrypted value is correct
      const settings = service.get();
      expect(settings.openaiApiKey).toBe('sk-test-key-123');
    });

    it('encrypts gemini API key', () => {
      service.update({ geminiApiKey: 'AIza-gemini-key' });

      const db = dbManager.getDatabase();
      const row = db
        .prepare("SELECT value FROM settings WHERE key = 'geminiApiKey'")
        .get() as { value: string };
      expect(row.value).not.toBe('AIza-gemini-key');

      expect(service.get().geminiApiKey).toBe('AIza-gemini-key');
    });

    it('stores empty string as-is for empty API keys', () => {
      service.update({ openaiApiKey: '' });
      expect(service.get().openaiApiKey).toBe('');
    });

    it('does not encrypt non-key settings', () => {
      service.update({ targetRole: 'lead-sa' });

      const db = dbManager.getDatabase();
      const row = db
        .prepare("SELECT value FROM settings WHERE key = 'targetRole'")
        .get() as { value: string };
      expect(row.value).toBe('lead-sa');
    });
  });

  // -----------------------------------------------------------------------
  // Encryption unavailable — graceful fallback
  // -----------------------------------------------------------------------

  describe('encryption unavailable', () => {
    it('stores API keys in plain text when encryption is not available', () => {
      const noEncryption = createMockSafeStorage(false);
      const svc = new SettingsService(dbManager.getDatabase(), noEncryption);

      svc.update({ openaiApiKey: 'sk-plain' });

      const db = dbManager.getDatabase();
      const row = db
        .prepare("SELECT value FROM settings WHERE key = 'openaiApiKey'")
        .get() as { value: string };
      expect(row.value).toBe('sk-plain');

      expect(svc.get().openaiApiKey).toBe('sk-plain');
    });
  });

  // -----------------------------------------------------------------------
  // Round-trip — full settings object
  // -----------------------------------------------------------------------

  describe('round-trip', () => {
    it('persists and retrieves a complete settings object', () => {
      const full: AppSettings = {
        aiProvider: 'gemini',
        openaiApiKey: 'sk-openai-abc',
        geminiApiKey: 'AIza-gemini-xyz',
        articleRefreshHour: 18,
        articleRefreshMinute: 45,
        targetRole: 'lead-solution-architect',
        theme: 'dark',
      };

      service.update(full);
      const retrieved = service.get();
      expect(retrieved).toEqual(full);
    });
  });
});
