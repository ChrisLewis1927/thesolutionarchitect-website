// Architecture Design Lab — Orchestrator Service
// Implements: Requirements 12.4, 12.5

import type Database from 'better-sqlite3';
import type {
  SolutionPremise,
  DiscoveryOutput,
  DiscoveryRequirement,
  ScenarioIntake,
  WizardValidation,
  ScenarioSummary,
  AssessmentResult,
  DomainAssessment,
  ArchitectureDomain,
  MissingInformation,
  ConfidenceSummary,
  ConsolidatedRecommendation,
  ReferenceArchitecture,
  PatternSearchResult,
  PatternEntry,
  PatternFilter,
  Standard,
  StandardReviewStatus,
  OutputType,
  FormattedOutput,
  LearningContent,
  SavedAssessment,
} from './types';

import { DiscoveryGeneratorImpl } from './discovery-generator';
import { ScenarioIntakeServiceImpl } from './scenario-intake';
import { DecisionEngineImpl } from './decision-engine';
import { ConfidenceScorerImpl } from './confidence-scorer';
import { PatternRecommenderImpl } from './pattern-recommender';
import { ReferenceArchitectureGeneratorImpl } from './reference-architecture-generator';
import { PatternLibraryServiceImpl } from './pattern-library';
import { StandardsServiceImpl } from './standards-service';
import { OutputFormatterImpl } from './output-formatter';
import { LearningModeServiceImpl } from './learning-mode';

// ---------------------------------------------------------------------------
// Design Lab Orchestrator Service
// ---------------------------------------------------------------------------

export class DesignLabService {
  private discoveryGenerator: DiscoveryGeneratorImpl;
  private scenarioIntake: ScenarioIntakeServiceImpl;
  private decisionEngine: DecisionEngineImpl;
  private confidenceScorer: ConfidenceScorerImpl;
  private patternRecommender: PatternRecommenderImpl;
  private refArchGenerator: ReferenceArchitectureGeneratorImpl;
  private patternLibrary: PatternLibraryServiceImpl;
  private standardsService: StandardsServiceImpl;
  private outputFormatter: OutputFormatterImpl;
  private learningMode: LearningModeServiceImpl;
  private db: Database.Database;

  constructor(db: Database.Database, contentPath: string) {
    this.db = db;
    this.discoveryGenerator = new DiscoveryGeneratorImpl();
    this.scenarioIntake = new ScenarioIntakeServiceImpl(db);
    this.decisionEngine = new DecisionEngineImpl(db, contentPath);
    this.confidenceScorer = new ConfidenceScorerImpl(db);
    this.patternRecommender = new PatternRecommenderImpl();
    this.refArchGenerator = new ReferenceArchitectureGeneratorImpl(db);
    this.patternLibrary = new PatternLibraryServiceImpl(contentPath);
    this.standardsService = new StandardsServiceImpl(db, contentPath);
    this.outputFormatter = new OutputFormatterImpl(db, contentPath);
    this.learningMode = new LearningModeServiceImpl(contentPath);
  }

  // -------------------------------------------------------------------------
  // Discovery
  // -------------------------------------------------------------------------

  analyseDiscovery(premise: SolutionPremise): DiscoveryOutput {
    return this.discoveryGenerator.analyse(premise);
  }

  updateDiscoveryRequirement(outputId: string, reqId: string, updated: Partial<DiscoveryRequirement>): DiscoveryOutput {
    return this.discoveryGenerator.updateRequirement(outputId, reqId, updated);
  }

  removeDiscoveryRequirement(outputId: string, reqId: string): DiscoveryOutput {
    return this.discoveryGenerator.removeRequirement(outputId, reqId);
  }

  addDiscoveryRequirement(outputId: string, req: Omit<DiscoveryRequirement, 'id'>): DiscoveryOutput {
    return this.discoveryGenerator.addRequirement(outputId, req);
  }

  exportDiscoveryPack(output: DiscoveryOutput): string {
    return this.discoveryGenerator.exportForDiscoveryPack(output);
  }

  // -------------------------------------------------------------------------
  // Scenario Intake
  // -------------------------------------------------------------------------

  createScenario(name: string): ScenarioIntake {
    return this.scenarioIntake.createScenario(name);
  }

  saveScenarioStep(scenarioId: string, stepId: string, data: unknown): WizardValidation {
    return this.scenarioIntake.saveStep(scenarioId, stepId, data);
  }

  getScenario(scenarioId: string): ScenarioIntake {
    return this.scenarioIntake.getScenario(scenarioId);
  }

  listScenarios(): ScenarioIntake[] {
    return this.scenarioIntake.listScenarios();
  }

  deleteScenario(scenarioId: string): void {
    this.scenarioIntake.deleteScenario(scenarioId);
  }

  getScenarioSummary(scenarioId: string): ScenarioSummary {
    return this.scenarioIntake.getSummary(scenarioId);
  }

  // -------------------------------------------------------------------------
  // Assessment
  // -------------------------------------------------------------------------

