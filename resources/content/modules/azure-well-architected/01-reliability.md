---
title: "Reliability"
category: "azure-well-architected"
sequenceOrder: 1
estimatedMinutes: 15
---

# Reliability

## Introduction

The Reliability pillar of the Azure Well-Architected Framework focuses on ensuring your application can meet the commitments you make to your customers. This includes building a resilient infrastructure that can recover from failures, designing applications that can handle demand fluctuations, and recovering from data loss or corruption.

For UK government services hosted on Azure — and many departments use Azure, particularly those with existing Microsoft enterprise agreements — reliability is a fundamental requirement. Citizens expect government digital services to be available when they need them, whether that is applying for a passport, checking benefit entitlements, or accessing health records.

This module covers the core reliability concepts within the Azure ecosystem, including availability, resiliency, and disaster recovery.

## Design Principles for Reliability

Azure's reliability guidance is built on several core design principles:

### Design for Business Requirements

Reliability requirements should be driven by business needs, not technical ambition. Define your Service Level Objectives (SLOs) based on the actual impact of downtime. A service used by internal staff during business hours has different reliability requirements than a citizen-facing service available 24/7.

Azure provides composite SLAs for services. Understanding how individual service SLAs combine is essential — two services each with 99.9% availability, used in sequence, provide a composite SLA of 99.8%.

### Design for Failure

Assume that any component can fail. Azure regions contain multiple Availability Zones — physically separate data centres with independent power, cooling, and networking. Distributing your workload across zones is the foundation of reliability on Azure.

Use Azure's built-in redundancy features:
- **Zone-redundant services** — automatically distributed across Availability Zones
- **Locally redundant storage (LRS)** — three copies within a single data centre
- **Zone-redundant storage (ZRS)** — three copies across Availability Zones
- **Geo-redundant storage (GRS)** — copies in a paired region for disaster recovery

### Observe Application Health

You cannot manage reliability without observability. Azure Monitor, Application Insights, and Log Analytics provide comprehensive monitoring capabilities. Implement health endpoints in your applications that check dependencies, not just return 200 OK.

## Availability Zones and Regions

### Azure Regions for UK Government

Azure provides two UK regions:
- **UK South** (London) — the primary region for most UK government workloads
- **UK West** (Cardiff) — commonly used as a paired region for disaster recovery

For services handling OFFICIAL data (the majority of government services), these regions meet data sovereignty requirements. For services requiring additional assurance, Azure also offers Azure Government regions, though these are primarily designed for US government use.

### Designing with Availability Zones

UK South supports Availability Zones. Design your architecture to use them:

- Deploy Azure App Service with zone-redundant scaling
- Use Azure SQL Database with zone-redundant configuration
- Deploy Azure Kubernetes Service (AKS) with node pools across zones
- Use zone-redundant Azure Cache for Redis

Not all Azure services support Availability Zones in all regions. Check the Azure documentation for current zone support in UK South before making architectural commitments.

## Resilient Application Design

### Retry Patterns

Transient failures are common in distributed cloud systems. Implement retry logic with exponential backoff for all external service calls. Azure SDKs include built-in retry policies — configure them appropriately rather than implementing custom retry logic.

Key considerations for retry policies:
- Set maximum retry counts to prevent infinite loops
- Use exponential backoff with jitter to avoid thundering herd problems
- Make operations idempotent so retries are safe
- Log retries for operational visibility

### Circuit Breaker Pattern

When a dependency is consistently failing, continuing to send requests wastes resources and can cascade failures. The circuit breaker pattern stops calling a failing dependency after a threshold of failures, allowing it time to recover.

Azure API Management includes built-in circuit breaker capabilities. For application-level circuit breakers, libraries like Polly (.NET) provide robust implementations.

### Queue-Based Load Levelling

Use Azure Service Bus or Azure Queue Storage to decouple producers from consumers. This pattern absorbs traffic spikes without overwhelming downstream services. A citizen-facing form submission can be acknowledged immediately while processing happens asynchronously from the queue.

## Data Resilience

### Backup Strategies

Azure Backup provides centralised backup management for:
- Azure VMs
- Azure SQL Database
- Azure Files
- Azure Blob Storage
- Azure Managed Disks

Define backup policies based on your RPO requirements. Test restores regularly — schedule quarterly restore drills and document the results.

### Database Resilience

Azure SQL Database offers several resilience features:
- **Active geo-replication** — readable secondaries in up to four regions
- **Auto-failover groups** — automatic failover with a single connection endpoint
- **Point-in-time restore** — recover to any point within the retention period
- **Long-term backup retention** — keep backups for up to 10 years for compliance

For Cosmos DB, configure multi-region writes for the highest availability, or single-region with automatic failover for a balance of cost and resilience.

## Disaster Recovery

### Recovery Strategies on Azure

Azure Site Recovery (ASR) provides disaster recovery for VMs and physical servers. For PaaS services, use the built-in geo-redundancy features:

- **Azure SQL** — auto-failover groups with automatic DNS failover
- **Azure Storage** — GRS or GZRS for automatic replication to paired regions
- **Azure App Service** — deploy to multiple regions behind Azure Front Door or Traffic Manager

### Testing DR

Use Azure Chaos Studio to inject faults and test your resilience:
- Simulate Availability Zone failures
- Introduce network latency or packet loss
- Terminate VM instances
- Simulate dependency outages

Run DR tests at least quarterly. Document the results and feed findings back into your architecture and runbooks.

## Key Takeaways

- Define reliability requirements based on business impact, not technical ambition
- Use Availability Zones in UK South as the baseline for production workloads
- Implement retry patterns with exponential backoff and circuit breakers for all external dependencies
- Test your disaster recovery procedures regularly using Azure Chaos Studio
- Understand composite SLAs when combining multiple Azure services

## Practical Examples

### Example 1: Zone-Redundant Government Portal

A UK government department deploys a citizen portal on Azure App Service with zone-redundant scaling across UK South Availability Zones. Azure SQL Database is configured with zone-redundant high availability. Azure Cache for Redis uses the Premium tier with zone redundancy. During an Availability Zone outage, the service continues operating with no user-visible impact, meeting the department's 99.95% availability SLO.

### Example 2: Cross-Region DR for a Critical Service

A department running a critical case management system implements disaster recovery using Azure SQL auto-failover groups between UK South and UK West. Azure Front Door routes traffic to the healthy region. The team conducts quarterly DR drills using Azure Chaos Studio, simulating a complete UK South failure. Failover completes within 5 minutes, meeting the 15-minute RTO requirement. The automated failover process is documented in runbooks and tested by on-call engineers.

---
keyTakeaways:
  - Define reliability requirements based on business impact not technical ambition
  - Use Availability Zones in UK South as the baseline for production workloads
  - Implement retry patterns with exponential backoff and circuit breakers for all dependencies
  - Test disaster recovery procedures regularly using Azure Chaos Studio
  - Understand composite SLAs when combining multiple Azure services

practicalExamples:
  - Deploy zone-redundant App Service and Azure SQL in UK South for high availability
  - Implement cross-region DR with Azure SQL auto-failover groups and Azure Front Door
