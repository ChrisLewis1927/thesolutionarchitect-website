---
title: "Technology Architecture"
category: "togaf"
sequenceOrder: 5
estimatedMinutes: 15
---

# Technology Architecture

## Introduction

Phase D of the TOGAF ADM — Technology Architecture — defines the technology infrastructure needed to support the applications and data architectures defined in Phase C. It maps logical application components to physical technology platforms, networks, and infrastructure services.

In the era of cloud computing, Technology Architecture has evolved significantly from its traditional focus on data centres, servers, and network hardware. For UK government architects, Phase D now primarily involves selecting cloud services, defining deployment topologies, and designing the infrastructure patterns that will host and connect applications.

This module covers how to develop a Technology Architecture that is fit for purpose, cost-effective, and aligned with government technology standards.

## Technology Architecture Principles

### Cloud First

The UK Government Cloud First policy states that public cloud should be the default choice for new services. Technology Architecture should start with cloud services and only consider on-premises or hybrid approaches when there is a specific, justified reason.

Justifiable reasons for non-cloud deployment include:
- Data classification requirements that cannot be met by available cloud services (rare for OFFICIAL data)
- Latency requirements that demand proximity to specific on-premises systems
- Regulatory requirements specific to certain data types
- Cost considerations for very stable, predictable workloads at scale (though this is increasingly rare)

### Use Managed Services

Prefer managed services over self-managed infrastructure. Running your own Kubernetes cluster, database server, or message broker requires operational expertise and ongoing maintenance. Managed services (Azure App Service, AWS RDS, Azure Service Bus) transfer this operational burden to the cloud provider.

The Technology Code of Practice reinforces this: choose tools and technology that are appropriate, and do not build what you can buy or reuse.

### Design for Operations

Technology Architecture must consider how the system will be operated, not just how it will be built:

- How will the system be monitored?
- How will deployments be performed?
- How will incidents be detected and resolved?
- How will the system be patched and updated?
- How will capacity be managed?

If the architecture requires a large operations team to keep it running, it may not be the right architecture for a government team with limited operational resources.

## Infrastructure Patterns

### Compute Patterns

Select compute patterns based on workload characteristics:

**Container orchestration (Kubernetes/ECS/AKS)** — for teams with container expertise running multiple services that benefit from consistent deployment and scaling patterns. Appropriate for larger teams with dedicated platform engineering capability.

**Platform-as-a-Service (App Service/Elastic Beanstalk)** — for teams that want to focus on application code without managing infrastructure. Appropriate for most government web applications and APIs.

**Serverless (Lambda/Azure Functions)** — for event-driven workloads with variable demand. Appropriate for APIs, data processing, and integration workflows.

**Virtual machines** — for workloads that require specific OS configurations or cannot be containerised. Increasingly rare for new development but common for legacy application hosting.

### Network Patterns

**Hub-spoke topology** — centralised network management with shared services (firewall, VPN gateway) in the hub and workload networks in spokes. The standard pattern for government cloud deployments.

**Service mesh** — for microservices architectures requiring sophisticated traffic management, mutual TLS, and observability. Adds complexity; only appropriate for large-scale microservices deployments.

**API gateway** — centralised entry point for APIs providing authentication, rate limiting, and routing. Essential for services exposing APIs to external consumers.

### Storage and Data Patterns

**Object storage** — for documents, images, backups, and unstructured data. S3 or Azure Blob Storage with appropriate lifecycle policies.

**Relational databases** — for structured data with complex query requirements. RDS/Aurora or Azure SQL with appropriate redundancy.

**NoSQL databases** — for high-throughput, flexible-schema workloads. DynamoDB or Cosmos DB.

**Caching** — for reducing database load and improving response times. ElastiCache or Azure Cache for Redis.

## Security Infrastructure

### Network Security

Technology Architecture must define the network security controls:

- **Web Application Firewall (WAF)** — protecting web applications from common attacks
- **Network firewalls** — controlling traffic between network segments
- **DDoS protection** — defending against volumetric attacks
- **Private connectivity** — VPN or dedicated connections for hybrid architectures

### Identity Infrastructure

Define how identity and access management is implemented:

