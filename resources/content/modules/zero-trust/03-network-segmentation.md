---
title: "Network Segmentation and Microsegmentation"
category: "zero-trust"
sequenceOrder: 3
estimatedMinutes: 15
---

# Network Segmentation and Microsegmentation

## Introduction

Network segmentation divides a network into smaller, isolated segments to limit the blast radius of a security breach. Microsegmentation takes this further, applying fine-grained access controls at the individual workload level. In a Zero Trust architecture, network segmentation is a critical control that prevents lateral movement — the ability of an attacker who has compromised one system to move to others.

For UK government architects, network segmentation is particularly important because government networks often connect to sensitive systems and data. A breach in one service should not provide a pathway to other services, other departments, or classified networks. NCSC guidance on network security explicitly recommends segmentation as a key defensive measure.

This module covers the principles, patterns, and implementation approaches for network segmentation in cloud and hybrid environments.

## Why Segmentation Matters

### Lateral Movement

In most successful cyber attacks, the initial compromise is just the beginning. Attackers gain a foothold through phishing, a vulnerable web application, or a compromised credential, and then move laterally through the network to reach their actual target — sensitive data, administrative systems, or critical infrastructure.

Traditional flat networks make lateral movement trivial. Once inside the network, an attacker can reach any system. Segmentation creates barriers that an attacker must overcome at each step, increasing the likelihood of detection and limiting the damage from any single compromise.

### Regulatory and Compliance Requirements

Government security standards require network segmentation:

- **NCSC Cloud Security Principles** — Principle 11 (External Interface Protection) and Principle 9 (Secure User Management) both imply segmentation
- **Cyber Essentials** — requires network segmentation as part of boundary firewalls and internet gateways
- **PCI DSS** — if your service handles payment card data, segmentation is required to limit the scope of compliance
- **Data Protection** — segmentation supports the principle of data minimisation by limiting which systems can access personal data

## Segmentation Approaches

### Network-Level Segmentation

Traditional network segmentation uses VLANs, subnets, and firewalls to create boundaries:

**Cloud VPC/VNet segmentation:**
- Separate VPCs or VNets for different environments (production, staging, development)
- Separate subnets for different tiers (web, application, database)
- Network ACLs and security groups controlling traffic between subnets
- Private subnets for resources that do not need direct internet access

**Hub-spoke topology:**
- A central hub VPC/VNet containing shared services (firewall, DNS, VPN gateway)
- Spoke VPCs/VNets for individual workloads, peered to the hub
- All inter-spoke traffic routed through the hub firewall for inspection
- This is the standard pattern for government cloud deployments

### Microsegmentation

Microsegmentation applies access controls at the individual workload level, rather than at the network level:

**Security groups / Network Security Groups:**
- Applied to individual instances or network interfaces
- Define allowed inbound and outbound traffic by source, destination, port, and protocol
- Stateful — return traffic is automatically allowed

**Kubernetes Network Policies:**
- Control traffic between pods within a Kubernetes cluster
- Define which pods can communicate with which other pods
- Default deny — pods cannot communicate unless explicitly allowed

**Service mesh:**
- Infrastructure-level traffic management between microservices
- Mutual TLS for all service-to-service communication
- Fine-grained traffic policies based on service identity
- Observability for all inter-service traffic

### Application-Level Segmentation

Beyond network controls, segment at the application level:

- **API gateways** — centralised entry point with authentication, authorisation, and rate limiting
- **Application-level firewalls** — WAF rules specific to each application
- **Database-level access controls** — separate database users and schemas for different applications
- **Separate data stores** — each service owns its own database, preventing direct cross-service data access

## Implementation Patterns

### Environment Isolation

Separate environments to prevent development and test activities from affecting production:

- **Separate accounts/subscriptions** — use separate AWS accounts or Azure subscriptions for production and non-production
- **No network connectivity** — production and non-production networks should not be connected
- **Separate credentials** — different credentials and secrets for each environment
- **Separate identity** — production administrative access should require separate, more stringent authentication

AWS Organizations and Azure Management Groups provide the structure for account-level isolation with centralised governance.

