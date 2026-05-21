// ArchLens — Learning Engine IPC handlers
// Implemented in Task 8.7

import { ipcMain } from 'electron';
import { LearningEngine, LearningCategory } from '../services/learning-engine';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Default user ID used for learning module completions.
 * ArchLens is a single-user desktop app so a fixed ID suffices.
 */
const DEFAULT_USER_ID = 'default';

/**
 * Registers IPC handlers for the `learning` namespace.
 *
 * Channels:
 *  - `learning.getCategories`     → returns all available learning categories
 *  - `learning.getModules`        → returns modules for a given category
 *  - `learning.completeModule`    → records a module completion
 *  - `learning.getNextRecommended`→ returns the next recommended module in a category
 */
export function registerLearningHandlers(learningEngine: LearningEngine): void {
  ipcMain.handle('learning.getCategories', () => {
    try {
      const categories = learningEngine.getCategories();
      return ipcSuccess(categories);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'learning.getModules',
    (_event, category: LearningCategory) => {
      try {
        const modules = learningEngine.getModules(category);
        return ipcSuccess(modules);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'learning.completeModule',
    (_event, moduleId: string) => {
      try {
        learningEngine.completeModule(DEFAULT_USER_ID, moduleId);
        return ipcSuccess(undefined);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'learning.getNextRecommended',
    (_event, category: LearningCategory) => {
      try {
        const next = learningEngine.getNextRecommended(DEFAULT_USER_ID, category);
        return ipcSuccess(next);
      } catch (err) {
        return ipcError(err);
      }
    },
  );
}
