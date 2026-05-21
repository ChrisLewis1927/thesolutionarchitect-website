// ArchLens — Infographic Generation IPC handlers

import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { InfographicService } from '../services/infographic-service';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `infographics` namespace.
 */
export function registerInfographicHandlers(
  infographicService: InfographicService,
  getApiKey: () => string,
): void {
  ipcMain.handle(
    'infographics.generate',
    async (_event, lessonNumber: number, lessonTitle: string, keyPoints: string[]) => {
      try {
        const apiKey = getApiKey();
        if (!apiKey) {
          return ipcError(new Error('No OpenAI API key configured. Please add your key in Settings.'));
        }
        const record = await infographicService.generate(lessonNumber, lessonTitle, keyPoints, apiKey);
        return ipcSuccess(record);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('infographics.getForLesson', (_event, lessonNumber: number) => {
    try {
      const record = infographicService.getForLesson(lessonNumber);
      return ipcSuccess(record);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('infographics.getAll', () => {
    try {
      const records = infographicService.getAll();
      return ipcSuccess(records);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('infographics.getImageData', (_event, lessonNumber: number) => {
    try {
      const imagePath = infographicService.getImagePath(lessonNumber);
      if (!imagePath) {
        return ipcSuccess(null);
      }
      // Return base64-encoded image data for display in renderer
      const buffer = fs.readFileSync(imagePath);
      const base64 = buffer.toString('base64');
      return ipcSuccess(`data:image/png;base64,${base64}`);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('infographics.download', async (_event, lessonNumber: number) => {
    try {
      const imagePath = infographicService.getImagePath(lessonNumber);
      if (!imagePath) {
        return ipcError(new Error('No infographic found for this lesson.'));
      }

      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showSaveDialog(win!, {
        title: 'Save Infographic',
        defaultPath: path.basename(imagePath),
        filters: [
          { name: 'PNG Image', extensions: ['png'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return ipcSuccess({ saved: false });
      }

      fs.copyFileSync(imagePath, result.filePath);
      shell.showItemInFolder(result.filePath);
      return ipcSuccess({ saved: true, filePath: result.filePath });
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('infographics.delete', (_event, lessonNumber: number) => {
    try {
      infographicService.delete(lessonNumber);
      return ipcSuccess(undefined);
    } catch (err) {
      return ipcError(err);
    }
  });
}
