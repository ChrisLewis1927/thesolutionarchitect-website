---
title: "Security Design Principles"
category: "secure-by-design"
sequenceOrder: 2
estimatedMinutes: 15
---

# Security Design Principles

## Introduction

The UK government's Secure by Design framework establishes a set of security principles that should guide every architectural decision. These principles are not abstract ideals — they are practical guidelines that, when applied consistently, produce systems that are inherently more resistant to attack and more resilient when attacks occur.

For solution architects, security principles provide a decision-making framework. When faced with a design choice, these principles help you evaluate options through a security lens. They complement (and often overlap with) the NCSC's security design principles and the broader Cyber Essentials framework.

This module covers the core security design principles, how to apply them in practice, and how they interact with other architectural concerns.

## Core Security Principles

### Least Privilege

The principle of least privilege states that every user, process, and system component should have only the minimum permissions necessary to perform its function. Nothing more.

In practice, this means:

- **User access** — role-based access control with roles defined at the narrowest scope. A caseworker who processes applications should not have access to system administration functions.
- **Service accounts** — applications should use service accounts with permissions limited to the specific resources they need. A web application that reads from a database should not have write access unless it needs it.
- **Network access** — network security groups should allow only the specific traffic flows required. Default deny, explicit allow.
- **API access** — API tokens and OAuth scopes should grant access only to the specific endpoints and data the consumer needs.

Least privilege is easy to state and difficult to maintain. Permissions tend to accumulate over time as new features are added and old permissions are not removed. Implement regular access reviews and automated detection of over-privileged accounts.

### Defence in Depth

Defence in depth means implementing multiple layers of security controls so that if one layer fails, others continue to protect the system. No single control should be the only thing standing between an attacker and your data.

Layers of defence in a typical government service:

1. **Perimeter** — WAF, DDoS protection, rate limiting
2. **Network** — network segmentation, security groups, private endpoints
3. **Identity** — authentication, authorisation, MFA
4. **Application** — input validation, output encoding, CSRF protection
5. **Data** — encryption at rest and in transit, data classification, access controls
6. **Monitoring** — logging, alerting, anomaly detection

Each layer should be designed independently — do not assume that the perimeter will catch everything, and do not assume that encryption makes access controls unnecessary.

### Secure Defaults

Systems should be secure in their default configuration. Users and administrators should not need to take action to achieve a baseline level of security.

Architectural implications:

- **Encryption by default** — all data encrypted at rest and in transit without requiring configuration
- **Authentication required** — all endpoints require authentication unless explicitly made public
- **Restrictive permissions** — new resources created with minimal permissions, expanded only when needed
- **Secure protocols** — TLS 1.2+ enforced, older protocols disabled
- **Security headers** — Content-Security-Policy, X-Frame-Options, and other security headers set by default

Infrastructure as Code templates should encode secure defaults. When a developer creates a new storage bucket or database, the template should ensure encryption, access logging, and appropriate access controls are enabled automatically.

### Fail Securely

When a system fails, it should fail in a secure state. A failure should not expose data, bypass authentication, or grant elevated permissions.

Examples of failing securely:

- If the authentication service is unavailable, deny access rather than allowing unauthenticated access
- If input validation fails, reject the input rather than processing it with a warning
- If a database connection fails, return an error rather than falling back to a cached response that might contain stale authorisation data
- If logging fails, halt the operation rather than continuing without an audit trail (for high-security operations)

### Separation of Duties

No single person or system component should have the ability to perform a critical action alone. Separation of duties prevents both accidental and malicious misuse.

Architectural patterns for separation of duties:

- **Deployment approvals** — code changes require review by someone other than the author before deployment to production
- **Administrative access** — privileged operations require approval from a second administrator
- **Data access** — access to sensitive data requires both authentication and authorisation from separate systems
- **Key management** — encryption keys are managed separately from the data they protect

## Applying Principles in Practice

### Threat-Informed Design

Security principles should be applied in proportion to the threat. Not every system needs the same level of security. Use threat modelling (covered in Module 1) to identify the specific threats your system faces, and apply principles accordingly.

A public information website has different security requirements than a system processing classified intelligence. Both should apply security principles, but the depth and rigour of application should match the risk.

