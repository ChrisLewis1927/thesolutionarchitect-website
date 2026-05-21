---
title: "Non-Functional Requirements"
category: "solution-architecture"
sequenceOrder: 3
estimatedMinutes: 15
---

# Non-Functional Requirements

## Introduction

Non-functional requirements (NFRs) define how a system should behave, as opposed to functional requirements which define what a system should do. They encompass performance, security, scalability, availability, maintainability, and other quality attributes that determine whether a system is fit for purpose.

For solution architects, NFRs are often the most architecturally significant requirements. Two systems with identical functional requirements but different NFRs may require completely different architectures. A service that must handle 100 requests per second with 99.9% availability requires a fundamentally different architecture than one handling 10 requests per hour with 95% availability.

In UK government, NFRs are frequently under-specified or overlooked entirely, leading to systems that meet functional requirements but fail in production. This module covers how to identify, specify, and design for non-functional requirements.

## Categories of Non-Functional Requirements

### Performance

Performance requirements define how fast the system must respond:

- **Response time** — maximum acceptable time from request to response (e.g., "95th percentile response time under 500ms")
- **Throughput** — number of transactions the system must handle per unit of time (e.g., "1,000 concurrent users")
- **Latency** — time for data to travel through the system (relevant for real-time systems)

Specify performance requirements with percentiles, not averages. "Average response time under 200ms" hides the fact that 5% of users might wait 10 seconds. "p95 response time under 500ms" is a meaningful, testable requirement.

### Availability

Availability requirements define how much downtime is acceptable:

- **99.9% availability** — approximately 8.7 hours of downtime per year
- **99.95% availability** — approximately 4.4 hours of downtime per year
- **99.99% availability** — approximately 52 minutes of downtime per year

Each additional "nine" of availability significantly increases architectural complexity and cost. Most government services operate at 99.9% or 99.95%. Only critical national infrastructure typically requires 99.99%.

Define availability in terms of:
- Measurement period (monthly, quarterly, annually)
- Planned maintenance windows (are they included in the calculation?)
- Degraded service (does partial functionality count as available?)

### Scalability

Scalability requirements define how the system must handle growth:

- **Vertical scalability** — ability to handle more load by increasing resource size
- **Horizontal scalability** — ability to handle more load by adding more instances
- **Elasticity** — ability to scale up and down automatically based on demand

Specify scalability in terms of expected growth: "The system must support 10x current load within 5 minutes of demand increase" or "The system must support 50% year-on-year growth in transaction volume without architectural changes."

### Security

Security NFRs define the security posture required:

- **Authentication** — how users and services must prove their identity
- **Authorisation** — how access to resources is controlled
- **Encryption** — requirements for data encryption at rest and in transit
- **Audit** — what actions must be logged and for how long
- **Compliance** — specific standards that must be met (Cyber Essentials, NCSC Cloud Security Principles)

For government services, security NFRs should reference the Secure by Design framework and NCSC guidance.

### Reliability

Reliability requirements define how the system handles failures:

- **Recovery Point Objective (RPO)** — maximum acceptable data loss (e.g., "no more than 1 hour of data loss")
- **Recovery Time Objective (RTO)** — maximum acceptable time to restore service (e.g., "service restored within 4 hours")
- **Fault tolerance** — ability to continue operating when components fail
- **Data integrity** — requirements for data accuracy and consistency

### Maintainability

Maintainability requirements affect long-term cost and agility:

- **Deployability** — how frequently and easily the system can be updated
- **Testability** — how easily the system can be tested (unit, integration, end-to-end)
- **Observability** — how easily the system's behaviour can be understood through logs, metrics, and traces
- **Modularity** — how easily individual components can be modified without affecting others

### Accessibility

For government services, accessibility is a legal requirement:

- **WCAG 2.2 AA compliance** — required by the Public Sector Bodies Accessibility Regulations 2018
- **Assistive technology support** — compatibility with screen readers, voice control, and other assistive technologies
- **Performance on constrained devices** — usability on older devices and slow connections

## Gathering NFRs

### Sources of NFRs

NFRs come from multiple sources:

- **Business stakeholders** — availability requirements, expected user volumes, compliance requirements
- **Users** — performance expectations, accessibility needs, device and connectivity constraints
- **Operations teams** — maintainability, observability, deployment requirements
- **Security teams** — security standards, threat assessment, compliance requirements
- **Regulatory requirements** — accessibility regulations, data protection, sector-specific regulations
- **Service Level Agreements** — commitments to users or partner organisations

### Common Problems

NFRs are frequently:

- **Missing** — nobody thought to specify them
- **Vague** — "the system must be fast" is not a testable requirement
- **Unrealistic** — "99.999% availability" for a service that does not justify the cost
- **Contradictory** — "maximum security" and "frictionless user experience" may conflict
- **Static** — specified once and never updated as the service evolves

