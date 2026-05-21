---
title: "Stakeholder Communication"
category: "solution-architecture"
sequenceOrder: 5
estimatedMinutes: 15
---

# Stakeholder Communication

## Introduction

The ability to communicate effectively with diverse stakeholders is what separates good solution architects from great ones. Technical brilliance means nothing if you cannot explain your architecture to a service owner, justify your decisions to a governance board, or guide a development team through a complex design.

In UK government, solution architects communicate with an unusually wide range of stakeholders: ministers and senior civil servants who need high-level summaries, product owners who need to understand trade-offs, developers who need technical detail, security teams who need assurance, and service assessors who need evidence of good practice. Each audience requires a different communication approach.

This module covers the communication skills, techniques, and artefacts that solution architects need to be effective.

## Understanding Your Audience

### Stakeholder Communication Needs

Different stakeholders need different things from architecture communication:

**Senior leaders (SRO, Director, CTO)**
- Need: high-level understanding, confidence that risks are managed, alignment with strategy
- Format: brief presentations, one-page summaries, executive dashboards
- Language: business outcomes, risk, cost, timeline — minimal technical jargon
- Frequency: monthly or at key decision points

**Product owners and service owners**
- Need: understanding of technical constraints and trade-offs, input into prioritisation
- Format: conversations, whiteboard sessions, brief written summaries
- Language: user impact, capability, feasibility — some technical terms with explanation
- Frequency: weekly or as needed

**Development teams**
- Need: clear technical direction, rationale for decisions, guidance on implementation
- Format: ADRs, technical specifications, architecture diagrams, code reviews
- Language: technical, precise, with code examples where helpful
- Frequency: daily through sprint activities

**Security and governance teams**
- Need: assurance that standards are met, understanding of risk mitigations
- Format: security architecture documents, compliance matrices, threat models
- Language: security-specific terminology, reference to standards and frameworks
- Frequency: at design reviews and assessment points

**Service assessors (GDS)**
- Need: evidence that the team understands their architecture and has made informed decisions
- Format: verbal presentation with supporting diagrams and ADRs
- Language: clear, confident, demonstrating understanding of trade-offs
- Frequency: at assessment points (alpha, beta, live)

## Architecture Diagrams

### The C4 Model

The C4 model provides a hierarchical approach to architecture diagrams:

**Level 1: System Context** — shows the system in its environment, including users and external systems it interacts with. This is the diagram for senior stakeholders and service assessors.

**Level 2: Container** — shows the high-level technology choices (web application, API, database, message queue). This is the diagram for product owners and technical leads.

**Level 3: Component** — shows the internal structure of a container (controllers, services, repositories). This is the diagram for developers.

**Level 4: Code** — shows the code-level structure (classes, interfaces). Rarely needed — the code itself is usually sufficient.

### Diagram Principles

Effective architecture diagrams follow these principles:

- **One purpose per diagram** — each diagram should answer one question. Do not try to show everything on one diagram.
- **Appropriate abstraction** — match the level of detail to the audience. Senior stakeholders do not need to see database tables.
- **Consistent notation** — use a consistent visual language. The C4 model, ArchiMate, or even simple boxes-and-arrows are all fine, as long as you are consistent.
- **Legend** — always include a legend explaining what the shapes and colours mean.
- **Title and date** — every diagram should have a title and a date so readers know what they are looking at and how current it is.

### Common Diagram Types

Beyond C4, solution architects commonly produce:

- **Deployment diagrams** — showing how components are deployed to infrastructure (cloud services, regions, availability zones)
- **Sequence diagrams** — showing the flow of interactions for key scenarios
- **Data flow diagrams** — showing how data moves through the system
- **Network diagrams** — showing network topology, security zones, and connectivity
- **Integration diagrams** — showing how the system connects to external systems

### Tools

Common diagramming tools in government:

- **Miro / Mural** — collaborative whiteboarding, good for workshops and informal diagrams
- **draw.io (diagrams.net)** — free, web-based diagramming with good template support
- **Structurizr** — C4 model diagrams generated from code (diagrams as code)
- **PlantUML / Mermaid** — text-based diagram generation, version-controllable
- **Lucidchart** — commercial diagramming tool with collaboration features

Diagrams-as-code tools (Structurizr, PlantUML, Mermaid) are increasingly popular because diagrams can be version-controlled alongside the code and updated through pull requests.

## Written Communication

