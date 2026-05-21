---
title: "Performance Efficiency Pillar"
category: "aws-well-architected"
sequenceOrder: 4
estimatedMinutes: 15
---

# Performance Efficiency Pillar

## Introduction

The Performance Efficiency pillar focuses on using computing resources efficiently to meet system requirements, and maintaining that efficiency as demand changes and technologies evolve. It is about selecting the right resource types and sizes, monitoring performance, and making informed decisions as business needs change.

In the context of UK government services, performance efficiency directly impacts citizen experience. A slow-loading GOV.UK service frustrates users and increases call centre volumes. An over-provisioned architecture wastes taxpayer money. The architect's role is to find the balance — delivering responsive services while being responsible stewards of public funds.

This module explores how to select, configure, and optimise AWS resources for performance efficiency.

## Selection

### Compute Selection

AWS offers a broad spectrum of compute options, each suited to different workload characteristics:

- **EC2 Instances** — maximum control, wide range of instance families optimised for compute, memory, storage, or GPU workloads
- **Lambda** — event-driven, pay-per-invocation, ideal for variable or unpredictable workloads
- **ECS/Fargate** — containerised workloads without managing the underlying infrastructure
- **App Runner** — simplified container deployment for web applications and APIs

The selection should be driven by workload characteristics, not familiarity. A team comfortable with EC2 might default to it for everything, but a bursty API that handles 10 requests per minute most of the time and 10,000 during peak hours is a natural fit for Lambda.

### Storage Selection

Match your storage choice to your access patterns:

- **S3** — object storage for documents, backups, and static assets. Use S3 Intelligent-Tiering for data with unpredictable access patterns.
- **EBS** — block storage for EC2 instances. Choose gp3 for general purpose, io2 for high-IOPS requirements.
- **EFS** — shared file system for workloads that need POSIX-compatible access across multiple instances.
- **DynamoDB** — key-value and document database for single-digit millisecond latency at any scale.

### Database Selection

Choosing the right database is one of the most consequential architectural decisions:

- **RDS** (PostgreSQL, MySQL) — relational data with complex queries and transactions
- **Aurora** — MySQL/PostgreSQL compatible with up to 5x throughput improvement
- **DynamoDB** — high-throughput, low-latency key-value access patterns
- **ElastiCache** (Redis, Memcached) — in-memory caching for sub-millisecond response times
- **Neptune** — graph database for highly connected datasets

Avoid the trap of using a relational database for everything. If your access pattern is simple key-value lookups, DynamoDB will outperform RDS and cost less at scale.

## Review

Performance efficiency is not a one-time decision. AWS releases new instance types, services, and features regularly. What was the optimal choice 18 months ago may no longer be.

### Benchmarking

Establish performance baselines for your workload. Measure latency at the 50th, 95th, and 99th percentiles — averages hide problems. A service with 200ms average latency might have a p99 of 3 seconds, meaning 1 in 100 users experiences unacceptable performance.

Use tools like AWS X-Ray for distributed tracing, CloudWatch for metrics, and load testing tools such as Locust or k6 to simulate realistic traffic patterns.

### Architecture Reviews

Schedule regular architecture reviews to assess whether your current resource selections still match your workload. The AWS Well-Architected Tool provides a structured framework for these reviews.

## Monitoring

### Key Metrics

Monitor the metrics that matter for your users, not just your infrastructure:

- **Latency** — time from request to response, measured at the edge (not just the server)
- **Throughput** — requests per second your system handles successfully
- **Error rate** — percentage of requests that fail
- **Saturation** — how close your resources are to capacity limits

These four metrics — latency, throughput, errors, and saturation — form the foundation of effective performance monitoring.

### Anomaly Detection

CloudWatch Anomaly Detection uses machine learning to establish baselines and alert on deviations. This is more effective than static thresholds for workloads with variable traffic patterns, which describes most government services (think Monday morning spikes on benefits services, or January peaks for tax services).

### Real User Monitoring

CloudWatch RUM captures actual user experience data from browsers. This is invaluable for government services where users may be on older devices or slower connections. Synthetic monitoring tells you your service is fast from AWS's perspective; RUM tells you it is fast from your users' perspective.

## Trade-offs

Performance efficiency often involves trade-offs with other pillars:

### Performance vs Cost

A larger instance type or provisioned IOPS will improve performance but increase cost. Use performance testing to find the point of diminishing returns. Often, a well-optimised application on a smaller instance outperforms a poorly optimised one on a larger instance.

### Caching vs Consistency

Caching dramatically improves read performance but introduces data staleness. For a service displaying government guidance that changes infrequently, aggressive caching is appropriate. For a service showing real-time appointment availability, cache TTLs must be very short or caching may be inappropriate.

### Global vs Regional

CloudFront and Global Accelerator can improve performance for geographically distributed users. For UK government services primarily serving domestic users, a single-region deployment with CloudFront for static assets is usually sufficient. Multi-region is rarely justified on performance grounds alone for UK-focused services.

## Optimisation Patterns

### Right-Sizing

Use AWS Compute Optimizer to identify over-provisioned or under-provisioned resources. Many government workloads run on instances far larger than needed because they were sized for peak load that occurs for a few hours per year.

Consider using Auto Scaling to match capacity to demand rather than provisioning for peak. A service that needs 10 instances during peak but 2 instances overnight should not run 10 instances 24/7.

### Content Delivery

Use CloudFront for static assets, API caching, and TLS termination at the edge. For government services, CloudFront's London edge locations provide excellent performance for UK users while reducing load on origin servers.

### Asynchronous Processing

Not everything needs to happen in real time. If a citizen submits a form and the response is "we'll process your application," the processing can happen asynchronously. Use SQS or Step Functions to decouple time-consuming operations from the user-facing request path.

## Key Takeaways

- Select compute, storage, and database services based on workload characteristics, not team familiarity
- Measure latency at p50, p95, and p99 — averages hide performance problems
- Monitor real user experience, not just infrastructure metrics
- Right-size resources using data from Compute Optimizer and Auto Scaling
- Review and update resource selections regularly as AWS releases new capabilities

## Practical Examples

### Example 1: Optimising a Citizen Portal

A government department's citizen portal runs on m5.2xlarge EC2 instances with consistent 30% CPU utilisation. After analysis with Compute Optimizer, the team migrates to m6i.xlarge instances (one generation newer, half the size) and enables Auto Scaling with a target tracking policy at 60% CPU. The result is 40% cost reduction with improved p99 latency due to the newer instance generation's better per-core performance. CloudFront is added for static assets, reducing origin load by 70%.

### Example 2: Database Performance for a Case Management System

A case management system uses a single RDS PostgreSQL db.r5.2xlarge instance. Query analysis reveals that 80% of database load comes from read queries for case status lookups. The team adds an ElastiCache Redis cluster for case status caching (TTL of 60 seconds) and an RDS read replica for reporting queries. The primary database CPU drops from 85% to 25%, and case status lookup latency improves from 150ms to 3ms.

---
keyTakeaways:
  - Select compute storage and database services based on workload characteristics not team familiarity
  - Measure latency at p50 p95 and p99 because averages hide performance problems
  - Monitor real user experience not just infrastructure metrics
  - Right-size resources using data from Compute Optimizer and Auto Scaling
  - Review resource selections regularly as AWS releases new capabilities

practicalExamples:
  - Use Compute Optimizer and Auto Scaling to right-size EC2 instances and reduce costs while improving latency
  - Add ElastiCache and read replicas to offload read-heavy queries from primary databases
