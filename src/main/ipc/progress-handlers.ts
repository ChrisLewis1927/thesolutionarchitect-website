// ArchLens — Progress Dashboard IPC handlers
// Implemented in Task 12.6

import { ipcMain } from 'electron';
import { ProgressService, JournalFilter } from '../services/progress-service';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `progress` namespace.
 *
 * Channels:
 *  - `progress.getSummary`        → returns aggregated progress summary
 *  - `progress.getTimeline`       → returns timeline entries for a period
 *  - `progress.addJournal`        → creates a new journal entry
 *  - `progress.getJournalEntries` → returns journal entries with optional filter
 *  - `progress.exportReport`      → generates a formatted progress report
 */
export function registerProgressHandlers(progressService: ProgressService): void {
  ipcMain.handle('progress.getSummary', () => {
    try {
      const summary = progressService.getSummary();
      return ipcSuccess(summary);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'progress.getTimeline',
    (_event, period: 'weekly' | 'monthly' | 'quarterly') => {
      try {
        const timeline = progressService.getTimeline(period);
        return ipcSuccess(timeline);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'progress.addJournal',
    (_event, content: string, tags: string[]) => {
      try {
        const entry = progressService.addJournalEntry(content, tags);
        return ipcSuccess(entry);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'progress.getJournalEntries',
    (_event, filter?: JournalFilter) => {
      try {
        const entries = progressService.getJournalEntries(filter);
        return ipcSuccess(entries);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'progress.exportReport',
    (_event, period: 'monthly' | 'quarterly' | 'yearly') => {
      try {
        const report = progressService.exportReport(period);
        return ipcSuccess(report);
      } catch (err) {
        return ipcError(err);
      }
    },
  );
}
