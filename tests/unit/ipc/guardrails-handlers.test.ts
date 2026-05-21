import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  GuardrailsService,
  GuardrailsTopic,
} from '../../../src/main/services/guardrails-service';

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
import { registerGuardrailsHandlers } from '../../../src/main/ipc/guardrails-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleTopic: GuardrailsTopic = {
  id: 'governance/01-ai-governance-frameworks',
  title: 'AI Governance Frameworks for UK Government',
  category: 'governance',
  content: '## Introduction\n\nAI governance content.',
  lastUpdated: new Date('2024-06-01'),
};

const sampleTopics: GuardrailsTopic[] = [
  sampleTopic,
  {
    id: 'security/01-security-guardrails-for-ai',
    title: 'Security Guardrails for AI Systems',
    category: 'security',
    content: '## Introduction\n\nSecurity guardrails content.',
    lastUpdated: new Date('2024-06-01'),
  },
];

function createMockService(
  overrides: Partial<GuardrailsService> = {},
): GuardrailsService {
  return {
    getTopics: vi.fn<() => GuardrailsTopic[]>().mockReturnValue(sampleTopics),
    getTopic: vi.fn<(id: string) => GuardrailsTopic>().mockReturnValue(sampleTopic),
    getByCategory: vi.fn<(category: string) => GuardrailsTopic[]>().mockReturnValue([sampleTopic]),
    loadTopics: vi.fn(),
    ...overrides,
  } as unknown as GuardrailsService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Guardrails IPC Handlers', () => {
  let service: GuardrailsService;

  beforeEach(() => {
    handlers.clear();
    service = createMockService();
    registerGuardrailsHandlers(service);
  });

  it('registers both guardrails channels', () => {
    expect(handlers.has('guardrails.getTopics')).toBe(true);
    expect(handlers.has('guardrails.getTopic')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // guardrails.getTopics
  // -------------------------------------------------------------------------

  describe('guardrails.getTopics', () => {
    it('returns ipcSuccess with all topics', async () => {
      const handler = handlers.get('guardrails.getTopics')!;
      const result = (await handler()) as {
        success: boolean;
        data: GuardrailsTopic[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe(
        'AI Governance Frameworks for UK Government',
      );
      expect(service.getTopics).toHaveBeenCalled();
    });

    it('returns ipcError when getTopics throws', async () => {
      service = createMockService({
        getTopics: vi.fn().mockImplementation(() => {
          throw new Error('Load failed');
        }),
      });
      handlers.clear();
      registerGuardrailsHandlers(service);

      const handler = handlers.get('guardrails.getTopics')!;
      const result = (await handler()) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // guardrails.getTopic
  // -------------------------------------------------------------------------

  describe('guardrails.getTopic', () => {
    it('returns ipcSuccess with a single topic', async () => {
      const handler = handlers.get('guardrails.getTopic')!;
      const result = (await handler(
        {},
        'governance/01-ai-governance-frameworks',
      )) as {
        success: boolean;
        data: GuardrailsTopic;
      };

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('governance/01-ai-governance-frameworks');
      expect(service.getTopic).toHaveBeenCalledWith(
        'governance/01-ai-governance-frameworks',
      );
    });

    it('returns ipcError when getTopic throws (not found)', async () => {
      service = createMockService({
        getTopic: vi.fn().mockImplementation(() => {
          throw new Error('Guardrails topic not found: nonexistent');
        }),
      });
      handlers.clear();
      registerGuardrailsHandlers(service);

      const handler = handlers.get('guardrails.getTopic')!;
      const result = (await handler({}, 'nonexistent')) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
