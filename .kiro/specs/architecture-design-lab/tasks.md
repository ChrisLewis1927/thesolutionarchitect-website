# Implementation Plan: Architecture Design Lab

## Overview

Implement the Architecture Design Lab module for ArchLens — a structured decision-making tool for UK government solution architects. The implementation follows a dependency-ordered approach: database schema and types first, then core services, IPC bridge, Zustand store, UI components, navigation integration, and finally tests. All code is TypeScript, consistent with the existing ArchLens stack.

## Tasks

- [ ] 1. Set up project structure, types, and database schema
  - [x] 1.1 Create Design Lab TypeScript type definitions and interfaces
    - Create `src/main/services/design-lab/types.ts` with all shared interfaces and types from the design document
    - Include: ArchitectureDomain, RAGStatus, ScenarioIntake and all step interfaces, DomainAssessment, ConfidenceScore, PatternEntry, Standard, OutputType, LearningContent, all error classes
    - _Requirements: 3.1, 5.1, 8.2, 12.6_

  - [x] 1.2 Create SQLite database migration for Design Lab tables
    - Add migration to create all 7 Design Lab tables: `design_lab_scenarios`, `design_lab_assessments`, `design_lab_confidence`, `design_lab_standard_reviews`, `design_lab_discoveries`, `design_lab_reference_architectures`, `design_lab_outputs`
    - Include all constraints, foreign keys, CHECK constraints, and default values from the design schema
    - Wire migration into the existing ArchLens database manager startup
    - _Requirements: 12.4_

  - [x] 1.3 Create Design Lab content file directory structure and seed pattern files
    - Create `resources/content/design-lab/patterns/` with all 18 pattern JSON files (static-website, public-transactional, internal-lob, api-led-integration, event-driven, batch-file-transfer, data-lake-analytics, saas-first, containerised, serverless, vm-legacy, multi-az-production, multi-region-dr, edge-protected-public, secure-admin-portal, case-management, document-upload-processing, hybrid-cloud)
    - Each file follows the PatternEntry schema from the design document
    - _Requirements: 8.1, 8.2_

  - [x] 1.4 Create standards content files
    - Create `resources/content/design-lab/standards/` with JSON files for: tcop, cloud-first, govuk-service-standard, secure-by-design, ncsc-cloud-security, data-protection, accessibility, aws-well-architected, azure-well-architected, departmental-principles
    - Each file follows the Standard interface schema with id, name, category, description, url, and applicableDomains
    - _Requirements: 9.1_

  - [x] 1.5 Create decision rules content files
    - Create `resources/content/design-lab/decision-rules/` with one JSON file per architecture domain (11 files)
    - Each file contains the rule sets used by the Decision Engine to produce assessments
    - _Requirements: 3.1, 3.2_

  - [x] 1.6 Create learning mode content files
    - Create `resources/content/design-lab/learning/anti-patterns/`, `governance-expectations/`, and `stakeholder-challenges/` directories
    - Create one JSON file per architecture domain in each subdirectory
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 1.7 Create output format template files
    - Create `resources/content/design-lab/templates/` with: adr-template.md, governance-briefing-template.md, hld-section-template.md, risk-log-template.md
    - _Requirements: 10.3, 10.4_

