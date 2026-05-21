import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

// ---------------------------------------------------------------------------
// Mock document-parser so we don't need real files
// ---------------------------------------------------------------------------

const mockParse = vi.fn();
const mockGetSupportedFormats = vi.fn().mockReturnValue(['pdf', 'docx', 'txt']);
const mockValidateFile = vi.fn().mockResolvedValue({ valid: true });

vi.mock('../../../src/main/services/document-parser', () => ({
  createDocumentParser: () => ({
    parse: mockParse,
    getSupportedFormats: mockGetSupportedFormats,
    validateFile: mockValidateFile,
  }),
}));

// Import after mocks are set up
import { registerAIHandlers } from '../../../src/main/ipc/ai-handlers';
import { AIService } from '../../../src/main/services/ai-service';
import { createDocumentParser } from '../../../src/main/services/document-parser';
import { DatabaseManager } from '../../../src/main/services/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openAIResponse(content = 'Hello', model = 'gpt-4o') {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 10, completion_tokens: 20 },
    model,
  };
}

function quickOverviewJSON() {
  return JSON.stringify({
    ratings: [
      { area: 'gds-service-standard', rating: 'green', summary: 'Good alignment' },
      { area: 'secure-by-design', rating: 'amber', summary: 'Needs work' },
      { area: 'zero-trust', rating: 'red', summary: 'Missing ZT' },
      { area: 'technical-feasibility', rating: 'green', summary: 'Feasible' },
      { area: 'communication-clarity', rating: 'green', summary: 'Clear' },
    ],
    overallSummary: 'Decent document',
  });
}

function deepDiveJSON() {
  return JSON.stringify({
    sections: [
      { area: 'gds-service-standard', feedback: 'Good', suggestions: ['Add more'], frameworkReferences: ['GDS Point 1'] },
      { area: 'secure-by-design', feedback: 'Needs work', suggestions: ['Improve'], frameworkReferences: ['SbD Principle 1'] },
      { area: 'zero-trust', feedback: 'Missing', suggestions: ['Add ZT'], frameworkReferences: ['NCSC ZT'] },
      { area: 'technical-feasibility', feedback: 'Solid', suggestions: ['Scale'], frameworkReferences: ['WAF Reliability'] },
      { area: 'communication-clarity', feedback: 'Clear', suggestions: ['Simplify'], frameworkReferences: ['TOGAF ADM'] },
    ],
    overallAssessment: 'Good overall',
  });
}

function makeParsedDocument(text = 'Sample document text') {
  return {
    text,
    metadata: {
      filename: 'test.pdf',
      format: 'pdf' as const,
      pageCount: 3,
      wordCount: 100,
      hasDiagrams: false,
    },
    warnings: [],
  };
}

