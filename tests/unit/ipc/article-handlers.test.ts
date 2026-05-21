import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ArticleCurator, CachedResult, Article } from '../../../src/main/services/article-curator';

// ---------------------------------------------------------------------------
// Mock Electron's ipcMain and shell
// ---------------------------------------------------------------------------

const handlers = new Map<string, (...args: unknown[]) => unknown>();
const listeners = new Map<string, (...args: unknown[]) => unknown>();
const mockOpenExternal = vi.fn<(url: string) => Promise<void>>().mockResolvedValue(undefined);

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    },
    on: (channel: string, handler: (...args: unknown[]) => unknown) => {
      listeners.set(channel, handler);
    },
  },
  shell: {
    openExternal: (...args: unknown[]) => mockOpenExternal(...(args as [string])),
  },
}));

// Import after mock is set up
import { registerArticleHandlers } from '../../../src/main/ipc/article-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleArticle: Article = {
  id: 'abc123',
  title: 'Cloud Architecture Trends',
  source: 'AWS Blog',
  url: 'https://aws.amazon.com/blogs/architecture/trends',
  publishedDate: new Date('2024-06-01T10:00:00Z'),
  summary: 'A look at emerging cloud architecture patterns.',
  category: 'cloud',
};

function createMockCurator(overrides: Partial<ArticleCurator> = {}): ArticleCurator {
  const cachedResult: CachedResult = {
    articles: [sampleArticle],
    stale: false,
    lastFetchedAt: new Date(),
  };

  return {
    getDaily: vi.fn<() => Promise<CachedResult>>().mockResolvedValue(cachedResult),
    refresh: vi.fn<() => Promise<Article[]>>().mockResolvedValue([sampleArticle]),
    getCached: vi.fn<() => Article[]>().mockReturnValue([sampleArticle]),
    setRefreshTime: vi.fn(),
    startScheduler: vi.fn(),
    stopScheduler: vi.fn(),
    ...overrides,
  } as unknown as ArticleCurator;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Article IPC Handlers', () => {
  let curator: ArticleCurator;

  beforeEach(() => {
    handlers.clear();
    listeners.clear();
    mockOpenExternal.mockClear();
    curator = createMockCurator();
    registerArticleHandlers(curator);
  });

  it('registers articles.getDaily and articles.refresh as handle, articles.openInBrowser as on', () => {
    expect(handlers.has('articles.getDaily')).toBe(true);
    expect(handlers.has('articles.refresh')).toBe(true);
    expect(listeners.has('articles.openInBrowser')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // articles.getDaily
  // -------------------------------------------------------------------------

  describe('articles.getDaily', () => {
    it('returns ipcSuccess with cached result', async () => {
      const handler = handlers.get('articles.getDaily')!;
      const result = (await handler()) as { success: boolean; data: CachedResult };

      expect(result.success).toBe(true);
      expect(result.data.articles).toHaveLength(1);
      expect(result.data.articles[0].title).toBe('Cloud Architecture Trends');
      expect(result.data.stale).toBe(false);
      expect(curator.getDaily).toHaveBeenCalled();
    });

    it('returns ipcError when getDaily throws', async () => {
      curator = createMockCurator({
        getDaily: vi.fn().mockRejectedValue(new Error('DB failure')),
      });
      handlers.clear();
      listeners.clear();
      registerArticleHandlers(curator);

      const handler = handlers.get('articles.getDaily')!;
      const result = (await handler()) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });

    it('returns ipcError with NetworkError code when network fails', async () => {
      const { NetworkError } = await import('../../../src/main/errors');
      curator = createMockCurator({
        getDaily: vi.fn().mockRejectedValue(new NetworkError('No feeds')),
      });
      handlers.clear();
      listeners.clear();
      registerArticleHandlers(curator);

      const handler = handlers.get('articles.getDaily')!;
      const result = (await handler()) as {
        success: boolean;
        error: { code: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.retryable).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // articles.refresh
  // -------------------------------------------------------------------------

  describe('articles.refresh', () => {
    it('returns ipcSuccess with refreshed articles', async () => {
      const handler = handlers.get('articles.refresh')!;
      const result = (await handler()) as { success: boolean; data: Article[] };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('abc123');
      expect(curator.refresh).toHaveBeenCalled();
    });

    it('returns ipcError when refresh throws NetworkError', async () => {
      const { NetworkError } = await import('../../../src/main/errors');
      curator = createMockCurator({
        refresh: vi.fn().mockRejectedValue(new NetworkError('Failed to fetch any RSS feeds')),
      });
      handlers.clear();
      listeners.clear();
      registerArticleHandlers(curator);

      const handler = handlers.get('articles.refresh')!;
      const result = (await handler()) as {
        success: boolean;
        error: { code: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.retryable).toBe(true);
    });

    it('returns ipcError for unexpected errors', async () => {
      curator = createMockCurator({
        refresh: vi.fn().mockRejectedValue(new Error('Unexpected')),
      });
      handlers.clear();
      listeners.clear();
      registerArticleHandlers(curator);

      const handler = handlers.get('articles.refresh')!;
      const result = (await handler()) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // articles.openInBrowser
  // -------------------------------------------------------------------------

  describe('articles.openInBrowser', () => {
    it('calls shell.openExternal with the provided URL', () => {
      const listener = listeners.get('articles.openInBrowser')!;
      listener({}, 'https://example.com/article');

      expect(mockOpenExternal).toHaveBeenCalledWith('https://example.com/article');
    });

    it('does not call shell.openExternal for empty string', () => {
      const listener = listeners.get('articles.openInBrowser')!;
      listener({}, '');

      expect(mockOpenExternal).not.toHaveBeenCalled();
    });

    it('does not call shell.openExternal for non-string input', () => {
      const listener = listeners.get('articles.openInBrowser')!;
      listener({}, 42);

      expect(mockOpenExternal).not.toHaveBeenCalled();
    });
  });
});
