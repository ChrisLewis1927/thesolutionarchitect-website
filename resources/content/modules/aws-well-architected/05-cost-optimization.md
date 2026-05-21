---
title: "Cost Optimization Pillar"
category: "aws-well-architected"
sequenceOrder: 5
estimatedMinutes: 15
---

# Cost Optimization Pillar

## Introduction

The Cost Optimization pillar focuses on avoiding unnecessary costs, understanding where money is being spent, selecting the most appropriate and right number of resource types, analysing spend over time, and scaling to meet business needs without overspending.

For UK government architects, cost optimisation carries particular weight. Public sector spending is subject to Cabinet Office spend controls, Treasury Green Book appraisals, and public scrutiny. Every pound spent on over-provisioned infrastructure is a pound not spent on citizen services. The Technology Code of Practice explicitly calls for making better use of public money through technology choices.

This module covers the principles, practices, and AWS-specific mechanisms for building cost-effective architectures.

## Cloud Financial Management

### Building a Cost-Aware Culture

Cost optimisation is not solely the architect's responsibility — it requires a culture where everyone from developers to product owners understands the cost implications of their decisions. This starts with visibility.

Enable AWS Cost Explorer for all team members. Create custom dashboards that show cost per service, per environment, and per team. When developers can see that their development environment costs £2,000 per month because they forgot to stop instances on Friday evening, behaviour changes quickly.

### Tagging Strategy

Implement a comprehensive tagging strategy from day one. At minimum, tag all resources with:

- **Service** — which service or application owns this resource
- **Environment** — production, staging, development, test
- **Team** — which team is responsible
- **Cost Centre** — for financial reporting and cross-charging

Without consistent tagging, cost allocation becomes guesswork. AWS Cost Allocation Tags and Tag Policies in AWS Organizations help enforce tagging compliance.

## Expenditure Awareness

### Understanding Your Bill

AWS bills can be complex. Use Cost Explorer to understand your spending patterns:

- Which services account for the majority of spend?
- How does spend vary by time of day, day of week, or month?
- Are there unexpected cost spikes that indicate misconfiguration?

Set up AWS Budgets with alerts at 50%, 80%, and 100% of expected monthly spend. For government projects with fixed annual budgets, this early warning system is essential.

### Identifying Waste

Common sources of waste in government AWS accounts include:

- **Unattached EBS volumes** — left behind after instance termination
- **Idle load balancers** — created for testing and never removed
- **Over-provisioned RDS instances** — sized for peak load that never materialised
- **Unused Elastic IPs** — incurring charges when not attached to running instances
- **Old snapshots and AMIs** — accumulated over months or years

AWS Trusted Advisor and Cost Explorer's right-sizing recommendations help identify these. Schedule monthly reviews to clean up unused resources.

## Cost-Effective Resources

### Pricing Models

AWS offers several pricing models, each suited to different usage patterns:

**On-Demand** — pay by the hour or second with no commitment. Use for unpredictable workloads, short-term projects, or initial development.

**Reserved Instances / Savings Plans** — commit to 1 or 3 years of usage for up to 72% discount. Compute Savings Plans offer the most flexibility, applying across EC2, Fargate, and Lambda. Use for stable, predictable baseline workloads.

**Spot Instances** — up to 90% discount for interruptible workloads. Excellent for batch processing, CI/CD build agents, and data processing pipelines. Not suitable for user-facing services.

**Graviton Instances** — ARM-based processors offering up to 40% better price-performance than equivalent x86 instances. Most modern application stacks run on Graviton without modification.

### Right-Sizing

The most common cost optimisation opportunity is right-sizing. Use AWS Compute Optimizer to analyse utilisation patterns and receive instance type recommendations. A t3.medium running at 5% CPU average is wasting money — a t3.small or t3.micro with burstable credits may be sufficient.

### Serverless Economics

For variable workloads, serverless architectures (Lambda, API Gateway, DynamoDB on-demand, S3) can dramatically reduce costs because you pay only for actual usage. A government service that handles 100 requests per hour during the day and near-zero overnight pays proportionally, rather than running EC2 instances 24/7.

However, serverless is not always cheaper. High-throughput, consistent workloads may be more cost-effective on reserved EC2 instances. Model both options before deciding.

## Managing Demand and Supply

### Auto Scaling

Auto Scaling is the primary mechanism for matching supply to demand. Configure scaling policies based on the metrics that best represent your workload's demand:

- **Target Tracking** — maintain a target value for a metric (e.g., 60% CPU utilisation)
- **Step Scaling** — add or remove capacity in steps based on alarm thresholds
- **Scheduled Scaling** — adjust capacity based on predictable patterns (e.g., scale down overnight)

For government services with predictable usage patterns (weekday business hours), scheduled scaling combined with target tracking provides cost-effective capacity management.

### Environment Management

Development and test environments do not need to run 24/7. Implement automated schedules to stop non-production environments outside business hours. A typical government project with 3 non-production environments can save 65% on those environments by running them only during working hours (roughly 50 hours per week versus 168).

Use AWS Instance Scheduler or simple Lambda functions triggered by EventBridge rules to automate this.

## Optimising Over Time

### Regular Reviews

Cost optimisation is an ongoing process, not a one-time exercise. Schedule monthly cost reviews with your team:

- Review Cost Explorer for trends and anomalies
- Check Compute Optimizer for new right-sizing recommendations
- Evaluate whether Reserved Instances or Savings Plans should be adjusted
- Review new AWS services or features that might reduce costs

### Architecture Evolution

As your service matures, revisit architectural decisions. A service initially built on EC2 might benefit from containerisation on Fargate, reducing operational overhead and potentially cost. A batch processing pipeline on EC2 might be cheaper and simpler on Lambda with Step Functions.

The Technology Code of Practice encourages iterative improvement — this applies to cost optimisation as much as functionality.

## Key Takeaways

- Implement comprehensive tagging and cost visibility from day one
- Use the right pricing model for each workload — Reserved for stable baseline, Spot for interruptible, On-Demand for variable
- Right-size resources based on actual utilisation data, not estimates
- Automate environment schedules to avoid paying for idle non-production resources
- Conduct monthly cost reviews and treat cost optimisation as an ongoing practice

## Practical Examples

### Example 1: Reducing Spend on a Digital Service

A government digital service team spends £18,000 per month on AWS. A cost review reveals: development environments running 24/7 (£4,200/month), over-provisioned RDS instances at 15% utilisation (£3,600/month), and no Reserved Instances despite stable production workloads. By implementing Instance Scheduler for dev environments (saving £2,700/month), right-sizing RDS (saving £2,000/month), and purchasing 1-year Compute Savings Plans for production (saving £3,500/month), monthly spend drops to £9,800 — a 46% reduction with no impact on service quality.

### Example 2: Serverless Migration for a Low-Traffic API

A department runs an internal API on two m5.large EC2 instances behind an ALB, costing £380/month. The API handles an average of 50 requests per hour. Migrating to API Gateway and Lambda reduces the monthly cost to £12 — a 97% saving. The team also eliminates patching and scaling responsibilities, freeing time for feature development.

---
keyTakeaways:
  - Implement comprehensive tagging and cost visibility from day one
  - Use the right pricing model for each workload type
  - Right-size resources based on actual utilisation data not estimates
  - Automate environment schedules to avoid paying for idle non-production resources
  - Conduct monthly cost reviews as an ongoing practice

practicalExamples:
  - Implement Instance Scheduler and right-sizing to reduce monthly AWS spend by 40% or more
  - Migrate low-traffic APIs to serverless architecture for dramatic cost reduction