### Techniques for Elicitation

- **Workshops** — bring together business, technical, and operational stakeholders to discuss quality attributes
- **Scenarios** — describe specific situations and ask "what should happen?" (e.g., "What happens if traffic doubles in 5 minutes?")
- **Reference architectures** — use existing similar services as a baseline for NFRs
- **Risk assessment** — identify risks and derive NFRs from mitigation requirements
- **User research** — understand user expectations for performance, availability, and accessibility

## Specifying NFRs

### SMART NFRs

NFRs should be Specific, Measurable, Achievable, Relevant, and Time-bound:

**Bad:** "The system must be highly available."
**Good:** "The system must achieve 99.9% availability measured monthly, excluding planned maintenance windows of up to 4 hours per month scheduled outside business hours (8am-6pm weekdays)."

**Bad:** "The system must be fast."
**Good:** "The system must return search results within 500ms at the 95th percentile under normal load (up to 500 concurrent users) and within 2 seconds at the 95th percentile under peak load (up to 2,000 concurrent users)."

### NFR Documentation

Document NFRs in a structured format:

- **ID** — unique identifier for traceability
- **Category** — performance, availability, security, etc.
- **Description** — clear statement of the requirement
- **Rationale** — why this requirement exists
- **Measurement** — how compliance will be verified
- **Priority** — must-have, should-have, or nice-to-have
- **Source** — who specified this requirement

### Trade-offs

NFRs often conflict with each other. Document trade-off decisions:

- Higher availability increases cost and complexity
- Stronger security may reduce usability
- Better performance may require more expensive infrastructure
- Greater scalability may introduce eventual consistency

The architect's role is to make these trade-offs explicit and help stakeholders make informed decisions.

## Designing for NFRs

### Architecture Drivers

NFRs are the primary drivers of architecture decisions. For each significant NFR, identify the architectural approach:

- **High availability** → multi-AZ deployment, auto-scaling, health checks, circuit breakers
- **High performance** → caching, CDN, database optimisation, asynchronous processing
- **Strong security** → defence in depth, encryption, least privilege, monitoring
- **High scalability** → stateless design, horizontal scaling, event-driven patterns
- **High maintainability** → modular design, CI/CD, Infrastructure as Code, observability

### Testing NFRs

NFRs must be tested, not just specified:

- **Performance testing** — load tests, stress tests, soak tests using tools like k6, Locust, or JMeter
- **Availability testing** — chaos engineering, failover testing, DR drills
- **Security testing** — penetration testing, ITHC, automated security scanning
- **Accessibility testing** — automated WCAG testing, manual testing with assistive technologies
- **Scalability testing** — load tests at projected future volumes

Integrate NFR testing into your CI/CD pipeline where possible. Performance regression tests can run on every deployment.

## Key Takeaways

- Non-functional requirements are the primary drivers of architecture decisions
- Specify NFRs with measurable, testable criteria — avoid vague statements like "must be fast"
- Gather NFRs from multiple sources including business, users, operations, and security teams
- Document trade-offs between conflicting NFRs and help stakeholders make informed decisions
- Test NFRs continuously, not just at the end of development

## Practical Examples

### Example 1: NFR Specification for a Citizen Service

A solution architect specifies NFRs for a new citizen-facing benefits service. Performance: p95 response time under 1 second for page loads, under 3 seconds for form submissions. Availability: 99.9% measured monthly, with planned maintenance windows of 2 hours per month outside business hours. Scalability: support 5,000 concurrent users at launch, scaling to 20,000 within 2 years. Security: WCAG 2.2 AA compliance, Cyber Essentials Plus, data encrypted at rest and in transit, ITHC before go-live. Reliability: RPO of 1 hour, RTO of 4 hours. Each NFR includes a measurement method and is traced to a business justification.

### Example 2: NFR-Driven Architecture Decision

A service has conflicting NFRs: the security team requires all data to be encrypted with customer-managed keys (increasing latency by 5-10ms per operation), while the performance requirement specifies p99 response time under 200ms. The architect analyses the impact: with encryption overhead, p99 is projected at 180ms under normal load but 250ms under peak load. The architect proposes a caching layer that serves 80% of read requests without hitting the encrypted data store, achieving p99 of 150ms under peak load while maintaining encryption for all data at rest. The trade-off is documented in an ADR.

---
keyTakeaways:
  - Non-functional requirements are the primary drivers of architecture decisions
  - Specify NFRs with measurable testable criteria avoid vague statements
  - Gather NFRs from multiple sources including business users operations and security
  - Document trade-offs between conflicting NFRs with informed stakeholder decisions
  - Test NFRs continuously not just at the end of development

practicalExamples:
  - Specify comprehensive NFRs for a citizen-facing benefits service with measurable criteria
  - Resolve conflicting security and performance NFRs through caching architecture