### Tier-Based Segmentation

Within an environment, segment by tier:

- **Public tier** — load balancers and CDN endpoints that accept traffic from the internet
- **Application tier** — application servers that accept traffic only from the public tier
- **Data tier** — databases and storage that accept traffic only from the application tier
- **Management tier** — bastion hosts and management tools with restricted access

Each tier should only be able to communicate with adjacent tiers. The public tier should never have direct access to the data tier.

### Service-Based Segmentation

For microservices architectures, segment by service:

- Each service has its own security group or network policy
- Communication between services is explicitly allowed based on the service dependency graph
- Services that do not need to communicate cannot communicate
- All inter-service traffic is encrypted (mutual TLS)

This approach requires maintaining an accurate service dependency map. Tools like service meshes (Istio, Linkerd) can automate much of this.

## Monitoring and Enforcement

### Network Flow Logging

Enable network flow logging to monitor traffic patterns:

- **VPC Flow Logs** (AWS) / **NSG Flow Logs** (Azure) — capture metadata about network traffic
- Analyse flow logs to identify unexpected communication patterns
- Alert on traffic that violates segmentation policies
- Use flow logs to validate that segmentation is working as intended

### Continuous Compliance

Segmentation policies can drift over time as new services are added and security groups are modified. Implement continuous compliance checking:

- **AWS Config Rules** / **Azure Policy** — automatically detect security group rules that violate segmentation policies
- **Infrastructure as Code** — define security groups and network policies in code, subject to review and version control
- **Regular audits** — periodically review network segmentation against the intended architecture

### Breach Detection

Segmentation supports breach detection by making anomalous traffic visible:

- Traffic between segments that should not communicate indicates a potential breach
- Unusual traffic volumes between segments may indicate data exfiltration
- New communication patterns that do not match the service dependency graph warrant investigation

Integrate network monitoring with your SIEM (Microsoft Sentinel, AWS Security Hub) for centralised alerting and investigation.

## Key Takeaways

- Network segmentation limits the blast radius of a breach by preventing lateral movement
- Use a hub-spoke topology as the standard pattern for government cloud deployments
- Implement microsegmentation at the workload level using security groups and network policies
- Separate environments using different accounts or subscriptions with no network connectivity between them
- Monitor network flows continuously and alert on traffic that violates segmentation policies

## Practical Examples

### Example 1: Hub-Spoke Segmentation for a Government Department

A government department implements a hub-spoke network architecture on Azure. The hub VNet contains Azure Firewall, Azure Bastion, and a VPN gateway connecting to the department's on-premises network. Each service team has a spoke VNet peered to the hub. Azure Firewall rules control all traffic between spokes — the benefits service spoke cannot communicate with the HR service spoke. Within each spoke, NSGs enforce tier-based segmentation (web, application, data). All traffic flows are logged and analysed in Microsoft Sentinel. When a penetration test compromises the web tier of one service, the testers confirm they cannot reach the data tier or any other service's network.

### Example 2: Kubernetes Microsegmentation

A government digital service runs on AKS with 12 microservices. The team implements Kubernetes Network Policies with a default-deny posture — no pod can communicate with any other pod unless explicitly allowed. Network policies are defined in YAML files alongside the application code, reviewed in pull requests. A service mesh (Linkerd) provides mutual TLS for all inter-service communication and observability dashboards showing traffic patterns. When a new service is deployed, it cannot communicate with anything until the team defines and reviews the appropriate network policies. Monthly reviews compare actual traffic patterns against the defined policies to identify unused rules.

---
keyTakeaways:
  - Network segmentation limits blast radius by preventing lateral movement
  - Use hub-spoke topology as the standard pattern for government cloud deployments
  - Implement microsegmentation at the workload level using security groups and network policies
  - Separate environments using different accounts or subscriptions with no network connectivity
  - Monitor network flows continuously and alert on segmentation policy violations

practicalExamples:
  - Implement hub-spoke architecture with Azure Firewall controlling inter-service traffic
  - Deploy Kubernetes Network Policies with default-deny and service mesh mTLS
