[# Implementation Plan: ArchLens](https://spectacular-dusk-736c8a.netlify.app/)

## Overview

ArchLens is an Electron + React + TypeScript desktop application for UK government solution architects. Implementation follows an incremental approach: project scaffolding and core infrastructure first, then each service layer built bottom-up with its corresponding IPC wiring and UI, finishing with integration and final wiring.

## Tasks

- [x] 1. Set up project structure, tooling, and core infrastructure
  - [x] 1.1 Initialise Electron + React + TypeScript project
    - Create project with `electron-builder`, React, TypeScript, Zustand
    - Configure `tsconfig.json`, ESLint, Prettier
    - Set up Vitest + `fast-check` + React Testing Library
    - Create directory structure: `src/main/`, `src/renderer/`, `src/preload/`, `resources/`, `tests/`
    - _Requirements: 11.1_

  - [x] 1.2 Implement Electron main process shell and window management
    - Create `main.ts` with `BrowserWindow` configuration (`nodeIntegration: false`, `contextIsolation: true`)
    - Implement preload script with `contextBridge` exposing typed `window.archlens` API stub
    - Set up `electron-log` for error logging
    - _Requirements: 11.1, 11.4_

  - [x] 1.3 Implement base error handling architecture
    - Create `ArchLensError` base class and subclasses: `AITimeoutError`, `AIProviderError`, `DocumentParseError`, `NetworkError`, `ValidationError`
    - Implement `mapAIError` helper for HTTP status code mapping
    - Implement IPC error serialisation (`{ success, error: { code, userMessage, retryable } }`)
    - _Requirements: 1.5, 1.6, 2.3, 2.4, 11.6_

  - [x] 1.4 Implement SQLite database manager and schema
    - Set up `better-sqlite3` with Electron `userData` path
    - Create all tables from the schema: `settings`, `documents`, `document_reviews`, `certifications`, `module_completions`, `articles`, `article_reads`, `journal_entries`, `journal_tags`, `ai_sessions`, `ai_messages`
    - Implement database integrity check on startup
    - _Requirements: 11.7_

  - [x] 1.5 Implement application settings service
    - Create `AppSettings` interface and settings CRUD via the `settings` table
    - Implement API key encryption/decryption using Electron `safeStorage`
    - Wire settings IPC handlers (`settings.get`, `settings.update`)
    - _Requirements: 1.7, 11.8_

- [x] 2. Checkpoint — Verify project scaffolding
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement AI Service Layer
  - [x] 3.1 Implement AI provider abstraction and OpenAI provider
    - Create `AIProvider` interface, `AIResponse`, `ConversationContext` types
    - Implement OpenAI provider with `sendMessage` and `validateApiKey`
    - Implement UK government system prompt (GDS Service Standard, Secure by Design, Zero Trust, TOGAF, Well-Architected)
    - Implement 15-second timeout with `AITimeoutError`
    - _Requirements: 1.1, 1.3, 1.5, 1.8_

  - [ ]* 3.2 Write property test: system prompt includes required UK government frameworks
    - **Property 1: System prompt includes required UK government frameworks**
    - **Validates: Requirements 1.3**

  - [x] 3.3 Implement Gemini provider and provider switching
    - Implement Gemini provider with `sendMessage` and `validateApiKey`
    - Implement `AIService.switchProvider` with key validation before switch
    - _Requirements: 1.7, 1.8_

  - [x] 3.4 Implement conversation context management
    - Maintain per-session message history in memory
    - Accumulate user/assistant messages in chronological order
    - Clear context on new session or Q&A panel close
    - _Requirements: 1.4_

  - [ ]* 3.5 Write property test: conversation context accumulates messages in order
    - **Property 2: Conversation context accumulates all messages in order**
    - **Validates: Requirements 1.4**

  - [x] 3.6 Implement AI error mapping
    - Map rate limit, authentication failure, server error, network error, and unknown errors to typed `ArchLensError` subclasses with distinct user-facing messages
    - _Requirements: 1.5, 1.6_

  - [ ]* 3.7 Write property test: AI error mapping produces descriptive messages
    - **Property 3: AI error mapping produces descriptive user-facing messages**
    - **Validates: Requirements 1.6**

  - [x] 3.8 Wire AI service IPC handlers
    - Implement IPC handlers for `ai.ask`, `ai.switchProvider`, `ai.validateKey`
    - Expose via preload `window.archlens.ai`
    - _Requirements: 1.1, 1.7_

- [x] 4. Implement Document Parser
  - [x] 4.1 Implement document parser for PDF, DOCX, and TXT
    - Implement `DocumentParser` interface with `parse`, `getSupportedFormats`, `validateFile`
    - PDF parsing via `pdf-parse`, DOCX via `mammoth`, TXT via `fs.readFile`
    - Implement file size/page limit validation (50 pages / 10MB)
    - Implement diagram detection via low text-to-page ratio heuristic with page-level warnings
    - Handle corrupted files with descriptive `DocumentParseError`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.2 Write property test: file format validation
    - **Property 4: File format validation accepts only supported formats**
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 4.3 Write property test: diagram detection flags low-text pages
    - **Property 5: Diagram detection flags low-text pages**
    - **Validates: Requirements 2.5**

  - [x] 4.4 Wire document parser IPC handlers
    - Implement IPC handlers for `documents.upload`, `documents.getSupportedFormats`
    - Expose via preload `window.archlens.documents`
    - _Requirements: 2.1_

- [x] 5. Implement Document Reviewer
  - [x] 5.1 Implement quick overview review
    - Create `DocumentReviewer` with `quickOverview` method
    - Construct structured AI prompt for traffic-light assessment across all five review areas
    - Parse AI response into typed `QuickOverview` with `TrafficLightRating[]`
    - Store review results in `document_reviews` table
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Write property test: review output covers all required areas
    - **Property 6: Review output covers all required review areas**
    - **Validates: Requirements 3.1, 3.2, 4.1**

  - [ ]* 5.3 Write property test: every traffic-light rating has a non-empty summary
    - **Property 7: Every traffic-light rating has a non-empty summary**
    - **Validates: Requirements 3.3, 3.4, 3.5**

  - [x] 5.4 Implement deep dive review
    - Implement `deepDive` method producing `DeepDiveReview` with sections, suggestions, and framework references
    - Construct structured AI prompt referencing GDS, Secure by Design, Zero Trust, TOGAF, Well-Architected
    - Store review results in `document_reviews` table
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 5.5 Write property test: deep dive sections include suggestions and framework references
    - **Property 8: Deep dive sections include suggestions and framework references**
    - **Validates: Requirements 4.2**

  - [x] 5.6 Wire document reviewer IPC handlers
    - Implement IPC handlers for `ai.reviewQuick`, `ai.reviewDeep`
    - Expose via preload `window.archlens.ai`
    - _Requirements: 3.1, 4.1_

- [x] 6. Checkpoint — Verify AI and document services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Article Curator
  - [x] 7.1 Implement RSS feed fetching and article curation
    - Create `ArticleCurator` with `getDaily`, `refresh`, `getCached`, `setRefreshTime`
    - Implement RSS parsing via `rss-parser` from pre-configured feed list (`resources/feeds.json`)
    - Implement 48-hour SQLite caching in `articles` table
    - Implement daily auto-refresh via `setInterval` (default 07:00)
    - Serve cached articles with staleness indicator on network failure
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [ ]* 7.2 Write property test: daily filter returns only recent articles
    - **Property 9: Daily article filter returns only recent articles**
    - **Validates: Requirements 5.1**

  - [ ]* 7.3 Write property test: article objects have all required display fields
    - **Property 10: Article objects have all required display fields**
    - **Validates: Requirements 5.3**

  - [x] 7.4 Wire article curator IPC handlers
    - Implement IPC handlers for `articles.getDaily`, `articles.refresh`, `articles.openInBrowser`
    - Expose via preload `window.archlens.articles`
    - _Requirements: 5.1, 5.4_

- [x] 8. Implement Learning Module Engine
  - [x] 8.1 Implement learning engine with content loading and sequencing
    - Create `LearningEngine` with `getCategories`, `getModules`, `getModule`, `completeModule`, `getNextRecommended`
    - Load and parse Markdown modules from `resources/content/modules/` at startup
    - Index modules by category and sequence order
    - Record completions in `module_completions` table
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.2 Write property test: modules ordered by sequence within category
    - **Property 11: Learning modules are ordered by sequence within each category**
    - **Validates: Requirements 6.2**

  - [ ]* 8.3 Write property test: module content has required structural elements
    - **Property 12: Learning module content has required structural elements**
    - **Validates: Requirements 6.3**

  - [ ]* 8.4 Write property test: module completion round-trip
    - **Property 13: Module completion round-trip**
    - **Validates: Requirements 6.4, 10.5**

  - [ ]* 8.5 Write property test: next recommended module follows sequence order
    - **Property 14: Next recommended module follows sequence order**
    - **Validates: Requirements 6.5**

  - [ ]* 8.6 Write property test: learning modules completable within 15 minutes
    - **Property 15: Learning modules are completable within 15 minutes**
    - **Validates: Requirements 6.6**

  - [x] 8.7 Wire learning engine IPC handlers
    - Implement IPC handlers for `learning.getCategories`, `learning.getModules`, `learning.completeModule`, `learning.getNextRecommended`
    - Expose via preload `window.archlens.learning`
    - _Requirements: 6.1, 6.4_

- [x] 9. Implement Career Tracker
  - [x] 9.1 Implement certification management and gap analysis
    - Create `CareerTracker` with `addCertification`, `removeCertification`, `getCertifications`, `analyseGaps`, `getRecommendations`, `getCapabilityCoverage`
    - Load DDAT capability definitions from `resources/content/ddat/capabilities.json`
    - Store certifications in `certifications` table
    - Implement gap analysis comparing user certs against target role DDAT requirements
    - Implement capability coverage percentage calculation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write property test: certification storage round-trip
    - **Property 16: Certification storage round-trip**
    - **Validates: Requirements 7.1**

  - [ ]* 9.3 Write property test: gap analysis identifies only genuine gaps
    - **Property 17: Gap analysis identifies only genuine gaps**
    - **Validates: Requirements 7.2**

  - [ ]* 9.4 Write property test: gap recommendations reference DDAT capabilities
    - **Property 18: Gap recommendations are valid and reference DDAT capabilities**
    - **Validates: Requirements 7.3, 7.4**

  - [ ]* 9.5 Write property test: capability coverage percentages bounded and consistent
    - **Property 19: Capability coverage percentages are bounded and consistent**
    - **Validates: Requirements 7.6**

  - [x] 9.6 Wire career tracker IPC handlers
    - Implement IPC handlers for `career.addCertification`, `career.getCertifications`, `career.analyseGaps`, `career.getRecommendations`, `career.getCoverage`
    - Expose via preload `window.archlens.career`
    - _Requirements: 7.1, 7.5_

- [x] 10. Checkpoint — Verify articles, learning, and career services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Diagram Coach
  - [x] 11.1 Implement diagram coach with module loading and ArchiMate reference
    - Create `DiagramCoach` with `getModules`, `getModule`, `getReference`, `completeModule`, `getNextRecommended`, `getAudienceGuidance`
    - Load diagram training modules from `resources/content/diagrams/`
    - Load ArchiMate reference data from `resources/content/reference/`
    - Record completions in `module_completions` table (type `diagram`)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [ ]* 11.2 Write property test: diagram module content is structurally complete
    - **Property 25: Diagram module content is structurally complete**
    - **Validates: Requirements 10.3, 10.4, 10.7, 10.8**

  - [ ]* 11.3 Write property test: diagram walkthrough steps are in order
    - **Property 26: Diagram walkthrough steps are in order**
    - **Validates: Requirements 10.4**

  - [ ]* 11.4 Write property test: ArchiMate reference library is complete
    - **Property 27: ArchiMate reference library is complete**
    - **Validates: Requirements 10.6**

  - [x] 11.5 Wire diagram coach IPC handlers
    - Implement IPC handlers for `diagrams.getModules`, `diagrams.getModule`, `diagrams.getReference`, `diagrams.completeModule`
    - Expose via preload `window.archlens.diagrams`
    - _Requirements: 10.1, 10.6_

- [x] 12. Implement Progress Dashboard and Journal
  - [x] 12.1 Implement progress service with aggregation and journal
    - Create `ProgressService` with `getSummary`, `getTimeline`, `addJournalEntry`, `getJournalEntries`, `exportReport`
    - Aggregate counts from `module_completions`, `certifications`, `article_reads` tables
    - Implement timeline filtering by period (weekly, monthly, quarterly)
    - Store journal entries in `journal_entries` and `journal_tags` tables
    - Implement export report generation as formatted text
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 12.2 Write property test: progress summary counts match actual records
    - **Property 20: Progress summary counts match actual records**
    - **Validates: Requirements 8.1, 8.5**

  - [ ]* 12.3 Write property test: timeline filtering returns entries within period
    - **Property 21: Timeline filtering returns only entries within the selected period**
    - **Validates: Requirements 8.3**

  - [ ]* 12.4 Write property test: journal entry round-trip
    - **Property 22: Journal entry round-trip**
    - **Validates: Requirements 8.4**

  - [ ]* 12.5 Write property test: progress export contains key metrics
    - **Property 23: Progress export contains key metrics**
    - **Validates: Requirements 8.6**

  - [x] 12.6 Wire progress service IPC handlers
    - Implement IPC handlers for `progress.getSummary`, `progress.getTimeline`, `progress.addJournal`, `progress.getJournalEntries`, `progress.exportReport`
    - Expose via preload `window.archlens.progress`
    - _Requirements: 8.1, 8.4_

- [x] 13. Implement Guardrails Knowledge Base
  - [x] 13.1 Implement guardrails service with content loading
    - Create `GuardrailsService` with `getTopics`, `getTopic`, `getByCategory`
    - Load Markdown content from `resources/content/guardrails/`
    - Index by category (governance, security, data-protection)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 13.2 Write property test: guardrails topics have valid categories
    - **Property 24: Guardrails topics have valid categories**
    - **Validates: Requirements 9.4**

  - [x] 13.3 Wire guardrails service IPC handlers
    - Implement IPC handlers for `guardrails.getTopics`, `guardrails.getTopic`
    - Expose via preload `window.archlens.guardrails`
    - _Requirements: 9.4_

- [x] 14. Checkpoint — Verify all backend services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement React UI — Shell and Navigation
  - [x] 15.1 Implement app shell with React Router and Zustand
    - Set up React Router with routes for all feature areas (Dashboard, Q&A, Document Review, Articles, Learning, Diagrams, Career, Progress, Guardrails, Settings)
    - Set up Zustand stores for UI state management
    - Implement dashboard home screen with navigation cards to all feature areas
    - Ensure navigation transitions complete within 500ms
    - _Requirements: 11.2, 11.3, 11.4_

  - [x] 15.2 Implement Settings page
    - Build settings form for AI provider selection, API key input, article refresh time, target role, theme
    - Wire to `window.archlens.settings` IPC
    - Implement API key validation feedback on provider switch
    - _Requirements: 1.7, 1.8, 11.8_

- [x] 16. Implement React UI — AI Q&A and Document Review
  - [x] 16.1 Implement AI Q&A panel
    - Build chat-style Q&A interface with message input and response display
    - Wire to `window.archlens.ai.ask` with session management
    - Display timeout/error messages with retry button when `retryable` is true
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

  - [x] 16.2 Implement Document Review page
    - Build document upload UI with file picker (PDF, DOCX, TXT filter)
    - Display unsupported format and parse error messages
    - Implement Quick Overview view with traffic-light rating cards
    - Implement Deep Dive view with sectioned feedback
    - Add toggle control to switch between Quick Overview and Deep Dive modes
    - Wire to `window.archlens.documents` and `window.archlens.ai` IPC
    - _Requirements: 2.1, 2.3, 2.4, 3.1, 3.6, 4.4, 4.5_

- [x] 17. Implement React UI — Articles, Learning, and Diagrams
  - [x] 17.1 Implement Daily Articles page
    - Build article list with title, source, date, summary display
    - Implement click-to-open in system browser via `articles.openInBrowser`
    - Show staleness banner when serving cached articles
    - Wire to `window.archlens.articles` IPC
    - _Requirements: 5.1, 5.3, 5.4, 5.6_

  - [x] 17.2 Implement Learning Modules page
    - Build category list and module list views
    - Display module content with sections, key takeaways, practical examples
    - Implement completion tracking and next-recommended suggestion
    - Wire to `window.archlens.learning` IPC
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 17.3 Implement Diagram Training page
    - Build diagram module browser by type
    - Display annotated examples, walkthroughs, exercises, common mistakes
    - Implement ArchiMate reference library view
    - Implement completion tracking and next-recommended suggestion
    - Wire to `window.archlens.diagrams` IPC
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 18. Implement React UI — Career, Progress, and Guardrails
  - [x] 18.1 Implement Career Growth page
    - Build certification input form and list display
    - Display gap analysis results with DDAT level comparisons
    - Display recommendations list
    - Display capability coverage visual summary
    - Wire to `window.archlens.career` IPC
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

  - [x] 18.2 Implement Progress Dashboard page
    - Build visual progress indicators for completion rates across categories
    - Implement timeline view with period selector (weekly, monthly, quarterly)
    - Build journal entry form with tag input
    - Display journal entries with filtering
    - Implement export report button
    - Wire to `window.archlens.progress` IPC
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 18.3 Implement AI Guardrails page
    - Build topic list organised by category with navigation
    - Display topic content rendered from Markdown
    - Wire to `window.archlens.guardrails` IPC
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 19. Checkpoint — Verify full UI integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Final integration and packaging
  - [x] 20.1 Complete IPC bridge wiring and preload script
    - Verify all `window.archlens` API methods are wired end-to-end
    - Ensure all IPC channels are explicitly whitelisted in preload
    - Verify error serialisation works across process boundary for all error types
    - _Requirements: 11.1, 11.6_

  - [x] 20.2 Configure electron-builder for Windows packaging
    - Set up `electron-builder` config for Windows NSIS installer
    - Bundle all static content under `resources/`
    - Create `resources/feeds.json` with pre-configured RSS feed URLs
    - Verify packaged app launches and all features work
    - _Requirements: 11.1, 11.5_

  - [ ]* 20.3 Write integration tests
    - Write Playwright E2E tests for app launch, navigation, and document review flow
    - Verify navigation transitions under 500ms
    - _Requirements: 11.2, 11.4_

- [x] 21. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at natural breakpoints
- Property tests validate the 27 correctness properties defined in the design document
- All AI provider calls should be mocked in tests — no real API calls in unit/property tests
- SQLite tests should use in-memory databases (`:memory:`)