- [ ] 2. Implement Discovery Generator service
  - [x] 2.1 Implement Discovery Generator core logic
    - Create `src/main/services/design-lab/discovery-generator.ts`
    - Implement `analyse()` method that accepts a SolutionPremise and produces a DiscoveryOutput with categorised functional and non-functional requirements
    - Implement rule-based text analysis to extract implied requirements from premise text
    - Flag ambiguous areas with discovery questions and ambiguity notes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Implement Discovery Generator CRUD and export methods
    - Implement `updateRequirement()`, `removeRequirement()`, `addRequirement()` methods
    - Implement `exportForDiscoveryPack()` to produce formatted text output
    - Implement `toScenarioIntakePreFill()` to map discovery output to partial ScenarioIntake
    - _Requirements: 1.7, 1.8, 1.9_

  - [ ]* 2.3 Write property tests for Discovery Generator (Properties 1-6)
    - **Property 1: Discovery output contains both functional and non-functional requirements with valid categories**
    - **Property 2: Discovery requirements have sufficient detail**
    - **Property 3: Ambiguous requirements are flagged with explanatory notes**
    - **Property 4: Discovery requirement CRUD round-trip**
    - **Property 5: Discovery export contains all requirement descriptions**
    - **Property 6: Discovery to scenario intake pre-fill produces valid partial scenario**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**

  - [ ]* 2.4 Write unit tests for Discovery Generator
    - Test with empty premise (should reject)
    - Test with minimal premise (should produce at least some requirements)
    - Test ambiguity detection with vague inputs
    - Test export format contains all requirement descriptions
    - Test pre-fill mapping produces valid partial ScenarioIntake
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Implement Scenario Intake service
  - [x] 3.1 Implement Scenario Intake service with wizard validation
    - Create `src/main/services/design-lab/scenario-intake.ts`
    - Implement `createScenario()`, `saveStep()`, `getScenario()`, `listScenarios()`, `deleteScenario()`
    - Implement per-step validation with mandatory field checks
    - Implement `validateScenario()` for full scenario validation
    - Implement `getSummary()` to produce ScenarioSummary with completeness percentage
    - Persist scenario data to `design_lab_scenarios` SQLite table
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.2 Write property tests for Scenario Intake (Properties 7-9)
    - **Property 7: Scenario intake wizard validates mandatory fields**
    - **Property 8: Scenario intake data persistence round-trip**
    - **Property 9: Scenario summary reflects actual scenario data**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**

  - [ ]* 3.3 Write unit tests for Scenario Intake service
    - Test creating a new scenario returns valid structure
    - Test saving step with missing mandatory fields returns validation errors
    - Test saving step with valid data returns isValid true
    - Test backward navigation preserves data
    - Test save/resume round-trip
    - Test delete removes scenario from database
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Decision Engine service
  - [x] 5.1 Implement Decision Engine core assessment logic
    - Create `src/main/services/design-lab/decision-engine.ts`
    - Implement `assess()` method that takes a complete ScenarioIntake and produces an AssessmentResult covering all 11 architecture domains
    - Load decision rules from content files in `resources/content/design-lab/decision-rules/`
    - Implement rule-based pattern matching against scenario inputs
    - Produce DomainAssessment with all required fields: recommendedPattern, candidateTechnologies, rationale, alternativesRationale, risksAndAssumptions, questionsToAskNext, evidenceNeeded, artefactsToProduce, relevantStandards, operationalBurden, costConsiderations, viableOptions, labels
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 5.2 Implement platform constraint propagation and responsible behaviour
    - Implement cloud platform filtering: constrain candidate technologies to user's available platforms
    - Implement no-cloud scenario handling: exclude cloud-specific technologies, recommend on-premises/SaaS
    - Implement missing information detection: identify gaps and produce MissingInformation entries
    - Implement managed services preference logic (prefer managed unless justified)
    - Implement facts/assumptions/recommendations labelling in AssessmentLabels
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 11.1, 11.2, 11.3_

  - [x] 5.3 Implement reassess and domain-specific query methods
    - Implement `reassess()` for updated scenario data
    - Implement `getDomainAssessment()` for single-domain retrieval
    - Implement `getMissingInformation()` for gap analysis
    - Persist assessment results to `design_lab_assessments` table
    - _Requirements: 2.7, 3.1_

  - [ ]* 5.4 Write property tests for Decision Engine (Properties 10-16, 33)
    - **Property 10: Decision engine produces assessments for all 11 architecture domains**
    - **Property 11: Domain assessments have all required structural fields**
    - **Property 12: Assessment outputs are labelled as facts, assumptions, or recommendations**
    - **Property 13: Viable options include comparative trade-offs**
    - **Property 14: Operational burden and cost considerations are populated**
    - **Property 15: Platform constraint propagation filters candidate technologies**
    - **Property 16: No-cloud scenario excludes cloud-specific technologies**
    - **Property 33: Missing information is identified for incomplete scenarios**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 3.10, 11.1, 11.2, 11.3, 11.4, 11.5**

  - [ ]* 5.5 Write unit tests for Decision Engine
    - Test assessment with complete scenario produces 11 domain assessments
    - Test platform filtering with AWS-only scenario
    - Test no-cloud scenario excludes cloud technologies
    - Test incomplete scenario produces missing information entries
    - Test managed services preference in recommendations
    - Test labels contain facts, assumptions, and recommendations
    - _Requirements: 3.1, 3.2, 3.3, 3.9, 3.10, 11.1_

