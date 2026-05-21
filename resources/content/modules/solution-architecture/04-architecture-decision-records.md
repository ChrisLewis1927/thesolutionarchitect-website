---
title: "Architecture Decision Records"
category: "solution-architecture"
sequenceOrder: 4
estimatedMinutes: 15
---

# Architecture Decision Records

## Introduction

Architecture Decision Records (ADRs) are short documents that capture significant architecture decisions along with their context and consequences. They provide a decision log that helps current and future team members understand why the architecture is the way it is.

ADRs have become one of the most widely adopted architecture practices in UK government digital teams. They are lightweight, version-controlled, and live alongside the code they describe. Unlike traditional architecture documents that become stale, ADRs capture decisions at the point they are made and remain relevant as a historical record.

This module covers how to write effective ADRs, when to use them, and how to integrate them into your team's workflow.

## Why ADRs Matter

### The Problem They Solve

Every architecture has a history of decisions that shaped it. Without documentation, this history exists only in the memories of the people who were there. When those people move on — and in government, people move frequently — the rationale for decisions is lost.

This leads to several problems:

- **Repeated debates** — new team members question existing decisions without understanding the context, leading to circular discussions
- **Uninformed changes** — developers modify the architecture without understanding why it was designed that way, potentially reintroducing problems that were previously solved
- **Governance gaps** — architecture review boards cannot assess whether decisions were well-reasoned if the reasoning is not documented
- **Onboarding friction** — new team members take longer to become productive because they cannot understand the architectural context

### What ADRs Provide

ADRs address these problems by capturing:

- **Context** — the situation and forces at play when the decision was made
- **Decision** — what was decided
- **Rationale** — why this option was chosen over alternatives
- **Consequences** — the expected positive and negative outcomes
- **Status** — whether the decision is current, superseded, or deprecated

## ADR Format

### The Standard Template

The most widely used ADR format is based on Michael Nygard's template:

```
# ADR-NNN: Title

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context
[Describe the situation, the forces at play, and why a decision is needed]

## Decision
[State the decision clearly and concisely]

## Consequences
[Describe the positive and negative consequences of this decision]
```

This template is deliberately simple. An ADR should be readable in 2-3 minutes. If it takes longer, it is too detailed.

### Extended Template

For more complex decisions, extend the template with:

```
## Options Considered

### Option 1: [Name]
[Brief description, pros, cons]

### Option 2: [Name]
[Brief description, pros, cons]

### Option 3: [Name]
[Brief description, pros, cons]

## Decision Drivers
- [Driver 1]
- [Driver 2]
- [Driver 3]
```

The extended template is useful when the decision involves evaluating multiple options and the rationale for the chosen option needs to be explicit.

## Writing Effective ADRs

### What to Record

Record decisions that are:

- **Architecturally significant** — they affect the structure, non-functional characteristics, or key design principles of the system
- **Difficult to reverse** — changing the decision later would be costly or disruptive
- **Contentious** — the team debated the decision, or stakeholders had different preferences
- **Non-obvious** — the reasoning would not be apparent to someone reading the code

Examples of decisions worth recording:
- Choice of database technology (PostgreSQL vs DynamoDB)
- Authentication approach (GOV.UK One Login vs custom authentication)
- Architecture pattern (monolith vs microservices)
- Hosting platform (AWS vs Azure)
- Integration pattern (synchronous API vs asynchronous messaging)
- Data storage approach (event sourcing vs traditional CRUD)

Examples of decisions NOT worth recording:
- Choice of code formatting tool
- Naming conventions for variables
- Which testing framework to use (unless it has architectural implications)

### Writing Good Context

The context section is the most important part of an ADR. It should explain:

- What problem or opportunity triggered the decision
- What constraints exist (budget, timeline, team skills, compliance requirements)
- What forces are in tension (e.g., simplicity vs scalability, security vs usability)

Good context enables future readers to evaluate whether the decision is still appropriate as circumstances change.

### Writing Good Consequences

Be honest about consequences — both positive and negative:

- **Positive:** "This approach reduces deployment complexity and allows independent scaling of the API and worker components."
- **Negative:** "This introduces eventual consistency between the API and reporting databases, which means reports may be up to 30 seconds behind real-time data."

Acknowledging negative consequences demonstrates thorough analysis and helps future architects understand the trade-offs that were accepted.

### Keeping ADRs Short

An ADR should be 1-2 pages. If you are writing more than that, you are either:

- Including too much detail (move implementation details to other documents)
- Combining multiple decisions (split into separate ADRs)
- Writing a design document rather than a decision record

## ADR Workflow