describe('AI IPC Handlers', () => {
  let service: AIService;
  let documentParser: ReturnType<typeof createDocumentParser>;
  let db: DatabaseManager;

  beforeEach(() => {
    handlers.clear();
    vi.restoreAllMocks();
    mockParse.mockReset();

    // Mock fetch for AIService constructor
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    );
    service = new AIService('sk-test', 'gem-test');
    documentParser = createDocumentParser();
    db = new DatabaseManager(':memory:');
    db.initialise();

    registerAIHandlers({ aiService: service, documentParser, db });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.close();
  });

  it('registers all five ai.* handlers', () => {
    expect(handlers.has('ai.ask')).toBe(true);
    expect(handlers.has('ai.switchProvider')).toBe(true);
    expect(handlers.has('ai.validateKey')).toBe(true);
    expect(handlers.has('ai.reviewQuick')).toBe(true);
    expect(handlers.has('ai.reviewDeep')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // ai.ask
  // -------------------------------------------------------------------------

  describe('ai.ask', () => {
    it('returns ipcSuccess with AI response on valid ask', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse('Architecture answer')), {
          status: 200,
        }),
      );

      const sessionId = service.getConversationManager().createSession();
      const handler = handlers.get('ai.ask')!;
      const result = (await handler({}, 'What is TOGAF?', sessionId)) as {
        success: boolean;
        data: { content: string };
      };

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Architecture answer');
    });

    it('returns ipcError when session does not exist', async () => {
      const handler = handlers.get('ai.ask')!;
      const result = (await handler({}, 'question', 'no-session')) as {
        success: boolean;
        error: { code: string; userMessage: string };
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.userMessage).toContain('no-session');
    });

    it('returns ipcError when AI provider fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Rate limited', { status: 429 }),
      );

      const sessionId = service.getConversationManager().createSession();
      const handler = handlers.get('ai.ask')!;
      const result = (await handler({}, 'test', sessionId)) as {
        success: boolean;
        error: { code: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('AI_RATE_LIMIT');
      expect(result.error.retryable).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // ai.switchProvider
  // -------------------------------------------------------------------------

  describe('ai.switchProvider', () => {
    it('returns ipcSuccess after switching provider', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const handler = handlers.get('ai.switchProvider')!;
      const result = (await handler({}, 'gemini', 'gem-valid-key')) as {
        success: boolean;
      };

      expect(result.success).toBe(true);
      expect(service.getActiveProvider().name).toBe('gemini');
    });

    it('returns ipcError when key validation fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const handler = handlers.get('ai.switchProvider')!;
      const result = (await handler({}, 'gemini', 'bad-key')) as {
        success: boolean;
        error: { code: string; userMessage: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.userMessage).toContain('Invalid API key');
    });
  });

  // -------------------------------------------------------------------------
  // ai.validateKey
  // -------------------------------------------------------------------------

  describe('ai.validateKey', () => {
    it('returns ipcSuccess with true for a valid key', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const handler = handlers.get('ai.validateKey')!;
      const result = (await handler({}, 'openai', 'sk-valid')) as {
        success: boolean;
        data: boolean;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns ipcSuccess with false for an invalid key', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const handler = handlers.get('ai.validateKey')!;
      const result = (await handler({}, 'gemini', 'bad-key')) as {
        success: boolean;
        data: boolean;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('does not switch the active provider', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      expect(service.getActiveProvider().name).toBe('openai');

      const handler = handlers.get('ai.validateKey')!;
      await handler({}, 'gemini', 'gem-key');

      expect(service.getActiveProvider().name).toBe('openai');
    });
  });

  // -------------------------------------------------------------------------
  // ai.reviewQuick (Task 5.6)
  // -------------------------------------------------------------------------

  describe('ai.reviewQuick', () => {
    it('parses the document, calls quickOverview, and returns ipcSuccess', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse(quickOverviewJSON())), {
          status: 200,
        }),
      );

      const handler = handlers.get('ai.reviewQuick')!;
      const result = (await handler({}, '/path/to/test.pdf')) as {
        success: boolean;
        data: { ratings: unknown[]; overallSummary: string };
      };

      expect(result.success).toBe(true);
      expect(result.data.ratings).toHaveLength(5);
      expect(result.data.overallSummary).toBe('Decent document');
      expect(mockParse).toHaveBeenCalledWith('/path/to/test.pdf');
    });

    it('returns ipcError when document parsing fails', async () => {
      mockParse.mockRejectedValue(new Error('File not found'));

      const handler = handlers.get('ai.reviewQuick')!;
      const result = (await handler({}, '/bad/path.pdf')) as {
        success: boolean;
        error: { code: string; userMessage: string };
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns ipcError when AI provider fails during review', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Server error', { status: 500 }),
      );

      const handler = handlers.get('ai.reviewQuick')!;
      const result = (await handler({}, '/path/to/test.pdf')) as {
        success: boolean;
        error: { code: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('AI_SERVER_ERROR');
      expect(result.error.retryable).toBe(true);
    });

    it('stores the document record in the database', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse(quickOverviewJSON())), {
          status: 200,
        }),
      );

      const handler = handlers.get('ai.reviewQuick')!;
      await handler({}, '/path/to/test.pdf');

      // Verify the document was stored in the DB
      const row = db.getDatabase().prepare('SELECT * FROM documents').get() as {
        filename: string;
        format: string;
      } | undefined;
      expect(row).toBeDefined();
      expect(row!.filename).toBe('test.pdf');
      expect(row!.format).toBe('pdf');
    });

    it('stores the review result in the database', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse(quickOverviewJSON())), {
          status: 200,
        }),
      );

      const handler = handlers.get('ai.reviewQuick')!;
      await handler({}, '/path/to/test.pdf');

      const review = db.getDatabase().prepare(
        "SELECT * FROM document_reviews WHERE mode = 'quick'",
      ).get() as { mode: string; result_json: string } | undefined;
      expect(review).toBeDefined();
      expect(review!.mode).toBe('quick');
    });
  });

  // -------------------------------------------------------------------------
  // ai.reviewDeep (Task 5.6)
  // -------------------------------------------------------------------------

  describe('ai.reviewDeep', () => {
    it('parses the document, calls deepDive, and returns ipcSuccess', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse(deepDiveJSON())), {
          status: 200,
        }),
      );

      const handler = handlers.get('ai.reviewDeep')!;
      const result = (await handler({}, '/path/to/test.pdf')) as {
        success: boolean;
        data: { sections: unknown[]; overallAssessment: string };
      };

      expect(result.success).toBe(true);
      expect(result.data.sections).toHaveLength(5);
      expect(result.data.overallAssessment).toBe('Good overall');
      expect(mockParse).toHaveBeenCalledWith('/path/to/test.pdf');
    });

    it('returns ipcError when document parsing fails', async () => {
      mockParse.mockRejectedValue(new Error('Corrupted file'));

      const handler = handlers.get('ai.reviewDeep')!;
      const result = (await handler({}, '/bad/path.docx')) as {
        success: boolean;
        error: { code: string; userMessage: string };
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns ipcError when AI provider fails during deep review', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const handler = handlers.get('ai.reviewDeep')!;
      const result = (await handler({}, '/path/to/test.pdf')) as {
        success: boolean;
        error: { code: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('AI_AUTH_ERROR');
      expect(result.error.retryable).toBe(false);
    });

    it('stores the review result as deep mode in the database', async () => {
      const parsed = makeParsedDocument();
      mockParse.mockResolvedValue(parsed);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse(deepDiveJSON())), {
          status: 200,
        }),
      );

      const handler = handlers.get('ai.reviewDeep')!;
      await handler({}, '/path/to/test.pdf');

      const review = db.getDatabase().prepare(
        "SELECT * FROM document_reviews WHERE mode = 'deep'",
      ).get() as { mode: string } | undefined;
      expect(review).toBeDefined();
      expect(review!.mode).toBe('deep');
    });
  });

  // -------------------------------------------------------------------------
  // Backward compatibility: registerAIHandlers(aiService) still works
  // -------------------------------------------------------------------------

  describe('backward compatibility', () => {
    it('registers all handlers when called with just AIService', () => {
      handlers.clear();
      registerAIHandlers(service);

      expect(handlers.has('ai.ask')).toBe(true);
      expect(handlers.has('ai.switchProvider')).toBe(true);
      expect(handlers.has('ai.validateKey')).toBe(true);
      expect(handlers.has('ai.reviewQuick')).toBe(true);
      expect(handlers.has('ai.reviewDeep')).toBe(true);
    });

    it('review handlers return error when deps are missing', async () => {
      handlers.clear();
      registerAIHandlers(service);

      const handler = handlers.get('ai.reviewQuick')!;
      const result = (await handler({}, '/path/to/test.pdf')) as {
        success: boolean;
        error: { userMessage: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.userMessage).toContain('not available');
    });
  });
});