- [ ] 6. Implement Confidence Scorer service
  - [x] 6.1 Implement Confidence Scorer
    - Create `src/main/services/design-lab/confidence-scorer.ts`
    - Implement `score()` method that assigns RAG status to each domain based on assessment completeness
    - Implement scoring rules: Green (high confidence, no gaps), Amber (partial, specific gaps), Red (low confidence, significant gaps), Grey (not assessed), N/A (not applicable)
    - Implement `getSummary()` with counts and overall maturity calculation
    - Persist confidence scores to `design_lab_confidence` table
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 6.2 Write property tests for Confidence Scorer (Properties 19-20)
    - **Property 19: Confidence scores cover all domains with valid RAG status**
    - **Property 20: RAG status consistency with gaps**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

  - [ ]* 6.3 Write unit tests for Confidence Scorer
    - Test Green status has empty gaps array
    - Test Amber status has non-empty gaps
    - Test Red status has more gaps than Amber
    - Test Grey for unassessed domains
    - Test N/A for inapplicable domains
    - Test summary counts match individual scores
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 7. Implement Pattern Recommender service
  - [x] 7.1 Implement Pattern Recommender
    - Create `src/main/services/design-lab/pattern-recommender.ts`
    - Implement `recommend()` method that produces ConsolidatedRecommendation from AssessmentResult
    - Each PatternRecommendation includes: domain, patternName, patternId, decisionLogic, conditionsForChange, risks, confidenceLevel
    - Identify cross-cutting concerns across domains
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write property tests for Pattern Recommender (Properties 17-18)
    - **Property 17: Pattern recommendations cover all assessed domains with decision logic**
    - **Property 18: High-severity risks in recommendations have mitigations**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 11.6**

  - [ ]* 7.3 Write unit tests for Pattern Recommender
    - Test recommendation output covers all 11 domains
    - Test decision logic is non-empty for each recommendation
    - Test conditions for change are populated
    - Test high-severity risks have mitigations
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Implement Reference Architecture Generator service
  - [x] 8.1 Implement Reference Architecture Generator
    - Create `src/main/services/design-lab/reference-architecture-generator.ts`
    - Implement `generate()` method that produces ReferenceArchitecture from AssessmentResult and ConsolidatedRecommendation
    - Produce: designSummary (plain English), keyComponents, dataFlowDescription, securityControls, resilienceModel, operationalModel, integrationApproach, deploymentApproach, keyRisks, openQuestions (categorised by stakeholder group), assumptions, adrCandidates, hldSectionDraft, governanceReviewQuestions
    - Implement `regenerate()` for re-running generation
    - Persist to `design_lab_reference_architectures` table
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.2 Write property tests for Reference Architecture Generator (Properties 21-23)
    - **Property 21: Reference architecture has all required sections populated**
    - **Property 22: Open questions are categorised by valid stakeholder group**
    - **Property 23: ADR candidates have title and context statement**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Pattern Library service
  - [x] 10.1 Implement Pattern Library service
    - Create `src/main/services/design-lab/pattern-library.ts`
    - Implement `search()` with relevance scoring based on name, description, and component keywords
    - Implement `getPattern()`, `getAllPatterns()`, `getPatternsByFilter()`
    - Implement `getSuggestions()` for partial match suggestions when no exact results
    - Implement `highlightForPlatforms()` to emphasise relevant cloud services
    - Load patterns from `resources/content/design-lab/patterns/` JSON files
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 10.2 Write property tests for Pattern Library (Properties 25-27)
    - **Property 25: Pattern library entries have all required display fields**
    - **Property 26: Pattern search returns results matching the query**
    - **Property 27: Pattern filter returns only matching patterns**
    - **Validates: Requirements 8.2, 8.3, 8.5**

  - [ ]* 10.3 Write unit tests for Pattern Library
    - Test loading all 18 patterns from content files
    - Test search by exact pattern name returns that pattern
    - Test search with no results returns suggestions
    - Test filter by cloud provider returns only matching patterns
    - Test filter by security classification
    - Test highlightForPlatforms emphasises correct services
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 11. Implement Standards Service
  - [x] 11.1 Implement Standards Service
    - Create `src/main/services/design-lab/standards-service.ts`
    - Implement `getApplicableStandards()`, `getAllStandards()`, `getRelevantForDomain()`
    - Implement `setReviewStatus()` and `getReviewStatuses()` with persistence to `design_lab_standard_reviews` table
    - Load standards from `resources/content/design-lab/standards/` JSON files
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 11.2 Write property tests for Standards Service (Properties 28-29)
    - **Property 28: Standards relevance filtering returns only applicable standards**
    - **Property 29: Standards review status round-trip**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 11.3 Write unit tests for Standards Service
    - Test loading all standards from content files
    - Test filtering by domain returns only applicable standards
    - Test setting review status persists correctly
    - Test adding note to action-required status
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 12. Implement Output Formatter service
  - [x] 12.1 Implement Output Formatter
    - Create `src/main/services/design-lab/output-formatter.ts`
    - Implement `generate()` for all 7 output types: architecture-decision-summary, hld-section, adr-draft, governance-briefing, risk-assumption-log, pattern-comparison, stakeholder-questions
    - Implement `generateAll()` to produce all output types at once
    - Implement `copyToClipboard()` using Electron clipboard API
    - Use template files from `resources/content/design-lab/templates/`
    - Persist generated outputs to `design_lab_outputs` table
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 12.2 Write property tests for Output Formatter (Properties 30-32)
    - **Property 30: Output formatter produces valid non-empty content for all output types**
    - **Property 31: ADR output has all required template sections**
    - **Property 32: Governance briefing output has all required sections**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ]* 12.3 Write unit tests for Output Formatter
    - Test generating each output type produces non-empty Markdown content
    - Test ADR output has title, status, context, decision, consequences sections
    - Test governance briefing has executive summary, key decisions, risks, assumptions, open questions
    - Test copyToClipboard calls clipboard API with correct content
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13. Implement Learning Mode service
  - [x] 13.1 Implement Learning Mode Service
    - Create `src/main/services/design-lab/learning-mode.ts`
    - Implement `getContent()` that returns LearningContent for a domain and pattern combination
    - Implement `getAntiPatterns()` for domain-specific anti-patterns
    - Implement `getGovernanceExpectations()` for domain-specific governance expectations
    - Load content from `resources/content/design-lab/learning/` subdirectories
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 13.2 Write property tests for Learning Mode (Property 24)
    - **Property 24: Learning mode content has all required educational fields**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

  - [ ]* 13.3 Write unit tests for Learning Mode Service
    - Test getContent returns all required fields for a known domain/pattern
    - Test anti-patterns have name, description, whyProblematic, betterApproach
    - Test stakeholder challenges cover security, operations, delivery, finance
    - Test governance expectations are non-empty
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement Design Lab orchestrator service and IPC bridge
  - [x] 15.1 Implement Design Lab orchestrator service
    - Create `src/main/services/design-lab/design-lab-service.ts`
    - Orchestrate calls between Discovery Generator, Scenario Intake, Decision Engine, Confidence Scorer, Pattern Recommender, Reference Architecture Generator, Pattern Library, Standards Service, Output Formatter, and Learning Mode
    - Implement saved assessments management: `listSavedAssessments()`, status tracking
    - _Requirements: 12.4, 12.5_

  - [x] 15.2 Implement IPC handlers for Design Lab
    - Create `src/main/ipc/design-lab-handlers.ts`
    - Register IPC handlers for all Design Lab operations listed in the IPC Bridge Extension design
    - Wire handlers to the Design Lab orchestrator service
    - Handle errors and serialize DesignLabError subclasses across the process boundary
    - _Requirements: 12.4, 12.6_

  - [x] 15.3 Extend preload script with Design Lab API
    - Add `designLab` namespace to the existing `window.archlens` API in `src/preload/index.ts`
    - Expose all Design Lab IPC methods through contextBridge
    - Whitelist all Design Lab IPC channels
    - _Requirements: 12.6_

  - [ ]* 15.4 Write property tests for persistence layer (Properties 34-35)
    - **Property 34: Assessment data persistence round-trip**
    - **Property 35: Saved assessments list returns all persisted assessments**
    - **Validates: Requirements 12.4, 12.5**

  - [ ]* 15.5 Write unit tests for IPC handlers
    - Test each IPC handler correctly routes to the orchestrator service
    - Test error serialization across process boundary
    - Test validation errors return field-level error details
    - _Requirements: 12.4, 12.6_

