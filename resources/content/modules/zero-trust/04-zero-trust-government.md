---
title: "Zero Trust in Government Context"
category: "zero-trust"
sequenceOrder: 4
estimatedMinutes: 15
---

# Zero Trust in Government Context

## Introduction

Implementing Zero Trust in UK government presents unique challenges and opportunities. Government organisations operate under specific security frameworks, handle data with defined classification levels, connect to shared government networks, and must balance security with the need to deliver effective public services. The transition from traditional perimeter-based security to Zero Trust is not a simple technology swap — it requires changes to architecture, processes, culture, and governance.

The NCSC has published guidance specifically addressing Zero Trust for government, recognising that the journey will be gradual and that organisations will operate hybrid models for years. This module covers the practical considerations for implementing Zero Trust in UK government contexts.

## The Government Security Landscape

### Current State

Most UK government departments operate a hybrid security model:

- **Perimeter-based networks** — departmental WANs, PSN connections, and VPN-based remote access
- **Cloud adoption** — increasing use of AWS and Azure, often with VPN connectivity back to the corporate network
- **Legacy systems** — older applications that assume network-level trust and cannot easily adopt modern authentication
- **Shared networks** — PSN (Public Services Network) and HSCN (Health and Social Care Network) connecting departments and health organisations

This hybrid state means Zero Trust implementation must coexist with traditional security models during a transition period that may last several years.

### NCSC Zero Trust Guidance

The NCSC's Zero Trust architecture guidance identifies eight principles:

1. Know your architecture including users, devices, services, and data
2. Know your user, service, and device identities
3. Assess user behaviour, device, and service health
4. Use policies to authorise requests
5. Authenticate and authorise everywhere
6. Focus your monitoring on users, devices, and services
7. Do not trust any network, including your own
8. Choose services designed for Zero Trust

These principles provide the framework for government Zero Trust implementations. They are deliberately technology-agnostic, recognising that different departments will use different tools and platforms.

## Planning the Transition

### Maturity Assessment

Before implementing Zero Trust, assess your current maturity across the key domains:

**Identity maturity:**
- Do you have a centralised identity provider?
- Is MFA enforced for all users?
- Do you have conditional access policies?
- Is privileged access managed through JIT mechanisms?

**Device maturity:**
- Are all devices managed and compliant?
- Can you assess device health before granting access?
- Do you have policies for unmanaged devices?

**Network maturity:**
- Is your network segmented?
- Are you using microsegmentation?
- Is all traffic encrypted?

**Application maturity:**
- Do applications authenticate users independently?
- Are APIs secured with modern authentication?
- Can applications make access decisions based on context?

**Data maturity:**
- Is data classified?
- Are access controls applied based on classification?
- Is data encrypted at rest and in transit?

### Prioritisation

Zero Trust is a journey. Prioritise based on risk and feasibility:

**Quick wins:**
- Enable MFA for all users (if not already done)
- Implement conditional access policies
- Enable Privileged Identity Management for administrative roles
- Segment production and non-production networks

**Medium-term goals:**
- Publish applications through identity-aware proxies (replacing VPN for application access)
- Implement device compliance checking
- Deploy microsegmentation for critical services
- Implement service-to-service authentication

**Long-term goals:**
- Eliminate VPN dependency entirely
- Implement continuous risk assessment for all access decisions
- Achieve full microsegmentation across all workloads
- Implement data-level access controls based on classification

### Building the Business Case

Zero Trust requires investment. Build the business case around:

- **Risk reduction** — quantify the cost of potential breaches and how Zero Trust reduces that risk
- **Operational efficiency** — Zero Trust can reduce VPN infrastructure costs and improve remote working experience
- **Compliance** — Zero Trust aligns with NCSC guidance and government security standards
- **Enablement** — Zero Trust enables secure cloud adoption and modern working practices

## Implementation Approaches

### Identity-First Approach

Start with identity as the foundation:

1. Consolidate identity into a single provider (Microsoft Entra ID is most common in government)
2. Enforce MFA for all users
3. Implement conditional access policies based on user risk, device compliance, and location
4. Deploy Privileged Identity Management for administrative access
5. Federate identity with partner organisations and cross-government services

This approach provides the most immediate security improvement and is a prerequisite for other Zero Trust capabilities.

### Application-Centric Approach

Publish applications through identity-aware proxies rather than requiring VPN access:

- **Azure AD Application Proxy** — publishes on-premises web applications through Entra ID
- **AWS Verified Access** — provides Zero Trust access to applications on AWS
- **Cloudflare Access / Zscaler Private Access** — third-party Zero Trust Network Access (ZTNA) solutions

