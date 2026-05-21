---
title: "Business Architecture"
category: "togaf"
sequenceOrder: 3
estimatedMinutes: 15
---

# Business Architecture

## Introduction

Phase B of the TOGAF ADM — Business Architecture — defines the business strategy, governance, organisation, and key business processes that the technology architecture must support. It bridges the gap between business strategy and technology implementation, ensuring that architecture decisions are grounded in business reality.

For UK government architects, Business Architecture is particularly important because government services exist to deliver policy outcomes, not to generate revenue. Understanding the policy intent, the operational processes, and the organisational context is essential for designing technology that genuinely serves its purpose. Too many government IT projects have failed because they automated existing processes without questioning whether those processes were right.

This module covers how to develop a Business Architecture that informs effective technology decisions.

## Business Architecture Concepts

### Business Capabilities

A business capability describes what an organisation does, independent of how it does it. Capabilities are stable over time — an organisation's capability to "process benefit claims" persists even as the technology, processes, and people change.

Capability mapping provides a technology-independent view of the organisation that helps architects:

- Identify areas of duplication (multiple systems doing the same thing)
- Spot capability gaps (things the organisation needs to do but cannot)
- Prioritise investment (which capabilities are most critical and most in need of improvement)
- Plan integration (which capabilities need to share information)

A government department's capability map might include: Policy Development, Citizen Engagement, Case Management, Payment Processing, Compliance Monitoring, and Performance Reporting.

### Value Streams

Value streams describe how an organisation delivers value to its stakeholders through a sequence of activities. Unlike processes (which describe how work is done), value streams focus on the value delivered at each stage.

For a government service, a value stream might be: "Citizen applies for benefit → Eligibility assessed → Decision communicated → Payment made → Case reviewed." Each stage delivers value (acknowledgement, assessment, decision, payment, assurance) and can be mapped to the capabilities and systems that support it.

### Business Processes

Business processes describe the specific steps, decisions, and handoffs involved in delivering a capability. Process modelling helps architects understand:

- Where manual steps could be automated
- Where bottlenecks occur
- Where handoffs between teams or systems create delays
- Where exceptions and edge cases add complexity

Use BPMN (Business Process Model and Notation) for formal process documentation, or simpler flowcharts for less formal contexts. The level of formality should match the audience and purpose.

## Developing the Business Architecture

### Current State Analysis

Before designing the target state, understand the current state:

**Organisation mapping** — who does what, and how are teams structured? In government, organisational structures often reflect historical decisions rather than optimal service delivery. Understanding the current structure helps identify where technology can bridge organisational boundaries.

**Process analysis** — how does work actually flow through the organisation? Talk to the people who do the work, not just the managers who describe it. The documented process and the actual process are often different.

**Pain point identification** — where are the bottlenecks, errors, and frustrations? These are the areas where architecture changes can deliver the most value.

### Target State Design

The target Business Architecture should describe:

- **Target capabilities** — what the organisation needs to be able to do, including new capabilities required by policy changes
- **Target processes** — how work should flow, incorporating automation and simplification
- **Target organisation** — how teams and roles may need to change to support new ways of working
- **Information requirements** — what information is needed, by whom, and when

### Gap Analysis

Compare the current and target states to identify gaps:

- **New capabilities** needed that do not exist today
- **Capabilities to be enhanced** with better technology or processes
- **Capabilities to be retired** that are no longer needed
- **Organisational changes** required to support the target state

The gap analysis directly informs the technology architecture phases (C and D) by identifying what the technology needs to enable.

## Business Architecture Techniques

### Capability-Based Planning

Capability-based planning is a strategic approach that:

1. Maps the organisation's business capabilities
2. Assesses the maturity and importance of each capability
3. Identifies capabilities that need investment
4. Plans technology and organisational changes to improve those capabilities

This approach is particularly effective in government because it focuses on outcomes (what the organisation needs to do) rather than solutions (what technology to buy).

### Business Motivation Model

The Business Motivation Model (BMM) connects business strategy to architecture:

- **Vision** — the desired future state
- **Goals** — measurable targets that contribute to the vision
- **Objectives** — specific, time-bound targets
- **Strategies** — approaches to achieving goals
- **Tactics** — specific actions that implement strategies

For government, the BMM connects ministerial priorities and policy objectives to departmental strategies and ultimately to technology investments.

### Organisation Mapping

Understanding the organisational context is critical for architecture success. Map:

- Reporting lines and decision-making authority
- Team boundaries and responsibilities
- Cross-team dependencies and collaboration patterns
- External relationships (other departments, suppliers, arm's-length bodies)

Architecture that requires cross-team collaboration will fail if the organisational structure does not support it. Sometimes the architecture recommendation is an organisational change, not a technology change.

## Business Architecture in Government

### Policy-Driven Architecture

Government business architecture is fundamentally driven by policy. When legislation changes, business processes must change, and technology must adapt. Design your business architecture to accommodate policy change:

- Separate business rules from application logic so rules can be updated without code changes
- Design processes with configurable decision points
- Build flexibility into data models to accommodate new data requirements

### Cross-Government Considerations

Government departments do not operate in isolation. Consider:

- **Shared platforms** — GOV.UK, GOV.UK Notify, GOV.UK Pay, and other GDS platforms
- **Cross-government data sharing** — how your service interacts with other departments' data
- **Common capabilities** — identity verification (GOV.UK One Login), payment processing, notification services
- **Standards compliance** — Technology Code of Practice, GDS Service Standard, Open Standards

Your business architecture should identify where cross-government platforms and shared capabilities can be leveraged rather than building bespoke solutions.

## Key Takeaways

- Business Architecture ensures technology decisions are grounded in business reality and policy intent
- Capability mapping provides a stable, technology-independent view of what the organisation does
- Value streams focus on the value delivered to stakeholders at each stage of a process
- Gap analysis between current and target states directly informs technology architecture decisions
- In government, business architecture must accommodate policy change and leverage cross-government platforms

## Practical Examples

### Example 1: Capability Mapping for a Regulatory Body

A government regulatory body maps its business capabilities to plan a technology modernisation programme. The capability map reveals that three separate legacy systems support the "Licence Processing" capability, each handling different licence types with duplicated functionality. The business architecture recommends consolidating into a single, configurable licence processing capability supported by one modern platform. This reduces maintenance costs, improves consistency for applicants, and simplifies future policy changes that affect licensing rules.

### Example 2: Value Stream Analysis for a Citizen Service

A department analyses the value stream for a citizen grant application process. The current process takes an average of 28 working days from application to payment. Value stream mapping reveals that 22 of those days are wait time — the application sits in queues between manual processing steps. The target business architecture introduces automated eligibility checking (reducing 15 days of manual assessment to minutes for straightforward cases), event-driven notifications (eliminating 5 days of batch processing delays), and direct bank payments via GOV.UK Pay (eliminating 2 days of payment processing). The target end-to-end time for straightforward cases drops to 3 working days.

---
keyTakeaways:
  - Business Architecture ensures technology decisions are grounded in business reality
  - Capability mapping provides a stable technology-independent view of the organisation
  - Value streams focus on value delivered to stakeholders at each stage
  - Gap analysis between current and target states informs technology decisions
  - Government business architecture must accommodate policy change and leverage shared platforms

practicalExamples:
  - Use capability mapping to identify system duplication and plan consolidation
  - Apply value stream analysis to reduce citizen service processing time from 28 to 3 days
