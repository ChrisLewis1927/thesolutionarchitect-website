---
title: "Zero Trust Fundamentals"
category: "zero-trust"
sequenceOrder: 1
estimatedMinutes: 15
---

# Zero Trust Fundamentals

## Introduction

Zero Trust is a security model based on the principle of "never trust, always verify." Unlike traditional perimeter-based security, which assumes that everything inside the network is trusted, Zero Trust assumes that threats can come from anywhere — inside or outside the network — and that every access request must be verified regardless of where it originates.

The concept was formalised by Forrester Research in 2010 and has since been adopted by governments worldwide. The UK's National Cyber Security Centre (NCSC) has published guidance on Zero Trust architecture, and the US government has mandated Zero Trust adoption across federal agencies. For UK government architects, Zero Trust is increasingly the expected approach for new services and a target state for existing ones.

This module introduces the core concepts of Zero Trust, its principles, and how it differs from traditional security models.

## The Problem with Perimeter Security

### The Traditional Model

Traditional network security operates on a castle-and-moat model:

- A strong perimeter (firewall, VPN) protects the internal network
- Once inside the perimeter, users and devices are largely trusted
- Access controls focus on keeping threats out rather than limiting movement within

This model worked reasonably well when all users were in offices, all applications were in data centres, and the network perimeter was clearly defined.

### Why Perimeter Security Fails

The traditional model has been undermined by several trends:

**Cloud adoption** — applications and data are no longer inside the perimeter. They are in AWS, Azure, SaaS platforms, and multiple cloud environments. The perimeter has dissolved.

**Remote working** — users access services from home networks, coffee shops, and mobile devices. The VPN becomes a bottleneck and a single point of failure.

**Sophisticated threats** — attackers who breach the perimeter (through phishing, compromised credentials, or supply chain attacks) can move laterally across the network with minimal resistance.

**Insider threats** — not all threats come from outside. Malicious or compromised insiders are already inside the perimeter.

The result is that perimeter security provides a false sense of security. Being "inside the network" should not be sufficient to access sensitive resources.

## Zero Trust Principles

### Never Trust, Always Verify

Every access request is treated as if it originates from an untrusted network. This applies regardless of:

- Where the request comes from (internal network, VPN, internet)
- Who is making the request (employee, contractor, service account)
- What device is being used (managed laptop, personal phone, server)

Every request must be authenticated, authorised, and encrypted before access is granted.

### Assume Breach

Design your systems as if an attacker is already inside your network. This mindset leads to:

- Minimising the blast radius of any single compromise
- Implementing monitoring and detection at every layer
- Segmenting networks and applications to prevent lateral movement
- Encrypting data even within the internal network

### Verify Explicitly

Make access decisions based on all available data points:

- **Identity** — who is the user, and have they been strongly authenticated?
- **Device** — is the device managed, compliant with security policies, and free of known malware?
- **Location** — where is the request coming from, and is this expected?
- **Application** — what application is being accessed, and is this user authorised?
- **Data classification** — what sensitivity level is the data being accessed?
- **Anomaly detection** — does this access pattern match the user's normal behaviour?

### Least Privilege Access

Grant the minimum access necessary for the task at hand:

- Time-limited access — grant access for a specific duration, not indefinitely
- Just-in-time access — elevate privileges only when needed, with approval
- Scope-limited access — grant access to specific resources, not broad categories
- Role-based access — define roles with minimal permissions for each function

## Zero Trust Architecture Components

### Identity

Identity is the foundation of Zero Trust. Strong identity verification replaces network location as the primary trust signal:

- **Multi-factor authentication (MFA)** — required for all users, not just administrators
- **Single sign-on (SSO)** — centralised authentication through an identity provider
- **Conditional access** — access policies based on user, device, location, and risk level
- **Passwordless authentication** — FIDO2 security keys, biometrics, or certificate-based authentication

### Device Trust

The device used to access resources is a critical trust signal:

- **Device management** — managed devices with enforced security policies (encryption, patching, endpoint protection)
- **Device health attestation** — verify device compliance before granting access
- **Bring Your Own Device (BYOD)** — define policies for unmanaged devices (limited access, virtual desktop, web-only access)

### Network

In Zero Trust, the network is untrusted by default:

- **Microsegmentation** — divide the network into small segments with access controls between them
- **Encrypted communications** — all traffic encrypted, even within the internal network
- **Software-defined perimeter** — resources are invisible to unauthorised users (they cannot even discover that a resource exists)

### Applications and Workloads

Applications must participate in Zero Trust:

- **Application-level authentication** — every application verifies the user's identity and authorisation
- **API security** — all API calls are authenticated and authorised
- **Service-to-service authentication** — services verify each other's identity using mutual TLS or token-based authentication

### Data

Data protection is the ultimate goal of Zero Trust:

- **Data classification** — classify data by sensitivity to apply appropriate controls
- **Encryption** — encrypt data at rest and in transit
- **Data loss prevention** — monitor and prevent unauthorised data exfiltration
- **Access logging** — log all data access for audit and anomaly detection

### Visibility and Analytics

Zero Trust requires comprehensive visibility:

- **Centralised logging** — aggregate logs from all components for analysis
- **Security Information and Event Management (SIEM)** — correlate events across the environment
- **User and Entity Behaviour Analytics (UEBA)** — detect anomalous behaviour patterns
- **Continuous monitoring** — real-time assessment of security posture

## Key Takeaways

- Zero Trust replaces perimeter-based security with continuous verification of every access request
- The core principles are: never trust always verify, assume breach, verify explicitly, and least privilege
- Identity replaces network location as the primary trust signal
- Zero Trust is a journey, not a destination — implement incrementally starting with the highest-risk areas
- NCSC provides specific guidance on implementing Zero Trust in UK government contexts

## Practical Examples

### Example 1: Zero Trust for Remote Government Workers

A government department transitions from VPN-based remote access to a Zero Trust model. Previously, remote workers connected via VPN to access all internal applications. Under Zero Trust, each application is published through an identity-aware proxy (Azure AD Application Proxy or AWS Verified Access). Users authenticate with MFA through the department's identity provider. Conditional access policies verify device compliance before granting access. Each application authorises users independently based on their role. The VPN is retained only for legacy applications that cannot be published through the proxy. The result is improved security (no broad network access), better user experience (no VPN connection required), and reduced infrastructure costs (smaller VPN capacity needed).

### Example 2: Zero Trust Between Microservices

A government digital service implements Zero Trust between its microservices. Each service has its own identity (managed identity or service account). Service-to-service communication uses mutual TLS, verifying both the client and server identity. An API gateway enforces authentication and authorisation for all external API calls. Network policies restrict communication to only the service pairs that need to communicate. All service-to-service calls are logged and monitored for anomalous patterns. When a vulnerability is discovered in one service, the team confirms that the attacker could not have accessed other services due to the Zero Trust controls.

---
keyTakeaways:
  - Zero Trust replaces perimeter-based security with continuous verification of every access request
  - Core principles are never trust always verify assume breach verify explicitly and least privilege
  - Identity replaces network location as the primary trust signal
  - Zero Trust is a journey not a destination implement incrementally
  - NCSC provides specific guidance on Zero Trust for UK government

practicalExamples:
  - Transition from VPN-based remote access to identity-aware application proxies
  - Implement mutual TLS and network policies between microservices for service-level Zero Trust
