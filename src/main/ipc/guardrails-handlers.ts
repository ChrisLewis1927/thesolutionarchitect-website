// ArchLens — Guardrails Knowledge Base IPC handlers
// Implemented in Task 13.3

import { ipcMain } from 'electron';
import { GuardrailsService } from '../services/guardrails-service';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `guardrails` namespace.
 *
 * Channels:
 *  - `guardrails.getTopics` → returns all guardrails topics
 *  - `guardrails.getTopic`  → returns a single topic by ID
 */
export function registerGuardrailsHandlers(guardrailsService: GuardrailsService): void {
  ipcMain.handle('guardrails.getTopics', () => {
    try {
      const topics = guardrailsService.getTopics();
      return ipcSuccess(topics);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'guardrails.getTopic',
    (_event, id: string) => {
      try {
        const topic = guardrailsService.getTopic(id);
        return ipcSuccess(topic);
      } catch (err) {
        return ipcError(err);
      }
    },
  );
}