  runAssessment(scenarioId: string): AssessmentResult {
    const scenario = this.scenarioIntake.getScenario(scenarioId);
    // Ensure steps object exists with safe defaults
    if (!scenario.steps) {
      (scenario as any).steps = {};
    }
    if (!scenario.steps.cloudPlatforms) {
      scenario.steps.cloudPlatforms = { availablePlatforms: [], noCloudAvailable: false };
    }
    if (!scenario.steps.serviceType) {
      scenario.steps.serviceType = { type: 'other', description: '' };
    }
    if (!scenario.steps.userBase) {
      scenario.steps.userBase = { expectedUsers: 'under-100', userTypes: [] };
    }
    if (!scenario.steps.trafficProfile) {
      scenario.steps.trafficProfile = { pattern: 'steady' };
    }
    if (!scenario.steps.dataSensitivity) {
      scenario.steps.dataSensitivity = { classification: 'official', containsPII: false, containsSpecialCategory: false };
    }
    if (!scenario.steps.availability) {
      scenario.steps.availability = { targetAvailability: '99.9', maintenanceWindow: true };
    }
    if (!scenario.steps.recovery) {
      scenario.steps.recovery = { rto: '', rpo: '' };
    }
    if (!scenario.steps.integrations) {
      scenario.steps.integrations = { systems: [], protocols: [] };
    }
    if (!scenario.steps.deployment) {
      scenario.steps.deployment = { preference: 'no-preference' };
    }
    if (!scenario.steps.teamCapability) {
      scenario.steps.teamCapability = { teamSize: 'small-2-5', cloudExperience: 'basic', relevantSkills: [] };
    }
    if (!scenario.steps.constraints) {
      scenario.steps.constraints = {};
    }
    if (!scenario.steps.nfrs) {
      scenario.steps.nfrs = {};
    }
    return this.decisionEngine.assess(scenario);
  }

  getAssessment(assessmentId: string): AssessmentResult {
    const row = this.db.prepare(
      'SELECT result_json FROM design_lab_assessments WHERE id = ?',
    ).get(assessmentId) as { result_json: string } | undefined;

    if (!row) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }
    return JSON.parse(row.result_json);
  }

  getDomainAssessment(assessmentId: string, domain: ArchitectureDomain): DomainAssessment {
    return this.decisionEngine.getDomainAssessment(assessmentId, domain);
  }

  getMissingInformation(assessmentId: string): MissingInformation[] {
    return this.decisionEngine.getMissingInformation(assessmentId);
  }

  // -------------------------------------------------------------------------
  // Confidence
  // -------------------------------------------------------------------------

  getConfidenceSummary(assessmentId: string): ConfidenceSummary {
    // Try loading from DB first
    try {
      return this.confidenceScorer.getSummary(assessmentId);
    } catch {
      // If not scored yet, score it now
      const assessment = this.getAssessment(assessmentId);
      const scenario = this.scenarioIntake.getScenario(assessment.scenarioId);
      return this.confidenceScorer.score(assessment, scenario);
    }
  }

  // -------------------------------------------------------------------------
  // Recommendations
  // -------------------------------------------------------------------------

  getRecommendations(assessmentId: string): ConsolidatedRecommendation {
    const assessment = this.getAssessment(assessmentId);
    return this.patternRecommender.recommend(assessment);
  }

  // -------------------------------------------------------------------------
  // Reference Architecture
  // -------------------------------------------------------------------------

  generateReferenceArchitecture(assessmentId: string): ReferenceArchitecture {
    const assessment = this.getAssessment(assessmentId);
    const recommendation = this.patternRecommender.recommend(assessment);
    return this.refArchGenerator.generate(assessment, recommendation);
  }

  // -------------------------------------------------------------------------
  // Pattern Library
  // -------------------------------------------------------------------------

  searchPatterns(query: string, filter?: PatternFilter): PatternSearchResult[] {
    return this.patternLibrary.search(query, filter);
  }

  getPattern(id: string): PatternEntry {
    return this.patternLibrary.getPattern(id);
  }

  getAllPatterns(): PatternEntry[] {
    return this.patternLibrary.getAllPatterns();
  }

  // -------------------------------------------------------------------------
  // Standards
  // -------------------------------------------------------------------------

  getApplicableStandards(assessmentId: string): Standard[] {
    const assessment = this.getAssessment(assessmentId);
    const domains = assessment.domains.map((d) => d.domain);
    return this.standardsService.getApplicableStandards(domains);
  }

  setStandardReviewStatus(assessmentId: string, standardId: string, status: StandardReviewStatus['status'], note?: string): void {
    this.standardsService.setReviewStatus(assessmentId, standardId, status, note);
  }

  getStandardReviewStatuses(assessmentId: string): StandardReviewStatus[] {
    return this.standardsService.getReviewStatuses(assessmentId);
  }

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------

  generateOutput(assessmentId: string, type: OutputType): FormattedOutput {
    return this.outputFormatter.generate(assessmentId, type);
  }

  copyToClipboard(content: string): void {
    this.outputFormatter.copyToClipboard(content);
  }

  // -------------------------------------------------------------------------
  // Learning Mode
  // -------------------------------------------------------------------------

  getLearningContent(domain: ArchitectureDomain, patternName: string): LearningContent {
    return this.learningMode.getContent(domain, patternName);
  }

  // -------------------------------------------------------------------------
  // Saved Assessments
  // -------------------------------------------------------------------------

  listSavedAssessments(): SavedAssessment[] {
    const rows = this.db.prepare(`
      SELECT a.id, a.scenario_id, s.name, a.status, a.created_at, a.updated_at
      FROM design_lab_assessments a
      JOIN design_lab_scenarios s ON a.scenario_id = s.id
      ORDER BY a.updated_at DESC
    `).all() as Array<{
      id: string;
      scenario_id: string;
      name: string;
      status: 'in-progress' | 'complete';
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      scenarioId: row.scenario_id,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      status: row.status,
    }));
  }
}
