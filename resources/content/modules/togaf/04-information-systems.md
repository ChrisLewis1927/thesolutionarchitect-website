---
title: "Information Systems Architecture"
category: "togaf"
sequenceOrder: 4
estimatedMinutes: 15
---

# Information Systems Architecture

## Introduction

Phase C of the TOGAF ADM covers Information Systems Architecture, which encompasses both Data Architecture and Application Architecture. This is where the abstract business requirements from Phase B are translated into concrete information system designs — the data models, application components, and integration patterns that will deliver the required business capabilities.

For UK government architects, Phase C is where many of the most consequential design decisions are made. The choice between a monolithic application and microservices, the design of data models that must serve multiple departments, the integration patterns that connect to cross-government platforms — these decisions shape the service for years to come.

This module covers both the Data Architecture and Application Architecture aspects of Phase C.

## Data Architecture

### Data as a Strategic Asset

The National Data Strategy positions data as a strategic asset for government. Your data architecture should reflect this by:

- Making data findable, accessible, interoperable, and reusable (FAIR principles)
- Designing data models that serve multiple consumers, not just the primary application
- Implementing data quality controls at the point of capture
- Planning for data sharing across organisational boundaries

### Conceptual Data Model

Start with a conceptual data model that describes the key data entities and their relationships in business terms. This model should be understandable by non-technical stakeholders and should map directly to the business capabilities identified in Phase B.

For a benefits service, the conceptual model might include: Citizen, Application, Entitlement, Assessment, Decision, Payment, and Appeal. Each entity has clear business meaning and relationships.

### Logical Data Model

The logical data model adds detail to the conceptual model:

- Attributes for each entity (with data types and constraints)
- Relationship cardinality (one-to-many, many-to-many)
- Normalisation to reduce redundancy
- Identification of master data and reference data

Design the logical model to be technology-independent. It should describe what data exists and how it relates, not how it is physically stored.

### Data Governance

Data governance defines who can access what data, under what conditions, and for what purposes:

- **Data ownership** — which team or role is accountable for each data entity
- **Data classification** — applying Government Security Classifications (OFFICIAL, SECRET, TOP SECRET)
- **Access controls** — role-based access aligned with the principle of least privilege
- **Retention policies** — how long data is kept, aligned with legal requirements and departmental policies
- **Data quality standards** — accuracy, completeness, timeliness, and consistency requirements

For government services handling personal data, data governance must also address GDPR and the Data Protection Act 2018, including lawful basis for processing, data subject rights, and data protection impact assessments.

### Data Integration Patterns

Government services rarely operate in isolation. Common data integration patterns include:

- **API-based integration** — RESTful or GraphQL APIs for real-time data exchange
- **Event-driven integration** — publishing events when data changes, allowing consumers to react asynchronously
- **Batch integration** — scheduled data transfers for non-time-sensitive exchanges
- **Data replication** — maintaining copies of data in multiple systems for performance or resilience

Choose the pattern that matches the timeliness, volume, and reliability requirements of each integration point.

## Application Architecture

### Application Portfolio Assessment

Before designing new applications, assess the existing portfolio:

- **TIME classification** — categorise applications as Tolerate, Invest, Migrate, or Eliminate
- **Technical debt assessment** — identify applications with high maintenance costs or security risks
- **Capability coverage** — map applications to business capabilities to identify gaps and overlaps
- **Integration complexity** — understand the web of integrations between existing applications

This assessment informs the target application architecture by identifying what to keep, what to replace, and what to consolidate.

### Application Architecture Patterns

Common patterns for government applications include:

**Monolithic architecture** — a single deployable unit containing all functionality. Appropriate for smaller services with a single team. Simpler to develop, test, and deploy initially, but can become difficult to maintain as the application grows.

**Modular monolith** — a monolithic deployment with clear internal module boundaries. Provides many of the organisational benefits of microservices without the operational complexity. A good default choice for most government services.

**Microservices** — independently deployable services, each owning its own data. Appropriate for large, complex services with multiple teams. Provides independent scaling and deployment but adds significant operational complexity.

