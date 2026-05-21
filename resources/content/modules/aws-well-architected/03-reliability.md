---
title: "Reliability Pillar"
category: "aws-well-architected"
sequenceOrder: 3
estimatedMinutes: 15
---

# Reliability Pillar

## Introduction

The Reliability pillar of the AWS Well-Architected Framework focuses on ensuring a workload performs its intended function correctly and consistently when expected. This encompasses the ability to operate and test the workload through its total lifecycle, including the capacity to recover from infrastructure or service disruptions, dynamically acquire computing resources to meet demand, and mitigate disruptions such as misconfigurations or transient network issues.

For UK government services, reliability is not merely a technical concern — it is a public trust obligation. When HMRC's self-assessment portal goes down during the January deadline, or when NHS Digital services become unavailable during a health crisis, the impact is measured in citizen outcomes, not just uptime percentages. Architects working on public sector systems must design for reliability with this context firmly in mind.

This module covers the foundational concepts, design principles, and practical patterns that underpin reliable architectures on AWS.

## Foundations of Reliability

Reliability on AWS begins with understanding your service limits, network topology, and the shared responsibility model. AWS provides a globally distributed infrastructure, but it is the architect's responsibility to use it effectively.

### Service Quotas and Limits

Every AWS service has default quotas. A common failure mode in production systems is hitting an unanticipated service limit — for example, running out of Elastic IP addresses or exceeding the maximum number of Lambda concurrent executions. Proactive management of service quotas is essential.

Use AWS Service Quotas to monitor and request increases before they become bottlenecks. Integrate quota monitoring into your operational dashboards alongside application metrics.

### Network Planning

Your VPC design is the foundation of reliability. Plan your CIDR ranges to allow for growth, use multiple Availability Zones from day one, and ensure your subnetting strategy supports the isolation and redundancy patterns your workload requires.

For government systems that connect to PSN (Public Services Network) or HSCN (Health and Social Care Network), network planning must also account for hybrid connectivity requirements and the additional latency and failure modes that come with VPN or Direct Connect links.

## Workload Architecture for Reliability

### Designing for Failure

The fundamental principle of reliable architecture is to assume everything will fail and design accordingly. This means:

- Using multiple Availability Zones for all stateful and stateless components
- Implementing health checks at every layer (load balancer, application, dependency)
- Designing idempotent operations so that retries are safe
- Using circuit breaker patterns to prevent cascade failures

A well-designed service should be able to lose an entire Availability Zone without user-visible impact. This is not aspirational — it is the baseline expectation for production government services.

### Loose Coupling

Tightly coupled systems propagate failures. When Service A calls Service B synchronously, and Service B calls Service C, a failure in C cascades back through the entire chain. Loose coupling through asynchronous messaging (SQS, SNS, EventBridge) allows components to fail independently.

Consider a citizen notification service: rather than synchronously sending emails during a form submission, place messages on a queue. The submission succeeds immediately, and the notification service processes messages at its own pace, with built-in retry logic.

### Bulkhead Isolation

Borrowed from ship design, the bulkhead pattern isolates components so that a failure in one does not sink the whole vessel. In AWS terms, this might mean separate Auto Scaling Groups for different workload types, dedicated database connections pools per service, or even separate AWS accounts for different risk profiles.

## Change Management

Unreliable systems are often the result of unreliable change processes. The majority of outages in production systems are caused by changes — deployments, configuration updates, or infrastructure modifications.

### Automated Deployments

Use CI/CD pipelines with automated testing gates. AWS CodePipeline, CodeBuild, and CodeDeploy provide native tooling, though many government teams use Jenkins, GitLab CI, or GitHub Actions with AWS integrations.

Every deployment should be:
- Automated (no manual steps in production)
- Tested (unit, integration, and smoke tests before traffic shifts)
- Reversible (canary or blue/green deployments with automatic rollback)

### Infrastructure as Code

All infrastructure should be defined in CloudFormation, CDK, or Terraform. This ensures environments are reproducible and changes are auditable — a key requirement for government systems subject to GDS spend controls and Cabinet Office oversight.

