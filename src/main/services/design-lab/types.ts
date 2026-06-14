// Architecture Design Lab — Shared type definitions and interfaces
// Implements: Requirements 3.1, 5.1, 8.2, 12.6

import { ArchLensError } from '../../errors';

// ---------------------------------------------------------------------------
// Core Domain Types
// ---------------------------------------------------------------------------

/**
 * The 11 architecture domains assessed by the Decision Engine.
 */
export type ArchitectureDomain =
  | 'hosting-compute'
  | 'data-persistence'
  | 'integration-apis'
  | 'networking-edge'
  | 'identity-access'
  | 'security-controls'
  | 'resilience-dr'
  | 'observability-operations'
  | 'deployment-release'
  | 'cost-sustainability'
  | 'compliance-assurance';

/**
 * RAG (Red/Amber/Green/Grey/N-A) confidence status for design areas.
 */
export type RAGStatus = 'green' | 'amber' | 'red' | 'grey' | 'na';

// ---------------------------------------------------------------------------
// Discovery Generator Types
// ---------------------------------------------------------------------------

export interface SolutionPremise {
  description: string;
  additionalContext?: string;
}

export type FunctionalCategory =
  | 'user-interactions'
  | 'data-processing'
  | 'integrations'
  | 'business-rules';

export type NonFunctionalCategory =
  | 'performance'
  | 'security'
  | 'availability'
  | 'scalability'
  | 'usability'
  | 'maintainability'
  | 'compliance'
  | 'operability';

export interface DiscoveryRequirement {
  id: string;
  category: FunctionalCategory | NonFunctionalCategory;
  type: 'functional' | 'non-functional';
  description: string;
  rationale: string;
  discoveryQuestions: string[];
  isAmbiguous: boolean;
  ambiguityNote?: string;
}

