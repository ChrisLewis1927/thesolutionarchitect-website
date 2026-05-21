import { describe, it, expect, beforeEach, vi } from 'vitest';

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
import { registerDocumentHandlers } from '../../../src/main/ipc/document-handlers';
import { DocumentParser, ParsedDocument } from '../../../src/main/services/document-parser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockParser(overrides: Partial<DocumentParser> = {}): DocumentParser {
  return {
    parse: vi.fn<(filePath: string) => Promise<ParsedDocument>>().mockResolvedValue({
      text: 'Extracted text content',
      metadata: {
        filename: 'test.pdf',
        format: 'pdf',
        pageCount: 3,
        wordCount: 150,
        hasDiagrams: false,
      },
      warnings: [],
    }),
    getSupportedFormats: vi.fn().mockReturnValue(['pdf', 'docx', 'txt']),
    validateFile: vi.fn().mockResolvedValue({ valid: true }),
    ...overrides,
  };
}

describe('Document IPC Handlers', () => {
  let parser: DocumentParser;

  beforeEach(() => {
    handlers.clear();
    parser = createMockParser();
    registerDocumentHandlers(parser);
  });

  it('registers documents.upload and documents.getSupportedFormats handlers', () => {
    expect(handlers.has('documents.upload')).toBe(true);
    expect(handlers.has('documents.getSupportedFormats')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // documents.upload
  // -------------------------------------------------------------------------

  describe('documents.upload', () => {
    it('returns ipcSuccess with parsed document on valid upload', async () => {
      const handler = handlers.get('documents.upload')!;
      const result = (await handler({}, '/path/to/test.pdf')) as {
        success: boolean;
        data: ParsedDocument;
      };

      expect(result.success).toBe(true);
      expect(result.data.text).toBe('Extracted text content');
      expect(result.data.metadata.filename).toBe('test.pdf');
      expect(result.data.metadata.format).toBe('pdf');
      expect(parser.parse).toHaveBeenCalledWith('/path/to/test.pdf');
    });

    it('returns ipcError when parse fails with ValidationError', async () => {
      const { ValidationError } = await import('../../../src/main/errors');
      parser = createMockParser({
        parse: vi.fn().mockRejectedValue(
          new ValidationError('Unsupported file format. Please upload a PDF, Word (.docx), or plain text (.txt) file.'),
        ),
      });
      handlers.clear();
      registerDocumentHandlers(parser);

      const handler = handlers.get('documents.upload')!;
      const result = (await handler({}, '/path/to/test.exe')) as {
        success: boolean;
        error: { code: string; userMessage: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.retryable).toBe(false);
    });

    it('returns ipcError when parse fails with DocumentParseError', async () => {
      const { DocumentParseError } = await import('../../../src/main/errors');
      parser = createMockParser({
        parse: vi.fn().mockRejectedValue(
          new DocumentParseError('Failed to parse PDF: corrupted.pdf. The file may be corrupted or password-protected.'),
        ),
      });
      handlers.clear();
      registerDocumentHandlers(parser);

      const handler = handlers.get('documents.upload')!;
      const result = (await handler({}, '/path/to/corrupted.pdf')) as {
        success: boolean;
        error: { code: string; userMessage: string; retryable: boolean };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('DOCUMENT_PARSE_ERROR');
      expect(result.error.retryable).toBe(false);
    });

    it('returns ipcError for unexpected errors', async () => {
      parser = createMockParser({
        parse: vi.fn().mockRejectedValue(new Error('Unexpected failure')),
      });
      handlers.clear();
      registerDocumentHandlers(parser);

      const handler = handlers.get('documents.upload')!;
      const result = (await handler({}, '/path/to/file.pdf')) as {
        success: boolean;
        error: { code: string; userMessage: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // documents.getSupportedFormats
  // -------------------------------------------------------------------------

  describe('documents.getSupportedFormats', () => {
    it('returns ipcSuccess with supported formats list', async () => {
      const handler = handlers.get('documents.getSupportedFormats')!;
      const result = (await handler()) as {
        success: boolean;
        data: string[];
      };

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['pdf', 'docx', 'txt']);
      expect(parser.getSupportedFormats).toHaveBeenCalled();
    });

    it('returns ipcError when getSupportedFormats throws', async () => {
      parser = createMockParser({
        getSupportedFormats: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected');
        }),
      });
      handlers.clear();
      registerDocumentHandlers(parser);

      const handler = handlers.get('documents.getSupportedFormats')!;
      const result = (await handler()) as {
        success: boolean;
        error: { code: string };
      };

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
