import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  DiagramCoach,
  DiagramModule,
  DiagramType,
  ArchiMateReference,
} from '../../../src/main/services/diagram-coach';

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
import { registerDiagramHandlers } from '../../../src/main/ipc/diagram-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleModule: DiagramModule = {
  id: 'archimate/01-introduction-to-archimate',
  title: 'Introduction to ArchiMate',
  diagramType: 'archimate',
  sequenceOrder: 1,
  content: {
    explanation: 'ArchiMate is an open modelling language for enterprise architecture.',
    annotatedExamples: [],
    walkthrough: [],
    exercises: [],
    commonMistakes: [],
  },
};

const sampleReference: ArchiMateReference = {
  symbols: [
    { name: 'Business Actor', description: 'An organisational entity', layer: 'Business', notation: 'yellow-circle' },
  ],
  relationships: [
    { name: 'Composition', description: 'Part-of relationship', notation: 'filled-diamond', category: 'structural' },
  ],
  layers: [
    { name: 'Business', description: 'Business layer', colour: '#FFFFB5', elements: ['Business Actor'] },
  ],
};

function createMockCoach(overrides: Partial<DiagramCoach> = {}): DiagramCoach {
  return {
    getModules: vi.fn<(type?: DiagramType) => DiagramModule[]>().mockReturnValue([sampleModule]),
    getModule: vi.fn<(id: string) => DiagramModule>().mockReturnValue(sampleModule),
    getReference: vi.fn<() => ArchiMateReference>().mockReturnValue(sampleReference),
    completeModule: vi.fn<(moduleId: string) => void>(),
    getNextRecommended: vi.fn().mockReturnValue(null),
    getAudienceGuidance: vi.fn().mockReturnValue(''),
    loadModules: vi.fn(),
    loadReference: vi.fn(),
    ...overrides,
  } as unknown as DiagramCoach;
}


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Diagram IPC Handlers', () => {
  let coach: DiagramCoach;

  beforeEach(() => {
    handlers.clear();
    coach = createMockCoach();
    registerDiagramHandlers(coach);
  });

  it('registers all four diagram channels', () => {
    expect(handlers.has('diagrams.getModules')).toBe(true);
    expect(handlers.has('diagrams.getModule')).toBe(true);
    expect(handlers.has('diagrams.getReference')).toBe(true);
    expect(handlers.has('diagrams.completeModule')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // diagrams.getModules
  // -------------------------------------------------------------------------

  describe('diagrams.getModules', () => {
    it('returns ipcSuccess with all modules when no type specified', async () => {
      const handler = handlers.get('diagrams.getModules')!;
      const result = (await handler({})) as { success: boolean; data: DiagramModule[] };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Introduction to ArchiMate');
      expect(coach.getModules).toHaveBeenCalledWith(undefined);
    });

    it('returns ipcSuccess with modules filtered by type', async () => {
      const handler = handlers.get('diagrams.getModules')!;
      const result = (await handler({}, 'archimate')) as { success: boolean; data: DiagramModule[] };

      expect(result.success).toBe(true);
      expect(coach.getModules).toHaveBeenCalledWith('archimate');
    });

    it('returns ipcError when getModules throws', async () => {
      coach = createMockCoach({
        getModules: vi.fn().mockImplementation(() => {
          throw new Error('Load failed');
        }),
      });
      handlers.clear();
      registerDiagramHandlers(coach);

      const handler = handlers.get('diagrams.getModules')!;
      const result = (await handler({})) as { success: boolean; error: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // diagrams.getModule
  // -------------------------------------------------------------------------

  describe('diagrams.getModule', () => {
    it('returns ipcSuccess with a single module', async () => {
      const handler = handlers.get('diagrams.getModule')!;
      const result = (await handler({}, 'archimate/01-introduction-to-archimate')) as {
        success: boolean;
        data: DiagramModule;
      };

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('archimate/01-introduction-to-archimate');
      expect(coach.getModule).toHaveBeenCalledWith('archimate/01-introduction-to-archimate');
    });

    it('returns ipcError when getModule throws (not found)', async () => {
      coach = createMockCoach({
        getModule: vi.fn().mockImplementation(() => {
          throw new Error('Diagram module not found: nonexistent');
        }),
      });
      handlers.clear();
      registerDiagramHandlers(coach);

      const handler = handlers.get('diagrams.getModule')!;
      const result = (await handler({}, 'nonexistent')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // diagrams.getReference
  // -------------------------------------------------------------------------

  describe('diagrams.getReference', () => {
    it('returns ipcSuccess with the ArchiMate reference', async () => {
      const handler = handlers.get('diagrams.getReference')!;
      const result = (await handler()) as { success: boolean; data: ArchiMateReference };

      expect(result.success).toBe(true);
      expect(result.data.symbols).toHaveLength(1);
      expect(result.data.relationships).toHaveLength(1);
      expect(result.data.layers).toHaveLength(1);
      expect(coach.getReference).toHaveBeenCalled();
    });

    it('returns ipcError when getReference throws', async () => {
      coach = createMockCoach({
        getReference: vi.fn().mockImplementation(() => {
          throw new Error('Reference load failed');
        }),
      });
      handlers.clear();
      registerDiagramHandlers(coach);

      const handler = handlers.get('diagrams.getReference')!;
      const result = (await handler()) as { success: boolean; error: { code: string } };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // diagrams.completeModule
  // -------------------------------------------------------------------------

  describe('diagrams.completeModule', () => {
    it('returns ipcSuccess on successful completion', async () => {
      const handler = handlers.get('diagrams.completeModule')!;
      const result = (await handler({}, 'archimate/01-introduction-to-archimate')) as {
        success: boolean;
        data: undefined;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(coach.completeModule).toHaveBeenCalledWith('archimate/01-introduction-to-archimate');
    });

    it('returns ipcError when completeModule throws', async () => {
      coach = createMockCoach({
        completeModule: vi.fn().mockImplementation(() => {
          throw new Error('DB write failed');
        }),
      });
      handlers.clear();
      registerDiagramHandlers(coach);

      const handler = handlers.get('diagrams.completeModule')!;
      const result = (await handler({}, 'some-module')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
