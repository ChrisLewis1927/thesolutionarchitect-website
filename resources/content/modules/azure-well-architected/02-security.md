---
title: "Security"
category: "azure-well-architected"
sequenceOrder: 2
estimatedMinutes: 15
---

# Security

## Introduction

The Security pillar of the Azure Well-Architected Framework provides guidance for hardening your workloads and protecting data, applications, and infrastructure from threats. In the Azure ecosystem, security is deeply integrated across the platform, from identity management through Microsoft Entra ID to network security with Azure Firewall and threat detection with Microsoft Defender for Cloud.

For UK government architects working with Azure, security requirements are shaped by NCSC guidance, the Secure by Design framework, and data classification policies. Most government services handle OFFICIAL data, which requires appropriate controls but does not demand the most restrictive security posture. Understanding the proportionate application of security controls is as important as knowing what controls exist.

This module covers the security capabilities within Azure and how to apply them effectively for government workloads.

## Identity and Access Management

### Microsoft Entra ID (Azure AD)

Microsoft Entra ID is the foundation of identity management on Azure. For government organisations, it typically integrates with existing Active Directory infrastructure through Entra Connect.

Key practices:
- **Conditional Access policies** — enforce MFA, device compliance, and location-based access controls
- **Privileged Identity Management (PIM)** — just-in-time access for administrative roles, requiring approval and time-limiting elevated permissions
- **Managed Identities** — eliminate the need for credentials in application code by using Azure-managed service principals

### Role-Based Access Control (RBAC)

Azure RBAC provides fine-grained access control for Azure resources. Apply the principle of least privilege:

- Use built-in roles where possible rather than creating custom roles
- Assign roles at the narrowest scope necessary (resource group rather than subscription)
- Use Entra ID groups for role assignments rather than individual users
- Review access regularly using Access Reviews in Entra ID

### Workload Identity

For applications running on Azure, use Managed Identities to authenticate to Azure services without storing credentials. This eliminates an entire class of security vulnerabilities related to credential management.

For applications that need to authenticate to external services, use Azure Key Vault to store secrets, certificates, and keys. Never store credentials in application configuration files or environment variables.

## Network Security

### Defence in Depth

Azure provides multiple layers of network security:

1. **Azure DDoS Protection** — automatic protection against volumetric attacks
2. **Azure Firewall** — centralised network security policy enforcement
3. **Network Security Groups (NSGs)** — stateful packet filtering at the subnet and NIC level
4. **Application Security Groups (ASGs)** — logical grouping of VMs for simplified NSG rules
5. **Azure Web Application Firewall (WAF)** — protection against common web exploits (OWASP Top 10)

### Private Networking

For government workloads, minimise exposure to the public internet:

- Use **Private Endpoints** to access Azure PaaS services over private IP addresses
- Deploy **Azure Private Link** for secure access to services without traversing the internet
- Use **Service Endpoints** as a simpler alternative where Private Endpoints are not available
- Implement **Azure Bastion** for secure RDP/SSH access without exposing management ports

### Hub-Spoke Network Topology

Most government Azure deployments use a hub-spoke network topology:

- **Hub VNet** — contains shared services (firewall, VPN gateway, DNS)
- **Spoke VNets** — contain workload resources, peered to the hub
- **Azure Firewall** in the hub inspects and controls traffic between spokes and to the internet

This topology provides centralised security control while allowing teams to manage their own spoke networks.

## Data Protection

### Encryption

Azure encrypts data at rest by default using platform-managed keys. For additional control:

- **Customer-managed keys (CMK)** — stored in Azure Key Vault, you control the key lifecycle
- **Azure Confidential Computing** — protects data in use through hardware-based trusted execution environments
- **TLS 1.2+** — enforced for all data in transit

For government services handling sensitive data, customer-managed keys provide the additional assurance that you control access to encryption keys.

### Data Classification

Implement data classification using Microsoft Purview:

- Apply sensitivity labels to documents and data
- Configure Data Loss Prevention (DLP) policies to prevent accidental exposure
- Use Azure Information Protection for email and document classification

Align your classification scheme with the Government Security Classifications (OFFICIAL, SECRET, TOP SECRET).

## Threat Detection and Response

### Microsoft Defender for Cloud

Defender for Cloud provides:

- **Security posture management** — continuous assessment of your Azure resources against security benchmarks
- **Threat protection** — real-time threat detection for Azure services, VMs, containers, and databases
- **Regulatory compliance** — built-in compliance assessments against standards including UK NCSC Cloud Security Principles

Enable Defender for Cloud across all subscriptions and review the Secure Score regularly. Aim to address all high-severity recommendations.

### Microsoft Sentinel

For organisations requiring a full SIEM/SOAR solution, Microsoft Sentinel provides:

- Log aggregation from Azure, Microsoft 365, and third-party sources
- AI-powered threat detection using built-in analytics rules
- Automated incident response through playbooks (Logic Apps)
- Integration with NCSC threat intelligence feeds

## Governance and Compliance

### Azure Policy

Use Azure Policy to enforce security standards across your Azure estate:

- Require encryption on storage accounts
- Enforce network security group rules
- Prevent deployment of non-compliant resource types
- Require specific tags on all resources

Azure Policy operates at the management group, subscription, or resource group level, allowing you to apply different policies to different environments.

### Security Benchmarks

Azure provides the Microsoft Cloud Security Benchmark (MCSB), which maps to multiple compliance frameworks. For UK government, the most relevant mappings include:

- NCSC Cloud Security Principles
- Cyber Essentials Plus
- ISO 27001
- NIST 800-53

Use these benchmarks as a starting point for your security controls, adapting them to your specific risk profile and data classification.

## Key Takeaways

- Use Microsoft Entra ID with Conditional Access and PIM as the foundation of identity security
- Implement defence in depth with multiple layers of network security
- Use Managed Identities and Key Vault to eliminate credential management vulnerabilities
- Enable Microsoft Defender for Cloud across all subscriptions and act on Secure Score recommendations
- Apply Azure Policy to enforce security standards consistently across your estate

## Practical Examples

### Example 1: Securing a Government Web Application

A government department deploys a citizen-facing web application on Azure App Service. The architecture implements: Azure Front Door with WAF for DDoS protection and OWASP rule enforcement, Private Endpoints for Azure SQL Database and Azure Storage (no public endpoints), Managed Identity for the App Service to authenticate to backend services, Key Vault for storing third-party API credentials, and Defender for Cloud monitoring with alerts routed to the security operations team. The application passes its ITHC (IT Health Check) with no critical findings.

### Example 2: Implementing Zero Trust Network Access

A department migrates from traditional VPN-based remote access to a Zero Trust model using Azure. Microsoft Entra ID Conditional Access policies enforce MFA and device compliance for all access. Azure AD Application Proxy provides secure access to internal web applications without VPN. Privileged Identity Management requires approval and time-limits administrative access. All network traffic flows through Azure Firewall with threat intelligence-based filtering. The result is improved security posture with better user experience — staff no longer need to connect to VPN for routine tasks.

---
keyTakeaways:
  - Use Microsoft Entra ID with Conditional Access and PIM as the foundation of identity security
  - Implement defence in depth with multiple layers of network security
  - Use Managed Identities and Key Vault to eliminate credential management vulnerabilities
  - Enable Microsoft Defender for Cloud across all subscriptions and act on recommendations
  - Apply Azure Policy to enforce security standards consistently across your estate

practicalExamples:
  - Deploy a web application with WAF Private Endpoints Managed Identity and Defender for Cloud
  - Implement Zero Trust network access using Entra ID Conditional Access and Application Proxy
