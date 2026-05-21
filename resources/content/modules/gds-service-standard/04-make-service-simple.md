---
title: "Make the service simple to use"
category: "gds-service-standard"
sequenceOrder: 4
estimatedMinutes: 15
---

# Make the Service Simple to Use

## Introduction

Point 12 of the GDS Service Standard requires teams to "make sure users succeed first time." While this is primarily a design concern, it has significant architectural implications. The simplicity of a service as experienced by users is directly influenced by the complexity of the underlying systems. Overly complex architectures produce overly complex user experiences.

For solution architects, making a service simple to use means designing systems that support straightforward user journeys, respond quickly, handle errors gracefully, and do not expose internal complexity to users. It means making hard things look easy — which often requires sophisticated architecture behind the scenes.

This module explores how architectural decisions affect service simplicity and what patterns support simple, effective user experiences.

## Simplicity Through Architecture

### Hiding Complexity

Good architecture hides complexity from users. When a citizen submits a form, they should not need to know that their data is validated against three different systems, stored in a database, queued for processing, and triggers notifications to two different teams. They should see: "Your application has been submitted. We'll email you within 5 working days."

Architectural patterns that hide complexity include:

- **Facade pattern** — a simple API that orchestrates complex backend interactions
- **Backend for Frontend (BFF)** — a backend layer tailored to the frontend's needs, aggregating data from multiple services
- **Asynchronous processing** — acknowledge the user's action immediately and process complex logic in the background
- **Progressive disclosure** — expose only the information and options relevant to the user's current step

### Performance and Perceived Simplicity

Slow services feel complex even when they are functionally simple. Users interpret delays as something going wrong. Architectural decisions that affect perceived simplicity:

- **Response time** — aim for under 1 second for page loads and under 200ms for API responses
- **Caching** — cache reference data, user session data, and frequently accessed content
- **CDN** — serve static assets from edge locations close to users
- **Optimistic UI** — show the expected result immediately while processing happens in the background

The GDS performance guidelines recommend that services should be usable on a slow connection (equivalent to 2G mobile). Design your architecture to deliver a good experience even under constrained conditions.

### Error Handling

How a service handles errors is a key aspect of simplicity. Users should never see technical error messages, stack traces, or HTTP status codes. Architectural approaches to graceful error handling:

- **Graceful degradation** — if a non-critical dependency fails, continue with reduced functionality rather than showing an error page
- **Retry with backoff** — automatically retry transient failures before surfacing an error to the user
- **Circuit breakers** — prevent cascade failures that would affect the entire service
- **Meaningful error messages** — when errors must be shown, provide clear guidance on what the user should do next

## Supporting Simple User Journeys

### One Thing Per Page

The GDS design pattern of "one thing per page" has architectural implications. Each page in a multi-step journey needs:

- State management — the service must remember what the user has already provided
- Validation — each page validates its own inputs before allowing progression
- Navigation — users can go back and change previous answers
- Save and return — users can leave and come back later

Architecturally, this requires a session management strategy. Options include:

- **Server-side sessions** — stored in Redis or a database, referenced by a session cookie
- **Encrypted cookies** — session data stored in the browser, encrypted and signed
- **Database-backed drafts** — partially completed applications stored in the database

For government services, server-side sessions with Redis are the most common approach, providing security (data is not exposed to the client) and scalability (sessions are shared across application instances).

### Smart Defaults and Pre-Population

Reduce user effort by pre-populating information the service already knows:

- If the user is authenticated through GOV.UK One Login, pre-populate their name and verified details
- If the user has previously used the service, offer to reuse their previous answers
- Use postcode lookup to simplify address entry
- Default to the most common option where appropriate

Architecturally, this requires integration with identity services, previous application data, and reference data services. Design these integrations to fail gracefully — if the postcode lookup service is unavailable, fall back to manual address entry.

### Validation and Guidance

Validate user input as early as possible and provide clear guidance:

