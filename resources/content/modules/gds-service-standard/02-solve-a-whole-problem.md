---
title: "Solve a whole problem for users"
category: "gds-service-standard"
sequenceOrder: 2
estimatedMinutes: 15
---

# Solve a Whole Problem for Users

## Introduction

Point 2 of the GDS Service Standard requires teams to "work towards solving a whole problem for users, working with other teams and organisations where necessary." This is one of the most architecturally significant points in the standard because it directly challenges the tendency to build systems that reflect organisational structures rather than user needs.

For solution architects, this point has profound implications. It means designing systems that cross organisational boundaries, integrate with other departments' services, and present a coherent experience to users even when the underlying systems are owned by different teams. It requires architects to think beyond their immediate service boundary and consider the end-to-end user journey.

This module explores what "solving a whole problem" means in practice and how architects can design systems that achieve it.

## Understanding Whole Problems

### Conway's Law and Government Services

Conway's Law states that organisations design systems that mirror their own communication structures. In government, this manifests as services that reflect departmental boundaries rather than user needs. A citizen moving house might need to update their address with DVLA, HMRC, the electoral register, their GP, and their local council — each requiring a separate interaction with a separate system.

Solving a whole problem means designing services from the user's perspective, not the organisation's. The architect's role is to identify where organisational boundaries create friction for users and design integration patterns that reduce or eliminate that friction.

### Mapping the Whole Problem

To solve a whole problem, you first need to understand it. Techniques include:

**User journey mapping** — trace the complete journey a user takes to achieve their goal, including steps that happen outside your service. A user applying for a driving licence needs to prove their identity, provide a photo, pay a fee, and receive the licence. Each step may involve different systems and organisations.

**Service mapping** — identify all the services, systems, and organisations involved in delivering the user's goal. This reveals integration points, handoffs, and potential failure points.

**Pain point analysis** — identify where users experience friction, confusion, or failure in the current journey. These are the areas where architectural improvements can have the most impact.

## Architectural Approaches

### API-First Design

APIs are the primary mechanism for enabling services to work together. Design your service with APIs from the start:

- **External APIs** — allow other services to integrate with your service
- **Internal APIs** — enable your own frontend and backend to evolve independently
- **Event APIs** — publish events when significant things happen in your service, allowing other services to react

Follow the GDS API technical and data standards:
- Use RESTful APIs with JSON payloads
- Version your APIs to allow evolution without breaking consumers
- Document APIs using OpenAPI specifications
- Implement appropriate authentication and authorisation

### Cross-Government Platform Integration

GDS provides platforms that help services solve whole problems:

**GOV.UK One Login** — provides identity verification and authentication across government services. By using One Login, your service contributes to a whole-problem solution where citizens have a single identity across government.

**GOV.UK Notify** — provides email, SMS, and letter notifications. Using Notify ensures consistent communication across services and reduces the need for users to check multiple channels.

**GOV.UK Pay** — provides payment processing. Using Pay means citizens have a consistent payment experience across government services.

**GOV.UK Forms** — provides a simple way to create online forms. For straightforward data collection, Forms can replace bespoke development.

These platforms are not just cost-saving measures — they are architectural building blocks for solving whole problems across government.

### Data Sharing Patterns

Solving whole problems often requires sharing data between services and organisations. Architectural patterns for data sharing include:

**Registers and reference data** — authoritative lists of things (countries, local authorities, licence types) that multiple services need. Use existing registers where available rather than maintaining your own copies.

**Event-driven data sharing** — when something happens in one service that other services need to know about, publish an event. This is more scalable and loosely coupled than point-to-point integrations.

**API-based data access** — provide APIs that allow authorised services to query your data. Implement appropriate access controls and rate limiting.

**Federated identity** — use GOV.UK One Login to share identity information across services without each service maintaining its own identity store.

### Service Boundaries and Ownership

Defining service boundaries is one of the most challenging aspects of solving whole problems. Consider:

- **Domain-driven design** — align service boundaries with business domains, not organisational structures
- **Team topology** — ensure each service can be owned and operated by a single team
- **User journey alignment** — service boundaries should not create visible seams in the user journey
- **Data ownership** — each service should own its data and expose it through APIs

When a whole problem spans multiple teams or departments, establish clear integration contracts and governance arrangements. An integration that nobody owns will eventually break.

## Challenges and Strategies

### Organisational Boundaries

The biggest challenge in solving whole problems is organisational, not technical. Different departments have different priorities, budgets, timelines, and governance structures. Strategies for working across boundaries include:

- Start with informal collaboration and shared understanding of the user problem
- Use cross-government communities (architecture, design, technology) to build relationships
- Propose lightweight integration approaches that minimise the burden on other teams
- Demonstrate value through prototypes and pilots before requesting formal commitments

### Legacy System Integration

Many government services depend on legacy systems that were not designed for integration. Approaches include:

- **Anti-corruption layer** — build an adapter that translates between your modern service and the legacy system's interface
- **Strangler fig pattern** — gradually replace legacy functionality by routing new requests to the modern service while maintaining the legacy system for existing functionality
- **Event sourcing from legacy** — capture changes in the legacy system as events that your modern service can consume

### Incremental Delivery

You do not need to solve the whole problem at once. The GDS Service Standard says "work towards solving a whole problem." This means:

- Start by solving the most painful part of the problem
- Design your architecture to accommodate future integration points
- Build APIs and events from the start, even if no consumers exist yet
- Plan for incremental expansion of the service boundary over time

## Key Takeaways

- Solving a whole problem means designing from the user's perspective, not the organisation's
- APIs are the primary mechanism for enabling services to work together across boundaries
- Leverage cross-government platforms (One Login, Notify, Pay) as building blocks for whole-problem solutions
- Define clear service boundaries aligned with business domains and team ownership
- Work incrementally towards solving the whole problem, starting with the most painful user friction

## Practical Examples

### Example 1: Cross-Department Address Change

An architect designs a service that allows citizens to update their address once and have it propagated to relevant government services. The architecture uses GOV.UK One Login for identity verification, an event-driven pattern where the address change service publishes an "address changed" event, and subscribing services (DVLA, HMRC, electoral services) consume the event and update their records. Each subscribing service maintains its own integration at its own pace, and the citizen sees a single, coherent experience. The architect works with three departments over 12 months to establish the integration contracts and governance arrangements.

### Example 2: End-to-End Business Licensing

A local authority architect redesigns the business licensing journey. Previously, applicants needed to interact with five separate systems (planning, environmental health, fire safety, licensing, and payments). The new architecture provides a single application journey that orchestrates checks across all five domains through internal APIs. The citizen completes one form, makes one payment through GOV.UK Pay, and receives updates through GOV.UK Notify. Behind the scenes, each domain team maintains their own service and data, connected through a lightweight orchestration layer.

---
keyTakeaways:
  - Solving a whole problem means designing from the user perspective not the organisation
  - APIs are the primary mechanism for enabling services to work together across boundaries
  - Leverage cross-government platforms as building blocks for whole-problem solutions
  - Define clear service boundaries aligned with business domains and team ownership
  - Work incrementally towards solving the whole problem starting with the most painful friction

practicalExamples:
  - Design an event-driven address change service that propagates updates across departments
  - Build a unified business licensing journey orchestrating five domain services through APIs
