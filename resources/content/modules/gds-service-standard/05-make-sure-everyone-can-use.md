---
title: "Make sure everyone can use the service"
category: "gds-service-standard"
sequenceOrder: 5
estimatedMinutes: 15
---

# Make Sure Everyone Can Use the Service

## Introduction

Point 5 of the GDS Service Standard requires teams to "make sure everyone can use the service." This encompasses accessibility, assisted digital support, and designing for the full range of users — including those with disabilities, those with low digital confidence, those using older devices, and those in challenging connectivity environments.

For architects, this point goes beyond frontend accessibility. It requires designing systems that perform well on low-powered devices, work on slow connections, support assistive technologies, and provide alternative channels for users who cannot use the digital service. These are architectural requirements, not just design requirements.

This module covers the architectural considerations for building truly inclusive government services.

## Accessibility as an Architectural Concern

### The Legal Framework

The Public Sector Bodies Accessibility Regulations 2018 require UK government services to meet WCAG 2.2 AA standards. The Equality Act 2010 requires reasonable adjustments for disabled users. Non-compliance is not just a quality issue — it is a legal risk.

Accessibility must be considered from the start of architecture design, not retrofitted after development. Retrofitting accessibility is expensive, often incomplete, and sometimes architecturally impossible.

### Server-Side Rendering

Server-side rendering (SSR) is the most reliable approach for accessible government services:

- Content is available immediately without waiting for JavaScript to execute
- Screen readers can access content as soon as the page loads
- The service works even if JavaScript fails to load or execute
- Search engines can index the content

The GOV.UK Design System is built on progressive enhancement principles — the core experience works with HTML alone, enhanced with CSS and JavaScript. Your architecture should support this approach.

Client-side rendering frameworks (React SPAs, Angular) can be made accessible, but require significantly more effort and testing. For citizen-facing government services, server-side rendering with progressive enhancement is the recommended approach.

### Progressive Enhancement

Progressive enhancement is an architectural strategy, not just a frontend technique:

1. **Core layer (HTML)** — the service works with HTML alone. Forms submit, pages navigate, content is readable.
2. **Presentation layer (CSS)** — styling enhances the experience but is not required for functionality.
3. **Enhancement layer (JavaScript)** — interactive features improve the experience but the service works without them.

Architecturally, this means:
- Form submissions must work as standard HTTP POST requests, not just AJAX calls
- Navigation must work with standard links, not just client-side routing
- Content must be in the HTML response, not loaded asynchronously as the only option

### Semantic HTML and API Design

Your API design affects accessibility. APIs should return data in structures that support semantic HTML rendering:

- Structured content (headings, lists, tables) rather than flat text
- Meaningful labels and descriptions for form fields
- Error messages associated with specific fields
- Status information that can be conveyed through ARIA live regions

## Performance for Inclusion

### Designing for Constrained Devices

Government services must work for users on older, lower-powered devices. Many citizens access services on budget smartphones or older computers. Architectural decisions that affect device performance:

- **Page weight** — keep total page size under 500KB where possible. Every kilobyte matters on a budget device.
- **JavaScript payload** — minimise JavaScript. Large JavaScript bundles take longer to parse and execute on low-powered devices.
- **Image optimisation** — use responsive images, modern formats (WebP, AVIF), and lazy loading
- **Third-party scripts** — every third-party script (analytics, chat widgets, A/B testing) adds weight and execution time

### Designing for Slow Connections

The GDS recommends testing services on a simulated 2G connection. Architectural approaches for slow connections:

- **Efficient caching** — use appropriate Cache-Control headers so returning users do not re-download unchanged resources
- **Compression** — enable Brotli or gzip compression for all text-based responses
- **Critical CSS** — inline the CSS needed for above-the-fold content to avoid render-blocking requests
- **Prefetching** — anticipate the user's next action and prefetch resources
- **Offline support** — for services where it makes sense, use Service Workers to provide basic offline functionality

### CDN and Edge Delivery

Use a CDN to serve static assets from locations close to users:

- Reduces latency for users across the UK, including rural areas with longer network paths
- Reduces load on origin servers
- Provides automatic compression and optimisation
- Offers DDoS protection as a side benefit

For government services, CloudFront (AWS) or Azure Front Door provide CDN capabilities with UK edge locations.

## Assisted Digital Support

### Architecture for Assisted Digital

