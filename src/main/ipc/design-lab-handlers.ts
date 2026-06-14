// Architecture Design Lab — IPC Handlers
// Implements: Requirements 12.4, 12.6

import { ipcMain } from 'electron';
import { ipcSuccess, ipcError } from '../errors';
import type { DesignLabService } from '../services/design-lab/design-lab-service';

// ---------------------------------------------------------------------------
// Register all Design Lab IPC handlers
// ---------------------------------------------------------------------------

export function registerDesignLabHandlers(service: DesignLabService): void {
  // -------------------------------------------------------------------------
  // Discovery
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:analyse-discovery', async (_event, premise) => {
    try {
      return ipcSuccess(service.analyseDiscovery(premise));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:update-discovery-requirement', async (_event, outputId, reqId, updated) => {
    try {
      return ipcSuccess(service.updateDiscoveryRequirement(outputId, reqId, updated));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:remove-discovery-requirement', async (_event, outputId, reqId) => {
    try {
      return ipcSuccess(service.removeDiscoveryRequirement(outputId, reqId));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:add-discovery-requirement', async (_event, outputId, req) => {
    try {
      return ipcSuccess(service.addDiscoveryRequirement(outputId, req));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:export-discovery-pack', async (_event, output) => {
    try {
      return ipcSuccess(service.exportDiscoveryPack(output));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Scenario Intake
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:create-scenario', async (_event, name) => {
    try {
      return ipcSuccess(service.createScenario(name));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:save-scenario-step', async (_event, scenarioId, stepId, data) => {
    try {
      return ipcSuccess(service.saveScenarioStep(scenarioId, stepId, data));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-scenario', async (_event, scenarioId) => {
    try {
      return ipcSuccess(service.getScenario(scenarioId));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:list-scenarios', async () => {
    try {
      return ipcSuccess(service.listScenarios());
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:delete-scenario', async (_event, scenarioId) => {
    try {
      service.deleteScenario(scenarioId);
      return ipcSuccess(null);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-scenario-summary', async (_event, scenarioId) => {
    try {
      return ipcSuccess(service.getScenarioSummary(scenarioId));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Assessment
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:run-assessment', async (_event, scenarioId) => {
    try {
      return ipcSuccess(service.runAssessment(scenarioId));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-assessment', async (_event, assessmentId) => {
    try {
      return ipcSuccess(service.getAssessment(assessmentId));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-domain-assessment', async (_event, assessmentId, domain) => {
    try {
      return ipcSuccess(service.getDomainAssessment(assessmentId, domain));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Confidence
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:get-confidence-summary', async (_event, assessmentId) => {
    try {
      return ipcSuccess(service.getConfidenceSummary(assessmentId));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Recommendations
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:get-recommendations', async (_event, assessmentId) => {
    try {
      return ipcSuccess(service.getRecommendations(assessmentId));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Reference Architecture
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:generate-reference-architecture', async (_event, assessmentId) => {
    try {
      return ipcSuccess(service.generateReferenceArchitecture(assessmentId));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Pattern Library
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:search-patterns', async (_event, query, filter) => {
    try {
      return ipcSuccess(service.searchPatterns(query, filter));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-pattern', async (_event, id) => {
    try {
      return ipcSuccess(service.getPattern(id));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-all-patterns', async () => {
    try {
      return ipcSuccess(service.getAllPatterns());
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Standards
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:get-applicable-standards', async (_event, assessmentId) => {
    try {
      return ipcSuccess(service.getApplicableStandards(assessmentId));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:set-standard-review-status', async (_event, assessmentId, standardId, status, note) => {
    try {
      service.setStandardReviewStatus(assessmentId, standardId, status, note);
      return ipcSuccess(null);
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:get-standard-review-statuses', async (_event, assessmentId) => {
    try {
      return ipcSuccess(service.getStandardReviewStatuses(assessmentId));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:generate-output', async (_event, assessmentId, type) => {
    try {
      return ipcSuccess(service.generateOutput(assessmentId, type));
    } catch (err) {
      return ipcError(err);
    }
  });

  ipcMain.handle('design-lab:copy-to-clipboard', async (_event, content) => {
    try {
      service.copyToClipboard(content);
      return ipcSuccess(null);
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Learning Mode
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:get-learning-content', async (_event, domain, patternName) => {
    try {
      return ipcSuccess(service.getLearningContent(domain, patternName));
    } catch (err) {
      return ipcError(err);
    }
  });

  // -------------------------------------------------------------------------
  // Saved Assessments
  // -------------------------------------------------------------------------

  ipcMain.handle('design-lab:list-saved-assessments', async () => {
    try {
      return ipcSuccess(service.listSavedAssessments());
    } catch (err) {
      return ipcError(err);
    }
  });
}
