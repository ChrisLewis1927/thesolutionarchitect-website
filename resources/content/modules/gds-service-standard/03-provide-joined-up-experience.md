---
title: "Provide a joined up experience"
category: "gds-service-standard"
sequenceOrder: 3
estimatedMinutes: 15
---

# Provide a Joined Up Experience

## Introduction

Point 3 of the GDS Service Standard requires teams to "work towards providing a joined up experience across all channels." This means that whether a citizen interacts with a service online, by phone, by post, or in person, the experience should be coherent and consistent. Information provided in one channel should be available in another, and users should not need to repeat themselves.

For architects, this point requires designing systems that support multi-channel service delivery with a unified data model and consistent business logic. It challenges the common pattern of building a digital service in isolation from phone and postal channels, which creates fragmented experiences and operational inefficiency.

This module covers the architectural patterns and design considerations for delivering joined-up, multi-channel government services.

## Understanding Multi-Channel Services

### Channel Landscape in Government

UK government services are delivered through multiple channels:

- **GOV.UK** — the primary digital channel for citizen-facing services
- **Phone** — contact centres handling queries, applications, and complaints
- **Post** — paper forms, letters, and documents
- **In-person** — Jobcentres, passport offices, DVLA local offices
- **Third-party intermediaries** — solicitors, accountants, charities acting on behalf of citizens
- **Assisted digital** — support for users who cannot use digital services independently

Each channel has different characteristics (synchronous vs asynchronous, structured vs unstructured, immediate vs delayed), but they all need to operate on the same underlying data and business logic.

### The Problem with Channel Silos

Many government services have evolved separate systems for each channel:

- A web application for online submissions
- A different application for contact centre agents
- A paper processing workflow for postal submissions
- Separate databases and business rules for each

This creates problems: a citizen who starts an application online and then phones for help finds that the contact centre agent cannot see their progress. A caseworker processing a paper form cannot check whether the same citizen has already submitted online. Data is duplicated, inconsistent, and difficult to report on.

## Architectural Patterns for Joined-Up Services

### Omnichannel Architecture

An omnichannel architecture provides a unified backend that serves all channels through appropriate interfaces:

```
[GOV.UK Frontend] ──→ [API Layer] ──→ [Business Logic] ──→ [Data Store]
[Agent Desktop]   ──→ [API Layer] ──→ [Business Logic] ──→ [Data Store]
[Paper Processing]──→ [API Layer] ──→ [Business Logic] ──→ [Data Store]
[Third-Party API] ──→ [API Layer] ──→ [Business Logic] ──→ [Data Store]
```

The key principle is that business logic and data are centralised, while channel-specific interfaces are separate. This ensures:

- Consistent business rules across all channels
- A single view of the citizen's interactions regardless of channel
- Changes to business logic are applied once and affect all channels
- Each channel can be optimised for its specific user experience

### API-First Backend

Design the backend as a set of APIs that any channel can consume:

- **Application API** — create, update, retrieve, and submit applications
- **Case API** — view case status, add notes, upload documents
- **Notification API** — send communications through the citizen's preferred channel
- **Search API** — find citizens, cases, and applications across all channels

These APIs should be channel-agnostic. The same API call creates an application whether it originates from the GOV.UK frontend, the agent desktop, or a paper processing workflow.

### Event-Driven State Management

Use events to keep all channels informed of state changes:

- When a citizen submits an application online, publish an "application submitted" event
- When a caseworker makes a decision, publish a "decision made" event
- When a document is uploaded (from any channel), publish a "document received" event

Channel-specific systems subscribe to relevant events and update their views accordingly. The contact centre agent's screen updates in real time when a citizen submits something online.

### Unified Case Management

A unified case management system provides the single source of truth for all citizen interactions:

- Every interaction (online submission, phone call, letter received) is recorded as a case event
- Case history is visible to all authorised users regardless of channel
- Business rules and workflows operate on the case, not on channel-specific data
- Reporting and analytics draw from a single data source

## Channel-Specific Considerations

### Digital Channel (GOV.UK)

The digital channel should be designed to be the primary channel, following GDS design patterns:

- Progressive disclosure — show only what the user needs at each step
- Save and return — allow users to start online and complete later
- Status tracking — let users check the progress of their application
- Accessible design — meet WCAG 2.2 AA standards

### Contact Centre Channel

The agent desktop should provide:

- Full visibility of the citizen's digital interactions
- Ability to perform the same actions as the digital channel (submit, update, check status)
- Additional capabilities for complex cases (override decisions, escalate, add notes)
- Integration with telephony systems for call routing and recording

### Paper Channel

Paper processing should feed into the same backend:

- Scanning and OCR for digitising paper forms
- Manual data entry workflows for information that cannot be automatically extracted
- Quality assurance processes for data accuracy
- Automatic matching of paper submissions to existing digital cases

### Assisted Digital

Assisted digital support enables users who cannot use the digital channel independently:

- Contact centre agents can walk users through the digital journey
- Face-to-face support in libraries, Jobcentres, or other locations
- The architecture should support "agent-assisted" mode where an agent completes the digital journey on behalf of the citizen

## Data Consistency Across Channels

### Single Source of Truth

Establish a single source of truth for each data entity. When a citizen's address is updated through any channel, all channels should reflect the change. This requires:

- A centralised data store (or a well-designed distributed system with eventual consistency)
- Clear data ownership — which system is authoritative for each data entity
- Conflict resolution — what happens when the same data is updated through two channels simultaneously

### Audit Trail

Maintain a complete audit trail of all interactions across all channels:

- Who did what, when, and through which channel
- What data was viewed, created, or modified
- What decisions were made and on what basis

This audit trail is essential for government services where accountability and transparency are requirements.

## Key Takeaways

- Design a unified backend with channel-specific frontends to ensure consistent business logic and data
- Use APIs as the integration layer between channels and business logic
- Implement event-driven state management so all channels reflect current state in real time
- Establish a single source of truth for citizen data with a complete audit trail
- Support assisted digital as a first-class channel, not an afterthought

## Practical Examples

### Example 1: Omnichannel Benefits Service

A government department redesigns its benefits service with an omnichannel architecture. The API-first backend serves the GOV.UK citizen portal, a React-based agent desktop for the contact centre, and a paper processing workflow. When a citizen starts an application online but phones the contact centre for help, the agent sees the partially completed application and can continue from where the citizen left off. All interactions are recorded in a unified case management system. GOV.UK Notify sends status updates through the citizen's preferred channel (email or SMS). The result is a 40% reduction in repeat contacts ("I'm calling to check on my application") because citizens can track status online.

### Example 2: Joined-Up Appointment Booking

A department implements a joined-up appointment booking system. Citizens can book appointments online through GOV.UK, by phone through the contact centre, or in person at local offices. All channels use the same booking API, which manages availability, sends confirmations through GOV.UK Notify, and records bookings in a central system. When a citizen books online and then phones to change the appointment, the agent sees the existing booking immediately. Cancellations from any channel free up the slot for all channels in real time. No-show rates drop by 25% because consistent reminder notifications are sent regardless of how the appointment was booked.

---
keyTakeaways:
  - Design a unified backend with channel-specific frontends for consistent business logic
  - Use APIs as the integration layer between channels and business logic
  - Implement event-driven state management so all channels reflect current state
  - Establish a single source of truth for citizen data with a complete audit trail
  - Support assisted digital as a first-class channel not an afterthought

practicalExamples:
  - Build an omnichannel benefits service where agents can continue citizen online applications
  - Implement a joined-up appointment booking system serving online phone and in-person channels
