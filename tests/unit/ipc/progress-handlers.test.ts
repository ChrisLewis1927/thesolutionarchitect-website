import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  ProgressService,
  ProgressSummary,
  TimelineEntry,
  JournalEntry,
  JournalFilter,
} from '../../../src/main/services/progress-service';

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
import { registerProgressHandlers } from '../../../src/main/ipc/progress-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleSummary: ProgressSummary = {
  totalModulesCompleted: 5,
  totalCertificationsEarned: 2,
  totalArticlesRead: 10,
  completionRates: {
    'aws-well-architected': 3,
    'azure-well-architected': 0,
    'togaf': 1,
    'gds-service-standard': 1,
    'secure-by-design': 0,
    'zero-trust': 0,
    'enterprise-architecture': 0,
    'solution-architecture': 0,
  },
  diagramModulesCompleted: 2,
};

const sampleTimeline: TimelineEntry[] = [
  {
    date: new Date('2024-06-01'),
    type: 'module',
    title: 'aws-well-architected/01-operational-excellence',
    category: 'aws-well-architected',
  },
];

const sampleJournalEntry: JournalEntry = {
  id: 'journal-1',
  content: 'Completed AWS module today',
  createdAt: new Date('2024-06-01'),
  tags: ['aws', 'learning'],
};

function createMockService(overrides: Partial<ProgressService> = {}): ProgressService {
  return {
    getSummary: vi.fn<() => ProgressSummary>().mockReturnValue(sampleSummary),
    getTimeline: vi
      .fn<(period: 'weekly' | 'monthly' | 'quarterly') => TimelineEntry[]>()
      .mockReturnValue(sampleTimeline),
    addJournalEntry: vi
      .fn<(content: string, tags: string[]) => JournalEntry>()
      .mockReturnValue(sampleJournalEntry),
    getJournalEntries: vi
      .fn<(filter?: JournalFilter) => JournalEntry[]>()
      .mockReturnValue([sampleJournalEntry]),
    exportReport: vi
      .fn<(period: 'monthly' | 'quarterly' | 'yearly') => string>()
      .mockReturnValue('Progress Report'),
    ...overrides,
  } as unknown as ProgressService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Progress IPC Handlers', () => {
  let service: ProgressService;

  beforeEach(() => {
    handlers.clear();
    service = createMockService();
    registerProgressHandlers(service);
  });

  it('registers all five progress channels', () => {
    expect(handlers.has('progress.getSummary')).toBe(true);
    expect(handlers.has('progress.getTimeline')).toBe(true);
    expect(handlers.has('progress.addJournal')).toBe(true);
    expect(handlers.has('progress.getJournalEntries')).toBe(true);
    expect(handlers.has('progress.exportReport')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // progress.getSummary
  // -------------------------------------------------------------------------

  describe('progress.getSummary', () => {
    it('returns ipcSuccess with summary data', async () => {
      const handler = handlers.get('progress.getSummary')!;
      const result = (await handler()) as { success: boolean; data: ProgressSummary };

      expect(result.success).toBe(true);
      expect(result.data.totalModulesCompleted).toBe(5);
      expect(result.data.totalCertificationsEarned).toBe(2);
      expect(result.data.totalArticlesRead).toBe(10);
      expect(service.getSummary).toHaveBeenCalled();
    });

    it('returns ipcError when getSummary throws', async () => {
      service = createMockService({
        getSummary: vi.fn().mockImplementation(() => {
          throw new Error('DB read failed');
        }),
      });
      handlers.clear();
      registerProgressHandlers(service);

      const handler = handlers.get('progress.getSummary')!;
      const result = (await handler()) as { success: boolean; error: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // progress.getTimeline
  // -------------------------------------------------------------------------

  describe('progress.getTimeline', () => {
    it('returns ipcSuccess with timeline entries', async () => {
      const handler = handlers.get('progress.getTimeline')!;
      const result = (await handler({}, 'monthly')) as {
        success: boolean;
        data: TimelineEntry[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('module');
      expect(service.getTimeline).toHaveBeenCalledWith('monthly');
    });

    it('returns ipcError when getTimeline throws', async () => {
      service = createMockService({
        getTimeline: vi.fn().mockImplementation(() => {
          throw new Error('Query failed');
        }),
      });
      handlers.clear();
      registerProgressHandlers(service);

      const handler = handlers.get('progress.getTimeline')!;
      const result = (await handler({}, 'weekly')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // progress.addJournal
  // -------------------------------------------------------------------------

  describe('progress.addJournal', () => {
    it('returns ipcSuccess with the created journal entry', async () => {
      const handler = handlers.get('progress.addJournal')!;
      const result = (await handler({}, 'Completed AWS module today', ['aws', 'learning'])) as {
        success: boolean;
        data: JournalEntry;
      };

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('journal-1');
      expect(result.data.content).toBe('Completed AWS module today');
      expect(result.data.tags).toEqual(['aws', 'learning']);
      expect(service.addJournalEntry).toHaveBeenCalledWith(
        'Completed AWS module today',
        ['aws', 'learning'],
      );
    });

    it('returns ipcError when addJournalEntry throws', async () => {
      service = createMockService({
        addJournalEntry: vi.fn().mockImplementation(() => {
          throw new Error('DB write failed');
        }),
      });
      handlers.clear();
      registerProgressHandlers(service);

      const handler = handlers.get('progress.addJournal')!;
      const result = (await handler({}, 'test', [])) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // progress.getJournalEntries
  // -------------------------------------------------------------------------

  describe('progress.getJournalEntries', () => {
    it('returns ipcSuccess with journal entries (no filter)', async () => {
      const handler = handlers.get('progress.getJournalEntries')!;
      const result = (await handler({})) as {
        success: boolean;
        data: JournalEntry[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toBe('Completed AWS module today');
      expect(service.getJournalEntries).toHaveBeenCalledWith(undefined);
    });

    it('passes filter to getJournalEntries', async () => {
      const filter: JournalFilter = { tags: ['aws'] };
      const handler = handlers.get('progress.getJournalEntries')!;
      const result = (await handler({}, filter)) as {
        success: boolean;
        data: JournalEntry[];
      };

      expect(result.success).toBe(true);
      expect(service.getJournalEntries).toHaveBeenCalledWith(filter);
    });

    it('returns ipcError when getJournalEntries throws', async () => {
      service = createMockService({
        getJournalEntries: vi.fn().mockImplementation(() => {
          throw new Error('DB read failed');
        }),
      });
      handlers.clear();
      registerProgressHandlers(service);

      const handler = handlers.get('progress.getJournalEntries')!;
      const result = (await handler({})) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // progress.exportReport
  // -------------------------------------------------------------------------

  describe('progress.exportReport', () => {
    it('returns ipcSuccess with the report string', async () => {
      const handler = handlers.get('progress.exportReport')!;
      const result = (await handler({}, 'monthly')) as {
        success: boolean;
        data: string;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe('Progress Report');
      expect(service.exportReport).toHaveBeenCalledWith('monthly');
    });

    it('returns ipcError when exportReport throws', async () => {
      service = createMockService({
        exportReport: vi.fn().mockImplementation(() => {
          throw new Error('Export failed');
        }),
      });
      handlers.clear();
      registerProgressHandlers(service);

      const handler = handlers.get('progress.exportReport')!;
      const result = (await handler({}, 'quarterly')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
