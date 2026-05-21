// ArchLens — Settings IPC handlers
// Implemented in Task 1.5

import { ipcMain } from 'electron';
import { SettingsService, AppSettings } from '../services/settings-service';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `settings` namespace.
 *
 * Channels:
 *  - `settings.get`    → returns the full AppSettings object
 *  - `settings.update` → accepts a Partial<AppSettings> and persists it
 */
export function registerSettingsHandlers(settingsService: SettingsService): void {
  ipcMain.handle('settings.get', () => {
    try {
      const settings = settingsService.get();
      return ipcSuccess(settings);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('settings.update', (_event, partial: Partial<AppSettings>) => {
    try {
      settingsService.update(partial);
      return ipcSuccess(undefined);
    } catch (err) {
      return ipcError(err);
    }
  });
}
