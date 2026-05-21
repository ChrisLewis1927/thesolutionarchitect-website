---
title: "Enterprise Architecture Fundamentals"
category: "enterprise-architecture"
sequenceOrder: 1
estimatedMinutes: 15
---

# Enterprise Architecture Fundamentals

## Introduction

Enterprise Architecture (EA) is the practice of analysing, designing, planning, and implementing enterprise-wide strategies for developing and executing on business vision. It provides a holistic view of an organisation's processes, information systems, technologies, and their alignment with business strategy.

In UK government, Enterprise Architecture plays a crucial role in managing the complexity of large departments, ensuring technology investments align with policy objectives, and enabling cross-government interoperability. The Government Digital Service, Cabinet Office, and individual departments all maintain architecture practices that guide technology decisions at different scales.

This module introduces the fundamental concepts of Enterprise Architecture, its role in government, and how it relates to other architecture disciplines.

## What is Enterprise Architecture?

### Definition and Scope

Enterprise Architecture operates at the intersection of business strategy and technology implementation. It answers questions like:

- What business capabilities does the organisation need?
- What information systems support those capabilities?
- What technology infrastructure underpins those systems?
- How should the organisation evolve its technology landscape to support its strategic goals?

EA is distinct from solution architecture (which focuses on individual systems) and technical architecture (which focuses on infrastructure). EA takes the broadest view, considering the entire organisation's technology landscape and its alignment with business strategy.

### The Four Architecture Domains

Enterprise Architecture traditionally covers four domains:

**Business Architecture** — the business strategy, governance, organisation, and key business processes. In government, this includes policy delivery models, service delivery channels, and organisational structures.

**Data Architecture** — the structure of an organisation's logical and physical data assets and data management resources. In government, this includes data sharing agreements, master data management, and compliance with data protection legislation.

**Application Architecture** — the individual applications, their interactions, and their relationships to the core business processes. In government, this includes the application portfolio, integration patterns, and the balance between bespoke development and commercial products.

**Technology Architecture** — the hardware, software, and network infrastructure needed to support the deployment of applications. In government, this includes cloud platforms, network connectivity (PSN, HSCN), and shared infrastructure services.

## EA in UK Government

### The Government Architecture Landscape

UK government architecture operates at multiple levels:

**Cross-government** — GDS and the Central Digital and Data Office (CDDO) set cross-government standards, including the Technology Code of Practice, the GDS Service Standard, and the Government API Standards. Cross-government platforms (GOV.UK, Notify, Pay, One Login) provide shared capabilities.

**Departmental** — each department has its own architecture practice, technology strategy, and application portfolio. Departmental architects ensure alignment with cross-government standards while addressing department-specific needs.

**Programme/Service** — individual programmes and services have solution architects who design specific systems within the departmental and cross-government context.

### The Technology Code of Practice

The Technology Code of Practice is the closest thing to a government-wide EA standard. Its 12 points cover:

1. Define user needs
2. Make things accessible
3. Be open and use open source
4. Make use of open standards
5. Use cloud first
6. Make things secure
7. Make privacy integral
8. Share, reuse, and collaborate
9. Integrate and adapt technology
10. Make better use of data
11. Define your purchasing strategy
12. Meet the Service Standard

Enterprise architects should ensure that departmental technology strategies and individual service designs align with these points.

### Spend Controls

The Cabinet Office spend control process requires departments to seek approval for technology spending above certain thresholds. Enterprise Architecture supports spend controls by:

- Providing a clear picture of the existing technology landscape
- Identifying opportunities for reuse and consolidation
- Ensuring new investments align with the departmental technology strategy
- Demonstrating that cross-government platforms have been considered

## EA Frameworks and Approaches

### TOGAF

TOGAF (The Open Group Architecture Framework) is the most widely used EA framework. It provides the Architecture Development Method (ADM) — an iterative process for developing enterprise architecture. TOGAF is covered in detail in the TOGAF module series.

### Zachman Framework

The Zachman Framework is a classification scheme for architecture artefacts, organised by perspective (planner, owner, designer, builder, implementer, user) and interrogative (what, how, where, who, when, why). It is useful as a taxonomy for organising architecture documentation but does not prescribe a process.

