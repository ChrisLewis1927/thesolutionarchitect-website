import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  SettingsService,
  SafeStorageAdapter,
} from '../../../src/main/services/settings-service';

// ---------------------------------------------------------------------------
// Mock Electron's ipcMain
// ---------------------------------------------------------------------------

const handlers = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    },
  },
}));

// Import after mock is set up
import { registerSettingsHandlers } from '../../../src/main/ipc/settings-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockSafeStorage(): SafeStorageAdapter {
  return {
    isEncryptionAvailable: () => true,
    encryptString: (plainText: string) => Buffer.from(`enc:${plainText}`),
    decryptString: (encrypted: Buffer) => {
      const str = encrypted.toString();
      return str.startsWith('enc:') ? str.slice(4) : str;
    },
  };
}

describe('Settings IPC Handlers', () => {
  let dbManager: DatabaseManager;
  let service: SettingsService;

  beforeEach(() => {
    handlers.clear();
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    service = new SettingsService(dbManager.getDatabase(), createMockSafeStorage());
    registerSettingsHandlers(service);
  });

  afterEach(() => {
    dbManager.close();
  });

  it('registers settings.get and settings.update handlers', () => {
    expect(handlers.has('settings.get')).toBe(true);
    expect(handlers.has('settings.update')).toBe(true);
  });

  describe('settings.get', () => {
    it('returns success with default settings', async () => {
      const handler = handlers.get('settings.get')!;
      const result = (await handler()) as { success: boolean; data: unknown };
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('aiProvider', 'openai');
      expect(result.data).toHaveProperty('theme', 'light');
    });

    it('returns updated settings after an update', async () => {
      const updateHandler = handlers.get('settings.update')!;
      await updateHandler({}, { theme: 'dark' });

      const getHandler = handlers.get('settings.get')!;
      const result = (await getHandler()) as { success: boolean; data: { theme: string } };
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('dark');
    });
  });

  describe('settings.update', () => {
    it('returns success on valid update', async () => {
      const handler = handlers.get('settings.update')!;
      const result = (await handler({}, { aiProvider: 'gemini' })) as {
        success: boolean;
      };
      expect(result.success).toBe(true);
    });

    it('persists API keys through encryption', async () => {
      const updateHandler = handlers.get('settings.update')!;
      await updateHandler({}, { openaiApiKey: 'sk-test' });

      const getHandler = handlers.get('settings.get')!;
      const result = (await getHandler()) as {
        success: boolean;
        data: { openaiApiKey: string };
      };
      expect(result.success).toBe(true);
      expect(result.data.openaiApiKey).toBe('sk-test');
    });
  });
});
