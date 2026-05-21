---
title: "Cost Optimization"
category: "azure-well-architected"
sequenceOrder: 3
estimatedMinutes: 15
---

# Cost Optimization

## Introduction

The Cost Optimization pillar of the Azure Well-Architected Framework focuses on understanding where your money is being spent, reducing unnecessary expenditure, and maximising the value delivered by your cloud investment. It is about spending wisely, not spending less — the goal is to deliver the required business outcomes at the lowest possible cost.

For UK government organisations on Azure, cost management is subject to Cabinet Office spend controls and Treasury scrutiny. Many departments have enterprise agreements with Microsoft that provide discounted rates, but these agreements do not eliminate the need for active cost management. Unused resources, over-provisioned infrastructure, and unoptimised architectures waste public money regardless of the pricing agreement.

This module covers the tools, techniques, and architectural patterns for cost-effective Azure deployments.

## Cost Management Foundations

### Azure Cost Management and Billing

Azure Cost Management is the primary tool for understanding and controlling Azure spend. Key capabilities include:

- **Cost analysis** — break down costs by resource group, service, tag, or custom dimension
- **Budgets** — set spending limits with alerts at configurable thresholds
- **Advisor recommendations** — automated suggestions for cost savings
- **Exports** — scheduled cost data exports for integration with finance systems

Enable Cost Management for all subscriptions and create budgets aligned with your departmental spending plans. Set alerts at 50%, 75%, and 90% of budget to provide early warning.

### Resource Organisation

Organise Azure resources to support cost management:

- **Management Groups** — align with organisational structure for policy and cost aggregation
- **Subscriptions** — separate by environment (production, non-production) or by team
- **Resource Groups** — group resources by application or service for cost tracking
- **Tags** — apply consistent tags for cost allocation (service, environment, team, cost centre)

Azure Policy can enforce tagging requirements, ensuring all resources are tagged for cost allocation.

## Optimising Compute Costs

### Right-Sizing Virtual Machines

Azure Advisor analyses VM utilisation and recommends right-sizing opportunities. Common findings include:

- VMs with consistently low CPU utilisation that could use a smaller SKU
- VMs that could benefit from burstable B-series instances
- VMs that are candidates for shutdown during off-hours

Review Advisor recommendations monthly and act on right-sizing suggestions. A D4s_v5 running at 15% CPU average should likely be a D2s_v5 or a B2ms.

### Reserved Instances and Savings Plans

For stable, predictable workloads, Azure Reservations provide up to 72% discount compared to pay-as-you-go pricing:

- **Reserved Instances** — commit to a specific VM size and region for 1 or 3 years
- **Azure Savings Plans** — commit to a specific hourly spend amount, with flexibility across VM sizes and regions

Savings Plans offer more flexibility than Reserved Instances and are generally recommended for organisations with diverse workloads. Analyse your usage patterns in Cost Management before committing.

### Spot Virtual Machines

Azure Spot VMs offer up to 90% discount for interruptible workloads. Suitable use cases include:

- CI/CD build agents
- Batch processing and data transformation
- Development and testing environments
- Stateless web application tiers (with appropriate handling of eviction)

Spot VMs can be evicted with 30 seconds notice when Azure needs the capacity. Design your workloads to handle eviction gracefully.

### Auto-Scaling

Configure Azure Virtual Machine Scale Sets or App Service auto-scaling to match capacity to demand:

- Scale based on metrics that represent actual demand (request count, queue depth) rather than infrastructure metrics (CPU)
- Set appropriate minimum and maximum instance counts
- Use scheduled scaling for predictable patterns (business hours, end-of-month processing)

### Dev/Test Pricing

Azure offers discounted pricing for development and test workloads through Azure Dev/Test subscriptions. These provide:

- Reduced rates on VMs (no Windows licence charges)
- Discounted rates on several PaaS services
- Separate billing for clear cost tracking

Ensure non-production workloads are deployed in Dev/Test subscriptions to take advantage of these discounts.

## Optimising Data and Storage Costs

### Storage Tiering

Azure Blob Storage offers multiple access tiers:

