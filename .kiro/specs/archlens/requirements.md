# Requirements Document

## Introduction

ArchLens is a Windows desktop application designed as a personal growth companion for UK government solution architects working in ICS Digital (Department for Energy Security & Net Zero / DSIT). The application provides AI-powered architectural guidance, design document review, curated learning, architectural diagramming training, career development tracking, and knowledge modules — all tailored to the UK government digital landscape and the DDAT capability framework. ArchLens helps architects bridge the gap between their current role and senior positions by combining daily learning, certification tracking, and on-demand AI assistance into a single professional tool.

## Glossary

- **ArchLens**: The desktop application being specified in this document.
- **AI_Provider**: The external AI service (OpenAI ChatGPT or Google Gemini) used to power natural language Q&A and document analysis features.
- **Document_Reviewer**: The subsystem responsible for ingesting uploaded documents, analysing them against best-practice frameworks, and producing structured feedback.
- **Article_Curator**: The subsystem responsible for discovering, filtering, and presenting daily architecture-related articles from external sources.
- **Learning_Module_Engine**: The subsystem responsible for delivering bite-sized architecture learning content organised by topic and framework.
- **Career_Tracker**: The subsystem responsible for managing certifications, qualifications, skill gaps, and career progression recommendations.
- **Progress_Dashboard**: The visual interface component that displays learning progress, development journal entries, and objective tracking.
- **Traffic_Light_Rating**: A colour-coded assessment indicator using green (good), amber (needs attention), and red (significant issues) to summarise document quality per review area.
- **GDS_Service_Standard**: The UK Government Digital Service Standard — a set of criteria for designing and building government digital services.
- **Secure_by_Design**: A UK government security framework requiring security to be embedded throughout the development lifecycle.
- **Zero_Trust**: A security architecture model that assumes no implicit trust and requires continuous verification of every access request.
- **DDAT_Framework**: The Digital, Data and Technology Profession Capability Framework used across UK government to define skills and career paths.
- **TOGAF**: The Open Group Architecture Framework — an enterprise architecture methodology.
- **ArchiMate**: An open and independent modelling language for enterprise architecture.
- **Well_Architected_Framework**: Cloud provider frameworks (AWS and Azure) defining best practices for building secure, high-performing, resilient, and efficient infrastructure.
- **Guardrails_Knowledge_Base**: The subsystem providing dedicated content on AI governance, security guardrails, and safe use of AI in government contexts.
- **Diagram_Coach**: The subsystem responsible for teaching architectural diagramming techniques, providing interactive ArchiMate and general architecture diagram tutorials, and offering AI-assisted feedback on user-created diagrams.

## Requirements

### Requirement 1: AI-Powered Architectural Q&A

**User Story:** As a solution architect, I want to ask architecture questions in natural language at any time, so that I can get immediate expert guidance during calls, workshops, and discovery sessions.

#### Acceptance Criteria

1. WHEN the user submits a natural language question, THE AI_Provider SHALL return a contextually relevant architecture response within 10 seconds.
2. WHEN the user opens ArchLens, THE ArchLens SHALL display the Q&A interface in a regular desktop window mode ready for input.
3. WHEN the user submits a question, THE AI_Provider SHALL tailor responses to UK government architecture context including GDS_Service_Standard, Secure_by_Design, and Zero_Trust principles.
4. WHEN the user submits a follow-up question within the same session, THE AI_Provider SHALL maintain conversational context from previous exchanges in that session.
5. IF the AI_Provider fails to respond within 15 seconds, THEN THE ArchLens SHALL display a timeout error message with a retry option.
6. IF the AI_Provider returns an error, THEN THE ArchLens SHALL display a descriptive error message indicating the nature of the failure.
7. THE ArchLens SHALL allow the user to configure which AI_Provider to use (OpenAI ChatGPT or Google Gemini) via a settings interface.
8. WHEN the user switches the AI_Provider in settings, THE ArchLens SHALL validate the corresponding API key before confirming the switch.

### Requirement 2: Design Document Upload and Ingestion

**User Story:** As a solution architect, I want to upload design documents in multiple formats, so that I can receive AI-powered review feedback without manual reformatting.

#### Acceptance Criteria

1. WHEN the user uploads a document, THE Document_Reviewer SHALL accept PDF, Word (.docx), and plain text (.txt) file formats.
2. WHEN the user uploads a supported document, THE Document_Reviewer SHALL extract the text content and prepare it for analysis within 30 seconds for documents up to 50 pages.
3. IF the user uploads an unsupported file format, THEN THE Document_Reviewer SHALL display an error message listing the supported formats.
4. IF the user uploads a corrupted or unreadable file, THEN THE Document_Reviewer SHALL display a descriptive error message indicating the file could not be processed.
5. WHEN the user uploads a document containing mixed content (text and diagrams), THE Document_Reviewer SHALL extract and analyse the text content and flag diagram sections for manual review.

