---
title: "Identity and Access Management"
category: "zero-trust"
sequenceOrder: 2
estimatedMinutes: 15
---

# Identity and Access Management

## Introduction

In a Zero Trust architecture, identity is the new perimeter. Every access decision is based on verified identity — of users, devices, and services. Identity and Access Management (IAM) is therefore the most critical component of any Zero Trust implementation.

For UK government architects, IAM must address multiple identity populations: civil servants accessing internal systems, citizens accessing public services, contractors and suppliers accessing specific resources, and automated services communicating with each other. Each population has different authentication requirements, risk profiles, and governance needs.

This module covers the IAM architecture patterns, technologies, and practices that underpin Zero Trust in government contexts.

## Identity Architecture

### Identity Providers

A centralised identity provider (IdP) is the foundation of IAM:

- **Microsoft Entra ID (Azure AD)** — the most common IdP in UK government, often integrated with on-premises Active Directory
- **AWS IAM Identity Center** — for AWS-centric environments, with federation to external IdPs
- **GOV.UK One Login** — for citizen-facing authentication and identity verification
- **Okta, Ping Identity** — commercial IdPs used by some departments

The IdP should be the single source of truth for user identity. All applications should delegate authentication to the IdP rather than implementing their own authentication.

### Federation

Government organisations often need to federate identity across boundaries:

- **Cross-department federation** — allowing users from one department to access another department's services
- **Supplier federation** — allowing contractor and supplier staff to access government systems using their own organisation's identity
- **Citizen federation** — GOV.UK One Login provides federated citizen identity across government services

Federation uses standards like SAML 2.0 and OpenID Connect to establish trust between identity providers. The key architectural decision is which attributes are shared across the federation boundary and how trust is established and maintained.

### Directory Services

Behind the IdP, directory services store user attributes and group memberships:

- **Microsoft Entra ID** — cloud-native directory with hybrid sync to on-premises AD
- **Active Directory** — on-premises directory still widely used in government
- **LDAP directories** — legacy directories that may need integration

Plan your directory architecture to support:
- A single source of truth for each user attribute
- Automated provisioning and deprovisioning (joiners, movers, leavers)
- Group-based access management
- Regular access reviews and certification

## Authentication

### Multi-Factor Authentication

MFA is a non-negotiable requirement in Zero Trust. The NCSC recommends MFA for all users, not just administrators:

**Something you know** — password or PIN
**Something you have** — security key, authenticator app, smart card
**Something you are** — biometric (fingerprint, face recognition)

MFA methods vary in strength:

- **FIDO2 security keys** — the strongest option, resistant to phishing attacks
- **Authenticator apps (TOTP)** — strong, widely supported, but vulnerable to real-time phishing
- **Push notifications** — convenient but vulnerable to MFA fatigue attacks (repeated prompts until the user approves)
- **SMS codes** — the weakest MFA option, vulnerable to SIM swapping and interception. NCSC advises against SMS-based MFA for high-value accounts.

For government services, aim for phishing-resistant MFA (FIDO2 or certificate-based) for administrative access, and authenticator app-based MFA as a minimum for all users.

### Passwordless Authentication

Passwordless authentication eliminates the password entirely, replacing it with stronger factors:

- **FIDO2 security keys** — hardware tokens that provide phishing-resistant authentication
- **Windows Hello for Business** — biometric or PIN-based authentication tied to the device
- **Certificate-based authentication** — smart cards or virtual smart cards

Passwordless authentication is more secure than password + MFA because it eliminates the password as an attack vector entirely. It is also often more convenient for users.

### Conditional Access

Conditional access policies make dynamic authentication decisions based on context:

- **User risk** — if the user's account shows signs of compromise, require additional verification or block access
- **Sign-in risk** — if the sign-in is from an unusual location or device, require MFA
- **Device compliance** — if the device does not meet security policies, limit access to web-only or block entirely
- **Application sensitivity** — require stronger authentication for sensitive applications
- **Location** — allow or restrict access based on geographic location or network

Conditional access is the mechanism that implements "verify explicitly" in practice. It evaluates multiple signals for every access request and applies the appropriate level of verification.

## Authorisation

### Role-Based Access Control (RBAC)

RBAC assigns permissions to roles, and roles to users:

