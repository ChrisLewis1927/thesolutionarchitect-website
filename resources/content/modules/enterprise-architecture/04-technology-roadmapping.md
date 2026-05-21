---
title: "Technology Roadmapping"
category: "enterprise-architecture"
sequenceOrder: 4
estimatedMinutes: 15
---

# Technology Roadmapping

## Introduction

A technology roadmap is a strategic planning document that aligns technology initiatives with business objectives over time. It communicates the planned evolution of the technology landscape — what will change, when, and why — to stakeholders ranging from senior leaders to delivery teams.

For UK government enterprise architects, technology roadmaps serve a critical function: they connect the department's technology strategy to concrete, funded initiatives. Without a roadmap, technology strategy remains aspirational. With one, it becomes a plan that can be resourced, governed, and delivered.

This module covers how to create, maintain, and use technology roadmaps in a government context.

## Purpose of Technology Roadmaps

### Strategic Alignment

A technology roadmap ensures that individual technology initiatives contribute to the organisation's strategic goals. It answers:

- How does this year's technology spending advance the department's strategy?
- Are we investing in the right areas?
- Are there dependencies between initiatives that need to be managed?
- What is the sequence of changes needed to reach the target state?

### Communication

Different stakeholders need different views of the roadmap:

- **Senior leaders** — high-level view showing strategic themes, major milestones, and investment levels
- **Programme managers** — initiative-level view showing dependencies, timelines, and resource requirements
- **Delivery teams** — detailed view showing technical changes, migration paths, and integration points
- **Finance** — cost profile showing capital and revenue expenditure over time

A good roadmap communicates effectively at all these levels.

### Decision Support

The roadmap supports decisions about:

- **Prioritisation** — which initiatives should be funded first?
- **Sequencing** — what order should changes be made in?
- **Trade-offs** — what are the consequences of delaying or cancelling an initiative?
- **Dependencies** — what must be completed before other work can begin?

## Creating a Technology Roadmap

### Inputs

A technology roadmap draws on multiple inputs:

**Business strategy** — the department's strategic objectives, policy priorities, and spending review commitments. The roadmap must demonstrate how technology supports these.

**Current state assessment** — the current technology landscape, including application portfolio, infrastructure, technical debt, and known risks. You cannot plan a journey without knowing your starting point.

**Target architecture** — the desired future state of the technology landscape. This comes from the enterprise architecture practice and should align with the Technology Code of Practice.

**Gap analysis** — the differences between current state and target architecture. These gaps become the initiatives on the roadmap.

**Constraints** — budget, skills, dependencies on other departments, procurement timelines, and political context. The roadmap must be achievable within these constraints.

### Defining Initiatives

Each initiative on the roadmap should be defined with:

- **Name and description** — what the initiative will achieve
- **Business driver** — why it is needed (policy change, end-of-life, cost reduction, capability improvement)
- **Dependencies** — what must be completed first, and what depends on this initiative
- **Estimated cost** — capital and revenue costs over the initiative's lifetime
- **Timeline** — start date, key milestones, and completion date
- **Risks** — key risks and mitigation strategies
- **Benefits** — expected outcomes (cost savings, improved service, reduced risk)

### Sequencing

Sequence initiatives based on:

**Dependencies** — some initiatives must complete before others can begin. Map these dependencies explicitly.

**Business value** — prioritise initiatives that deliver the most business value earliest. Use techniques like weighted scoring or MoSCoW prioritisation.

**Risk** — address high-risk items (end-of-life systems, security vulnerabilities) before they become critical.

**Quick wins** — include some initiatives that deliver visible results quickly to build momentum and stakeholder confidence.

**Resource availability** — sequence initiatives to match available skills and capacity. Do not plan more work than the organisation can deliver.

### Time Horizons

Structure the roadmap across time horizons:

**Near-term (0-12 months)** — detailed, committed initiatives with allocated budget and resources. These should be specific and actionable.

**Medium-term (1-3 years)** — planned initiatives with estimated costs and timelines. These are directional but may change as circumstances evolve.

**Long-term (3-5 years)** — strategic themes and aspirational goals. These set direction but are not commitments.

This structure acknowledges that certainty decreases over time. Near-term plans should be concrete; long-term plans should be flexible.

## Government-Specific Considerations

### Spending Reviews

UK government technology spending is governed by spending review cycles (typically 3-5 years). Technology roadmaps should align with these cycles:

- Roadmap initiatives should map to spending review funding allocations
- Business cases for spending review bids should reference the technology roadmap
- The roadmap should be updated when spending review outcomes are known

### Spend Controls

Technology spending above certain thresholds requires Cabinet Office approval through the spend control process. The technology roadmap supports spend control by:

- Demonstrating that proposed spending aligns with the departmental technology strategy
- Showing that cross-government platforms and shared services have been considered
- Providing context for individual spend control submissions within the broader roadmap

### Cross-Government Dependencies

Government technology roadmaps often depend on cross-government initiatives:

- Migration to GOV.UK One Login for citizen authentication
- Adoption of GOV.UK Notify for communications
- Cloud migration aligned with the Cloud First policy
- Network changes (PSN evolution, HSCN)

Identify these dependencies explicitly and plan for the uncertainty they introduce. Cross-government timelines often slip.

## Maintaining the Roadmap

### Regular Reviews

Review and update the roadmap regularly:

- **Monthly** — update progress on near-term initiatives, adjust timelines as needed
- **Quarterly** — review medium-term plans, incorporate new business requirements, adjust priorities
- **Annually** — major review aligned with business planning cycle, update long-term direction

### Managing Change

The roadmap will change. New policy priorities emerge, budgets are cut, dependencies slip, and new technologies become available. Manage change through:

- A clear change process — who can propose changes, who approves them
- Impact assessment — what are the consequences of the proposed change on other initiatives?
- Communication — ensure stakeholders are informed of significant changes
- Version control — maintain a history of roadmap changes and their rationale

### Measuring Progress

Track roadmap delivery:

- **Initiative completion** — are initiatives completing on time and within budget?
- **Benefit realisation** — are completed initiatives delivering the expected benefits?
- **Technical debt** — is the overall level of technical debt decreasing over time?
- **Target architecture alignment** — is the technology landscape moving towards the target state?

## Visualisation

### Roadmap Formats

Choose a visualisation format that suits your audience:

**Swimlane roadmap** — initiatives organised by theme or domain, plotted on a timeline. Good for showing the overall plan and dependencies.

**Gantt chart** — detailed timeline with dependencies, milestones, and resource allocation. Good for programme management.

**Now/Next/Later** — initiatives categorised by time horizon without specific dates. Good for agile contexts where exact timelines are uncertain.

**Wardley Map overlay** — initiatives plotted on a Wardley Map showing how the technology landscape will evolve. Good for strategic discussions about build vs buy decisions.

### Tools

Common tools for technology roadmaps in government:

- **Miro / Mural** — collaborative visual tools, good for workshops and high-level roadmaps
- **Jira / Azure DevOps** — project management tools with roadmap features, good for detailed planning
- **PowerPoint / Google Slides** — for presentation-quality roadmaps for senior stakeholders
- **Productboard / Aha!** — dedicated roadmapping tools with dependency management

## Key Takeaways

- Technology roadmaps connect strategy to delivery by sequencing initiatives over time
- Structure roadmaps across near-term (detailed), medium-term (planned), and long-term (directional) horizons
- Align roadmaps with government spending review cycles and spend control processes
- Review and update roadmaps regularly — monthly for progress, quarterly for priorities, annually for direction
- Visualise roadmaps appropriately for different audiences using swimlanes, Gantt charts, or Now/Next/Later formats

## Practical Examples

### Example 1: Three-Year Technology Roadmap

A government department creates a 3-year technology roadmap aligned with its spending review settlement. Year 1 focuses on foundations: migrating 20 applications to cloud, implementing a CI/CD platform, and establishing an API gateway. Year 2 focuses on modernisation: replacing 3 end-of-life systems, adopting GOV.UK One Login, and implementing a data platform. Year 3 focuses on optimisation: decommissioning legacy data centres, consolidating duplicated applications, and implementing AI-assisted case management. The roadmap is reviewed quarterly by the Design Authority and updated based on delivery progress and changing priorities.

### Example 2: Roadmap for Spend Control

A department prepares a spend control submission for a £5 million cloud migration programme. The technology roadmap provides context: the migration is Phase 2 of a 5-phase modernisation programme. Phase 1 (completed) established the cloud landing zone. Phase 2 migrates 30 applications. Phases 3-5 (future) will modernise migrated applications, implement new capabilities, and decommission the legacy data centre. The roadmap demonstrates that the spend control request is part of a coherent strategy, not an isolated initiative. The submission is approved with the condition that quarterly progress reports reference the roadmap.

---
keyTakeaways:
  - Technology roadmaps connect strategy to delivery by sequencing initiatives over time
  - Structure roadmaps across near-term medium-term and long-term horizons
  - Align roadmaps with government spending review cycles and spend control processes
  - Review and update roadmaps regularly monthly quarterly and annually
  - Visualise roadmaps appropriately for different audiences

practicalExamples:
  - Create a 3-year technology roadmap aligned with spending review settlement
  - Use the technology roadmap to provide context for a spend control submission