### Requirement 3: Design Document Review — Quick Overview

**User Story:** As a solution architect, I want a quick traffic-light overview of my design document, so that I can rapidly identify areas needing attention before a governance board.

#### Acceptance Criteria

1. WHEN the user selects "Quick Overview" mode for an uploaded document, THE Document_Reviewer SHALL produce a Traffic_Light_Rating for each review area within 30 seconds.
2. THE Document_Reviewer SHALL assess the following review areas at minimum: alignment with GDS_Service_Standard, Secure_by_Design compliance, Zero_Trust considerations, technical feasibility, and clarity of communication.
3. WHEN a review area is rated green, THE Document_Reviewer SHALL display a brief summary confirming compliance for that area.
4. WHEN a review area is rated amber, THE Document_Reviewer SHALL display a summary identifying specific concerns for that area.
5. WHEN a review area is rated red, THE Document_Reviewer SHALL display a summary identifying critical issues requiring resolution for that area.
6. WHEN the user views the Quick Overview, THE Document_Reviewer SHALL provide a toggle control to switch to Deep Dive mode for the same document.

### Requirement 4: Design Document Review — Deep Dive

**User Story:** As a solution architect, I want detailed written feedback on my design documents with specific improvement suggestions, so that I can strengthen my designs before presenting at Architecture boards.

#### Acceptance Criteria

1. WHEN the user selects "Deep Dive" mode for an uploaded document, THE Document_Reviewer SHALL produce detailed written feedback for each review area within 60 seconds.
2. WHEN the Document_Reviewer produces feedback for a review area, THE Document_Reviewer SHALL include specific improvement suggestions with references to the relevant best-practice framework.
3. THE Document_Reviewer SHALL assess documents against GDS_Service_Standard, Secure_by_Design, Zero_Trust, and industry best practices including TOGAF and Well_Architected_Framework principles.
4. WHEN the user views the Deep Dive results, THE Document_Reviewer SHALL organise feedback by review area with clear section headings.
5. WHEN the user views the Deep Dive results, THE Document_Reviewer SHALL provide a toggle control to switch to Quick Overview mode for the same document.

### Requirement 5: Daily Article Curation

**User Story:** As a solution architect, I want curated daily articles from a broad set of sources, so that I can stay current on architecture, cloud, security, and government digital standards.

#### Acceptance Criteria

1. WHEN the user opens the daily articles section, THE Article_Curator SHALL display a curated list of articles published within the last 24 hours.
2. THE Article_Curator SHALL source articles covering architecture, cloud computing, cybersecurity, UK government digital standards, and enterprise technology topics.
3. WHEN the Article_Curator presents an article, THE Article_Curator SHALL display the article title, source, publication date, and a brief summary.
4. WHEN the user selects an article, THE Article_Curator SHALL open the full article in the default system web browser.
5. THE Article_Curator SHALL refresh the article list automatically once per day at a user-configurable time.
6. IF the Article_Curator cannot retrieve articles from external sources, THEN THE Article_Curator SHALL display the most recently cached article list with a notification indicating the data is not current.

### Requirement 6: Bite-Sized Learning Modules

**User Story:** As a solution architect, I want to learn architecture concepts in digestible bite-sized modules, so that I can build knowledge progressively without overwhelming time commitments.

#### Acceptance Criteria

1. THE Learning_Module_Engine SHALL organise learning content into the following topic categories: AWS Well_Architected_Framework, Azure Well_Architected_Framework, TOGAF, GDS_Service_Standard, Secure_by_Design, Zero_Trust, enterprise and domain architecture, and general solution architecture best practices.
2. WHEN the user selects a topic category, THE Learning_Module_Engine SHALL display a list of available modules within that category ordered by recommended learning sequence.
3. WHEN the user opens a learning module, THE Learning_Module_Engine SHALL present the content in a structured format with clear sections, key takeaways, and practical examples.
4. WHEN the user completes a learning module, THE Learning_Module_Engine SHALL record the completion status and date in the user's progress record.
5. WHEN the user completes a learning module, THE Learning_Module_Engine SHALL suggest the next recommended module based on the learning sequence.
6. THE Learning_Module_Engine SHALL present each module in a format completable within 15 minutes of reading time.

### Requirement 7: Career Growth and Certification Recommendations

**User Story:** As a solution architect aspiring to a Lead Solution Architect role, I want personalised certification and course recommendations based on my current qualifications, so that I can close skill gaps aligned with the DDAT capability framework.

#### Acceptance Criteria

1. WHEN the user inputs existing certifications and qualifications, THE Career_Tracker SHALL store them in the user's profile.
2. WHEN the user views career recommendations, THE Career_Tracker SHALL analyse the user's current certifications against the DDAT_Framework requirements for the target role.
3. WHEN skill gaps are identified, THE Career_Tracker SHALL recommend specific certifications, courses, and learning paths to address each gap.
4. THE Career_Tracker SHALL align all recommendations with the DDAT_Framework capability levels for solution architecture roles.
5. WHEN the user adds a new certification or completes a course, THE Career_Tracker SHALL update the gap analysis and refresh recommendations.
6. THE Career_Tracker SHALL display a visual summary of the user's current capability coverage against the target role requirements.

