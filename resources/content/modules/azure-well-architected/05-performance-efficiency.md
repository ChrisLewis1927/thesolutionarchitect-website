---
title: "Performance Efficiency"
category: "azure-well-architected"
sequenceOrder: 5
estimatedMinutes: 15
---

# Performance Efficiency

## Introduction

The Performance Efficiency pillar of the Azure Well-Architected Framework focuses on the ability of your workload to scale efficiently to meet the demands placed on it by users. It encompasses selecting the right resources, scaling appropriately, and optimising performance as requirements evolve.

For UK government services on Azure, performance directly impacts citizen experience and service adoption. Research consistently shows that users abandon slow services — if a GOV.UK transaction takes too long to load, citizens will phone the call centre instead, increasing costs and reducing service effectiveness. Architects must design for performance that meets user expectations while remaining cost-effective.

This module covers how to design, measure, and optimise performance on Azure.

## Capacity Planning

### Understanding Demand Patterns

Before selecting resources, understand your workload's demand characteristics:

- **Steady state** — consistent load throughout operating hours (internal business applications)
- **Periodic peaks** — predictable spikes at specific times (Monday mornings, end of financial year)
- **Event-driven spikes** — unpredictable surges triggered by external events (policy announcements, media coverage)
- **Growth trends** — gradual increase in baseline demand as user adoption grows

Government services often exhibit all four patterns. A benefits service might have steady weekday traffic, Monday morning peaks, unpredictable spikes when policy changes are announced, and gradual growth as more users move from phone to digital channels.

### Scaling Strategies

Azure supports both vertical and horizontal scaling:

**Vertical scaling (scale up)** — increase the size of individual resources. Simple but has limits and may require downtime.

**Horizontal scaling (scale out)** — add more instances of a resource. More complex but provides better resilience and can scale further.

For production workloads, prefer horizontal scaling. Design your application to be stateless so that any instance can handle any request. Store session state in Azure Cache for Redis or Azure SQL rather than in-memory.

## Compute Performance

### Azure App Service

App Service provides built-in auto-scaling:

- **Rule-based scaling** — scale based on metrics (CPU, memory, HTTP queue length)
- **Automatic scaling** — Azure manages scaling decisions based on HTTP traffic patterns (preview feature)

Choose the right App Service Plan tier:
- **Basic** — development and testing
- **Standard** — production workloads with auto-scaling
- **Premium** — high-performance requirements, VNet integration, more instances
- **Isolated** — dedicated environment for compliance or performance isolation

### Azure Kubernetes Service (AKS)

For containerised workloads, AKS provides multiple scaling mechanisms:

- **Horizontal Pod Autoscaler (HPA)** — scales pods based on CPU, memory, or custom metrics
- **Vertical Pod Autoscaler (VPA)** — adjusts pod resource requests and limits
- **Cluster Autoscaler** — adds or removes nodes based on pod scheduling needs
- **KEDA** — event-driven autoscaling based on queue depth, event count, or custom triggers

### Azure Functions

Functions on the Consumption plan scale automatically from zero to hundreds of instances. For predictable high-throughput workloads, the Premium plan provides pre-warmed instances to eliminate cold start latency.

Cold starts can add 1-3 seconds of latency on the Consumption plan. For latency-sensitive APIs, use the Premium plan or keep functions warm with a timer trigger.

## Data Performance

### Azure SQL Database Performance

Optimise Azure SQL Database performance:

- **Query Performance Insight** — identifies top resource-consuming queries
- **Automatic tuning** — Azure automatically creates indexes, drops unused indexes, and fixes plan regression
- **Read replicas** — offload read-heavy workloads to read-only replicas
- **In-memory OLTP** — for extreme throughput requirements on Business Critical tier

Monitor DTU or vCore utilisation. If your database consistently runs above 80% utilisation, consider scaling up or optimising queries before adding more capacity.

### Caching with Azure Cache for Redis

Caching is one of the most effective performance optimisation techniques:

- **Session state** — store user sessions in Redis rather than in-memory for stateless scaling
- **Output caching** — cache rendered pages or API responses
- **Data caching** — cache frequently accessed database results
- **Distributed locking** — coordinate access across multiple application instances

