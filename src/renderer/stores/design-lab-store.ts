// Architecture Design Lab — Zustand Store
// Implements: Requirements 12.4, 12.6

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types (renderer-side mirrors of main process types)
// ---------------------------------------------------------------------------

type ArchitectureDomain =
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

type RAGStatus = 'green' | 'amber' | 'red' | 'grey' | 'na';

interface PatternFilter {
  cloudProvider?: 'aws' | 'azure' | 'gcp';
  workloadType?: string;
  securityClassification?: string;
}

interface PatternSearchResult {
  pattern: unknown;
  relevanceScore: number;
  matchedOn: string[];
}

interface StandardReviewStatus {
  standardId: string;
  assessmentId: string;
  status: 'not-reviewed' | 'reviewed' | 'not-applicable' | 'action-required';
  note?: string;
  reviewedAt?: Date;
}

// ---------------------------------------------------------------------------
// Store State Interface
// ---------------------------------------------------------------------------

interface DesignLabState {
  // Wizard state
  currentScenarioId: string | null;
  currentStep: number;
  wizardData: Record<string, unknown>;
  validationErrors: Record<string, string[]>;

  // Assessment state
  currentAssessmentId: string | null;
  assessmentResult: unknown | null;
  confidenceSummary: unknown | null;
  recommendations: unknown | null;

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
  setCurrentScenarioId: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  updateWizardData: (stepId: string, data: unknown) => void;
  setValidationErrors: (stepId: string, errors: string[]) => void;
  clearValidationErrors: () => void;
  setCurrentAssessmentId: (id: string | null) => void;
  setAssessmentResult: (result: unknown) => void;
  setConfidenceSummary: (summary: unknown) => void;
  setRecommendations: (recs: unknown) => void;
  selectDomain: (domain: ArchitectureDomain | null) => void;
  setActiveTab: (tab: DesignLabState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPatternSearchQuery: (query: string) => void;
  setPatternFilter: (filter: PatternFilter) => void;
  setPatternResults: (results: PatternSearchResult[]) => void;
  setStandardReviewStatuses: (statuses: StandardReviewStatus[]) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState = {
  currentScenarioId: null,
  currentStep: 0,
  wizardData: {},
  validationErrors: {},
  currentAssessmentId: null,
  assessmentResult: null,
  confidenceSummary: null,
  recommendations: null,
  selectedDomain: null,
  activeTab: 'assessment' as const,
  isLoading: false,
  error: null,
  patternSearchQuery: '',
  patternFilter: {},
  patternResults: [],
  standardReviewStatuses: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDesignLabStore = create<DesignLabState>((set) => ({
  ...initialState,

  setCurrentScenarioId: (id) => set({ currentScenarioId: id }),

  setCurrentStep: (step) => set({ currentStep: step }),

  updateWizardData: (stepId, data) =>
    set((state) => ({
      wizardData: { ...state.wizardData, [stepId]: data },
    })),

  setValidationErrors: (stepId, errors) =>
    set((state) => ({
      validationErrors: { ...state.validationErrors, [stepId]: errors },
    })),

  clearValidationErrors: () => set({ validationErrors: {} }),

  setCurrentAssessmentId: (id) => set({ currentAssessmentId: id }),

  setAssessmentResult: (result) => set({ assessmentResult: result }),

  setConfidenceSummary: (summary) => set({ confidenceSummary: summary }),

  setRecommendations: (recs) => set({ recommendations: recs }),

  selectDomain: (domain) => set({ selectedDomain: domain }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setPatternSearchQuery: (query) => set({ patternSearchQuery: query }),

  setPatternFilter: (filter) => set({ patternFilter: filter }),

  setPatternResults: (results) => set({ patternResults: results }),

  setStandardReviewStatuses: (statuses) => set({ standardReviewStatuses: statuses }),

  reset: () => set(initialState),
}));