### Requirement 8: Progress Tracking and Personal Development Journal

**User Story:** As a solution architect, I want to track my learning progress visually over time, so that I can demonstrate professional development and feed progress into Civil Service objectives.

#### Acceptance Criteria

1. THE Progress_Dashboard SHALL display visual progress indicators showing learning completion rates across all topic categories.
2. WHEN the user completes a learning module, certification, or course, THE Progress_Dashboard SHALL update the visual indicators within 5 seconds.
3. THE Progress_Dashboard SHALL display a timeline view of the user's learning activity over configurable time periods (weekly, monthly, quarterly).
4. WHEN the user creates a journal entry, THE Progress_Dashboard SHALL store the entry with a timestamp and optional tags for categorisation.
5. WHEN the user views the dashboard, THE Progress_Dashboard SHALL display a summary of total modules completed, certifications earned, and articles read.
6. THE Progress_Dashboard SHALL provide an export function to generate a progress summary report suitable for Civil Service objective evidence.

### Requirement 9: AI Security and Guardrails Knowledge

**User Story:** As a solution architect working in government, I want a dedicated section on AI governance and security guardrails, so that I can advise teams on safe AI adoption as AI becomes more prevalent in government services.

#### Acceptance Criteria

1. THE Guardrails_Knowledge_Base SHALL provide structured content covering AI governance frameworks relevant to UK government.
2. THE Guardrails_Knowledge_Base SHALL provide content on security guardrails for AI systems in government contexts.
3. THE Guardrails_Knowledge_Base SHALL provide content on data protection and privacy considerations when using AI with government data.
4. WHEN the user accesses the AI guardrails section, THE Guardrails_Knowledge_Base SHALL present content organised by topic area with clear navigation.
5. WHEN new AI governance guidance is published by UK government bodies, THE Guardrails_Knowledge_Base SHALL be updatable to incorporate the new guidance.

### Requirement 10: Architectural Diagramming and ArchiMate Training

**User Story:** As a solution architect who struggles with architectural diagrams, I want a dedicated section that teaches me how to create professional architecture drawings and flows using ArchiMate and other common notations, so that I can produce clear, standards-compliant diagrams for governance boards and stakeholder communication.

#### Acceptance Criteria

1. THE Diagram_Coach SHALL provide structured learning modules covering ArchiMate notation including elements, relationships, and viewpoints.
2. THE Diagram_Coach SHALL provide learning modules covering common architecture diagram types including solution overview diagrams, data flow diagrams, sequence diagrams, network topology diagrams, and deployment diagrams.
3. WHEN the user selects a diagramming module, THE Diagram_Coach SHALL present annotated example diagrams with explanations of each element and why it is used.
4. THE Diagram_Coach SHALL provide step-by-step walkthroughs showing how to construct a diagram from a blank canvas to a finished output for each diagram type.
5. WHEN the user completes a diagramming module, THE Diagram_Coach SHALL record the completion in the user's progress record and suggest the next recommended module.
6. THE Diagram_Coach SHALL provide a reference library of ArchiMate symbols, relationship types, and layer definitions accessible at any time.
7. THE Diagram_Coach SHALL include practical exercises where the user is given a scenario and guided through creating the appropriate diagram.
8. THE Diagram_Coach SHALL provide guidance on common diagramming mistakes and anti-patterns with examples of how to correct them.
9. THE Diagram_Coach SHALL include content on selecting the right diagram type for different audiences (technical teams, governance boards, non-technical stakeholders).

### Requirement 11: Application Platform and User Interface

**User Story:** As a solution architect, I want a professional, clean desktop application with a visual dashboard-oriented interface, so that I can access all features efficiently without feeling overwhelmed.

#### Acceptance Criteria

1. THE ArchLens SHALL run as a native Windows desktop application built using the Electron framework.
2. THE ArchLens SHALL present a dashboard-oriented home screen providing navigation to all major feature areas.
3. THE ArchLens SHALL use a professional, clean visual design that avoids information overload on any single screen.
4. WHEN the user navigates between feature areas, THE ArchLens SHALL complete the navigation transition within 500 milliseconds.
5. THE ArchLens SHALL require an active internet connection for AI_Provider features, article curation, and content updates.
6. IF the internet connection is lost during an AI_Provider operation, THEN THE ArchLens SHALL display a clear notification indicating the connection issue and allow the user to retry when connectivity is restored.
7. THE ArchLens SHALL store user preferences, progress data, certifications, and journal entries in local persistent storage.
8. THE ArchLens SHALL provide a settings interface for configuring AI_Provider API keys, preferred AI_Provider, and article refresh schedule.
