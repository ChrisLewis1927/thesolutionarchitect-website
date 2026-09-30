---
title: Caching on AWS without overloading your database
date: 2026-09-30T17:48:00.000Z
category: Cloud
excerpt: Learn how to use caching on AWS without creating a new failure point,
  from cache-aside and eviction to ElastiCache scaling, cross-Region recovery
  and protecting the database when the cache is empty or unavailable.
author: The Solution Architect
---
A cache can make a busy application faster and take a lot of repeated work away from the database. It can also serve old data, run out of memory, or send a wall of traffic back to the database when it disappears.

So the useful question is not simply “should we add a cache?” It is **what are we caching, how fresh must it be, and what happens when the cache is empty or unavailable?**

Imagine an online shop. Thousands of people may request the same product description, price or category information. Those repeated reads are good cache candidates. A stock check that decides whether an order can be accepted is a different matter: the cost of using an old answer is much higher.

That distinction should drive the design.

#### **Cache repeated work, not everything**

A cache works best when the application repeatedly asks for the same data and the answer can be reused for a period of time. The database remains the source of truth; the cache keeps a temporary copy that is cheaper or faster to read.

Start with three questions:

* Is the same data requested often enough to produce useful cache hits?
* How expensive is the original database read?
* How old can the cached answer safely be?

If a value changes constantly or almost every request is unique, caching it may add complexity without removing much database work. Measure hit rate, response time and database load rather than assuming that another AWS service will automatically improve the design.

AWS makes the same point in its guidance on [caching database query results](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/caching-database-query-results.html): caching is most useful for read-heavy workloads where the same queries repeat and the underlying data changes relatively infrequently.

#### **Decide how data gets into the cache**

Two common patterns are **cache-aside** and **write-through**.

With **cache-aside**, sometimes called lazy loading, the application checks the cache first. If the value is missing, the application reads the database, returns the result and stores a copy in the cache for the next request.

This is simple and only caches data people actually request. The trade-off is that the first request after a miss is slower and many simultaneous misses can hit the database together.

With **write-through**, the application updates the cache when the underlying data changes. That can make later reads more likely to find current data, but it means every write has more work to do and you must handle partial failure. A successful database update followed by a failed cache update can still leave an old value behind.

A **time to live (TTL)** limits how long an entry remains cached. It is a freshness control, not proof that the data is current. If a value was already wrong when it entered the cache, a TTL does not fix it; it only limits how long that copy can survive.

A useful rule is to match the TTL to the consequence of staleness. A product description may tolerate minutes or hours. A decision about stock, entitlement or account balance may need a much fresher source.

![](/images/blog/5.6.1-lazy-loading-and-write-through.png)

#### **Choose the cache deployment after you understand the traffic**

Amazon ElastiCache supports Valkey, Redis OSS and Memcached. For many application caches, Valkey or Redis OSS is attractive because it supports richer data structures, replication and sharding. Memcached is a simpler distributed key-value cache.

The engine matters, but so does the deployment model. **ElastiCache Serverless** manages capacity and scaling for you. **Node-based clusters** give you more control over node type, replicas, shards and features such as Global Datastore. AWS summarises the differences in its [ElastiCache deployment comparison](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.deployment.html).

This article treats the cache as **rebuildable**: the authoritative data exists somewhere else. If the only copy of important data lives in the in-memory service, you are making a different durability and recovery decision.

#### **Replicas and shards solve different problems**

For node-based Valkey and Redis OSS, a **replica** and a **shard** are not two ways of doing the same thing.

A replica contains a copy of one shard. It can serve reads and can be promoted if the primary fails. Adding replicas therefore helps read capacity and availability, but it does not increase the write capacity of that shard.

A shard holds part of the dataset. With cluster mode enabled, data is partitioned across multiple shards, each with its own primary and optional replicas. This is how you spread memory and write work across more than one primary. AWS allows up to five read replicas per shard. 