### When to Write ADRs

Write ADRs at the point of decision, not retrospectively. The best time to capture context and rationale is when the decision is being made.

In agile delivery:
- During architecture spikes — the spike output includes an ADR
- During sprint planning — when a story requires an architectural decision
- During design discussions — when the team reaches a significant decision
- During architecture reviews — when the ARB requests documentation of a decision

### Review Process

ADRs should be reviewed like code:

- Submit the ADR as a pull request
- Team members review the context, decision, and consequences
- Reviewers may suggest additional options or consequences
- The ADR is merged when the team agrees on the decision

This process ensures that decisions are collaborative and that the documentation accurately reflects the team's understanding.

### Lifecycle Management

ADRs have a lifecycle:

- **Proposed** — the decision is under discussion
- **Accepted** — the decision has been agreed and is in effect
- **Deprecated** — the decision is no longer relevant (the feature was removed, the technology was decommissioned)
- **Superseded** — the decision has been replaced by a new decision (link to the new ADR)

Never delete ADRs. Even superseded decisions provide valuable historical context. Mark them as superseded and link to the replacement.

### Storage and Organisation

Store ADRs in the Git repository alongside the code:

```
docs/
  adr/
    0001-use-postgresql-for-primary-database.md
    0002-adopt-event-driven-integration.md
    0003-use-govuk-one-login-for-authentication.md
    0004-deploy-on-aws-ecs-fargate.md
```

Number ADRs sequentially. Use descriptive filenames. Keep them in a dedicated directory.

For cross-service decisions that affect multiple repositories, maintain a central ADR repository that individual service ADRs can reference.

## ADRs in Government Context

### Service Assessments

GDS service assessments evaluate whether the team understands their technical architecture and can explain their decisions. ADRs provide ready-made evidence:

- "We chose PostgreSQL because..." (ADR-001)
- "We use event-driven integration because..." (ADR-002)
- "We selected AWS because..." (ADR-004)

Teams with well-maintained ADRs consistently perform better in service assessments because they can articulate their decisions clearly and demonstrate that alternatives were considered.

### Architecture Review Boards

ADRs support ARB governance by:

- Providing a standard format for presenting decisions
- Documenting that alternatives were considered
- Recording the rationale for future reference
- Enabling the ARB to review decisions asynchronously

### Knowledge Transfer

When team members change (common in government), ADRs dramatically reduce knowledge transfer time. New architects can read the ADR log to understand the architectural history and the reasoning behind current design choices.

## Key Takeaways

- ADRs capture significant architecture decisions with their context, rationale, and consequences
- Write ADRs at the point of decision, not retrospectively
- Keep ADRs short (1-2 pages) and store them in the Git repository alongside the code
- Review ADRs through pull requests to ensure collaborative decision-making
- Never delete ADRs — mark superseded decisions and link to replacements

## Practical Examples

### Example 1: Database Selection ADR

A team writes an ADR for their database selection:

**Context:** The service needs to store case data with complex relationships (cases, applicants, decisions, documents). Expected volume is 100,000 cases per year, growing 20% annually. The team has strong PostgreSQL experience.

**Options considered:** PostgreSQL (relational, team expertise, complex queries), DynamoDB (managed, scalable, but limited query flexibility), MongoDB (flexible schema, but less team experience).

**Decision:** Use Amazon RDS PostgreSQL with read replicas for reporting.

**Consequences:** Positive — leverages team expertise, supports complex queries for case search, well-understood operational model. Negative — requires capacity planning for RDS instances, less automatic scaling than DynamoDB, team must manage schema migrations.

### Example 2: ADR Log for a Service Assessment

A team preparing for a beta service assessment presents their ADR log: 12 ADRs covering hosting platform (AWS), compute pattern (ECS Fargate), database (PostgreSQL), authentication (GOV.UK One Login), integration pattern (event-driven via SQS), frontend framework (server-side rendered with GOV.UK Design System), and 6 other significant decisions. The assessors note that each ADR clearly explains the context, alternatives considered, and trade-offs accepted. The team passes the technical architecture section of the assessment with commendation for their decision documentation.

---
keyTakeaways:
  - ADRs capture significant architecture decisions with context rationale and consequences
  - Write ADRs at the point of decision not retrospectively
  - Keep ADRs short and store them in the Git repository alongside the code
  - Review ADRs through pull requests for collaborative decision-making
  - Never delete ADRs mark superseded decisions and link to replacements

practicalExamples:
  - Write a database selection ADR evaluating PostgreSQL DynamoDB and MongoDB
  - Maintain an ADR log of 12 decisions to support a beta service assessment
