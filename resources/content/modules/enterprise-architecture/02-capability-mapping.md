---
title: "Capability Mapping"
category: "enterprise-architecture"
sequenceOrder: 2
estimatedMinutes: 15
---

# Capability Mapping

## Introduction

Capability mapping is one of the most powerful tools in the enterprise architect's toolkit. A business capability map describes what an organisation does — its abilities and capacities — independent of how it does them. Unlike organisation charts (which show who), process maps (which show how), or application portfolios (which show what technology), capability maps provide a stable, technology-independent view of the organisation.

For UK government architects, capability mapping is particularly valuable because government organisations frequently reorganise, change processes, and replace technology — but their fundamental capabilities remain relatively stable. A department's capability to "assess benefit eligibility" persists regardless of whether it is done manually, through a legacy system, or through a modern digital service.

This module covers how to create, use, and maintain capability maps in a government context.

## What is a Business Capability?

### Definition

A business capability is a particular ability or capacity that a business may possess or exchange to achieve a specific purpose or outcome. Capabilities are:

- **Stable** — they change slowly compared to processes, technology, or organisation structures
- **Unique** — each capability should appear once in the map (no duplication)
- **Outcome-focused** — they describe what the organisation achieves, not how
- **Hierarchical** — capabilities decompose into sub-capabilities at increasing levels of detail

### Capabilities vs Processes vs Functions

It is important to distinguish capabilities from related concepts:

- **Capability** — what the organisation can do (e.g., "Process Benefit Claims")
- **Process** — how the organisation does it (e.g., "Receive claim form → Verify identity → Check eligibility → Calculate entitlement → Issue decision")
- **Function** — who does it (e.g., "Benefits Processing Team")
- **Service** — what is delivered to users (e.g., "Universal Credit Application Service")

A single capability may be delivered through multiple processes, by multiple functions, using multiple services. The capability map provides the stable reference point that connects these different views.

## Creating a Capability Map

### Level 1: Strategic Capabilities

Start with the highest level — the major capability areas that define what the organisation does. For a typical government department, Level 1 capabilities might include:

- **Policy Development** — creating and maintaining policy
- **Service Delivery** — delivering services to citizens and businesses
- **Regulation and Compliance** — monitoring and enforcing compliance
- **Corporate Services** — HR, finance, IT, estates
- **Intelligence and Analysis** — data analysis and evidence-based decision making
- **Stakeholder Engagement** — communicating with Parliament, public, and partners

These Level 1 capabilities should be recognisable to senior leaders and should cover the full scope of the organisation's activities.

### Level 2: Operational Capabilities

Decompose each Level 1 capability into more specific capabilities. For example, "Service Delivery" might decompose into:

- **Application Processing** — receiving and processing applications from citizens
- **Eligibility Assessment** — determining whether applicants meet criteria
- **Decision Making** — making and communicating decisions
- **Payment Processing** — calculating and issuing payments
- **Case Management** — managing ongoing cases and interactions
- **Appeals Handling** — processing appeals against decisions
- **Customer Communication** — communicating with citizens about their cases

### Level 3: Detailed Capabilities

Further decompose Level 2 capabilities where needed. "Eligibility Assessment" might include:

- **Identity Verification** — confirming the applicant's identity
- **Data Gathering** — collecting information needed for assessment
- **Rules Application** — applying eligibility rules to the applicant's circumstances
- **Evidence Evaluation** — assessing supporting evidence
- **Risk Assessment** — evaluating fraud risk

Level 3 is typically the most useful level for technology planning, as it maps well to system components and services.

## Using Capability Maps

### Heat Mapping

Overlay additional information on the capability map to identify priorities:

**Strategic importance** — which capabilities are most critical to the organisation's mission? Rate each capability as high, medium, or low strategic importance.

**Current performance** — how well does the organisation currently perform each capability? Rate based on efficiency, effectiveness, user satisfaction, and cost.

**Technology maturity** — what is the state of the technology supporting each capability? Rate based on age, supportability, scalability, and security.

A capability that is strategically important, poorly performing, and supported by aging technology is a clear priority for investment.

### Application Portfolio Mapping

Map applications to the capabilities they support:

- Identify which applications support which capabilities
- Reveal duplication — multiple applications supporting the same capability
- Identify gaps — capabilities with no technology support
- Assess coverage — capabilities supported by a single, fragile application

This mapping is invaluable for application rationalisation. If three applications support the same capability, there is an opportunity to consolidate.

