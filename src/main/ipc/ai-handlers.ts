// ArchLens — AI IPC handlers
// Implemented in Task 3.8, extended in Task 5.6

import { ipcMain } from 'electron';
import { AIService } from '../services/ai-service';
import { DocumentReviewer } from '../services/document-reviewer';
import { DocumentParser } from '../services/document-parser';
import { DatabaseManager } from '../services/database';
import { ipcSuccess, ipcError } from '../errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function storeDocumentRecord(
  db: DatabaseManager,
  id: string,
  parsed: import('../services/document-parser').ParsedDocument,
  filePath: string,
): void {
  const stmt = db.getDatabase().prepare(
    `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  stmt.run(
    id,
    parsed.metadata.filename,
    parsed.metadata.format,
    filePath,
    parsed.metadata.pageCount,
    parsed.metadata.wordCount,
    parsed.metadata.hasDiagrams ? 1 : 0,
  );
}

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

export interface AIHandlerDeps {
  aiService: AIService;
  documentParser?: DocumentParser;
  db?: DatabaseManager;
}

/**
 * Registers IPC handlers for the `ai` namespace.
 *
 * Channels:
 *  - `ai.ask`            → sends a question within a conversation session
 *  - `ai.switchProvider`  → switches the active AI provider after key validation
 *  - `ai.validateKey`     → validates an API key for a provider without switching
 *  - `ai.reviewQuick`     → parses a document and returns a quick overview review
 *  - `ai.reviewDeep`      → parses a document and returns a deep dive review
 */
export function registerAIHandlers(
  aiServiceOrDeps: AIService | AIHandlerDeps,
): void {
  // Support both the original single-arg signature and the new deps object
  const deps: AIHandlerDeps =
    aiServiceOrDeps instanceof AIService
      ? { aiService: aiServiceOrDeps }
      : aiServiceOrDeps;

  const { aiService, documentParser, db } = deps;

  // -----------------------------------------------------------------------
  // Existing handlers
  // -----------------------------------------------------------------------

  ipcMain.handle(
    'ai.ask',
    async (_event, question: string, sessionId: string) => {
      try {
        const response = await aiService.ask(question, sessionId);
        return ipcSuccess(response);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'ai.switchProvider',
    async (_event, provider: 'openai' | 'gemini', apiKey: string) => {
      try {
        await aiService.switchProvider(provider, apiKey);
        return ipcSuccess(undefined);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'ai.validateKey',
    async (_event, provider: 'openai' | 'gemini', key: string) => {
      try {
        const valid = await aiService.validateKey(provider, key);
        return ipcSuccess(valid);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  // -----------------------------------------------------------------------
  // Document review handlers (Task 5.6)
  // -----------------------------------------------------------------------

  ipcMain.handle(
    'ai.reviewQuick',
    async (_event, filePath: string) => {
      try {
        if (!documentParser || !db) {
          throw new Error(
            'Document review is not available — parser or database not configured.',
          );
        }

        const parsed = await documentParser.parse(filePath);
        const documentId = generateDocumentId();
        storeDocumentRecord(db, documentId, parsed, filePath);

        const reviewer = new DocumentReviewer(aiService, db);
        const overview = await reviewer.quickOverview(parsed, documentId);
        return ipcSuccess(overview);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'ai.reviewDeep',
    async (_event, filePath: string) => {
      try {
        if (!documentParser || !db) {
          throw new Error(
            'Document review is not available — parser or database not configured.',
          );
        }

        const parsed = await documentParser.parse(filePath);
        const documentId = generateDocumentId();
        storeDocumentRecord(db, documentId, parsed, filePath);

        const reviewer = new DocumentReviewer(aiService, db);
        const review = await reviewer.deepDive(parsed, documentId);
        return ipcSuccess(review);
      } catch (err) {
        return ipcError(err);
      }
    },
  );
}