- Define roles based on job functions (caseworker, team leader, administrator)
- Assign the minimum permissions needed for each role
- Use role hierarchies sparingly — they add complexity and can lead to permission creep
- Review role assignments regularly

RBAC works well for relatively static permission structures. For more dynamic requirements, consider Attribute-Based Access Control.

### Attribute-Based Access Control (ABAC)

ABAC makes access decisions based on attributes of the user, resource, action, and environment:

- User attributes: department, clearance level, role, location
- Resource attributes: classification, owner, type
- Action attributes: read, write, delete, approve
- Environment attributes: time of day, device type, network location

ABAC is more flexible than RBAC and can express complex policies like "caseworkers can view cases assigned to their team during business hours from managed devices." However, ABAC policies are more complex to manage and audit.

### Just-In-Time Access

Just-in-time (JIT) access grants elevated permissions only when needed, for a limited time:

- Users request elevated access through a self-service portal
- Requests require approval from a manager or security team
- Access is granted for a specific duration (e.g., 4 hours)
- All actions during the elevated session are logged
- Access is automatically revoked when the time expires

Azure Privileged Identity Management (PIM) and AWS IAM Identity Center provide JIT access capabilities. JIT access is essential for administrative roles — no one should have permanent administrative access.

## Service Identity

### Machine-to-Machine Authentication

In a Zero Trust architecture, services must authenticate to each other just as users authenticate to applications:

- **Managed identities** — cloud-provider-managed service identities (Azure Managed Identity, AWS IAM Roles)
- **Mutual TLS (mTLS)** — both client and server present certificates to verify identity
- **OAuth 2.0 client credentials** — services authenticate using client ID and secret (or certificate)
- **Service mesh** — infrastructure-level mTLS between services (Istio, Linkerd)

Prefer managed identities where available — they eliminate the need to manage credentials for service accounts.

### Workload Identity Federation

For services that need to authenticate across cloud providers or from CI/CD pipelines:

- **Workload identity federation** — allows external identities (GitHub Actions, GitLab CI, other cloud providers) to authenticate to your cloud environment without long-lived credentials
- **OIDC federation** — CI/CD pipelines authenticate using short-lived OIDC tokens rather than stored secrets

This eliminates the need to store cloud credentials in CI/CD systems, reducing the risk of credential theft.

## Key Takeaways

- Identity is the foundation of Zero Trust — centralise authentication through a trusted identity provider
- Implement MFA for all users, with phishing-resistant methods for administrative access
- Use conditional access to make dynamic authentication decisions based on user, device, and context
- Implement just-in-time access for administrative roles — no permanent elevated permissions
- Authenticate services to each other using managed identities and mutual TLS

## Practical Examples

### Example 1: Government IAM Architecture

A government department implements a comprehensive IAM architecture. Microsoft Entra ID serves as the central identity provider, synchronised with on-premises Active Directory through Entra Connect. Conditional access policies enforce MFA for all users, require device compliance for access to sensitive applications, and block access from non-UK locations. Privileged Identity Management requires approval and time-limits all administrative access. GOV.UK One Login provides citizen authentication for public-facing services. All authentication events are logged to Microsoft Sentinel for security monitoring. The department achieves a 95% reduction in credential-based attacks within six months.

### Example 2: Service Identity for a Cloud-Native Application

A cloud-native government application running on AWS implements service identity using IAM roles for ECS tasks. Each microservice has its own IAM role with permissions limited to the specific AWS resources it needs. Service-to-service communication uses mutual TLS through AWS App Mesh. The CI/CD pipeline (GitHub Actions) authenticates to AWS using OIDC federation — no AWS credentials are stored in GitHub. Secrets are stored in AWS Secrets Manager and accessed through IAM role permissions. The architecture eliminates all long-lived credentials from the application and pipeline.

---
keyTakeaways:
  - Identity is the foundation of Zero Trust centralise authentication through a trusted IdP
  - Implement MFA for all users with phishing-resistant methods for administrative access
  - Use conditional access for dynamic authentication decisions based on context
  - Implement just-in-time access for administrative roles with no permanent elevated permissions
  - Authenticate services using managed identities and mutual TLS

practicalExamples:
  - Implement Entra ID with conditional access PIM and Sentinel for government IAM
  - Use IAM roles mTLS and OIDC federation to eliminate long-lived credentials
