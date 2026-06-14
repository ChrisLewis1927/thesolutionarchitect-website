# Requirements Document

## Introduction

The Architecture Design Lab is a new major module for ArchLens that helps UK government solution architects move from requirements, constraints, and non-functional requirements into practical technical architecture decisions. Rather than blindly recommending technologies, the module guides the user through a structured decision process, explaining why particular design patterns, cloud services, resilience models, and security controls may or may not be appropriate for a given workload. The module covers the full journey from scenario intake through decision assessment, pattern recommendation, confidence scoring, reference architecture generation, learning mode, a searchable pattern library, standards alignment, and exportable output formats.

## Glossary

- **Design_Lab**: The Architecture Design Lab module — the primary subsystem being specified in this document.
- **Scenario_Intake**: The wizard/form subsystem responsible for capturing workload context including service type, users, traffic profile, data sensitivity, availability requirements, recovery expectations, integration needs, deployment model, team capability, constraints, and known NFRs.
- **Decision_Engine**: The subsystem responsible for analysing scenario intake data and generating structured decision assessments across architecture domains.
- **Pattern_Recommender**: The subsystem responsible for producing practical architecture recommendations with decision logic explained.
- **Confidence_Scorer**: The subsystem responsible for assigning RAG (Red/Amber/Green/Grey/N/A) status to each design area based on the completeness and strength of the assessment.
- **Reference_Architecture_Generator**: The subsystem responsible for producing high-level architecture summaries including design narratives, component lists, data flows, security controls, resilience models, and operational models.
- **Learning_Mode**: The subsystem responsible for teaching users why architecture decisions are made, including explanations of pattern rationale, anti-patterns, challenge questions, and governance expectations.
- **Pattern_Library**: The searchable library subsystem containing pre-defined architecture patterns with usage guidance, components, trade-offs, and cloud service examples.
- **Standards_Panel**: The subsystem responsible for reminding users of applicable UK government and industry standards during the design process.
- **Output_Formatter**: The subsystem responsible for generating exportable architecture documents in multiple formats.
- **Discovery_Generator**: The subsystem responsible for accepting a solution premise and producing structured functional and non-functional requirements suitable for running a discovery session.
- **Architecture_Domain**: A distinct area of technical concern assessed by the Decision_Engine (e.g., hosting/compute, data/persistence, networking/edge protection, identity/access, security controls, resilience/DR, observability/operations, deployment/release, cost/sustainability, compliance/assurance, integration/APIs).
- **RAG_Status**: A colour-coded confidence indicator using Green (high confidence), Amber (partial confidence, gaps remain), Red (low confidence, significant gaps), Grey (not yet assessed), and N/A (not applicable to this workload).
- **NFR**: Non-Functional Requirement — a constraint or quality attribute such as performance, availability, security, or maintainability.
- **ADR**: Architecture Decision Record — a document capturing a single architecture decision, its context, and consequences.
- **HLD**: High-Level Design — an architecture document describing the overall solution structure without implementation detail.
- **TCoP**: UK Government Technology Code of Practice — a set of criteria to help government design, build, and buy technology.
- **NCSC**: National Cyber Security Centre — the UK government authority on cyber security.

## Requirements

### Requirement 1: Discovery Requirements Generation

**User Story:** As a solution architect preparing for a discovery session, I want to describe a basic solution premise and receive a structured list of functional and non-functional requirements, so that I have a comprehensive starting point for stakeholder discussions and can ensure no key areas are overlooked.

#### Acceptance Criteria

1. WHEN the user enters a solution premise as free-text description, THE Discovery_Generator SHALL accept the input and analyse it for implied functional and non-functional requirements.
2. WHEN the Discovery_Generator analyses a solution premise, THE Discovery_Generator SHALL produce a categorised list of functional requirements covering user interactions, data processing, integrations, and business rules implied by the premise.
3. WHEN the Discovery_Generator analyses a solution premise, THE Discovery_Generator SHALL produce a categorised list of non-functional requirements covering performance, availability, security, scalability, maintainability, accessibility, compliance, and operational considerations.
4. WHEN the Discovery_Generator produces requirements, THE Discovery_Generator SHALL write each requirement at sufficient detail to form the basis of a discovery session question or discussion point.
5. WHEN the Discovery_Generator identifies areas where the premise is ambiguous or incomplete, THE Discovery_Generator SHALL flag those areas as discovery questions that need stakeholder input.
6. WHEN the Discovery_Generator produces requirements, THE Discovery_Generator SHALL categorise non-functional requirements by quality attribute (performance, security, availability, scalability, usability, maintainability, compliance, operability).
7. THE Discovery_Generator SHALL allow the user to edit, remove, or add to the generated requirements list before using it in subsequent stages.
8. WHEN the user confirms the discovery requirements, THE Discovery_Generator SHALL allow the user to proceed to the Scenario_Intake with relevant fields pre-populated from the confirmed requirements.
9. THE Discovery_Generator SHALL produce requirements in a format suitable for copying into discovery session packs, stakeholder workshops, or requirements traceability documents.

