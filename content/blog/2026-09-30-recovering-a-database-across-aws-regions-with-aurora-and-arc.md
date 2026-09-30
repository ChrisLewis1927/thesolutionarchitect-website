---
title: Recovering a database across AWS Regions with Aurora and ARC
date: 2026-09-30T17:17:00.000Z
category: Cloud
excerpt: Learn how Aurora Global Database, RDS Proxy and AWS Application
  Recovery Controller work together to recover data, applications and traffic
  when a Region fails.
author: The Solution Architect
---
A second Region can contain a healthy copy of your database and still leave you with an outage. The data has to be current enough, one database has to accept writes, the application has to reconnect, and user traffic has to move at the right time.

Imagine a service running in London with an Aurora Global Database secondary in Ireland. If London fails, “promote Ireland” is only one step. The useful question is whether the **whole service** can recover within the time and data-loss limits you agreed.

Those limits are normally expressed as:

* **Recovery point objective (RPO):** how much recent data you can afford to lose.
* **Recovery time objective (RTO):** how long the service can be unavailable.

Aurora, RDS Proxy and Amazon Application Recovery Controller (ARC) each help with a different part of that problem. None of them solves it alone.

## Aurora protects storage before you add replicas

An Aurora cluster separates database compute from its storage. The writer and any readers use the same distributed cluster volume rather than keeping a separate full copy of the database for every instance.

Aurora stores six copies of the data across three Availability Zones in one Region. AWS says the storage layer can lose up to two copies without affecting write availability and up to three without affecting read availability. [AWS explains the storage architecture](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html).

That changes how to think about resilience. Adding an Aurora reader gives you another **database instance** that can serve reads and potentially be promoted; it does not create another six-copy database.

For high availability inside one Region, place compute across Availability Zones and make sure a potential replacement writer has enough capacity for the workload. Durable storage is only half the story: the application still needs a database instance it can connect to.

<!-- DIAGRAM REPLACEMENT — 5.5.1 — Aurora Separates Compute From Storage: Show one writer and optional readers above a shared Aurora cluster volume. Show six storage copies spread across three Availability Zones. Remove the current “write quorum 4 of 6, read quorum 3 of 6, so a whole zone plus one more copy can be lost” statement. Replace it with: \*\*“Aurora can lose up to two storage copies without affecting writes, and up to three without affecting reads.”\*\* -->

## Connect to the role, not a particular machine

Aurora gives you different endpoints because applications usually care about a **role**, not the name of a database instance.

The **cluster endpoint** points to the current writer in a regional Aurora cluster. The **reader endpoint** distributes new read connections across available replicas. An **instance endpoint** deliberately targets one specific DB instance. [AWS documents the endpoint types](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html).

That difference becomes important during failover. If a reader is promoted to writer, the cluster endpoint is updated to point to the new writer. The application can keep the same endpoint in its configuration, but existing database connections can still break. Clients need sensible DNS behaviour, reconnection and retry handling.

An instance endpoint behaves differently: it continues to refer to that particular instance. That is useful when you intentionally need a specific instance, but it is the wrong abstraction when the application simply needs “whichever instance is the writer”.

Aurora Global Database adds a **global writer endpoint**. It follows the primary Region after a switchover or failover, which can avoid changing the application's database address. The application still needs network access to the new Region and must pick up the DNS change.

<!-- DIAGRAM REPLACEMENT — 5.5.2 — Endpoints Follow The Failover: Keep the before-and-after idea, but show the \*\*cluster endpoint → current writer\*\* before and after promotion. Add a separate \*\*instance endpoint → Instance A\*\* line to show that it remains tied to Instance A. Remove “instance endpoints do not belong in application configuration”; replace it with \*\*“Use an instance endpoint only when you deliberately need that instance.”\*\* -->

## A second Region is not a second independent writer

Aurora Global Database extends the design across Regions. One Region is primary and performs writes; secondary Regions contain read-only clusters that receive changes through Aurora's storage-based replication. AWS describes replication latency as typically under a second, although it is asynchronous and a secondary can therefore be behind. [AWS explains how Aurora Global Database works](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html).

That gives you two different recovery cases.

A **planned switchover** is for healthy clusters. Aurora synchronises the target and changes the primary Region without data loss. An **unplanned failover** is for a Regional outage. Because replication is asynchronous, changes that had not reached the secondary can be lost. That is why the database's measured replication lag matters to your RPO.

Global write forwarding does not turn the secondary into another writer. It lets an application connected to a secondary Region submit supported write statements there; Aurora forwards them to the primary writer, then replicates the result back. That saves the application from implementing its own write-routing logic, but it adds a cross-Region round trip and the available SQL and consistency behaviour depend on the engine and configuration. [AWS documents Global Database write forwarding](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-write-forwarding.html).

<!-- DIAGRAM REPLACEMENT — 5.5.3 — Global Database Write Forwarding: Keep the primary-to-secondary replication arrow and secondary-to-primary forwarded-write arrow. Change the footer to: \*\*“Writes are still executed in the primary Region. Write forwarding reduces application routing logic, but adds cross-Region latency and still depends on the primary.”\*\* -->