export interface DiscoveryOutput {
  premiseId: string;
  premise: string;
  functionalRequirements: DiscoveryRequirement[];
  nonFunctionalRequirements: DiscoveryRequirement[];
  discoveryQuestions: string[];
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// Scenario Intake Wizard Types
// ---------------------------------------------------------------------------

export interface ScenarioIntake {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'complete';
  steps: {
    cloudPlatforms: CloudPlatformStep;
    serviceType: ServiceTypeStep;
    userBase: UserBaseStep;
    trafficProfile: TrafficProfileStep;
    dataSensitivity: DataSensitivityStep;
    availability: AvailabilityStep;
    recovery: RecoveryStep;
    integrations: IntegrationStep;
    deployment: DeploymentStep;
    teamCapability: TeamCapabilityStep;
    constraints: ConstraintsStep;
    nfrs: NFRStep;
  };
}

export interface CloudPlatformStep {
  availablePlatforms: Array<'aws' | 'azure' | 'gcp'>;
  noCloudAvailable: boolean;
  notes?: string;
}

export interface ServiceTypeStep {
  type:
    | 'public-facing'
    | 'internal'
    | 'api-service'
    | 'batch-processing'
    | 'data-platform'
    | 'integration-layer'
    | 'other';
  description: string;
}

export interface UserBaseStep {
  expectedUsers:
    | 'under-100'
    | '100-1000'
    | '1000-10000'
    | '10000-100000'
    | 'over-100000';
  userTypes: string[];
  peakUsagePattern?: string;
}

export interface TrafficProfileStep {
  pattern: 'steady' | 'spiky' | 'seasonal' | 'growing' | 'unpredictable';
  peakDescription?: string;
  estimatedRequestsPerSecond?: number;
}

export interface DataSensitivityStep {
  classification: 'official' | 'official-sensitive' | 'secret' | 'top-secret';
  containsPII: boolean;
  containsSpecialCategory: boolean;
  retentionRequirements?: string;
}

export interface AvailabilityStep {
  targetAvailability: '99' | '99.5' | '99.9' | '99.95' | '99.99';
  maintenanceWindow: boolean;
  maintenanceWindowDetails?: string;
}

export interface RecoveryStep {
  rto: string;
  rpo: string;
  drStrategy?: 'active-active' | 'active-passive' | 'pilot-light' | 'backup-restore';
}

export interface IntegrationTarget {
  name: string;
  type: 'internal' | 'external' | 'third-party';
  protocol: string;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
}

export interface IntegrationStep {
  systems: IntegrationTarget[];
  protocols: Array<
    'rest-api' | 'soap' | 'messaging' | 'file-transfer' | 'database' | 'event-stream'
  >;
}

export interface DeploymentStep {
  preference:
    | 'cloud-native'
    | 'containerised'
    | 'vm-based'
    | 'serverless'
    | 'hybrid'
    | 'no-preference';
  existingInfrastructure?: string;
  cicdRequirements?: string;
}

export interface TeamCapabilityStep {
  teamSize: 'solo' | 'small-2-5' | 'medium-6-15' | 'large-16-plus';
  cloudExperience: 'none' | 'basic' | 'intermediate' | 'advanced';
  relevantSkills: string[];
  constraints?: string;
}

export interface ConstraintsStep {
  budgetConstraints?: string;
  timelineConstraints?: string;
  technologyConstraints?: string[];
  organisationalConstraints?: string[];
  regulatoryConstraints?: string[];
}

export interface NFRStep {
  performanceRequirements?: string;
  securityRequirements?: string;
  complianceRequirements?: string;
  accessibilityRequirements?: string;
  otherRequirements?: string;
}

export interface WizardValidation {
  stepId: string;
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export interface ScenarioSummary {
  scenarioId: string;
  name: string;
  cloudPlatforms: string[];
  serviceType: string;
  dataClassification: string;
  availability: string;
  completeness: number;
  missingFields: string[];
}

// ---------------------------------------------------------------------------
// Decision Engine Types
// ---------------------------------------------------------------------------

export interface CandidateTechnology {
  name: string;
  category: string;
  platform: 'aws' | 'azure' | 'gcp' | 'on-premises' | 'saas' | 'multi-cloud';
  isRecommended: boolean;
  rationale: string;
}

export interface RiskAssumption {
  type: 'risk' | 'assumption';
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface OperationalBurden {
  staffingImplications: string;
  skillsRequired: string[];
  toolingRequired: string[];
  ongoingMaintenance: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface CostConsideration {
  runningCosts: string;
  transitionCosts: string;
  costDrivers: string[];
  optimisationOpportunities: string[];
}

export interface ViableOption {
  name: string;
  description: string;
  tradeOffs: Array<{ advantage: string; disadvantage: string }>;
  suitabilityScore: number;
}

export interface AssessmentLabels {
  facts: string[];
  assumptions: string[];
  recommendations: string[];
}

export interface DomainAssessment {
  domain: ArchitectureDomain;
  recommendedPattern: string;
  candidateTechnologies: CandidateTechnology[];
  rationale: string;
  alternativesRationale: string;
  risksAndAssumptions: RiskAssumption[];
  questionsToAskNext: string[];
  evidenceNeeded: string[];
  artefactsToProduce: string[];
  relevantStandards: string[];
  operationalBurden: OperationalBurden;
  costConsiderations: CostConsideration;
  viableOptions: ViableOption[];
  labels: AssessmentLabels;
}

export interface MissingInformation {
  domain: ArchitectureDomain;
  missingFields: string[];
  impact: string;
  question: string;
}

export interface AssessmentResult {
  id: string;
  scenarioId: string;
  domains: DomainAssessment[];
  missingInformation: MissingInformation[];
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// Confidence Scorer Types
// ---------------------------------------------------------------------------

export interface ConfidenceScore {
  domain: ArchitectureDomain;
  status: RAGStatus;
  rationale: string;
  gaps: string[];
  improvementActions: string[];
}

export interface ConfidenceSummary {
  assessmentId: string;
  scores: ConfidenceScore[];
  overallMaturity: 'early' | 'developing' | 'established' | 'mature';
  greenCount: number;
  amberCount: number;
  redCount: number;
  greyCount: number;
  naCount: number;
}

// ---------------------------------------------------------------------------
// Pattern Recommender Types
// ---------------------------------------------------------------------------

export interface PatternRecommendation {
  domain: ArchitectureDomain;
  patternName: string;
  patternId: string;
  decisionLogic: string;
  conditionsForChange: string[];
  risks: RiskAssumption[];
  confidenceLevel: RAGStatus;
}

export interface ConsolidatedRecommendation {
  assessmentId: string;
  recommendations: PatternRecommendation[];
  crossCuttingConcerns: string[];
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// Reference Architecture Generator Types
// ---------------------------------------------------------------------------

export interface ComponentEntry {
  name: string;
  purpose: string;
  technology: string;
  platform: string;
}

export interface CategorisedQuestion {
  question: string;
  stakeholderGroup:
    | 'technical'
    | 'security'
    | 'operations'
    | 'delivery'
    | 'finance'
    | 'governance';
}

export interface ADRCandidate {
  title: string;
  contextStatement: string;
  domain: ArchitectureDomain;
}

export interface ReferenceArchitecture {
  id: string;
  assessmentId: string;
  designSummary: string;
  keyComponents: ComponentEntry[];
  dataFlowDescription: string;
  securityControls: string[];
  resilienceModel: string;
  operationalModel: string;
  integrationApproach: string;
  deploymentApproach: string;
  keyRisks: RiskAssumption[];
  openQuestions: CategorisedQuestion[];
  assumptions: string[];
  adrCandidates: ADRCandidate[];
  hldSectionDraft: string;
  governanceReviewQuestions: string[];
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// Pattern Library Types
// ---------------------------------------------------------------------------

export interface CloudServiceExample {
  platform: 'aws' | 'azure' | 'gcp';
  services: Array<{ name: string; purpose: string }>;
}

export interface PatternEntry {
  id: string;
  name: string;
  description: string;
  whenToUse: string[];
  whenNotToUse: string[];
  typicalComponents: ComponentEntry[];
  securityControls: string[];
  resilienceConsiderations: string[];
  costConsiderations: string[];
  operationalConsiderations: string[];
  cloudServiceExamples: CloudServiceExample[];
  questionsToAsk: string[];
  commonMistakes: string[];
  workloadTypes: string[];
  securityClassifications: string[];
}

export interface PatternSearchResult {
  pattern: PatternEntry;
  relevanceScore: number;
  matchedOn: string[];
}

export interface PatternFilter {
  cloudProvider?: 'aws' | 'azure' | 'gcp';
  workloadType?: string;
  securityClassification?: string;
}

// ---------------------------------------------------------------------------
// Standards Service Types
// ---------------------------------------------------------------------------

export interface Standard {
  id: string;
  name: string;
  category:
    | 'government-policy'
    | 'security'
    | 'cloud'
    | 'accessibility'
    | 'departmental';
  description: string;
  url?: string;
  applicableDomains: ArchitectureDomain[];
}

export interface StandardReviewStatus {
  standardId: string;
  assessmentId: string;
  status: 'not-reviewed' | 'reviewed' | 'not-applicable' | 'action-required';
  note?: string;
  reviewedAt?: Date;
}

// ---------------------------------------------------------------------------
// Output Formatter Types
// ---------------------------------------------------------------------------

export type OutputType =
  | 'architecture-decision-summary'
  | 'hld-section'
  | 'adr-draft'
  | 'governance-briefing'
  | 'risk-assumption-log'
  | 'pattern-comparison'
  | 'stakeholder-questions';

export interface FormattedOutput {
  type: OutputType;
  title: string;
  content: string;
  generatedAt: Date;
  assessmentId: string;
}

export interface ADROutput extends FormattedOutput {
  type: 'adr-draft';
  sections: {
    title: string;
    status: string;
    context: string;
    decision: string;
    consequences: string;
  };
}

export interface GovernanceBriefingOutput extends FormattedOutput {
  type: 'governance-briefing';
  sections: {
    executiveSummary: string;
    keyDecisions: string;
    risks: string;
    assumptions: string;
    openQuestions: string;
  };
}

// ---------------------------------------------------------------------------
// Learning Mode Types
// ---------------------------------------------------------------------------

export interface AntiPattern {
  name: string;
  description: string;
  whyProblematic: string;
  betterApproach: string;
}

export interface StakeholderChallenge {
  stakeholder: 'security' | 'operations' | 'delivery' | 'finance';
  typicalChallenges: string[];
}

export interface LearningContent {
  domain: ArchitectureDomain;
  patternName: string;
  whySelected: string;
  whenInappropriate: string[];
  architectQuestions: string[];
  antiPatterns: AntiPattern[];
  stakeholderChallenges: StakeholderChallenge[];
  governanceExpectations: string[];
}

// ---------------------------------------------------------------------------
// Service Interfaces
// ---------------------------------------------------------------------------

/**
 * Discovery Generator — analyses a solution premise and produces structured
 * functional and non-functional requirements for discovery sessions.
 */
export interface DiscoveryGenerator {
  analyse(premise: SolutionPremise): DiscoveryOutput;
  updateRequirement(
    outputId: string,
    reqId: string,
    updated: Partial<DiscoveryRequirement>,
  ): DiscoveryOutput;
  removeRequirement(outputId: string, reqId: string): DiscoveryOutput;
  addRequirement(
    outputId: string,
    req: Omit<DiscoveryRequirement, 'id'>,
  ): DiscoveryOutput;
  exportForDiscoveryPack(output: DiscoveryOutput): string;
  toScenarioIntakePreFill(output: DiscoveryOutput): Partial<ScenarioIntake>;
}

/**
 * Scenario Intake Service — manages the multi-step wizard for capturing
 * workload context, with validation and save/resume support.
 */
export interface ScenarioIntakeService {
  createScenario(name: string): ScenarioIntake;
  saveStep(
    scenarioId: string,
    stepId: string,
    data: unknown,
  ): WizardValidation;
  getScenario(scenarioId: string): ScenarioIntake;
  listScenarios(): ScenarioIntake[];
  deleteScenario(scenarioId: string): void;
  validateScenario(scenarioId: string): WizardValidation[];
  getSummary(scenarioId: string): ScenarioSummary;
}

/**
 * Decision Engine — analyses scenario intake data and generates structured
 * assessments across all architecture domains.
 */
export interface DecisionEngine {
  assess(scenario: ScenarioIntake): AssessmentResult;
  reassess(
    scenarioId: string,
    updatedScenario: ScenarioIntake,
  ): AssessmentResult;
  getDomainAssessment(
    assessmentId: string,
    domain: ArchitectureDomain,
  ): DomainAssessment;
  getMissingInformation(assessmentId: string): MissingInformation[];
}

/**
 * Confidence Scorer — assigns RAG status to each architecture domain based
 * on assessment completeness and strength.
 */
export interface ConfidenceScorer {
  score(
    assessment: AssessmentResult,
    scenario: ScenarioIntake,
  ): ConfidenceSummary;
  getScore(
    assessmentId: string,
    domain: ArchitectureDomain,
  ): ConfidenceScore;
  getSummary(assessmentId: string): ConfidenceSummary;
}

/**
 * Pattern Recommender — produces consolidated recommendations with
 * decision logic explained.
 */
export interface PatternRecommender {
  recommend(assessment: AssessmentResult): ConsolidatedRecommendation;
  getRecommendation(
    assessmentId: string,
    domain: ArchitectureDomain,
  ): PatternRecommendation;
}

/**
 * Reference Architecture Generator — produces high-level architecture
 * summaries from assessment results.
 */
export interface ReferenceArchitectureGenerator {
  generate(
    assessment: AssessmentResult,
    recommendation: ConsolidatedRecommendation,
  ): ReferenceArchitecture;
  regenerate(assessmentId: string): ReferenceArchitecture;
}

/**
 * Pattern Library Service — manages the searchable library of architecture
 * patterns with filtering and suggestions.
 */
export interface PatternLibraryService {
  search(query: string, filter?: PatternFilter): PatternSearchResult[];
  getPattern(id: string): PatternEntry;
  getAllPatterns(): PatternEntry[];
  getPatternsByFilter(filter: PatternFilter): PatternEntry[];
  getSuggestions(query: string): PatternEntry[];
  highlightForPlatforms(
    patternId: string,
    platforms: string[],
  ): PatternEntry;
}

/**
 * Standards Service — manages the standards alignment checklist and tracks
 * user review status.
 */
export interface StandardsService {
  getApplicableStandards(domains: ArchitectureDomain[]): Standard[];
  getAllStandards(): Standard[];
  getRelevantForDomain(domain: ArchitectureDomain): Standard[];
  setReviewStatus(
    assessmentId: string,
    standardId: string,
    status: StandardReviewStatus['status'],
    note?: string,
  ): void;
  getReviewStatuses(assessmentId: string): StandardReviewStatus[];
}

/**
 * Output Formatter — generates exportable architecture documents in
 * structured text format.
 */
export interface OutputFormatter {
  generate(assessmentId: string, type: OutputType): FormattedOutput;
  generateAll(assessmentId: string): FormattedOutput[];
  copyToClipboard(content: string): void;
}

/**
 * Learning Mode Service — provides educational context for architecture
 * decisions including anti-patterns and governance expectations.
 */
export interface LearningModeService {
  getContent(
    domain: ArchitectureDomain,
    patternName: string,
  ): LearningContent;
  getAntiPatterns(domain: ArchitectureDomain): AntiPattern[];
  getGovernanceExpectations(domain: ArchitectureDomain): string[];
}

// ---------------------------------------------------------------------------
// Saved Assessment Types
// ---------------------------------------------------------------------------

export interface SavedAssessment {
  id: string;
  scenarioId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'in-progress' | 'complete';
  confidenceSummary?: ConfidenceSummary;
}

// ---------------------------------------------------------------------------
// Zustand Store Interface
// ---------------------------------------------------------------------------

export interface DesignLabState {
  // Wizard state
  currentScenarioId: string | null;
  currentStep: number;
  wizardData: Partial<ScenarioIntake>;
  validationErrors: Record<string, string[]>;

  // Assessment state
  currentAssessmentId: string | null;
  assessmentResult: AssessmentResult | null;
  confidenceSummary: ConfidenceSummary | null;
  recommendations: ConsolidatedRecommendation | null;

  // UI state
  selectedDomain: ArchitectureDomain | null;
  activeTab: 'assessment' | 'patterns' | 'standards' | 'export' | 'learning';
  isLoading: boolean;
  error: string | null;

  // Pattern library state
  patternSearchQuery: string;
  patternFilter: PatternFilter;
  patternResults: PatternSearchResult[];

  // Standards state
  standardReviewStatuses: StandardReviewStatus[];

  // Actions
  setCurrentStep: (step: number) => void;
  updateWizardData: (stepId: string, data: unknown) => void;
  setAssessmentResult: (result: AssessmentResult) => void;
  setConfidenceSummary: (summary: ConfidenceSummary) => void;
  setRecommendations: (recs: ConsolidatedRecommendation) => void;
  selectDomain: (domain: ArchitectureDomain | null) => void;
  setActiveTab: (tab: DesignLabState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

/**
 * Base error for all Design Lab operations.
 * Extends ArchLensError with a component identifier for targeted error handling.
 */
export class DesignLabError extends ArchLensError {
  public readonly component:
    | 'discovery'
    | 'intake'
    | 'engine'
    | 'scorer'
    | 'patterns'
    | 'output';

  constructor(
    message: string,
    code: string,
    userMessage: string,
    retryable: boolean,
    component: DesignLabError['component'],
  ) {
    super(message, code, userMessage, retryable);
    this.name = 'DesignLabError';
    this.component = component;
  }
}

/**
 * Thrown when scenario intake validation fails with field-level errors.
 */
export class ScenarioValidationError extends DesignLabError {
  public readonly fieldErrors: Array<{ field: string; message: string }>;

  constructor(fieldErrors: Array<{ field: string; message: string }>) {
    super(
      `Scenario validation failed: ${fieldErrors.length} errors`,
      'SCENARIO_VALIDATION',
      'Please complete the required fields before proceeding.',
      false,
      'intake',
    );
    this.name = 'ScenarioValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Thrown when the decision engine fails to assess a specific domain.
 */
export class AssessmentError extends DesignLabError {
  constructor(domain: ArchitectureDomain, cause: string) {
    super(
      `Assessment failed for domain ${domain}: ${cause}`,
      'ASSESSMENT_FAILED',
      'The assessment could not be completed. Please try again.',
      true,
      'engine',
    );
    this.name = 'AssessmentError';
  }
}

/**
 * Thrown when a requested content item (pattern, standard, learning content) is not found.
 */
export class ContentNotFoundError extends DesignLabError {
  constructor(contentType: string, id: string) {
    super(
      `Content not found: ${contentType}/${id}`,
      'CONTENT_NOT_FOUND',
      'The requested content is not available. It may need to be reinstalled.',
      false,
      'patterns',
    );
    this.name = 'ContentNotFoundError';
  }
}