- **Client-side validation** — immediate feedback for format errors (email, phone number, date)
- **Server-side validation** — authoritative validation including business rules
- **Inline error messages** — show errors next to the relevant field, not in a separate error summary
- **Contextual help** — provide guidance text that helps users understand what is being asked

The architecture should support validation at multiple levels without duplicating business rules. Define validation rules in a shared location (API schema, validation library) that both client and server can use.

## Accessibility as Simplicity

### Architectural Support for Accessibility

Accessibility is not just a frontend concern. Architecture decisions affect accessibility:

- **Server-side rendering** — ensures content is available to screen readers and works without JavaScript
- **Progressive enhancement** — build the core experience in HTML, enhance with CSS and JavaScript
- **Semantic APIs** — return data in structures that support accessible rendering
- **Performance** — slow services are particularly problematic for users of assistive technologies

The Public Sector Bodies Accessibility Regulations 2018 require government services to meet WCAG 2.2 AA. This is a legal requirement, not a nice-to-have.

### Content Delivery

Serve content in formats that are accessible to all users:

- HTML pages that work with screen readers, keyboard navigation, and voice control
- PDFs that are tagged and accessible (or better, avoid PDFs entirely and use HTML)
- Documents in Open Document Format where document downloads are necessary
- Alternative formats available on request

## Monitoring Simplicity

### User Journey Analytics

Monitor how users actually experience your service:

- **Completion rates** — what percentage of users who start a journey complete it?
- **Drop-off points** — where do users abandon the journey?
- **Error rates** — which pages generate the most validation errors?
- **Time per page** — which pages take users the longest?
- **Support requests** — which parts of the journey generate the most contact centre calls?

These metrics reveal where the service is not simple enough. A page with a 40% error rate is not simple to use, regardless of how clean the design looks.

### Real User Monitoring

Use Real User Monitoring (RUM) to understand actual user experience:

- Page load times across different devices and connection speeds
- JavaScript errors that affect functionality
- Geographic distribution of performance issues
- Impact of third-party scripts on performance

## Key Takeaways

- Architectural complexity should be hidden from users through facades, BFFs, and asynchronous processing
- Performance directly affects perceived simplicity — aim for sub-second page loads
- Design error handling to be graceful, with meaningful messages and automatic recovery where possible
- Support the one-thing-per-page pattern with robust session management and save-and-return capability
- Monitor user journey analytics to identify where the service is not simple enough

## Practical Examples

### Example 1: Simplifying a Complex Eligibility Check

A government service determines eligibility for a grant based on 15 different criteria involving data from three departments. Rather than asking the citizen 30 questions, the architect designs a system that: authenticates the citizen through GOV.UK One Login, retrieves verified identity data, calls APIs to check 10 criteria automatically (tax status, benefits status, address), and asks the citizen only the 5 questions that cannot be answered from existing data. The user experiences a simple, 5-question journey. Behind the scenes, the BFF orchestrates calls to three departmental APIs with circuit breakers and fallback logic. Eligibility determination time drops from 20 minutes of form-filling to 3 minutes.

### Example 2: Graceful Degradation in Practice

A citizen-facing service depends on a postcode lookup API, a document upload service, and a payment service. The architect implements graceful degradation: if the postcode lookup fails, the form falls back to manual address entry. If the document upload service is slow, the user can skip the upload and provide documents later by post. If the payment service is unavailable, the user completes the application and receives a payment link by email when the service recovers. The service maintains 99.9% availability for the core journey even when individual dependencies experience outages.

---
keyTakeaways:
  - Hide architectural complexity from users through facades BFFs and asynchronous processing
  - Performance directly affects perceived simplicity so aim for sub-second page loads
  - Design error handling to be graceful with meaningful messages and automatic recovery
  - Support one-thing-per-page with robust session management and save-and-return
  - Monitor user journey analytics to identify where the service is not simple enough

practicalExamples:
  - Simplify a complex eligibility check by pre-populating data from departmental APIs
  - Implement graceful degradation so the core journey works even when dependencies fail