- [ ] 16. Implement Zustand store for Design Lab
  - [x] 16.1 Implement Design Lab Zustand store
    - Create `src/renderer/stores/design-lab-store.ts`
    - Implement all state slices: wizard state, assessment state, UI state, pattern library state, standards state
    - Implement all actions: setCurrentStep, updateWizardData, setAssessmentResult, setConfidenceSummary, setRecommendations, selectDomain, setActiveTab, setLoading, setError, reset
    - _Requirements: 12.4, 12.6_

- [ ] 17. Implement Design Lab UI pages
  - [x] 17.1 Implement Design Lab landing page
    - Create `src/renderer/pages/DesignLab.tsx`
    - Display list of saved assessments with name, status, date, and confidence summary
    - Provide "New Assessment" button to start a new scenario
    - Provide "Resume" action for in-progress assessments
    - Follow existing ArchLens visual design language
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [x] 17.2 Implement Scenario Intake Wizard UI component
    - Create `src/renderer/pages/design-lab/ScenarioWizard.tsx`
    - Implement multi-step form with all 12 wizard steps from the design
    - Implement per-step validation with inline field-level error display
    - Implement backward navigation without data loss
    - Implement save/resume functionality
    - Display summary confirmation before triggering assessment
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 17.3 Implement Assessment Dashboard UI
    - Create `src/renderer/pages/design-lab/AssessmentDashboard.tsx`
    - Display RAG status indicators for all 11 architecture domains in a summary view
    - Implement domain detail view showing full DomainAssessment content
    - Display facts/assumptions/recommendations with clear labelling
    - Display viable options with trade-off comparisons
    - Show missing information prompts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.7, 11.1, 11.2, 11.3_

  - [x] 17.4 Implement Pattern Library Browser UI
    - Create `src/renderer/pages/design-lab/PatternBrowser.tsx`
    - Implement search input with real-time results
    - Implement filter controls for cloud provider, workload type, security classification
    - Display pattern cards with all required fields from PatternEntry
    - Highlight cloud services relevant to user's selected platforms
    - Show suggestions when no exact matches found
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 17.5 Implement Export Panel UI
    - Create `src/renderer/pages/design-lab/ExportPanel.tsx`
    - Display all 7 output types as selectable options
    - Show generated output as formatted Markdown preview
    - Implement one-click copy to clipboard for each section
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 17.6 Implement Standards Alignment Panel UI
    - Create `src/renderer/pages/design-lab/StandardsPanel.tsx`
    - Display checklist of applicable standards
    - Implement status toggles: reviewed, not applicable, action required
    - Implement note input for action-required items
    - Highlight standards relevant to current recommendations
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 17.7 Implement Learning Mode UI
    - Create `src/renderer/pages/design-lab/LearningMode.tsx`
    - Display educational content for selected domain and pattern
    - Show why pattern was selected, when inappropriate, architect questions
    - Display anti-patterns with explanations
    - Show stakeholder challenges and governance expectations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 17.8 Implement Discovery Generator UI
    - Create `src/renderer/pages/design-lab/DiscoveryWizard.tsx`
    - Implement free-text premise input
    - Display generated requirements in categorised lists
    - Implement edit, remove, and add actions for requirements
    - Implement export to discovery pack
    - Implement "Proceed to Scenario Intake" with pre-fill
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 1.8, 1.9_