Assisted digital support enables users who cannot use the digital service independently. The architecture must support:

**Agent-assisted journeys** — contact centre agents or face-to-face support workers complete the digital journey on behalf of the citizen. This requires:
- An agent-facing interface that mirrors the citizen journey
- The ability for agents to act on behalf of a specific citizen
- Audit logging that records who performed each action
- Appropriate access controls and data protection

**Save and return** — users who need help partway through a journey should be able to save their progress and return later (potentially with assistance). This requires:
- Persistent storage of partially completed applications
- Secure access to saved applications (authentication, expiry)
- The ability to resume from any point in the journey

**Alternative format support** — some users need information in alternative formats (large print, audio, Braille, Easy Read). The architecture should support:
- Content stored in structured formats that can be rendered in multiple ways
- Document generation in accessible formats
- Integration with translation and alternative format services

### Multi-Language Support

Government services may need to support multiple languages, particularly Welsh (required for services used in Wales under the Welsh Language Act 1993). Architectural considerations:

- **Internationalisation (i18n)** — design the application to support multiple languages from the start
- **Content management** — store translatable content separately from application logic
- **URL structure** — support language-specific URLs (e.g., /en/apply, /cy/gwneud-cais)
- **Right-to-left support** — if supporting languages like Arabic or Urdu, ensure the layout can be mirrored

## Testing for Inclusion

### Accessibility Testing in CI/CD

Integrate automated accessibility testing into your deployment pipeline:

- **axe-core** — automated WCAG testing that catches common issues
- **Pa11y** — command-line accessibility testing tool
- **Lighthouse** — Google's auditing tool including accessibility checks

Automated testing catches approximately 30-40% of accessibility issues. Manual testing with assistive technologies is essential for the remainder.

### Performance Testing for Inclusion

Test performance under constrained conditions:

- Throttle network to 2G speeds and verify the service is usable
- Test on low-powered devices (budget Android phones, older laptops)
- Measure Time to Interactive, not just page load time
- Test with JavaScript disabled to verify progressive enhancement

### User Testing with Diverse Users

Architecture decisions should be validated through user testing with:

- Users of screen readers (JAWS, NVDA, VoiceOver)
- Users of voice control software (Dragon NaturallySpeaking)
- Users with motor impairments using switch access or eye tracking
- Users with cognitive disabilities
- Users with low digital literacy
- Users on older devices and slow connections

## Key Takeaways

- Accessibility is an architectural concern that must be addressed from the start, not retrofitted
- Server-side rendering with progressive enhancement is the most reliable approach for inclusive services
- Design for constrained devices and slow connections — keep pages lightweight and efficient
- Support assisted digital journeys with agent-facing interfaces and save-and-return capability
- Integrate automated accessibility and performance testing into CI/CD pipelines

## Practical Examples

### Example 1: Inclusive Architecture for a Citizen Service

A government department builds a new citizen service using server-side rendered pages with the GOV.UK Design System. The architecture serves pages under 200KB total weight, with critical CSS inlined and JavaScript loaded asynchronously as enhancement. All forms work without JavaScript through standard HTTP POST submissions. Azure Front Door serves static assets from UK edge locations. The service is tested on 2G-simulated connections and budget Android devices. An agent-assisted mode allows contact centre staff to complete journeys on behalf of citizens, with full audit logging. The service passes WCAG 2.2 AA assessment and achieves a Lighthouse accessibility score of 100.

### Example 2: Welsh Language Support

A service used across England and Wales implements bilingual support. Content is stored in a CMS with Welsh and English versions managed by the content team. The URL structure supports language switching (/en/ and /cy/ prefixes). The GOV.UK Design System components support both languages. Email notifications through GOV.UK Notify are sent in the user's preferred language. The architecture supports adding additional languages in future without code changes — only content translation is needed. The Welsh Language Commissioner's office confirms the service meets Welsh Language Standards.

---
keyTakeaways:
  - Accessibility is an architectural concern that must be addressed from the start
  - Server-side rendering with progressive enhancement is the most reliable inclusive approach
  - Design for constrained devices and slow connections with lightweight efficient pages
  - Support assisted digital journeys with agent-facing interfaces and save-and-return
  - Integrate automated accessibility and performance testing into CI/CD pipelines

practicalExamples:
  - Build an inclusive citizen service with SSR progressive enhancement and agent-assisted mode
  - Implement bilingual Welsh and English support with language-aware content management