## Replication is not a backup

A second Region protects you from some infrastructure failures. It does not protect you from every data problem.

If the application writes a bad value or deletes the wrong records, replication can carry that change to the secondary as designed. Keep a tested backup and point-in-time recovery path for recovering a known-good state. [AWS documents Aurora backup and restore](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/BackupRestoreAurora.html).

This is an important distinction: **failover recovers service location; backup recovers data state**. A resilient design often needs both.

## Do not let application scaling become a database problem

Database recovery can also fail for a much less dramatic reason: too many connections.

Suppose six application tasks can each open 20 database connections. That is up to 120 potential connections. Scale the same application to 40 tasks and the theoretical maximum becomes 800. The database may be doing exactly the same work, but it now has far more connections to manage.

**RDS Proxy** sits between the application and Aurora, pooling and reusing database connections. This can reduce the connection-management load on the database and makes sudden scale-out less likely to create a connection storm. [AWS explains how RDS Proxy works](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.howitworks.html).

It is not magic. Some session state can pin a client to a database connection and reduce multiplexing. During failover, RDS Proxy can keep idle client connections open and redirect them to the new writer, but statements or transactions already in progress can still be interrupted. Applications still need bounded connection pools and tested retry behaviour.

<!-- DIAGRAM REPLACEMENT — 5.5.4 — RDS Proxy And Connection Storms: Keep the direct-versus-proxy comparison, but label the top path \*\*“potentially many database connections”\*\* rather than claiming \`max_connections\` is hit. In the lower path show \*\*“RDS Proxy pools and reuses database connections”\*\*. Replace the footer with: \*\*“RDS Proxy can preserve idle client connections through failover; active statements or transactions may still be interrupted.”\*\* -->

## ARC coordinates recovery; it does not make the database decision for you

At this point there are two separate jobs:

1. make the database writable in the recovery Region; and
2. move application traffic to a service that is actually ready to use it.

ARC helps coordinate the second job and, with **Region switch**, can orchestrate both as part of a recovery plan.

ARC **routing controls** are highly available on/off switches connected to Route 53 health checks. Changing a routing-control state can influence which application replica receives traffic. Safety rules can block combinations of states that you have defined as unsafe. The routing-control data plane is spread across five Regional endpoints, so recovery automation should be able to use another endpoint if one is unavailable. [AWS explains ARC routing controls](https://docs.aws.amazon.com/r53recovery/latest/dg/routing-control.html).

A routing control does **not** promote an Aurora database. Traffic should not be sent to the recovery Region merely because a switch can be flipped.

For a fuller workflow, **ARC Region switch** lets you define a recovery plan made of ordered or parallel steps. AWS provides an Aurora Global Database execution block that can perform a switchover or failover as part of that plan, alongside application and traffic actions. [AWS documents Region switch](https://docs.aws.amazon.com/r53recovery/latest/dg/region-switch.html).

ARC readiness checks serve a different purpose. They can highlight capacity or configuration differences between your primary and recovery environments before an incident. AWS explicitly says not to use them as the primary failover trigger or assume they will be available during an outage.

Zonal shift is different again: it moves supported resources away from an impaired Availability Zone **within a Region**. It is useful for zonal problems, but it is not a substitute for a cross-Region recovery design.

<!-- DIAGRAM REPLACEMENT — 5.5.5 — Coordinating Recovery With ARC: Replace the current diagram with a simple recovery flow: \*\*monitoring/operator → Aurora switchover or failover → verify database and application health → ARC/Route 53 traffic change → recovery Region serves users\*\*. Show \*\*safety rules\*\* beside the traffic-control step and \*\*readiness checks\*\* as a separate pre-incident preparation activity. Remove “the cheapest of the three” and “most incidents are zonal”. -->

## The recovery sequence matters more than the individual services

A sensible recovery runbook might look like this:

1. **Stop or fence writes to the old primary** so two sides cannot accept conflicting updates.
2. **Switch or fail over Aurora Global Database** to the intended recovery Region.
3. **Check the data and capacity** before treating the new primary as healthy.
4. **Reconnect or restart application components** so they use the current writer.
5. **Move user traffic** only when the application is ready.
6. **Watch errors, database lag and business transactions**, not just infrastructure health.
7. **Plan the return journey** rather than improvising failback later.

The exact automation will differ by service, but the architectural principle is the same: database failover, application recovery and traffic movement are separate events that need to happen in a controlled order.

A useful design review therefore asks more than “do we have Aurora Global Database?” Ask instead: **how much data could we lose, how long until the application is genuinely usable, what prevents writes going to the wrong place, and have we proved the whole sequence works?**

## Sources

* [Aurora storage architecture](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html)
* [Aurora endpoints](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html)
* [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
* [Global Database write forwarding](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-write-forwarding.html)
* [Aurora backup and restore](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/BackupRestoreAurora.html)
* [RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.howitworks.html)
* [ARC routing control](https://docs.aws.amazon.com/r53recovery/latest/dg/routing-control.html)
* [ARC Region switch](https://docs.aws.amazon.com/r53recovery/latest/dg/region-switch.html)

*Last reviewed: September 2026.*