### ArchiMate

ArchiMate is a modelling language for enterprise architecture. It provides a visual notation for describing architectures across business, application, and technology layers. ArchiMate is maintained by The Open Group and is commonly used alongside TOGAF.

### Wardley Mapping

Wardley Mapping is a strategy tool that maps the components of a value chain by their visibility to the user and their evolutionary stage (genesis, custom, product, commodity). It is particularly useful for making technology investment decisions — components that have become commodities should be bought or consumed as services, while components that provide competitive advantage may warrant custom development.

In government, Wardley Mapping helps identify where to use shared platforms (commodity) versus where to build bespoke solutions (custom or genesis).

## The Enterprise Architect Role

### Responsibilities

Enterprise architects in government typically:

- Maintain the enterprise architecture — the documented current and target state of the organisation's technology landscape
- Advise on technology strategy — helping senior leaders make informed technology investment decisions
- Ensure alignment — between individual projects and the overall technology strategy
- Facilitate governance — through architecture review boards and spend control processes
- Promote standards — ensuring adoption of cross-government and departmental standards
- Enable reuse — identifying opportunities to share capabilities and reduce duplication

### Skills and Competencies

The DDaT (Digital, Data and Technology) capability framework defines the skills expected of enterprise architects:

- Strategic thinking — ability to see the big picture and plan for the long term
- Communication — ability to explain complex technical concepts to non-technical stakeholders
- Governance — ability to establish and operate architecture governance processes
- Technical breadth — understanding of a wide range of technologies and patterns
- Business acumen — understanding of the business context and policy drivers

### Common Challenges

Enterprise architects in government face several common challenges:

- **Pace of change** — EA processes can be slow, while agile delivery teams move quickly
- **Relevance** — EA must demonstrate value to delivery teams, not just governance boards
- **Legacy** — large legacy estates constrain the target architecture
- **Organisational complexity** — government departments are large, complex organisations with many stakeholders
- **Political context** — technology decisions are influenced by policy priorities, ministerial interests, and spending reviews

## Key Takeaways

- Enterprise Architecture provides a holistic view of an organisation's business, data, application, and technology landscape
- In UK government, EA operates at cross-government, departmental, and programme levels
- The Technology Code of Practice provides the closest thing to a government-wide EA standard
- Multiple frameworks exist (TOGAF, Zachman, ArchiMate, Wardley Mapping) — choose and adapt based on context
- Enterprise architects must balance strategic planning with practical relevance to delivery teams

## Practical Examples

### Example 1: Departmental Technology Strategy

A government department's enterprise architect develops a 5-year technology strategy. Starting with a current-state assessment (200+ applications, 3 data centres, 15 cloud accounts), they map applications to business capabilities and identify: 30 applications supporting duplicated capabilities, 45 applications past end-of-life, and 20 applications with no clear business owner. The target architecture consolidates to 120 applications, migrates all workloads to cloud, and adopts cross-government platforms for identity, payments, and notifications. A prioritised roadmap sequences the changes over 5 years, aligned with the department's spending review settlement.

### Example 2: Architecture Review Board

A department establishes an Architecture Review Board (ARB) to govern technology decisions. The ARB meets fortnightly to review: new service designs (checking alignment with the technology strategy and Technology Code of Practice), significant technology changes (evaluating risk and impact), and exception requests (where teams need to deviate from standards). The enterprise architect prepares a one-page assessment for each item, highlighting alignment, risks, and recommendations. The ARB reduces duplicated technology investments by 40% in its first year by identifying reuse opportunities across teams.

---
keyTakeaways:
  - Enterprise Architecture provides a holistic view of business data application and technology
  - In UK government EA operates at cross-government departmental and programme levels
  - The Technology Code of Practice provides the government-wide EA standard
  - Choose and adapt EA frameworks based on organisational context
  - Balance strategic planning with practical relevance to delivery teams

practicalExamples:
  - Develop a 5-year departmental technology strategy with application rationalisation roadmap
  - Establish an Architecture Review Board to govern technology decisions and identify reuse