The client must connect in a way that matches the cluster. With cluster mode disabled, applications normally send writes to the **primary endpoint** and can use the **reader endpoint** for replica reads. With cluster mode enabled, use a cluster-aware client and the **configuration endpoint**, which lets the client discover the cluster topology. [AWS documents the endpoint behaviour](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Endpoints.html).



![](/images/blog/5.6.2-cluster-mode-disabled-and-enabled.png)

For a resilient node-based deployment, Multi-AZ places replicas in different Availability Zones and enables automatic failover. The application still needs sensible connection timeouts, reconnection and retry behaviour; failover is not useful if the client keeps talking to a dead connection.

#### **Expiry and eviction are different**

**Expiry** removes an entry because its lifetime has ended.

**Eviction** removes data because the cache needs memory for something else.

That distinction matters because the default `volatile-lru` policy for Valkey and Redis OSS only chooses eviction candidates from keys that have an expiry. If the cache is full and none of its keys has a TTL, there may be nothing it is allowed to evict, so a write that needs more memory can fail. AWS documents `volatile-lru` as the default `maxmemory-policy`. 

For a disposable cache, a policy such as `allkeys-lru` or `allkeys-lfu` may make more sense because every key can become an eviction candidate. That is a workload decision, not a universal setting.

Monitor memory, cache hit rate, evictions, CPU, connections and latency together. A rising eviction count does not automatically mean “buy a bigger cache”. It may mean the working set is too large, TTLs are wrong, low-value data is being cached, or the application simply does not reuse entries often enough.



![](/images/blog/5.6.3-eviction-policy-behaviour.png)

#### **A second Region may not need a second warm cache**

If the cache is genuinely disposable, the simplest recovery plan may be to create or start a cache in the recovery Region and let the application warm it from the database. The important question is whether the database can safely absorb that burst of misses.

For workloads that need a warm cross-Region copy, **ElastiCache Global Datastore** can replicate a node-based Valkey or Redis OSS cluster from one primary Region to secondary Regions. The primary accepts writes; secondaries are read-only until one is promoted. Replication is asynchronous, and AWS supports up to two secondary Regions. Cross-Region promotion is not automatic. [AWS documents the current Global Datastore model and limitations](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Redis-Global-Datastores-Getting-Started.html).

That makes Global Datastore useful for some disaster-recovery and local-read designs, but it is not mandatory just because the application itself spans Regions. Serverless caches do not support Global Datastore. 



![](/images/blog/5.6.4-global-datastore-across-regions.png)

#### **Design the cache-down path before you rely on the cache**

A cache can reduce database load during normal operation and then cause the worst database spike of the year when it fails.

If every cache lookup suddenly becomes a database read, thousands of previously cheap requests can arrive at the source at once. The fallback therefore needs limits.

Use short cache timeouts, bounded retries and a controlled route to the database. Limit concurrent fallback work to something the database can actually sustain. For less important features, degraded behaviour or a temporary error may be safer than overwhelming the system of record.

AWS Prescriptive Guidance makes the underlying principle explicit: if a cache becomes unavailable, the application can treat requests as misses, but the cache layer should not make the application more fragile. [AWS discusses this fallback design](https://docs.aws.amazon.com/prescriptive-guidance/latest/dynamodb-elasticache-integration/design.html).

Also plan for a **cache stampede**. If a popular key expires, hundreds of requests can all discover the miss at nearly the same time and race to rebuild it. Techniques such as adding small random variation to TTLs, allowing one request to refresh a key while others wait, or refreshing very hot entries before expiry can reduce the spike.



![](/images/blog/5.6.5-the-cache-must-be-optional.png)

#### **Test the three states that matter**

A cache design is not finished when the hit rate looks good.

Test it **warm**, when popular data is already cached. Test it **empty**, as it will be after creation, recovery or a widespread expiry. Then test it **unreachable**, so you can see what timeouts, retries and fallback actually do.

For each test, record response time, error rate, cache hit rate and database load. The useful result is not “ElastiCache stayed healthy”. It is that the **application remained within acceptable limits when the cache did not**.

That is the real architectural value of caching: removing repeated work without turning a performance optimisation into another critical failure mode.
