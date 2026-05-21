---
title: "TOGAF Overview and ADM"
category: "togaf"
sequenceOrder: 1
estimatedMinutes: 15
---

# TOGAF Overview and ADM

## Introduction

TOGAF (The Open Group Architecture Framework) is the most widely adopted enterprise architecture framework globally. It provides a structured approach to designing, planning, implementing, and governing enterprise information technology architecture. TOGAF is not a prescriptive methodology — it is a framework of methods and tools that organisations adapt to their specific context.

For UK government architects, TOGAF provides a common language and structured approach that complements government-specific frameworks like the Technology Code of Practice and the GDS Service Standard. Many government departments and their strategic suppliers use TOGAF concepts, making familiarity with the framework essential for effective collaboration.

This module introduces TOGAF's core concepts and its central method — the Architecture Development Method (ADM).

## TOGAF Structure

TOGAF is organised into several key components:

### Architecture Development Method (ADM)

The ADM is the core of TOGAF. It is an iterative, cyclic process for developing and managing enterprise architecture. The ADM consists of a preliminary phase and eight main phases (A through H), plus a requirements management process that interacts with all phases.

### Enterprise Continuum

The Enterprise Continuum is a classification scheme for architecture and solution assets. It ranges from generic (Foundation Architectures) to specific (Organisation-Specific Architectures). Think of it as a library of reusable architecture patterns and building blocks that become more specific as you move from industry-wide to organisation-specific.

### Architecture Repository

The Architecture Repository stores architecture outputs at different levels of abstraction:
- **Architecture Metamodel** — defines the types of architecture elements
- **Architecture Capability** — the organisation's architecture practice parameters
- **Architecture Landscape** — the current and target state architectures
- **Standards Information Base** — standards that the architecture must conform to
- **Reference Library** — reusable architecture patterns and templates
- **Governance Log** — records of governance decisions and compliance assessments

## The Architecture Development Method (ADM)

### Preliminary Phase

The Preliminary Phase establishes the architecture capability within the organisation. Key activities include:

- Defining the scope of the architecture effort
- Establishing the architecture governance framework
- Selecting and adapting architecture tools and frameworks
- Defining architecture principles

In a government context, this phase aligns the architecture practice with departmental governance structures, the Technology Code of Practice, and cross-government architecture standards.

### Phase A: Architecture Vision

Phase A establishes the high-level vision for the architecture engagement. It defines:

- The business problem or opportunity being addressed
- Stakeholders and their concerns
- The scope and constraints of the architecture work
- The Architecture Vision — a high-level description of the target state

The key deliverable is the Statement of Architecture Work, which is essentially the project charter for the architecture engagement.

### Phase B: Business Architecture

Phase B defines the business architecture needed to support the Architecture Vision. It describes:

- Business processes and functions
- Organisation structure and roles
- Business capabilities and value streams
- Information flows between business functions

For government services, this phase maps to understanding the policy intent, user needs, and operational processes that the technology must support.

### Phase C: Information Systems Architecture

Phase C covers both Data Architecture and Application Architecture:

- **Data Architecture** — what data entities exist, how they relate, where they are stored, and how they flow
- **Application Architecture** — what applications are needed, how they interact, and how they map to business functions

This phase is where solution architects spend much of their time, defining the logical application landscape and data models.

### Phase D: Technology Architecture

Phase D defines the technology infrastructure needed to support the applications and data:

- Computing platforms and hosting environments
- Network infrastructure and connectivity
- Security infrastructure
- Middleware and integration platforms

In modern cloud-native architectures, this phase covers cloud service selection, deployment topology, and infrastructure patterns.

### Phase E: Opportunities and Solutions

Phase E identifies the major implementation projects needed to deliver the target architecture. It involves:

- Grouping related changes into work packages
- Identifying transition architectures (intermediate states between current and target)
- Assessing build vs buy vs reuse options
- Defining the implementation roadmap

### Phase F: Migration Planning