### Architecture Decision Records

ADRs are covered in detail in the dedicated module. They are the primary written artefact for documenting architecture decisions.

### Technical Specifications

For complex features or integrations, write technical specifications that describe:

- The problem being solved
- The proposed approach
- API contracts (request/response formats, error handling)
- Data models and schemas
- Sequence of operations
- Error handling and edge cases
- Testing approach

Keep specifications focused and concise. A 5-page specification that covers one feature is more useful than a 50-page document that covers everything.

### Architecture Overviews

An architecture overview document provides a comprehensive description of the system for new team members and governance reviews:

- System context and purpose
- Key architecture decisions and their rationale (reference ADRs)
- Component descriptions and responsibilities
- Integration points and data flows
- Non-functional requirements and how they are met
- Deployment architecture
- Security architecture

Update the overview when significant changes are made. A stale architecture document is worse than no document — it misleads readers.

## Verbal Communication

### Presenting to Governance Boards

When presenting to an Architecture Review Board or Design Authority:

- **Lead with the decision** — state what you are proposing and why, then provide supporting detail
- **Anticipate questions** — prepare for questions about alternatives, risks, costs, and compliance
- **Be concise** — governance boards review multiple items per meeting. Respect their time.
- **Be honest about trade-offs** — acknowledging weaknesses builds credibility
- **Provide a clear ask** — what do you need from the board? Approval, feedback, or a decision?

### Service Assessments

GDS service assessments evaluate the team's understanding of their architecture. Tips for the technical architecture section:

- **Tell a story** — explain the architecture as a narrative, not a list of technologies
- **Show understanding of trade-offs** — assessors want to see that you considered alternatives
- **Reference user needs** — connect technical decisions to user requirements
- **Be honest about challenges** — assessors respect teams that acknowledge difficulties
- **Use diagrams** — a clear context diagram and container diagram support your narrative

### Facilitating Technical Discussions

Solution architects often facilitate technical discussions within the team:

- **Frame the decision** — clearly state what needs to be decided and what constraints exist
- **Ensure all voices are heard** — quieter team members may have valuable perspectives
- **Capture the outcome** — document the decision as an ADR
- **Manage scope** — keep the discussion focused on the decision at hand
- **Drive to a conclusion** — discussions without decisions waste time

## Key Takeaways

- Tailor communication to your audience — senior leaders need outcomes, developers need technical detail
- Use the C4 model to create architecture diagrams at appropriate levels of abstraction
- Write concise, focused documents — ADRs for decisions, specifications for features, overviews for context
- Present to governance boards with a clear ask, honest trade-offs, and concise supporting detail
- Facilitate technical discussions by framing decisions clearly and driving to documented outcomes

## Practical Examples

### Example 1: Communicating a Major Architecture Change

A solution architect needs to communicate a migration from a monolithic application to a modular architecture. For the SRO, they prepare a one-page brief: business benefits (faster feature delivery, reduced risk), timeline (12 months), cost (£200K additional over BAU), and risks (temporary increase in complexity during migration). For the development team, they produce a detailed technical specification with module boundaries, API contracts, data migration approach, and a phased migration plan. For the ARB, they present a 15-minute overview with C4 diagrams showing current and target state, an ADR documenting the decision rationale, and a risk register. Each audience receives the information they need in the format they can use.

### Example 2: Service Assessment Preparation

A team preparing for a beta service assessment creates their architecture communication pack. The solution architect produces: a system context diagram showing the service, its users, and external integrations; a container diagram showing the application components and their technology choices; a sequence diagram for the primary user journey; a summary of 8 key ADRs covering the most significant decisions; and a one-page architecture overview linking technical choices to user needs and Service Standard points. During the assessment, the architect walks through the architecture as a narrative: "Citizens access the service through GOV.UK, authenticate with One Login, submit their application which is processed asynchronously, and receive updates through Notify. We chose this approach because..." The team passes the assessment.

---
keyTakeaways:
  - Tailor communication to your audience with appropriate detail and language
  - Use the C4 model for architecture diagrams at appropriate levels of abstraction
  - Write concise focused documents ADRs for decisions specifications for features
  - Present to governance boards with clear asks honest trade-offs and concise detail
  - Facilitate technical discussions by framing decisions and driving to documented outcomes

practicalExamples:
  - Communicate a major architecture change with tailored artefacts for three different audiences
  - Prepare an architecture communication pack for a beta service assessment
