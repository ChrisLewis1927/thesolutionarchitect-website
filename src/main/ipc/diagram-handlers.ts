// ArchLens — Diagram Coach IPC handlers
// Implemented in Task 11.5

import { ipcMain } from 'electron';
import { DiagramCoach, DiagramType } from '../services/diagram-coach';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `diagrams` namespace.
 *
 * Channels:
 *  - `diagrams.getModules`      → returns diagram modules, optionally filtered by type
 *  - `diagrams.getModule`       → returns a single diagram module by ID
 *  - `diagrams.getReference`    → returns the ArchiMate reference library
 *  - `diagrams.completeModule`  → records a diagram module completion
 */
export function registerDiagramHandlers(diagramCoach: DiagramCoach): void {
  ipcMain.handle(
    'diagrams.getModules',
    (_event, type?: DiagramType) => {
      try {
        const modules = diagramCoach.getModules(type);
        return ipcSuccess(modules);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'diagrams.getModule',
    (_event, id: string) => {
      try {
        const mod = diagramCoach.getModule(id);
        return ipcSuccess(mod);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('diagrams.getReference', () => {
    try {
      const reference = diagramCoach.getReference();
      return ipcSuccess(reference);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'diagrams.completeModule',
    (_event, moduleId: string) => {
      try {
        diagramCoach.completeModule(moduleId);
        return ipcSuccess(undefined);
      } catch (err) {
        return ipcError(err);
      }
    },
  );
}
