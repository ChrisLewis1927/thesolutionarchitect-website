---
title: "Common Architecture Patterns"
category: "solution-architecture"
sequenceOrder: 2
estimatedMinutes: 15
---

# Common Architecture Patterns

## Introduction

Architecture patterns are reusable solutions to commonly occurring problems in software architecture. They provide a shared vocabulary for discussing design decisions and a starting point for designing new systems. Understanding common patterns — their strengths, weaknesses, and appropriate contexts — is a core competency for solution architects.

For UK government architects, pattern selection has significant implications for team structure, operational complexity, cost, and the ability to meet GDS Service Standard requirements. Choosing the wrong pattern can saddle a team with unnecessary complexity, while choosing the right one can dramatically simplify delivery and operations.

This module covers the most common architecture patterns encountered in government digital services.

## Monolithic Architecture

### Description

A monolithic architecture deploys the entire application as a single unit. All functionality — user interface, business logic, data access — is packaged and deployed together.

### When to Use

- Small to medium-sized applications with a single development team
- Applications where all components scale at the same rate
- Teams with limited operational experience (simpler to deploy and monitor)
- Early-stage services where requirements are still evolving

### Strengths

- Simple to develop, test, and deploy
- Easy to debug (single process, single log stream)
- No inter-service communication overhead
- Straightforward data consistency (single database, transactions)

### Weaknesses

- Becomes difficult to maintain as the codebase grows
- All components must be deployed together (a change to one feature requires redeploying everything)
- Scaling is all-or-nothing (cannot scale individual components independently)
- Technology choices are locked in for the entire application

### Government Context

Many successful government services run as monoliths. The GOV.UK publishing platform started as a collection of small monolithic applications. For a team of 4-8 developers building a single service, a monolith is often the right choice.

## Modular Monolith

### Description

A modular monolith is a single deployable unit with clear internal module boundaries. Each module owns its data and exposes a well-defined interface to other modules. It combines the deployment simplicity of a monolith with the organisational benefits of modular design.

### When to Use

- Medium-sized applications with clear domain boundaries
- Teams that want the benefits of modularity without the operational complexity of microservices
- Applications that may need to be decomposed into microservices in the future

### Strengths

- Simpler deployment and operations than microservices
- Clear module boundaries support team autonomy and code organisation
- Easier to refactor into microservices later if needed
- In-process communication (no network overhead between modules)

### Weaknesses

- Requires discipline to maintain module boundaries (easy to create cross-module dependencies)
- Still deploys as a single unit (a bug in one module affects the whole application)
- Scaling is still all-or-nothing

### Government Context

The modular monolith is increasingly recommended as the default pattern for government services. It provides a good balance of simplicity and structure for teams of 6-15 developers.

## Microservices

### Description

A microservices architecture decomposes the application into small, independently deployable services. Each service owns its data, communicates with other services through APIs or events, and can be developed, deployed, and scaled independently.

### When to Use

- Large, complex applications with multiple development teams
- Applications where different components have different scaling requirements
- Organisations with mature DevOps practices and platform engineering capability
- Applications where independent deployment of components is a business requirement

### Strengths

- Independent deployment — teams can release changes without coordinating with other teams
- Independent scaling — scale individual services based on their specific demand
- Technology diversity — different services can use different languages and frameworks
- Fault isolation — a failure in one service does not necessarily affect others

### Weaknesses

- Significant operational complexity (many services to deploy, monitor, and debug)
- Distributed system challenges (network latency, partial failures, eventual consistency)
- Requires mature CI/CD, monitoring, and incident response practices
- Inter-service communication adds latency and complexity

### Government Context