### Requirement 2: Scenario Intake Wizard

**User Story:** As a solution architect, I want to capture the full context of a workload through a structured intake form, so that the decision engine has sufficient information to produce relevant architecture recommendations.

#### Acceptance Criteria

1. WHEN the user starts a new design assessment, THE Scenario_Intake SHALL present a multi-step wizard capturing: available cloud platforms and accounts (AWS, Azure, GCP, or none), service type, expected user base, traffic profile, data sensitivity classification, availability requirement, recovery time and point objectives, integration needs, deployment model preference, team capability and size, constraints, and known NFRs.
2. WHEN the Scenario_Intake captures available cloud platforms, THE Scenario_Intake SHALL allow the user to select one or more cloud providers they have access to, or indicate that no cloud account is currently available.
3. WHEN the user completes a wizard step, THE Scenario_Intake SHALL validate that mandatory fields contain values before allowing progression to the next step.
3. WHEN the user has not completed all mandatory fields, THE Scenario_Intake SHALL highlight incomplete fields with descriptive guidance on what information is needed.
4. THE Scenario_Intake SHALL allow the user to navigate backwards through completed wizard steps to amend previous answers without losing data entered in subsequent steps.
5. WHEN the user completes the final wizard step, THE Scenario_Intake SHALL present a summary of all captured inputs for confirmation before triggering the Decision_Engine.
6. THE Scenario_Intake SHALL allow the user to save a partially completed intake and resume it later.
7. IF the user provides insufficient information for a reliable assessment, THEN THE Decision_Engine SHALL identify the specific missing information and prompt the user to provide it before generating strong recommendations.

### Requirement 3: Decision Engine Assessment

**User Story:** As a solution architect, I want a structured assessment across all architecture domains based on my scenario inputs, so that I can understand the trade-offs and make informed decisions rather than accepting blind recommendations.

#### Acceptance Criteria

1. WHEN the user confirms the scenario intake summary, THE Decision_Engine SHALL generate a structured assessment covering the following Architecture_Domains: hosting/compute, data/persistence, integration/APIs, networking/edge protection, identity/access, security controls, resilience/DR, observability/operations, deployment/release, cost/sustainability, and compliance/assurance.
2. WHEN the Decision_Engine assesses an Architecture_Domain, THE Decision_Engine SHALL produce for each domain: a recommended pattern, candidate technologies, rationale for the recommendation, rationale for why alternatives may not fit, risks and assumptions, questions to ask next, evidence needed, architecture artefacts to produce, and relevant standards.
3. WHEN the Decision_Engine produces a recommendation, THE Decision_Engine SHALL separate facts from assumptions from recommendations using clear labelling.
4. WHEN multiple viable options exist for an Architecture_Domain, THE Decision_Engine SHALL present all viable options with comparative trade-offs rather than presenting a single answer.
5. THE Decision_Engine SHALL explain the operational burden associated with each recommended option including staffing, skills, tooling, and ongoing maintenance considerations.
6. THE Decision_Engine SHALL explain cost, security, resilience, compliance, and maintainability trade-offs for each recommendation.
7. THE Decision_Engine SHALL encourage managed services over self-managed infrastructure unless the scenario inputs provide specific justification for self-management.
8. THE Decision_Engine SHALL treat product and service names as examples of a category rather than as default choices.
9. WHEN the user has specified available cloud platforms in the Scenario_Intake, THE Decision_Engine SHALL constrain candidate technology recommendations to services available on those platforms.
10. WHEN the user has indicated no cloud account is available, THE Decision_Engine SHALL recommend on-premises or SaaS alternatives and flag where a cloud account would unlock additional options.

### Requirement 4: Pattern Recommendation Output

**User Story:** As a solution architect, I want practical recommendations with the decision logic clearly explained, so that I can justify architecture choices to governance boards and stakeholders.

#### Acceptance Criteria

1. WHEN the Decision_Engine completes its assessment, THE Pattern_Recommender SHALL produce a consolidated recommendation output summarising the recommended patterns across all assessed Architecture_Domains.
2. WHEN the Pattern_Recommender presents a recommendation, THE Pattern_Recommender SHALL include the decision logic explaining why the pattern was selected given the scenario inputs.
3. WHEN the Pattern_Recommender presents a recommendation, THE Pattern_Recommender SHALL identify conditions under which the recommendation would change.
4. WHEN the Pattern_Recommender presents a recommendation, THE Pattern_Recommender SHALL flag risks that require mitigation and assumptions that require validation.

