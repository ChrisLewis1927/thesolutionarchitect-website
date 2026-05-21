---
title: "Architecture Vision Phase"
category: "togaf"
sequenceOrder: 2
estimatedMinutes: 15
---

# Architecture Vision Phase

## Introduction

Phase A of the TOGAF Architecture Development Method — the Architecture Vision — is where every architecture engagement begins in earnest. It establishes the scope, stakeholders, constraints, and high-level target state for the architecture work. A well-crafted Architecture Vision provides the foundation that all subsequent phases build upon.

In UK government contexts, the Architecture Vision phase aligns naturally with the discovery phase of the GDS service design process. Both seek to understand the problem space, identify stakeholders, and establish a shared understanding of what success looks like before committing to detailed design work.

This module covers how to develop an effective Architecture Vision, manage stakeholders, and produce the key deliverables of Phase A.

## Inputs to the Architecture Vision

### Request for Architecture Work

The Architecture Vision phase is typically triggered by a Request for Architecture Work. In government, this might come from:

- A business case approved through the spend control process
- A policy change requiring new or modified digital services
- A technology refresh driven by end-of-life systems
- A cross-government initiative requiring departmental participation

The request should articulate the business problem or opportunity, not prescribe a technical solution. "We need to replace our legacy case management system" is a better starting point than "We need to build a microservices architecture on Kubernetes."

### Existing Architecture Documentation

Gather existing architecture documentation:
- Current state architecture diagrams and descriptions
- Previous architecture reviews and assessments
- Technology strategy and roadmap documents
- Relevant Architecture Decision Records (ADRs)

In many government departments, this documentation may be incomplete or outdated. Acknowledge gaps and plan to address them during the vision phase rather than assuming the documentation is accurate.

## Stakeholder Management

### Identifying Stakeholders

Architecture affects many people. Identify stakeholders across multiple dimensions:

- **Business stakeholders** — service owners, policy teams, operational staff
- **Technical stakeholders** — development teams, infrastructure teams, security teams
- **Governance stakeholders** — architecture review boards, spend control teams, senior responsible owners
- **External stakeholders** — other departments, shared service providers, suppliers
- **Users** — citizens, caseworkers, or other end users of the service

### Stakeholder Mapping

Use a stakeholder map to understand each stakeholder's:

- **Interest** — what they care about (cost, timeline, functionality, compliance)
- **Influence** — their ability to affect the architecture engagement
- **Concerns** — specific worries or requirements they bring
- **Communication needs** — how often and in what format they need updates

A power/interest grid helps prioritise stakeholder engagement. High-power, high-interest stakeholders (typically the SRO and service owner) need close management. High-power, low-interest stakeholders (such as the CTO or architecture review board) need to be kept satisfied with periodic updates.

### Managing Concerns

Each stakeholder brings concerns that the architecture must address. Common concerns in government contexts include:

- **Security** — "Does this meet NCSC guidance and pass ITHC?"
- **Cost** — "Is this within our spend control approval?"
- **Accessibility** — "Does this meet WCAG 2.2 AA and the public sector accessibility regulations?"
- **Data sovereignty** — "Where is the data stored and processed?"
- **Interoperability** — "Can this integrate with cross-government platforms?"
- **Sustainability** — "How does this align with Greening Government commitments?"

Document these concerns explicitly and show how the architecture addresses each one. This traceability is valuable during service assessments and architecture reviews.

## Developing the Vision

### Business Scenarios

Business scenarios are a TOGAF technique for understanding the business problem in context. A business scenario describes:

1. The business process or situation
2. The business and technology environment
3. The problems that need to be addressed
4. The desired outcome

For a government service, a business scenario might describe: "A citizen applies for a benefit online. The current system requires manual processing by caseworkers, taking an average of 15 working days. The desired outcome is automated eligibility checking with a decision within 2 working days for straightforward cases."

### Architecture Principles

Define or reference the architecture principles that will guide design decisions. Government architecture principles typically include:

- **User-centred design** — design for user needs, not organisational convenience
- **Reuse before buy, buy before build** — leverage existing capabilities and commercial products
- **Open standards** — use open standards and open source where appropriate
- **Cloud first** — use public cloud unless there is a compelling reason not to
- **Security by design** — build security in from the start, not bolt it on later
- **Data as an asset** — manage data as a valuable organisational asset

These principles should be specific enough to guide decisions. "Use good technology" is not a useful principle. "Prefer managed cloud services over self-managed infrastructure to reduce operational burden" is.

### The Vision Statement

The Architecture Vision statement is a concise description of the target state. It should be:

- **Clear** — understandable by non-technical stakeholders
- **Measurable** — include criteria for success
- **Achievable** — realistic given constraints and timescale
- **Aligned** — consistent with business strategy and government policy

A good vision statement for a government service might be: "A cloud-hosted, API-driven case management platform that enables caseworkers to process 80% of applications within 2 working days, integrates with GOV.UK for citizen-facing interactions, and meets all GDS Service Standard requirements for a live service."

## Key Deliverables

### Statement of Architecture Work

The Statement of Architecture Work is the primary output of Phase A. It defines:

- Scope and constraints of the architecture engagement
- Stakeholders and their concerns
- Architecture principles and requirements
- The Architecture Vision
- Approach and timeline for subsequent ADM phases
- Governance arrangements

This document serves as the agreement between the architecture team and the sponsoring stakeholders. In government, it often forms part of the business case or programme initiation documentation.

### High-Level Architecture

Phase A produces a high-level architecture — not a detailed design, but enough to validate the vision and identify major risks. This typically includes:

- A context diagram showing the system in its environment
- A high-level component diagram showing major building blocks
- Key integration points with other systems
- Major technology choices and their rationale

Keep this high-level. The purpose is to validate feasibility and alignment, not to make detailed design decisions.

## Key Takeaways

- The Architecture Vision establishes scope, stakeholders, and direction before detailed design begins
- Stakeholder management is as important as technical analysis in Phase A
- Business scenarios ground the architecture in real problems and desired outcomes
- Architecture principles guide decisions throughout subsequent phases
- The Statement of Architecture Work is the key deliverable that authorises further architecture development

## Practical Examples

### Example 1: Vision for a Benefits Service Transformation

A government department initiates an architecture engagement to replace a 15-year-old benefits processing system. The Architecture Vision phase identifies 12 stakeholder groups, from citizens to Treasury. Business scenarios document five key user journeys. The vision statement defines a cloud-native platform processing 80% of claims automatically. Architecture principles prioritise user-centred design, API-first integration, and cloud-native services. The Statement of Architecture Work is approved by the department's Architecture Review Board, authorising a 6-week detailed design phase covering Phases B through D.

### Example 2: Lightweight Vision for an API Platform

A department needs an API management platform to expose data to other departments. The solution architect conducts a two-day Architecture Vision exercise: a half-day stakeholder workshop identifies key concerns (security, rate limiting, developer experience), a day of analysis produces a high-level architecture (Azure API Management with Entra ID authentication), and a half-day to write a concise Statement of Architecture Work. The lightweight approach is proportionate to the scope — a single platform component rather than a full service transformation.

---
keyTakeaways:
  - The Architecture Vision establishes scope stakeholders and direction before detailed design
  - Stakeholder management is as important as technical analysis in Phase A
  - Business scenarios ground the architecture in real problems and desired outcomes
  - Architecture principles guide decisions throughout subsequent phases
  - The Statement of Architecture Work authorises further architecture development

practicalExamples:
  - Conduct a full Architecture Vision phase for a major benefits service transformation
  - Run a lightweight two-day vision exercise for a focused API platform initiative