### Monitoring and Alerting

You cannot manage what you cannot measure. Implement comprehensive monitoring using CloudWatch metrics, alarms, and dashboards. Define Service Level Objectives (SLOs) for your workload and alert when error budgets are being consumed.

For government services, consider what metrics matter most to your users. Page load time for a citizen-facing service is more meaningful than CPU utilisation of your EC2 instances.

## Failure Management

### Fault Isolation with Availability Zones and Regions

AWS Availability Zones are physically separate data centres within a region, connected by low-latency networking. Distributing your workload across multiple AZs is the most fundamental reliability pattern on AWS.

For critical national infrastructure or services with strict data sovereignty requirements, consider multi-region architectures. However, multi-region adds significant complexity — only adopt it when the business requirement genuinely demands it.

### Backup and Recovery

Define your Recovery Point Objective (RPO) and Recovery Time Objective (RTO) for each workload component. These should be driven by business requirements, not technical convenience.

- Use automated backups for RDS, DynamoDB, and EBS
- Test your restore procedures regularly — an untested backup is not a backup
- Consider AWS Backup for centralised backup management across services

### Disaster Recovery Strategies

AWS supports four DR strategies, each with different cost and recovery characteristics:

1. **Backup and Restore** — lowest cost, highest RTO (hours)
2. **Pilot Light** — core services running, scale up on failover (minutes to hours)
3. **Warm Standby** — scaled-down copy running continuously (minutes)
4. **Multi-site Active/Active** — full capacity in multiple locations (near-zero RTO)

Choose the strategy that matches your service's criticality and budget. Most government services operate at the Pilot Light or Warm Standby level, with critical national infrastructure requiring Active/Active.

## Testing Reliability

### Game Days

Regular game day exercises test your team's ability to respond to failures. Simulate AZ failures, database failovers, and dependency outages in a controlled environment. Document findings and feed them back into your architecture and runbooks.

### Chaos Engineering

AWS Fault Injection Simulator (FIS) allows you to inject faults into your workload in a controlled manner. Start with simple experiments — terminating a single instance — and gradually increase scope as your confidence grows.

Chaos engineering is not about breaking things for fun. It is about building confidence that your system behaves as expected when things go wrong.

## Key Takeaways

- Design for failure at every layer — assume any component can fail at any time
- Use multiple Availability Zones as a baseline, and consider multi-region only when business requirements demand it
- Automate deployments with rollback capability to reduce change-related outages
- Define RPO and RTO based on business needs, not technical defaults
- Test your reliability through game days and chaos engineering, not just unit tests

## Practical Examples

### Example 1: Multi-AZ Government Service

A UK government department runs a citizen-facing benefits application on AWS. The architecture uses an Application Load Balancer distributing traffic across three Availability Zones, with Auto Scaling Groups maintaining minimum capacity in each AZ. RDS Multi-AZ provides automatic database failover. During a planned AZ maintenance event, the service continues operating with no user-visible impact, maintaining the department's SLA of 99.9% availability.

### Example 2: Disaster Recovery for a Critical Tax Service

HMRC requires a tax calculation service to be available during peak filing periods with an RTO of 15 minutes and RPO of 1 minute. The team implements a Warm Standby strategy with a continuously running read replica in a secondary region, automated Route 53 health checks, and a runbook-driven failover process tested quarterly through game day exercises. The total additional cost is approximately 30% of the primary infrastructure, justified by the service's criticality during self-assessment deadlines.

---
keyTakeaways:
  - Design for failure at every layer — assume any component can fail at any time
  - Use multiple Availability Zones as a baseline for all production workloads
  - Automate deployments with rollback capability to reduce change-related outages
  - Define RPO and RTO based on business needs not technical defaults
  - Test reliability through game days and chaos engineering regularly

practicalExamples:
  - Deploy a multi-AZ architecture with ALB health checks and Auto Scaling to survive AZ failures transparently
  - Implement a Warm Standby DR strategy with automated Route 53 failover for critical government services
