---
title: "Architecture Governance"
category: "enterprise-architecture"
sequenceOrder: 3
estimatedMinutes: 15
---

# Architecture Governance

## Introduction

Architecture governance is the practice and orientation by which enterprise architectures and other architectures are managed and controlled. It provides the framework for making architecture decisions, ensuring compliance with standards, and managing the evolution of the technology landscape over time.

In UK government, architecture governance is particularly important because technology decisions have long-lasting consequences, public money must be spent wisely, and services must meet cross-government standards. Without effective governance, departments risk duplicated investments, incompatible systems, security vulnerabilities, and technology choices that do not align with strategic direction.

This module covers how to establish and operate effective architecture governance in a government context.

## Why Governance Matters

### The Cost of Poor Governance

Without architecture governance, organisations experience:

- **Duplicated systems** — multiple teams building similar capabilities independently, wasting money and creating integration challenges
- **Technology sprawl** — an ever-growing portfolio of technologies, each requiring different skills and support arrangements
- **Integration failures** — systems that cannot communicate because they were designed without considering the broader landscape
- **Security gaps** — inconsistent application of security standards across services
- **Vendor lock-in** — individual teams making technology choices that lock the organisation into specific vendors

### The Value of Good Governance

Effective governance provides:

- **Alignment** — technology investments support business strategy and policy objectives
- **Consistency** — common standards and patterns reduce complexity and improve interoperability
- **Reuse** — shared capabilities and platforms reduce cost and improve quality
- **Risk management** — architecture risks are identified and mitigated before they become problems
- **Accountability** — clear decision-making processes with documented rationale

## Governance Structures

### Architecture Review Board (ARB)

The ARB is the primary governance body for architecture decisions. Its responsibilities include:

- Reviewing and approving architecture designs for new services and significant changes
- Ensuring alignment with the technology strategy and cross-government standards
- Identifying opportunities for reuse and consolidation
- Managing architecture exceptions and deviations
- Resolving architecture disputes between teams

**Composition:** The ARB should include senior architects, technical leads, and representation from security, data, and operations. It should not be exclusively architects — diverse perspectives improve decision quality.

**Cadence:** Fortnightly meetings work well for most departments. More frequent for large transformation programmes, less frequent for stable organisations.

**Process:** Keep it lightweight. Teams submit a brief architecture overview (not a 50-page document). The ARB provides feedback and a decision (approve, approve with conditions, or request changes) within the meeting.

### Design Authority

Some departments use a Design Authority as a more senior governance body that:

- Sets the technology strategy and architecture principles
- Approves major technology investments and strategic direction changes
- Resolves escalations from the ARB
- Reports to the department's digital and technology leadership

The Design Authority typically meets monthly and focuses on strategic decisions rather than individual service designs.

### Community of Practice

Architecture communities of practice complement formal governance with informal knowledge sharing:

- Regular meetups where architects share patterns, lessons learned, and challenges
- Peer review of architecture designs before formal ARB submission
- Shared repositories of architecture patterns, decision records, and reference architectures
- Cross-team collaboration on common challenges

Communities of practice are often more effective than formal governance at spreading good practice and building a shared understanding of architecture standards.

## Governance Processes

### Architecture Principles

Architecture principles are the foundation of governance. They provide the criteria against which architecture decisions are evaluated:

- Principles should be specific enough to guide decisions ("prefer managed cloud services over self-managed infrastructure") not vague ("use good technology")
- Each principle should have a rationale explaining why it exists
- Principles should be reviewed and updated annually
- Exceptions to principles should be documented with rationale

Government-wide principles come from the Technology Code of Practice. Departmental principles should complement these with department-specific guidance.

### Architecture Decision Records (ADRs)

ADRs document significant architecture decisions:

- **Context** — what is the situation and what problem needs to be solved?
- **Decision** — what was decided?
- **Rationale** — why was this option chosen over alternatives?
- **Consequences** — what are the positive and negative implications?
- **Status** — proposed, accepted, deprecated, or superseded

ADRs should be stored alongside the code they relate to (in the Git repository) and indexed in the architecture repository. They provide an invaluable record for future architects who need to understand why decisions were made.

### Compliance Assessment

Regular compliance assessments verify that implemented systems conform to the approved architecture:

- **Pre-implementation review** — architecture design review before development begins
- **In-flight review** — periodic checks during development to catch drift early
- **Post-implementation review** — verification that the implemented system matches the approved design
- **Annual review** — periodic reassessment of live services against current standards

