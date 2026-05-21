// ArchLens — Career Tracker IPC handlers
// Implemented in Task 9.6

import { ipcMain } from 'electron';
import { CareerTracker, Certification } from '../services/career-tracker';
import { ipcSuccess, ipcError } from '../errors';

/**
 * Registers IPC handlers for the `career` namespace.
 *
 * Channels:
 *  - `career.addCertification`   → stores a new certification
 *  - `career.getCertifications`  → returns all stored certifications
 *  - `career.analyseGaps`        → analyses skill gaps for a target role
 *  - `career.getRecommendations` → returns recommendations for a target role
 *  - `career.getCoverage`        → returns capability coverage for a target role
 */
export function registerCareerHandlers(careerTracker: CareerTracker): void {
  ipcMain.handle(
    'career.addCertification',
    (_event, cert: Certification) => {
      try {
        careerTracker.addCertification(cert);
        return ipcSuccess(undefined);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('career.getCertifications', () => {
    try {
      const certs = careerTracker.getCertifications();
      return ipcSuccess(certs);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'career.analyseGaps',
    (_event, targetRole: string) => {
      try {
        const gaps = careerTracker.analyseGaps(targetRole);
        return ipcSuccess(gaps);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'career.getRecommendations',
    (_event, targetRole: string) => {
      try {
        const recommendations = careerTracker.getRecommendations(targetRole);
        return ipcSuccess(recommendations);
      } catch (err) {
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'career.getCoverage',
    (_event, targetRole: string) => {
      try {
        const coverage = careerTracker.getCapabilityCoverage(targetRole);
        return ipcSuccess(coverage);
      } catch (err) {
        return ipcError(err);
      }
    },
  );
}