- **Hot** — frequently accessed data, highest storage cost, lowest access cost
- **Cool** — infrequently accessed data (30+ days), lower storage cost, higher access cost
- **Cold** — rarely accessed data (90+ days), even lower storage cost
- **Archive** — long-term retention, lowest storage cost, highest access cost and retrieval latency

Implement lifecycle management policies to automatically move data between tiers based on age or access patterns. For government services with data retention requirements, Archive tier provides compliant long-term storage at minimal cost.

### Database Cost Optimisation

Azure SQL Database offers several pricing models:

- **DTU-based** — bundled compute, storage, and IO. Simple but less flexible.
- **vCore-based** — separate compute and storage. More control and eligible for Azure Hybrid Benefit.
- **Serverless** — auto-scales and auto-pauses. Ideal for intermittent workloads.

For databases with unpredictable usage patterns, Serverless tier can dramatically reduce costs by pausing the database during periods of inactivity. A reporting database used only during business hours could save 60% compared to a provisioned tier.

### Azure Hybrid Benefit

Organisations with existing Windows Server and SQL Server licences (common in government through enterprise agreements) can use Azure Hybrid Benefit to reduce VM and database costs by up to 85% when combined with Reserved Instances.

Check with your licensing team to understand which licences are eligible and ensure they are applied to your Azure resources.

## Architecture Patterns for Cost Efficiency

### Serverless Architectures

Azure Functions, Logic Apps, and Event Grid provide serverless compute that charges only for actual execution:

- Azure Functions consumption plan — pay per execution and execution time
- Logic Apps consumption plan — pay per action execution
- Event Grid — pay per operation

For low-traffic or variable-traffic workloads, serverless can reduce costs by 80-95% compared to always-on compute.

### PaaS Over IaaS

Platform-as-a-Service offerings (App Service, Azure SQL, Cosmos DB) typically provide better cost efficiency than equivalent IaaS deployments because:

- No OS patching or management overhead (reducing staff costs)
- Built-in scaling and high availability features
- Optimised resource utilisation through multi-tenancy

The total cost of ownership for PaaS is almost always lower than IaaS when you factor in operational costs.

## Key Takeaways

- Use Azure Cost Management with budgets and alerts to maintain spending visibility
- Right-size VMs based on Advisor recommendations and utilisation data
- Apply Reserved Instances or Savings Plans for stable production workloads
- Implement storage lifecycle policies to move data to appropriate cost tiers automatically
- Consider serverless and PaaS architectures for variable workloads to pay only for actual usage

## Practical Examples

### Example 1: Optimising a Department's Azure Spend

A government department spends £45,000 per month on Azure. A cost review identifies: 12 D4s_v5 VMs running at 20% average CPU (£8,400/month), no Reserved Instances despite stable production workloads (potential saving of £9,000/month), and 3TB of Blob Storage in Hot tier with 80% of data unaccessed for 90+ days (£1,200/month in excess storage costs). By right-sizing VMs to D2s_v5, purchasing 1-year Savings Plans, and implementing storage lifecycle policies, monthly spend reduces to £28,000 — a 38% saving.

### Example 2: Serverless Migration for an Internal Tool

A department runs an internal approval workflow application on two D2s_v3 VMs with Azure SQL Database (S3 tier), costing £650/month. The application handles approximately 200 requests per day. Migrating to Azure Functions (consumption plan), Logic Apps for workflow orchestration, and Azure SQL Serverless reduces monthly cost to £45 — a 93% reduction. The team also eliminates VM patching responsibilities.

---
keyTakeaways:
  - Use Azure Cost Management with budgets and alerts to maintain spending visibility
  - Right-size VMs based on Advisor recommendations and utilisation data
  - Apply Reserved Instances or Savings Plans for stable production workloads
  - Implement storage lifecycle policies to move data to appropriate cost tiers
  - Consider serverless and PaaS architectures for variable workloads

practicalExamples:
  - Right-size VMs and purchase Savings Plans to reduce monthly Azure spend by 38%
  - Migrate low-traffic internal tools to serverless architecture for 93% cost reduction