Choose the appropriate Redis tier:
- **Basic** — development and testing only (no SLA)
- **Standard** — production with replication
- **Premium** — persistence, clustering, zone redundancy, VNet support
- **Enterprise** — Redis modules (RediSearch, RedisBloom, RedisTimeSeries)

### Cosmos DB Performance

Cosmos DB provides single-digit millisecond latency at any scale. Key performance considerations:

- **Partition key selection** — the most important design decision. Choose a key that distributes requests evenly.
- **Request Units (RUs)** — understand your RU consumption and provision accordingly
- **Indexing policy** — customise indexing to reduce RU consumption for write-heavy workloads
- **Consistency levels** — choose the weakest consistency level that meets your requirements (Session consistency is appropriate for most scenarios)

## Network Performance

### Azure Front Door

Azure Front Door provides global load balancing and acceleration:

- **Anycast routing** — routes users to the nearest edge location
- **SSL offloading** — terminates TLS at the edge, reducing origin server load
- **Caching** — caches static and dynamic content at edge locations
- **WAF integration** — security and performance in a single service

For UK government services primarily serving domestic users, Front Door's London edge locations provide excellent performance while adding DDoS protection and WAF capabilities.

### Content Delivery Network

Azure CDN caches static content at edge locations worldwide. For government services:

- Cache static assets (CSS, JavaScript, images) with long TTLs
- Use cache-busting techniques (content hashing in filenames) for cache invalidation
- Configure custom domains with managed TLS certificates

### ExpressRoute

For hybrid architectures connecting to on-premises government networks, Azure ExpressRoute provides dedicated private connectivity with:

- Predictable latency (no internet routing variability)
- Higher bandwidth (up to 100 Gbps)
- Built-in redundancy with dual circuits

ExpressRoute is commonly used by government departments connecting Azure to PSN or departmental WANs.

## Performance Testing

### Load Testing

Azure Load Testing (based on Apache JMeter) provides cloud-based load testing:

- Define test scenarios that simulate realistic user behaviour
- Generate load from Azure regions close to your users
- Integrate load tests into CI/CD pipelines for automated performance regression testing
- Monitor application performance during tests using Application Insights

### Performance Baselines

Establish performance baselines and monitor for regression:

- Measure p50, p95, and p99 latency for key user journeys
- Track throughput capacity (requests per second at acceptable latency)
- Monitor resource utilisation under load (CPU, memory, connections, IO)
- Compare performance across deployments to detect regressions

## Key Takeaways

- Understand your workload's demand patterns before selecting scaling strategies
- Design applications to be stateless for effective horizontal scaling
- Use Azure Cache for Redis to reduce database load and improve response times
- Implement Azure Front Door for edge caching, SSL offloading, and DDoS protection
- Establish performance baselines and integrate load testing into CI/CD pipelines

## Practical Examples

### Example 1: Scaling a Citizen-Facing Service

A government service experiences 10x traffic spikes when policy changes are announced. The team implements Azure App Service with auto-scaling rules based on HTTP queue length (scale out when queue exceeds 10 requests, scale in when below 2). Azure Cache for Redis caches user session data and frequently accessed reference data. Azure Front Door caches static assets and provides DDoS protection. During a major policy announcement, the service scales from 3 to 25 instances within 5 minutes, maintaining p95 latency under 400ms throughout the spike.

### Example 2: Database Performance Optimisation

A case management system's Azure SQL Database runs at 90% DTU utilisation, causing slow queries during peak hours. Analysis with Query Performance Insight reveals three queries consuming 60% of resources. The team enables automatic tuning, which creates two missing indexes reducing those queries' cost by 80%. A read replica is added for reporting queries. Azure Cache for Redis caches case status lookups (the most frequent query). DTU utilisation drops to 35%, and p95 query latency improves from 2.1 seconds to 180ms.

---
keyTakeaways:
  - Understand your workload demand patterns before selecting scaling strategies
  - Design applications to be stateless for effective horizontal scaling
  - Use Azure Cache for Redis to reduce database load and improve response times
  - Implement Azure Front Door for edge caching SSL offloading and DDoS protection
  - Establish performance baselines and integrate load testing into CI/CD pipelines

practicalExamples:
  - Configure App Service auto-scaling with Redis caching and Front Door for traffic spikes
  - Use Query Performance Insight and automatic tuning to reduce database utilisation by 60%
