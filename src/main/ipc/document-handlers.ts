// ArchLens — Document Parser IPC handlers
// Implemented in Task 4.4

import { ipcMain } from 'electron';
import { DocumentParser } from '../services/document-parser';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `documents` namespace.
 *
 * Channels:
 *  - `documents.upload`              → parses an uploaded document and returns extracted content
 *  - `documents.getSupportedFormats` → returns the list of accepted file extensions
 */
export function registerDocumentHandlers(documentParser: DocumentParser): void {
  ipcMain.handle(
    'documents.upload',
    async (_event, filePath: string) => {
      try {
        const parsed = await documentParser.parse(filePath);
        return ipcSuccess(parsed);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('documents.getSupportedFormats', () => {
    try {
      const formats = documentParser.getSupportedFormats();
      return ipcSuccess(formats);
    } catch (err) {
      return ipcError(err);
    }
  });
}