### Security in the Development Lifecycle

Security principles should be embedded throughout the development lifecycle:

- **Design** — threat modelling, security architecture review, principle-based design decisions
- **Development** — secure coding standards, static analysis, dependency scanning
- **Testing** — security testing (DAST, penetration testing), ITHC for government services
- **Deployment** — automated security checks in CI/CD, infrastructure compliance scanning
- **Operations** — security monitoring, incident response, vulnerability management
- **Decommissioning** — secure data deletion, credential revocation, access removal

### Balancing Security with Usability

Security controls that are too burdensome will be circumvented. Users who are forced to change passwords every 30 days will write them on sticky notes. Services that require three-factor authentication for low-risk actions will drive users to less secure alternatives.

The NCSC's password guidance explicitly recommends against forced regular password changes because the security benefit is outweighed by the usability cost. Apply the same thinking to all security controls — the most secure system is one that users actually use correctly.

## Government-Specific Considerations

### NCSC Guidance

The National Cyber Security Centre provides guidance that should inform your security architecture:

- **Cloud Security Principles** — 14 principles for evaluating cloud services
- **Zero Trust Architecture** — guidance on implementing zero trust in government
- **Secure Design Principles** — principles for designing secure systems
- **Device Security Guidance** — platform-specific security configuration

NCSC guidance is authoritative for UK government. When NCSC guidance conflicts with vendor recommendations, NCSC guidance takes precedence.

### IT Health Checks (ITHC)

Government services undergo IT Health Checks — independent security assessments — before going live and periodically thereafter. Design your architecture with ITHC in mind:

- Document your security architecture clearly so assessors can understand it
- Implement security controls that can be verified and tested
- Maintain an up-to-date list of all external-facing endpoints
- Ensure you can provide assessors with appropriate access for testing

### Data Classification

Apply security controls proportionate to the data classification:

- **OFFICIAL** — the majority of government data. Requires good security practices but not extraordinary measures.
- **OFFICIAL-SENSITIVE** — a handling caveat within OFFICIAL. Requires additional access controls and handling procedures.
- **SECRET and TOP SECRET** — require specialist security measures beyond the scope of most digital services.

Most government digital services handle OFFICIAL data. Design your security architecture for OFFICIAL, with additional controls for OFFICIAL-SENSITIVE data where applicable.

## Key Takeaways

- Apply least privilege consistently across users, services, networks, and APIs
- Implement defence in depth with multiple independent security layers
- Encode secure defaults in Infrastructure as Code templates so new resources are secure automatically
- Design systems to fail securely — failures should not expose data or bypass controls
- Balance security controls with usability to ensure users follow secure practices

## Practical Examples

### Example 1: Applying Least Privilege to a Microservices Architecture

A government digital service consists of five microservices. The architect implements least privilege at every level: each service has its own database user with access only to its own tables, IAM roles grant each service access only to the specific AWS services it needs, network security groups allow traffic only between services that need to communicate, and API authentication uses OAuth scopes that limit each service to the specific endpoints it consumes. When a vulnerability is discovered in one service, the blast radius is limited to that service's data and permissions — the attacker cannot pivot to other services or access other data.

### Example 2: Defence in Depth for a Citizen-Facing Service

A citizen-facing service implements defence in depth across six layers. The WAF blocks common attack patterns (SQL injection, XSS). Network security groups restrict traffic to known paths. GOV.UK One Login provides citizen authentication with MFA. The application validates all input and encodes all output. Data is encrypted at rest with customer-managed keys and in transit with TLS 1.3. CloudWatch and GuardDuty provide continuous monitoring with alerts to the security operations team. During an ITHC, the assessors confirm that compromising any single layer would not provide access to citizen data.

---
keyTakeaways:
  - Apply least privilege consistently across users services networks and APIs
  - Implement defence in depth with multiple independent security layers
  - Encode secure defaults in Infrastructure as Code templates
  - Design systems to fail securely so failures do not expose data or bypass controls
  - Balance security controls with usability to ensure users follow secure practices

practicalExamples:
  - Implement least privilege across a microservices architecture to limit blast radius
  - Build defence in depth across six layers for a citizen-facing government service