### Requirement 5: Design Confidence Scoring

**User Story:** As a solution architect, I want a visual confidence indicator for each design area, so that I can quickly identify where my architecture is strong and where gaps remain.

#### Acceptance Criteria

1. WHEN the Decision_Engine completes its assessment, THE Confidence_Scorer SHALL assign a RAG_Status to each Architecture_Domain.
2. WHEN a RAG_Status is Green, THE Confidence_Scorer SHALL indicate that the design area has high confidence with sufficient evidence and clear rationale.
3. WHEN a RAG_Status is Amber, THE Confidence_Scorer SHALL indicate that the design area has partial confidence with specific gaps identified.
4. WHEN a RAG_Status is Red, THE Confidence_Scorer SHALL indicate that the design area has low confidence with significant gaps or unresolved risks.
5. WHEN a RAG_Status is Grey, THE Confidence_Scorer SHALL indicate that the design area has not yet been assessed due to insufficient input data.
6. WHEN a RAG_Status is N/A, THE Confidence_Scorer SHALL indicate that the design area is not applicable to the current workload scenario.
7. THE Confidence_Scorer SHALL display all RAG_Status values in a single summary view allowing the user to see overall design maturity at a glance.

### Requirement 6: Reference Architecture Generator

**User Story:** As a solution architect, I want a generated high-level architecture summary covering all key aspects of the design, so that I can use it as a starting point for formal architecture documentation.

#### Acceptance Criteria

1. WHEN the user requests a reference architecture output, THE Reference_Architecture_Generator SHALL produce a structured summary including: plain-English design summary, key components, data flow description, security controls, resilience model, operational model, integration approach, deployment approach, key risks, open questions, assumptions, ADR candidates, HLD section draft, and governance review questions.
2. WHEN the Reference_Architecture_Generator produces a design summary, THE Reference_Architecture_Generator SHALL use plain English suitable for both technical and non-technical stakeholders.
3. WHEN the Reference_Architecture_Generator identifies open questions, THE Reference_Architecture_Generator SHALL categorise them by the stakeholder group best placed to answer (technical team, security, operations, delivery, finance, governance).
4. WHEN the Reference_Architecture_Generator identifies ADR candidates, THE Reference_Architecture_Generator SHALL provide a draft title and context statement for each candidate decision record.

### Requirement 7: Learning Mode

**User Story:** As a solution architect developing my skills, I want to understand why architecture decisions are made and what experienced architects would challenge, so that I can build my own decision-making capability over time.

#### Acceptance Criteria

1. WHEN the user activates Learning_Mode for a recommendation, THE Learning_Mode SHALL explain why the recommended pattern was selected with reference to the scenario inputs.
2. WHEN the user activates Learning_Mode for a recommendation, THE Learning_Mode SHALL explain what conditions would make the recommended pattern inappropriate.
3. WHEN the user activates Learning_Mode for a recommendation, THE Learning_Mode SHALL present questions that an experienced architect would ask about the design.
4. WHEN the user activates Learning_Mode for a recommendation, THE Learning_Mode SHALL identify common anti-patterns related to the design area and explain why they are problematic.
5. WHEN the user activates Learning_Mode for a recommendation, THE Learning_Mode SHALL describe what security, operations, delivery, and finance stakeholders would typically challenge about the design.
6. WHEN the user activates Learning_Mode for a recommendation, THE Learning_Mode SHALL describe what evidence a governance board would expect to see before approving the design.

### Requirement 8: Pattern Library

**User Story:** As a solution architect, I want a searchable library of architecture patterns with detailed guidance on when to use each pattern, so that I can quickly find relevant patterns and understand their trade-offs.

#### Acceptance Criteria

1. THE Pattern_Library SHALL contain entries for the following patterns: static website, public-facing transactional service, internal line-of-business application, API-led integration, event-driven integration, batch file transfer, data lake and analytics, SaaS-first, containerised application, serverless application, VM-based legacy, multi-AZ production, multi-region disaster recovery, edge-protected public service, secure admin portal, case management platform, document upload and processing, and hybrid cloud.
2. WHEN the user views a pattern entry, THE Pattern_Library SHALL display: when to use the pattern, when not to use the pattern, typical components, security controls, resilience considerations, cost considerations, operational considerations, example cloud services across AWS, Azure, and GCP, questions to ask, and common mistakes.
3. WHEN the user searches the Pattern_Library, THE Pattern_Library SHALL return matching patterns based on pattern name, description keywords, and component keywords.
4. WHEN the user searches the Pattern_Library with no matching results, THE Pattern_Library SHALL suggest related patterns that partially match the search criteria.
5. THE Pattern_Library SHALL allow the user to filter patterns by cloud provider, workload type, and security classification.
6. WHEN the user has specified available cloud platforms in a scenario, THE Pattern_Library SHALL highlight cloud service examples relevant to those platforms and de-emphasise services on platforms the user does not have access to.

