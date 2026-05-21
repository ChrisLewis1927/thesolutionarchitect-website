import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  LearningEngine,
  LearningModule,
  LearningCategory,
} from '../../../src/main/services/learning-engine';

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
import { registerLearningHandlers } from '../../../src/main/ipc/learning-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleModule: LearningModule = {
  id: 'aws-well-architected/01-operational-excellence',
  title: 'Operational Excellence',
  category: 'aws-well-architected',
  sequenceOrder: 1,
  estimatedMinutes: 10,
  content: {
    sections: [{ heading: 'Introduction', body: 'Overview of operational excellence.' }],
    keyTakeaways: ['Automate operations'],
    practicalExamples: ['Use CloudFormation'],
  },
};

const allCategories: LearningCategory[] = [
  'aws-well-architected',
  'azure-well-architected',
  'togaf',
  'gds-service-standard',
  'secure-by-design',
  'zero-trust',
  'enterprise-architecture',
  'solution-architecture',
];

function createMockEngine(overrides: Partial<LearningEngine> = {}): LearningEngine {
  return {
    getCategories: vi.fn<() => LearningCategory[]>().mockReturnValue(allCategories),
    getModules: vi.fn<(cat: LearningCategory) => LearningModule[]>().mockReturnValue([sampleModule]),
    getModule: vi.fn<(id: string) => LearningModule>().mockReturnValue(sampleModule),
    completeModule: vi.fn<(userId: string, moduleId: string) => void>(),
    getNextRecommended: vi
      .fn<(userId: string, cat: LearningCategory) => LearningModule | null>()
      .mockReturnValue(sampleModule),
    loadModules: vi.fn(),
    ...overrides,
  } as unknown as LearningEngine;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Learning IPC Handlers', () => {
  let engine: LearningEngine;

  beforeEach(() => {
    handlers.clear();
    engine = createMockEngine();
    registerLearningHandlers(engine);
  });

  it('registers all four learning channels', () => {
    expect(handlers.has('learning.getCategories')).toBe(true);
    expect(handlers.has('learning.getModules')).toBe(true);
    expect(handlers.has('learning.completeModule')).toBe(true);
    expect(handlers.has('learning.getNextRecommended')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // learning.getCategories
  // -------------------------------------------------------------------------

  describe('learning.getCategories', () => {
    it('returns ipcSuccess with all categories', async () => {
      const handler = handlers.get('learning.getCategories')!;
      const result = (await handler()) as { success: boolean; data: LearningCategory[] };

      expect(result.success).toBe(true);
      expect(result.data).toEqual(allCategories);
      expect(engine.getCategories).toHaveBeenCalled();
    });

    it('returns ipcError when getCategories throws', async () => {
      engine = createMockEngine({
        getCategories: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected');
        }),
      });
      handlers.clear();
      registerLearningHandlers(engine);

      const handler = handlers.get('learning.getCategories')!;
      const result = (await handler()) as { success: boolean; error: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // learning.getModules
  // -------------------------------------------------------------------------

  describe('learning.getModules', () => {
    it('returns ipcSuccess with modules for a category', async () => {
      const handler = handlers.get('learning.getModules')!;
      const result = (await handler({}, 'aws-well-architected')) as {
        success: boolean;
        data: LearningModule[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Operational Excellence');
      expect(engine.getModules).toHaveBeenCalledWith('aws-well-architected');
    });

    it('returns ipcError when getModules throws', async () => {
      engine = createMockEngine({
        getModules: vi.fn().mockImplementation(() => {
          throw new Error('DB failure');
        }),
      });
      handlers.clear();
      registerLearningHandlers(engine);

      const handler = handlers.get('learning.getModules')!;
      const result = (await handler({}, 'aws-well-architected')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // learning.completeModule
  // -------------------------------------------------------------------------

  describe('learning.completeModule', () => {
    it('returns ipcSuccess on successful completion', async () => {
      const handler = handlers.get('learning.completeModule')!;
      const result = (await handler({}, 'aws-well-architected/01-operational-excellence')) as {
        success: boolean;
        data: undefined;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(engine.completeModule).toHaveBeenCalledWith(
        'default',
        'aws-well-architected/01-operational-excellence',
      );
    });

    it('returns ipcError when completeModule throws', async () => {
      engine = createMockEngine({
        completeModule: vi.fn().mockImplementation(() => {
          throw new Error('DB write failed');
        }),
      });
      handlers.clear();
      registerLearningHandlers(engine);

      const handler = handlers.get('learning.completeModule')!;
      const result = (await handler({}, 'some-module')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // learning.getNextRecommended
  // -------------------------------------------------------------------------

  describe('learning.getNextRecommended', () => {
    it('returns ipcSuccess with the next recommended module', async () => {
      const handler = handlers.get('learning.getNextRecommended')!;
      const result = (await handler({}, 'aws-well-architected')) as {
        success: boolean;
        data: LearningModule;
      };

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Operational Excellence');
      expect(engine.getNextRecommended).toHaveBeenCalledWith('default', 'aws-well-architected');
    });

    it('returns ipcSuccess with null when all modules are completed', async () => {
      engine = createMockEngine({
        getNextRecommended: vi.fn().mockReturnValue(null),
      });
      handlers.clear();
      registerLearningHandlers(engine);

      const handler = handlers.get('learning.getNextRecommended')!;
      const result = (await handler({}, 'aws-well-architected')) as {
        success: boolean;
        data: null;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('returns ipcError when getNextRecommended throws', async () => {
      engine = createMockEngine({
        getNextRecommended: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected');
        }),
      });
      handlers.clear();
      registerLearningHandlers(engine);

      const handler = handlers.get('learning.getNextRecommended')!;
      const result = (await handler({}, 'aws-well-architected')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