- **Identity provider** — Microsoft Entra ID, AWS IAM Identity Center, or integration with existing government identity services
- **Service-to-service authentication** — managed identities, IAM roles, or certificate-based authentication
- **Citizen authentication** — GOV.UK One Login integration
- **Privileged access management** — just-in-time access for administrative operations

### Secrets Management

All secrets (API keys, database credentials, certificates) should be stored in a dedicated secrets management service (AWS Secrets Manager, Azure Key Vault) and accessed programmatically. Never store secrets in code, configuration files, or environment variables.

## Deployment Architecture

### Environment Strategy

Define the environments needed for your service:

- **Development** — for active development, may be ephemeral
- **Test/QA** — for automated and manual testing
- **Staging/Pre-production** — mirrors production for final validation
- **Production** — the live service

Each environment should be defined in Infrastructure as Code and deployable from the same templates with environment-specific parameters. Non-production environments should be right-sized (smaller instances, fewer replicas) to reduce costs.

### Deployment Topology

Document the deployment topology showing:

- Which components run in which compute services
- How components communicate (synchronous APIs, asynchronous messaging, events)
- Where data is stored and how it is replicated
- How traffic enters the system (load balancers, CDN, API gateways)
- How the system connects to external services and on-premises networks

### Disaster Recovery Topology

Define the DR topology based on the RPO and RTO requirements from the business:

- Which components are replicated to a secondary region
- How failover is triggered (automatic or manual)
- What data replication strategy is used (synchronous or asynchronous)
- How DNS is managed during failover

## Technology Selection

### Evaluation Criteria

When selecting specific technologies, evaluate against:

- **Fitness for purpose** — does it meet the functional and non-functional requirements?
- **Operational maturity** — is it well-supported, well-documented, and widely adopted?
- **Team capability** — does the team have the skills to use it effectively?
- **Vendor lock-in** — how difficult would it be to migrate away?
- **Cost** — total cost of ownership including licensing, operations, and training
- **Government compliance** — does it meet security, accessibility, and data sovereignty requirements?

### Architecture Decision Records

Document technology selection decisions as Architecture Decision Records (ADRs). Each ADR should capture:

- The decision context and problem statement
- The options considered
- The decision made and its rationale
- The consequences (positive and negative)

ADRs provide an auditable trail of architecture decisions that is invaluable during service assessments, architecture reviews, and team onboarding.

## Key Takeaways

- Start with cloud-first and managed services as the default technology choices
- Select compute patterns based on workload characteristics and team capability
- Design the technology architecture for operations, not just initial deployment
- Define security infrastructure including network security, identity, and secrets management
- Document all technology decisions as Architecture Decision Records

## Practical Examples

### Example 1: Technology Architecture for a Digital Service

A government digital service team defines the technology architecture for a new citizen-facing application. The deployment topology uses Azure App Service (PaaS) for the web application, Azure SQL Database for structured data, Azure Blob Storage for document uploads, and Azure Cache for Redis for session management. Azure Front Door provides CDN, WAF, and DDoS protection. The hub-spoke network topology connects to the department's existing Azure landing zone. All infrastructure is defined in Bicep templates, deployed through Azure DevOps pipelines. The architecture is documented in four ADRs covering compute selection, database choice, authentication approach, and hosting region.

### Example 2: Hybrid Technology Architecture

A department with significant on-premises investment designs a hybrid technology architecture. New citizen-facing services are deployed on AWS using ECS Fargate, while legacy back-office systems remain on-premises. AWS Direct Connect provides dedicated connectivity between AWS and the department's data centre. An API gateway in AWS mediates all communication between cloud and on-premises systems, providing a clear integration boundary. The technology roadmap defines a 3-year migration path for moving back-office systems to cloud, prioritised by business value and technical risk.

---
keyTakeaways:
  - Start with cloud-first and managed services as the default technology choices
  - Select compute patterns based on workload characteristics and team capability
  - Design technology architecture for operations not just initial deployment
  - Define security infrastructure including network security identity and secrets management
  - Document all technology decisions as Architecture Decision Records

practicalExamples:
  - Define a PaaS-based technology architecture with hub-spoke networking and IaC deployment
  - Design a hybrid architecture with API gateway mediating cloud and on-premises integration
