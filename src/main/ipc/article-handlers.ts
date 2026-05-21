// ArchLens — Article Curator IPC handlers
// Implemented in Task 7.4

import { ipcMain, shell } from 'electron';
import { ArticleCurator } from '../services/article-curator';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `articles` namespace.
 *
 * Channels:
 *  - `articles.getDaily`       → returns today's curated articles (invoke)
 *  - `articles.refresh`        → forces a feed refresh and returns articles (invoke)
 *  - `articles.openInBrowser`  → opens a URL in the default browser (send, not invoke)
 */
export function registerArticleHandlers(articleCurator: ArticleCurator): void {
  ipcMain.handle('articles.getDaily', async () => {
    try {
      const result = await articleCurator.getDaily();
      return ipcSuccess(result);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('articles.refresh', async () => {
    try {
      const articles = await articleCurator.refresh();
      return ipcSuccess(articles);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.on('articles.openInBrowser', (_event, url: string) => {
    if (typeof url === 'string' && url.length > 0) {
      shell.openExternal(url).catch(() => {
        // Swallow — nothing useful to report back on a fire-and-forget send
      });
    }
  });
}
