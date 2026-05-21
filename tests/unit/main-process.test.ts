import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock electron modules before importing anything
vi.mock('electron', () => ({
  app: {
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    quit: vi.fn(),
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('electron-log', () => {
  const log = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    transports: {
      file: { level: 'info' },
      console: { level: 'debug' },
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  };
  return { default: log };
});

describe('Main process configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should configure BrowserWindow with security best practices', async () => {
    const { BrowserWindow } = await import('electron');
    await import('../../src/main/main');

    // Wait for app.whenReady() to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        webPreferences: expect.objectContaining({
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        }),
      })
    );
  });

  it('should configure electron-log error handler', async () => {
    const log = (await import('electron-log')).default;
    await import('../../src/main/main');

    expect(log.errorHandler.startCatching).toHaveBeenCalled();
    expect(log.transports.file.level).toBe('info');
    expect(log.transports.console.level).toBe('debug');
  });
});