### Investment Planning

Use capability maps to guide technology investment:

- **Invest** — capabilities that are strategically important and need improvement
- **Maintain** — capabilities that are performing well and need to continue
- **Rationalise** — capabilities with duplicated or over-provisioned technology
- **Retire** — capabilities that are no longer needed

This approach ensures technology spending is aligned with business priorities rather than driven by technology age or vendor pressure.

### Cross-Government Capability Sharing

Capability maps reveal opportunities for cross-government sharing:

- Many departments have similar capabilities (identity verification, payment processing, notification)
- Cross-government platforms (GOV.UK One Login, Pay, Notify) provide shared implementations of common capabilities
- Identifying shared capabilities helps justify investment in platforms that benefit multiple departments

## Maintaining the Capability Map

### Governance

Assign ownership for the capability map:

- The enterprise architect typically maintains the map
- Business stakeholders validate that the map accurately represents the organisation
- The map is reviewed and updated at least annually, or when significant organisational changes occur

### Evolution

Capability maps evolve slowly, but they do evolve:

- New policy areas create new capabilities
- Machinery of government changes move capabilities between departments
- Technology enables new capabilities (e.g., AI-powered decision support)
- Capabilities may be retired when policy areas are closed

Track changes to the capability map over time to maintain a historical record of how the organisation has evolved.

### Tools

Capability maps can be maintained in various tools:

- **ArchiMate modelling tools** (Archi, Sparx EA) — for formal architecture practices
- **Spreadsheets** — for simpler organisations or initial mapping exercises
- **Miro or Mural** — for collaborative mapping workshops
- **Custom databases** — for large organisations with complex mapping requirements

The tool matters less than the practice. A well-maintained spreadsheet is more valuable than an unused modelling tool.

## Common Pitfalls

### Too Much Detail Too Soon

Start with Level 1 and Level 2 before diving into Level 3. A complete Level 2 map that covers the whole organisation is more useful than a detailed Level 3 map of one department.

### Confusing Capabilities with Processes

Capabilities describe what, not how. "Process benefit claims" is a capability. "Receive form, verify identity, check eligibility, calculate entitlement" is a process. Keep the capability map at the what level.

### Organisational Bias

Capability maps should be organisation-independent. Do not structure the map to mirror the organisation chart. The same capability may be performed by multiple teams, and a single team may contribute to multiple capabilities.

### Stale Maps

A capability map that is not maintained becomes misleading. Establish a regular review cycle and update the map when the organisation changes.

## Key Takeaways

- Capability maps provide a stable, technology-independent view of what an organisation does
- Create maps at three levels: strategic (Level 1), operational (Level 2), and detailed (Level 3)
- Use heat mapping to overlay strategic importance, performance, and technology maturity
- Map applications to capabilities to identify duplication, gaps, and rationalisation opportunities
- Maintain the map through regular reviews and governance processes

## Practical Examples

### Example 1: Capability-Led Application Rationalisation

A government department with 180 applications creates a Level 2 capability map with 45 capabilities. Mapping applications to capabilities reveals that the "Customer Communication" capability is supported by 7 different applications (email system, SMS gateway, letter generation, two CRM systems, a portal, and a chatbot). The enterprise architect proposes consolidating to GOV.UK Notify for outbound communications and a single CRM for interaction management. The rationalisation eliminates 5 applications, saves £800,000 annually in licensing and support costs, and improves the citizen experience through consistent communications.

### Example 2: Investment Prioritisation Using Heat Maps

A department uses capability heat mapping to prioritise its technology investment for the next spending review period. The heat map reveals that "Fraud Detection" is rated high strategic importance, low current performance, and supported by a 15-year-old system approaching end of life. "Financial Reporting" is rated medium importance, high performance, and well-supported by modern technology. The department prioritises investment in fraud detection capability, securing £3 million over 3 years for a modern, AI-enhanced fraud detection platform. Financial reporting receives maintenance-level funding only.

---
keyTakeaways:
  - Capability maps provide a stable technology-independent view of what an organisation does
  - Create maps at three levels strategic operational and detailed
  - Use heat mapping to overlay strategic importance performance and technology maturity
  - Map applications to capabilities to identify duplication and rationalisation opportunities
  - Maintain the map through regular reviews and governance processes

practicalExamples:
  - Use capability mapping to identify 7 overlapping applications and consolidate to 2
  - Apply heat mapping to prioritise technology investment for a spending review