### Requirement 9: Standards Alignment Panel

**User Story:** As a solution architect working in UK government, I want reminders of applicable standards and policies during the design process, so that I do not overlook compliance requirements that governance boards will check.

#### Acceptance Criteria

1. WHEN the user views a design assessment, THE Standards_Panel SHALL display a checklist of applicable standards including: UK Government TCoP, Cloud First policy, GOV.UK Service Standard, Secure by Design, NCSC Cloud Security Principles, data protection and privacy regulations, accessibility requirements, AWS Well-Architected Framework or equivalent, departmental architecture principles, and existing platform patterns.
2. WHEN the Decision_Engine produces a recommendation, THE Standards_Panel SHALL highlight which standards are relevant to that specific recommendation.
3. THE Standards_Panel SHALL allow the user to mark each standard as reviewed, not applicable, or requiring further action.
4. WHEN the user marks a standard as requiring further action, THE Standards_Panel SHALL allow the user to add a note describing the outstanding action.

### Requirement 10: Output Formats and Export

**User Story:** As a solution architect, I want to export architecture outputs in multiple document formats, so that I can share them with governance boards, stakeholders, and technical teams without manual reformatting.

#### Acceptance Criteria

1. THE Output_Formatter SHALL support generation of the following output types: architecture decision summary, HLD section, ADR draft, governance board briefing, risk and assumption log, pattern comparison table, and questions for stakeholders, technical teams, and security review.
2. WHEN the user requests an export, THE Output_Formatter SHALL generate the selected output type as copyable text formatted for direct use in documents.
3. WHEN the user exports an ADR draft, THE Output_Formatter SHALL structure the output following a standard ADR template including title, status, context, decision, and consequences sections.
4. WHEN the user exports a governance board briefing, THE Output_Formatter SHALL structure the output with an executive summary, key decisions, risks, assumptions, and open questions.
5. THE Output_Formatter SHALL allow the user to copy any individual output section to the system clipboard with a single action.

### Requirement 11: Responsible Recommendation Behaviour

**User Story:** As a solution architect, I want the tool to behave responsibly by asking for missing information, separating facts from assumptions, and avoiding false certainty, so that I can trust the outputs and use them professionally.

#### Acceptance Criteria

1. WHEN the scenario intake data is insufficient for a confident recommendation in an Architecture_Domain, THE Decision_Engine SHALL explicitly state what information is missing and ask the user to provide it before making a strong recommendation.
2. THE Decision_Engine SHALL label all outputs with clear distinction between facts (based on stated inputs), assumptions (inferred from inputs), and recommendations (suggested based on analysis).
3. THE Decision_Engine SHALL present multiple viable options with trade-offs rather than presenting a single correct answer when the scenario supports multiple valid approaches.
4. WHEN a recommendation carries significant operational complexity, THE Decision_Engine SHALL explicitly flag the operational burden including staffing, skills, and tooling requirements.
5. WHEN a recommendation carries significant cost implications, THE Decision_Engine SHALL explicitly flag the cost considerations including ongoing running costs and transition costs.
6. WHEN a recommendation carries security or resilience risks, THE Decision_Engine SHALL explicitly flag those risks with suggested mitigations.

### Requirement 12: Module Integration and Navigation

**User Story:** As a solution architect, I want the Architecture Design Lab accessible as a major module in the ArchLens navigation, so that I can access it alongside other features without disrupting my workflow.

#### Acceptance Criteria

1. THE ArchLens SHALL display the Design_Lab as a primary navigation item in the application sidebar alongside existing modules.
2. WHEN the user navigates to the Design_Lab, THE ArchLens SHALL display the Design_Lab landing page within 500 milliseconds.
3. THE Design_Lab SHALL follow the existing ArchLens visual design language including typography, colour palette, spacing, and component styles.
4. THE Design_Lab SHALL store all assessment data, saved scenarios, and user progress in local persistent storage consistent with the existing ArchLens data storage approach.
5. WHEN the user has previously saved assessments, THE Design_Lab SHALL display a list of saved assessments on the landing page allowing the user to resume or review previous work.
6. THE Design_Lab SHALL be built using React and TypeScript consistent with the existing ArchLens technology stack.