Each application is individually published with its own access policy. Users access applications directly through the proxy without connecting to the corporate network. This eliminates the VPN as a single point of failure and reduces the attack surface.

### Network-Centric Approach

Implement network segmentation progressively:

1. Separate production and non-production environments into different accounts/subscriptions
2. Implement hub-spoke network topology with centralised firewall
3. Apply tier-based segmentation within each environment
4. Implement microsegmentation for critical services
5. Deploy service mesh for microservices architectures

## Handling Legacy Systems

### The Legacy Challenge

Many government systems were built assuming network-level trust:

- Applications that authenticate based on IP address or network location
- Systems that use unencrypted protocols within the "trusted" network
- Applications with hardcoded credentials or shared service accounts
- Systems that cannot integrate with modern identity providers

### Integration Strategies

**Identity bridging** — place an identity-aware proxy in front of legacy applications. The proxy handles modern authentication and passes identity information to the legacy application through headers or other mechanisms.

**Network isolation** — place legacy systems in isolated network segments with strict access controls. Users access legacy systems through a jump box or virtual desktop that is itself protected by Zero Trust controls.

**Gradual migration** — plan to replace legacy systems over time. Use the strangler fig pattern to gradually route functionality from legacy to modern systems.

**Compensating controls** — where legacy systems cannot be modified, implement additional monitoring and detection to compensate for the lack of modern security controls.

## Governance and Operations

### Policy Framework

Define Zero Trust policies that cover:

- **Access policies** — who can access what, under what conditions
- **Device policies** — minimum security requirements for devices accessing government services
- **Data policies** — how data is classified and what controls apply at each classification level
- **Exception policies** — how exceptions to Zero Trust policies are requested, approved, and reviewed

### Monitoring and Response

Zero Trust generates significantly more telemetry than traditional security models. Invest in:

- **SIEM** — centralised log aggregation and correlation (Microsoft Sentinel, Splunk)
- **SOAR** — automated response to common security events
- **Threat hunting** — proactive searching for indicators of compromise
- **Incident response** — updated procedures that account for Zero Trust controls and telemetry

### Measuring Progress

Track Zero Trust maturity over time:

- Percentage of users with MFA enabled
- Percentage of applications published through identity-aware proxies
- Percentage of network segments with microsegmentation
- Number of VPN-dependent applications remaining
- Mean time to detect and respond to security incidents

## Key Takeaways

- Zero Trust in government is a multi-year journey that must coexist with traditional security models
- Start with identity (MFA, conditional access, PIM) as the foundation for all other Zero Trust capabilities
- Publish applications through identity-aware proxies to reduce VPN dependency
- Handle legacy systems through identity bridging, network isolation, and gradual migration
- Measure and report Zero Trust maturity to maintain momentum and justify continued investment

## Practical Examples

### Example 1: Department-Wide Zero Trust Programme

A government department launches a 3-year Zero Trust programme. Year 1 focuses on identity: consolidating to Entra ID, enforcing MFA for all 5,000 users, implementing conditional access, and deploying PIM for 200 administrators. Year 2 focuses on applications: publishing 40 internal applications through Azure AD Application Proxy, eliminating VPN dependency for 80% of users. Year 3 focuses on network: implementing microsegmentation for critical services and deploying continuous monitoring through Microsoft Sentinel. By the end of year 3, VPN usage drops by 90%, security incidents related to credential theft drop by 75%, and the department passes its annual ITHC with no critical findings related to network security.

### Example 2: Zero Trust for a Legacy Integration

A department needs to provide Zero Trust access to a 20-year-old case management system that authenticates users based on Windows domain credentials and IP address. The team deploys Azure AD Application Proxy in front of the application, handling modern authentication (MFA, conditional access) at the proxy layer. Kerberos Constrained Delegation passes the authenticated identity to the legacy application. Network access to the legacy system is restricted to the Application Proxy servers only. Users access the application through their browser with SSO — they do not notice the legacy system behind the proxy. The department plans to replace the legacy system within 3 years, but Zero Trust controls protect it in the interim.

---
keyTakeaways:
  - Zero Trust in government is a multi-year journey coexisting with traditional security
  - Start with identity as the foundation for all other Zero Trust capabilities
  - Publish applications through identity-aware proxies to reduce VPN dependency
  - Handle legacy systems through identity bridging network isolation and gradual migration
  - Measure Zero Trust maturity to maintain momentum and justify continued investment

practicalExamples:
  - Execute a 3-year department-wide Zero Trust programme across identity applications and network
  - Implement Zero Trust access to a legacy system using Azure AD Application Proxy and KCD