Compliance assessments should be proportionate. A small internal tool needs less rigorous review than a citizen-facing service handling personal data.

### Exception Management

Not every service can comply with every standard. An effective exception process:

1. The team identifies the standard they cannot meet and explains why
2. The team proposes compensating controls or a remediation timeline
3. The ARB evaluates the risk and decides whether to grant the exception
4. Exceptions are time-limited and reviewed at expiry
5. All exceptions are recorded in the governance log

Exceptions should be rare but not impossible. A governance process that never grants exceptions is too rigid; one that always grants them is ineffective.

## Governance in Agile Contexts

### Lightweight Governance

Architecture governance must work with agile delivery, not against it. Principles for lightweight governance:

- **Shift left** — provide architecture guidance early (during discovery and alpha) rather than reviewing completed designs
- **Embed architects** — place architects in delivery teams rather than reviewing from outside
- **Automate compliance** — use automated checks (linting, policy-as-code, security scanning) rather than manual reviews
- **Trust and verify** — trust teams to follow standards, verify through automated checks and periodic reviews

### Architecture Spikes

In agile delivery, architecture decisions often emerge through spikes — time-boxed investigations that explore technical options. Governance should support this by:

- Providing architecture principles and patterns that guide spike outcomes
- Reviewing spike findings and decisions through lightweight ADRs
- Offering architecture advice during spikes rather than reviewing after the fact

### Guardrails vs Gates

**Gates** stop progress until approval is granted. They are appropriate for high-risk decisions (production deployment of a new service, adoption of a new technology platform).

**Guardrails** guide teams towards good decisions without stopping progress. They are appropriate for routine decisions (choosing between approved technologies, following established patterns).

Most architecture governance should be guardrails, with gates reserved for genuinely high-risk decisions.

## Measuring Governance Effectiveness

Track metrics that indicate whether governance is working:

- **Time to decision** — how long does it take from ARB submission to decision? (Target: same meeting)
- **Compliance rate** — what percentage of services comply with architecture standards?
- **Exception count** — how many active exceptions exist? (Trending up is a warning sign)
- **Reuse rate** — how often do teams reuse existing capabilities rather than building new ones?
- **Team satisfaction** — do delivery teams find governance helpful or obstructive?

If teams view governance as a bureaucratic hurdle rather than a helpful guide, the governance process needs to change.

## Key Takeaways

- Architecture governance ensures technology decisions align with strategy and standards
- The Architecture Review Board is the primary governance body — keep it lightweight and decision-focused
- Architecture Decision Records provide an auditable trail of decisions and their rationale
- Governance must work with agile delivery — prefer guardrails over gates and embed architects in teams
- Measure governance effectiveness through decision speed, compliance rates, and team satisfaction

## Practical Examples

### Example 1: Establishing an ARB

A government department establishes an Architecture Review Board. The ARB meets fortnightly with 8 members (chief architect, 3 domain architects, security architect, data architect, head of engineering, and a rotating delivery team representative). Teams submit a one-page architecture brief 3 days before the meeting. The ARB reviews 3-4 items per meeting, providing a decision and written feedback within 24 hours. In its first year, the ARB reviews 45 architecture designs, identifies 12 reuse opportunities (saving an estimated £2.1 million), and catches 8 security concerns before they reach production.

### Example 2: Governance for a Multi-Team Programme

A large transformation programme with 6 delivery teams implements layered governance. Each team has an embedded architect who makes day-to-day architecture decisions, documented as ADRs in the team's repository. A programme-level architecture forum meets weekly to coordinate cross-team decisions and resolve dependencies. The departmental ARB reviews the programme's architecture quarterly, focusing on strategic alignment and cross-programme impacts. Automated policy checks in the CI/CD pipeline enforce security and compliance standards without manual review. The layered approach provides appropriate governance at each level without creating bottlenecks.

---
keyTakeaways:
  - Architecture governance ensures technology decisions align with strategy and standards
  - Keep the Architecture Review Board lightweight and decision-focused
  - Architecture Decision Records provide an auditable trail of decisions and rationale
  - Governance must work with agile delivery prefer guardrails over gates
  - Measure governance effectiveness through decision speed compliance and team satisfaction

practicalExamples:
  - Establish an ARB that reviews 45 designs and identifies 12 reuse opportunities in year one
  - Implement layered governance for a multi-team programme with embedded architects and automated checks