**Serverless** — event-driven functions and managed services. Appropriate for variable workloads and event processing. Reduces operational overhead but requires a different approach to application design.

The choice between these patterns should be driven by team size, organisational structure, and operational capability — not by technology trends. A small team building a microservices architecture will spend more time on infrastructure than on delivering user value.

### Integration Architecture

Government services integrate with many systems. Design your integration architecture to be:

- **Loosely coupled** — services communicate through well-defined interfaces, not shared databases
- **Resilient** — handle integration failures gracefully with retries, circuit breakers, and fallbacks
- **Observable** — log and trace all integration calls for debugging and audit
- **Secure** — authenticate and authorise all integration points, encrypt data in transit

Common integration technologies in government include:

- REST APIs with OAuth 2.0 / OpenID Connect authentication
- Message queues (SQS, Azure Service Bus) for asynchronous communication
- Event buses (EventBridge, Azure Event Grid) for event-driven integration
- API gateways for centralised API management, security, and rate limiting

### Cross-Government Platform Integration

Design your application architecture to leverage cross-government platforms:

- **GOV.UK One Login** — for citizen identity verification and authentication
- **GOV.UK Notify** — for sending emails, SMS, and letters to citizens
- **GOV.UK Pay** — for taking payments from citizens
- **GOV.UK Forms** — for simple form-based services

These platforms provide tested, accessible, and cost-effective capabilities that should be used in preference to building bespoke equivalents.

## Bridging Data and Application Architecture

### Data Ownership in Distributed Systems

In a distributed application architecture, each service should own its data. This means:

- No shared databases between services
- Data is accessed through the service's API, not by querying its database directly
- Each service is the authoritative source for its data entities
- Data that needs to be available across services is shared through events or APIs

This principle is challenging in government contexts where legacy systems often share databases. Plan a migration path that gradually moves towards service-owned data.

### Event-Driven Data Consistency

When services own their data independently, maintaining consistency across services requires careful design. Event-driven patterns provide eventual consistency:

- When a service changes its data, it publishes an event
- Other services that need to know about the change subscribe to the event
- Each service maintains its own view of the data it needs

This approach trades immediate consistency for loose coupling and resilience — a worthwhile trade-off for most government services.

## Key Takeaways

- Data Architecture should treat data as a strategic asset, following FAIR principles
- Start with conceptual and logical data models before making technology choices
- Choose application architecture patterns based on team size and operational capability, not trends
- Design integrations to be loosely coupled, resilient, and observable
- Leverage cross-government platforms rather than building bespoke equivalents

## Practical Examples

### Example 1: Data Architecture for a Shared Service

A government shared service centre designs a data architecture to support case management across three departments. The conceptual model identifies common entities (Case, Citizen, Decision, Document) with department-specific extensions. A logical data model implements multi-tenancy with department-specific configuration. Data governance defines each department as the data owner for their cases, with cross-department reporting enabled through anonymised, aggregated data views. APIs provide controlled access to case data, with OAuth 2.0 scopes limiting each department to their own data.

### Example 2: Application Architecture for a Regulatory Service

A regulatory body designs an application architecture for a new licensing service. The team of eight developers chooses a modular monolith pattern — simpler to operate than microservices while maintaining clear module boundaries. The application integrates with GOV.UK One Login for identity verification, GOV.UK Pay for licence fees, and GOV.UK Notify for application status updates. An event-driven integration with the department's data warehouse enables reporting without impacting the operational database. The architecture supports future decomposition into microservices if the team grows and the service complexity warrants it.

---
keyTakeaways:
  - Data Architecture should treat data as a strategic asset following FAIR principles
  - Start with conceptual and logical data models before making technology choices
  - Choose application architecture patterns based on team size and operational capability
  - Design integrations to be loosely coupled resilient and observable
  - Leverage cross-government platforms rather than building bespoke equivalents

practicalExamples:
  - Design a multi-tenant data architecture for a shared service centre with department-level data ownership
  - Build a modular monolith integrating with GOV.UK platforms for a regulatory licensing service