Phase F creates a detailed migration plan, including:

- Prioritisation of projects based on business value and dependencies
- Resource allocation and timeline
- Risk assessment and mitigation strategies
- Cost-benefit analysis for each project

### Phase G: Implementation Governance

Phase G ensures that implementation projects conform to the target architecture. Activities include:

- Architecture compliance reviews
- Change management for architecture deviations
- Guidance and support for implementation teams
- Monitoring of project deliverables against architecture specifications

### Phase H: Architecture Change Management

Phase H establishes processes for managing changes to the architecture after implementation:

- Monitoring the business and technology environment for changes that affect the architecture
- Assessing the impact of change requests
- Determining whether changes require a new ADM cycle
- Maintaining the architecture repository

### Requirements Management

Requirements Management is not a phase but a continuous process that interacts with all ADM phases. It ensures that architecture requirements are identified, stored, and fed into the appropriate ADM phase.

## Adapting TOGAF for Government

### Proportionate Application

TOGAF is comprehensive, but not every engagement requires every phase in full detail. The framework explicitly supports tailoring:

- For a small digital service, a lightweight pass through Phases A-D may be sufficient
- For a major transformation programme, the full ADM cycle with detailed deliverables is appropriate
- For ongoing architecture governance, Phases G and H are the primary focus

### Integration with Agile

TOGAF and agile are not mutually exclusive. Many government teams use TOGAF concepts within agile delivery:

- Architecture Vision (Phase A) aligns with discovery and alpha phases
- Business and Information Systems Architecture (Phases B-C) inform backlog prioritisation
- Technology Architecture (Phase D) guides sprint-level technical decisions
- Implementation Governance (Phase G) operates through architecture reviews within sprints

The key is to apply TOGAF iteratively rather than as a waterfall process. Produce lightweight architecture artefacts that evolve with the delivery.

## Key Takeaways

- TOGAF provides a structured framework for enterprise architecture, not a rigid methodology
- The ADM is an iterative cycle of eight phases plus requirements management
- Tailor the depth and formality of TOGAF application to the scale and complexity of the engagement
- TOGAF complements government frameworks like the Technology Code of Practice and GDS Service Standard
- Integrate TOGAF concepts with agile delivery by producing lightweight, evolving architecture artefacts

## Practical Examples

### Example 1: ADM for a Government Digital Transformation

A government department uses the TOGAF ADM to plan a digital transformation of its case management processes. Phase A defines the vision: replacing a legacy system with a modern, cloud-hosted service that meets GDS Service Standard requirements. Phase B maps current business processes and identifies opportunities for simplification. Phase C defines the target application landscape (microservices on cloud PaaS) and data architecture (event-sourced with CQRS). Phase D specifies the AWS/Azure hosting environment. Phase E identifies three transition architectures over 18 months, allowing incremental migration from the legacy system.

### Example 2: Lightweight ADM in an Agile Context

A solution architect on an agile delivery team uses TOGAF concepts without formal TOGAF deliverables. During discovery, they create an Architecture Vision document (Phase A) as a two-page brief. During alpha, they produce a lightweight business capability map (Phase B) and logical application architecture (Phase C) as Miro boards. Technology decisions (Phase D) are captured as Architecture Decision Records in the team's Git repository. Architecture governance (Phase G) happens through peer review of ADRs and fortnightly architecture community meetings.

---
keyTakeaways:
  - TOGAF provides a structured framework for enterprise architecture not a rigid methodology
  - The ADM is an iterative cycle of eight phases plus requirements management
  - Tailor the depth and formality of TOGAF to the scale and complexity of the engagement
  - TOGAF complements government frameworks like the Technology Code of Practice
  - Integrate TOGAF concepts with agile delivery using lightweight evolving artefacts

practicalExamples:
  - Use the full ADM cycle for a major government digital transformation programme
  - Apply lightweight TOGAF concepts within agile delivery using ADRs and capability maps