- [ ] 18. Integrate Design Lab into ArchLens navigation
  - [x] 18.1 Add Design Lab route and navigation entry
    - Add `{ label: 'Design Lab', path: '/design-lab', icon: '🏗️' }` to navItems in `src/renderer/components/Layout.tsx`
    - Add route in `src/renderer/App.tsx`: `/design-lab` → DesignLab landing page
    - Add nested routes for wizard, assessment, patterns, export sub-pages
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 18.2 Write unit tests for Design Lab UI components
    - Test DesignLab landing page renders saved assessments list
    - Test ScenarioWizard renders all steps and validates fields
    - Test AssessmentDashboard renders RAG indicators for all domains
    - Test PatternBrowser search and filter functionality
    - Test ExportPanel copy-to-clipboard interaction
    - Test StandardsPanel status toggle and note input
    - Test LearningMode renders all educational sections
    - _Requirements: 12.1, 12.3, 12.6_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1-35)
- Unit tests validate specific examples and edge cases
- All services follow the existing ArchLens pattern: service layer in `src/main/services/`, IPC in `src/main/ipc/`, pages in `src/renderer/pages/`
- Content files in `resources/content/design-lab/` follow the existing ArchLens content bundling pattern
- The Zustand store follows the same pattern as existing stores in `src/renderer/stores/`
- Database migrations extend the existing SQLite database managed by `better-sqlite3`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] },
    { "id": 6, "tasks": ["5.4", "5.5", "6.1", "7.1"] },
    { "id": 7, "tasks": ["6.2", "6.3", "7.2", "7.3", "8.1"] },
    { "id": 8, "tasks": ["8.2", "10.1", "11.1", "12.1", "13.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "11.2", "11.3", "12.2", "12.3", "13.2", "13.3"] },
    { "id": 10, "tasks": ["15.1"] },
    { "id": 11, "tasks": ["15.2", "15.3"] },
    { "id": 12, "tasks": ["15.4", "15.5", "16.1"] },
    { "id": 13, "tasks": ["17.1", "17.2", "17.8"] },
    { "id": 14, "tasks": ["17.3", "17.4", "17.5", "17.6", "17.7"] },
    { "id": 15, "tasks": ["18.1"] },
    { "id": 16, "tasks": ["18.2"] }
  ]
}
```