Microservices are appropriate for large government programmes with multiple teams (e.g., Universal Credit, HMRC's Making Tax Digital). For smaller services, the operational overhead of microservices often outweighs the benefits. Do not adopt microservices because they are fashionable — adopt them because your team size and service complexity demand it.

## Event-Driven Architecture

### Description

An event-driven architecture uses events as the primary mechanism for communication between components. When something significant happens (a form is submitted, a payment is made, a decision is reached), an event is published. Other components subscribe to events they are interested in and react accordingly.

### When to Use

- Systems that need to react to changes in real time
- Loosely coupled systems where producers and consumers evolve independently
- Systems with complex workflows that span multiple services
- Integration scenarios where multiple systems need to know about the same event

### Strengths

- Loose coupling — producers do not need to know about consumers
- Scalability — events can be processed asynchronously and in parallel
- Extensibility — new consumers can be added without modifying producers
- Resilience — if a consumer is temporarily unavailable, events are queued for later processing

### Weaknesses

- Eventual consistency — data may be temporarily inconsistent across services
- Debugging complexity — tracing the flow of events across multiple services is challenging
- Event schema evolution — changing event formats requires careful versioning
- Ordering guarantees — ensuring events are processed in the correct order can be complex

### Government Context

Event-driven patterns are valuable for government services that need to notify multiple systems when something happens. For example, when a citizen's address changes, an event can notify benefits, tax, and electoral services. AWS EventBridge and Azure Event Grid provide managed event routing services.

## Serverless Architecture

### Description

A serverless architecture uses cloud-managed services for compute (Functions), storage (object storage, managed databases), and integration (API gateways, event buses). The cloud provider manages all infrastructure, and you pay only for actual usage.

### When to Use

- Variable or unpredictable workloads (pay only for what you use)
- Event-driven processing (file uploads, queue processing, scheduled tasks)
- APIs with low to moderate traffic
- Teams that want to minimise operational overhead

### Strengths

- No infrastructure management (no servers to patch, scale, or monitor)
- Cost-effective for variable workloads (zero cost when idle)
- Automatic scaling (from zero to thousands of concurrent executions)
- Rapid development (focus on business logic, not infrastructure)

### Weaknesses

- Cold start latency (functions may take 1-3 seconds to start after being idle)
- Execution time limits (Lambda: 15 minutes, Azure Functions: varies by plan)
- Vendor lock-in (serverless architectures are tightly coupled to the cloud provider)
- Debugging and testing complexity (difficult to replicate the cloud environment locally)

### Government Context

Serverless is well-suited for government services with variable traffic patterns. A service that handles 50 requests per hour most of the time but spikes to 5,000 during peak periods benefits from serverless economics. Many government APIs and data processing pipelines run effectively on serverless.

## Choosing the Right Pattern

### Decision Framework

Consider these factors when choosing an architecture pattern:

| Factor | Monolith | Modular Monolith | Microservices | Serverless |
|--------|----------|-------------------|---------------|------------|
| Team size | 2-8 | 6-15 | 15+ | 2-10 |
| Operational maturity | Low | Medium | High | Low-Medium |
| Deployment frequency | Weekly-Monthly | Weekly | Daily | Continuous |
| Scaling needs | Uniform | Uniform | Variable | Variable |
| Complexity | Low-Medium | Medium | High | Medium |

### The Default Choice

For most new government services, start with a modular monolith. It provides a good balance of simplicity and structure. If the service grows in complexity and team size, it can be decomposed into microservices. If it remains small, the monolith serves well.

Do not start with microservices unless you have a clear, specific reason and the operational maturity to support them.

## Key Takeaways

- Architecture patterns provide reusable solutions to common design problems
- The modular monolith is the recommended default for most government services
- Microservices are appropriate for large, complex services with multiple teams — not for every project
- Event-driven patterns enable loose coupling and are valuable for cross-service integration
- Choose patterns based on team size, operational maturity, and actual requirements — not trends

## Practical Examples

### Example 1: Pattern Selection for a New Service

A government department is building a new case management service. The team has 8 developers, moderate cloud experience, and a requirement to integrate with 3 existing systems. The solution architect evaluates options: microservices would add unnecessary operational complexity for a single team; a pure monolith risks becoming difficult to maintain as the service grows. The architect recommends a modular monolith with clear module boundaries (intake, assessment, decision, communication) and an event-driven integration layer for external system communication. The architecture supports future decomposition if the team grows, but avoids premature complexity.

### Example 2: Migrating from Monolith to Microservices

A government service that started as a monolith has grown to 25 developers across 4 teams. Deployment coordination has become a bottleneck — teams wait days for a shared release window. The solution architect plans a gradual migration using the strangler fig pattern: new features are built as independent services, while existing functionality is extracted from the monolith one module at a time. An API gateway routes requests to either the monolith or the new services. Over 12 months, the team extracts 3 high-change modules into independent services, reducing deployment coordination overhead by 60% while leaving stable, low-change modules in the monolith.

---
keyTakeaways:
  - Architecture patterns provide reusable solutions to common design problems
  - The modular monolith is the recommended default for most government services
  - Microservices are appropriate for large complex services with multiple teams
  - Event-driven patterns enable loose coupling for cross-service integration
  - Choose patterns based on team size operational maturity and actual requirements

practicalExamples:
  - Select a modular monolith with event-driven integration for a new case management service
  - Migrate from monolith to microservices using the strangler fig pattern over 12 months
