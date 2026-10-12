---
title: "Tightly and loosely coupled architectures: what actually depends on what?"
date: 2026-10-12T15:19:00.000Z
category: Cloud
excerpt: Tight and loose coupling describe how much one part of a system depends
  on another. This post explains how those dependencies affect change,
  deployment and resilience, how APIs and queues can reduce them, and why
  splitting an application into services does not automatically make it loosely
  coupled.
author: The Solution Architect
---
Imagine a council's permit application service. Residents submit a form, the service records the application, and a receipt is sent afterwards.

In one design, submission cannot finish until the receipt service responds. In another, receipt generation is recorded as work to be completed later. A temporary receipt service outage has different consequences in each design.

This is an illustrative example, but it gives us a concrete way into coupling: what does one part of a system need from another, and what happens when that dependency changes or fails?

#### **What tight and loose coupling mean**

The usual architectural terms are **tightly coupled** and **loosely coupled**. Coupling describes dependencies between components, whether those components are modules inside an application or separately running services.

With tight coupling, a component depends on details of another component in ways that make changes difficult to contain. Altering one part can require corresponding changes elsewhere. With loose coupling, components interact through defined interfaces that limit how much they need to know about each other's implementation. [AWS's Well-Architected guidance explains this distinction](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_prevent_interaction_failure_loosely_coupled_system.html).

A useful formal reference comes from OASIS, the standards body. Its [reference architecture for service-oriented architecture](https://docs.oasis-open.org/soa-rm/soa-ra/v1.0/soa-ra.html) describes loose coupling as imposing the constraints needed for components to work together, while avoiding additional constraints caused by implementation technology.

That still leaves a dependency. A consumer, the component using an interface, needs to understand the information exchanged and the expected behaviour. Loose coupling makes that dependency narrower and more deliberate.

For example, a permit application service might need a documented operation for sending a receipt. It should not also need to understand how the receipt service organises its internal database tables.

#### **There is more than one dependency to examine**

Calling a whole architecture "loosely coupled" can hide useful detail. The [OASIS reference model](https://docs.oasis-open.org/soa-rm/v1.0/soa-rm.html) treats loose coupling as a subjective trade-off rather than something with a universal numerical measure.

The following are practical questions drawn from the documentation cited throughout this article, rather than a formal classification of coupling types.

| Dependency                       | A tighter arrangement                                            | A looser arrangement                                                      |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Implementation knowledge         | Consumers rely on internal structures or implementation choices. | Consumers rely on a defined interface that hides internal decisions.      |
| Data structure                   | Several services directly use the same database tables.          | An owning service exposes data through an agreed contract.                |
| Availability during an operation | The caller must wait for another service to respond.             | Work can be accepted for later processing without waiting for the worker. |
| Change and release               | A change requires coordinated updates across services.           | Compatible changes can be tested and deployed independently.              |

A system can be relatively loose in one row and tight in another. That is why the question "loosely coupled in what respect?" is more useful than counting the services on a diagram.

#### **Shared tables make internal changes somebody else's problem**

Suppose the permit application service and a reporting service both query the same application tables. The reporting service knows column names and how records relate to one another. Changing that **schema**, the structure of the stored data, can therefore require changes in both services.

Microsoft's [guidance on service data ownership](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations) recommends keeping a service's data private to avoid this dependence on shared schemas. It also distinguishes shared tables from sharing a physical database server: separate services do not necessarily need separate database machines.

![Illustrative comparison of two services accessing shared tables and a reporting service using the application service's documented API.](/images/blog/coupling-data-boundaries.png)

In the second design, the reporting service depends on an **API**, an application programming interface. Provided the application service preserves the agreed behaviour, it can change its internal storage without requiring the reporting service to understand the new tables. This is the ownership boundary described in AWS's [database-per-service pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/database-per-service.html).

The dependency has moved to a contract. Changing that contract incompatibly can still affect the reporting service.

#### **An API can hide internals while retaining a dependency on availability**

An API contract describes the operations available, the information exchanged and the behaviour consumers can expect. A stable contract helps separate implementations, but it does not settle when the services must be available.

In a **synchronous** interaction, the caller waits for a response. In **asynchronous message passing**, the sender passes work or information onwards without waiting for the consuming service to complete it. Microsoft [distinguishes these communication patterns](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication), including the difference between asynchronous client code and an interaction that still requires a response.

AWS calls the synchronous availability dependency **temporal coupling**: the caller and its dependency need to be available at the same time. A chain of required synchronous calls extends that dependence across every service needed to complete the operation. [Its reliability guidance explains the consequences](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_prevent_interaction_failure_identify.html).

In our example, a documented receipt API could hide the receipt service's internals perfectly. If submission still waits for that API to succeed, an unavailable receipt service can prevent submission from completing. The interface boundary and the availability boundary answer different questions.

#### **A queue lets work wait for its consumer**

A **message queue** holds work for a consumer to retrieve and process. In the permit example, submission could hand receipt generation to a durable queue, which persists messages to storage for recovery, and continue after that hand-off succeeds. Microsoft's [web-queue-worker architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/web-queue-worker) separates request handling from later processing in this way.

![Illustrative comparison of submission waiting for a receipt service and submission handing work to a durable queue for a receipt worker to process later.](/images/blog/coupling-time-dependency.png)

If the worker is temporarily unavailable, accepted messages can wait. Microsoft's [Service Bus documentation](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions) illustrates this separation through durable message storage. It depends on a working queue and its capacity and retention limits. The queue becomes a dependency of the submission path.

Queues can also buffer temporary bursts while consumers process work at a manageable rate. They cannot solve a sustained shortfall in processing capacity: if work consistently arrives faster than it is completed, the backlog and waiting time grow. Microsoft's [queue-based load levelling pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) covers these benefits and limits.

Notice the changed promise to the resident. "Your application has been received" does not mean "your receipt has been delivered", still less "your permit has been approved". In this example, those are separate outcomes and would need separate status information.

#### **Publishing an event reduces knowledge of individual consumers**

A queue is not the only messaging arrangement. With **publish-subscribe**, usually shortened to pub/sub, a producer publishes an event through an intermediary. Interested consumers receive it through subscriptions, without the producer needing to call each consumer directly. Microsoft's [publisher-subscriber pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber) describes this arrangement.

For our fictional permit service, an `ApplicationReceived` event could be relevant to receipt generation and reporting. Adding a reporting subscription need not require adding a reporting API call to the application service. An event here means a record of something that happened.

This differs from putting several workers on one work queue. **Competing consumers** share the processing of work items; they do not each receive a copy for a different business purpose. Pub/sub provides separate subscriptions for those purposes. Microsoft's [competing consumers pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers) explains that distinction.

An intermediary reduces the producer's knowledge of consumers. Everyone still needs to agree what `ApplicationReceived` means.

#### **The work that loose coupling leaves you with**

**Compatibility still needs managing.** A message is a contract too. Removing a field, changing its meaning or introducing a value a consumer cannot handle can break an integration. Microsoft's [pub/sub guidance](https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber) recommends managing message compatibility and versioning breaking changes. A messaging intermediary does not make incompatible changes safe.

**Copies of data can lag.** If reporting maintains its own view from events, it may temporarily show an older state than the owning service. Microsoft's [guidance on separate read and write models](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs) describes this issue. **Eventual consistency** means copies can converge as updates are successfully processed, rather than changing together immediately. The service needs to decide whether that delay is acceptable for the information being used.

**Duplicate processing needs attention.** [AWS warns against assuming asynchronous communication guarantees exactly-once delivery](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_prevent_interaction_failure_identify.html). **Idempotency** means repeating the same operation has the same intended effect as performing it once. In our example, reprocessing receipt work should not create another receipt record or trigger an unintended repeat notification. Microsoft's [idempotent consumer guidance](https://learn.microsoft.com/en-us/azure/architecture/patterns/idempotent-consumer) covers these effects, including duplicate handling in downstream calls. It also distinguishes deduplication from preserving message order. Adding a queue alone guarantees neither safe business effects nor ordering.

**Operating the flow takes work.** Microsoft's [interservice communication guidance](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication) identifies messaging infrastructure, latency, cost and tracing as trade-offs. If submission succeeded but the receipt never arrived, operators need to follow the work through the flow. A successful hand-off is insufficient evidence that the resident received the intended outcome.

These are design responsibilities, not reasons to reject messaging. They need to be included when comparing it with a direct call.

#### **Saving data and publishing an event are two separate writes**

Our permit example has another possible failure. The application might be saved successfully, then the process might fail before publishing `ApplicationReceived`. Without a recovery mechanism, reporting and receipt generation could miss that application.

The **transactional outbox** pattern addresses this gap. The service records the application and a pending event in the same database transaction. They commit together or roll back together. A separate process reads committed outbox entries and publishes the events. [AWS documents the pattern and its failure cases](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

This makes the business change and the intention to publish atomic within that database transaction. It does not make receipt generation and reporting part of the same atomic transaction. Publication can still produce duplicates, and the publishing process still needs to run successfully.

For the illustrative service, this would allow "received" to mean that the application and its pending event were durably recorded, while later work remains visibly pending.

#### **A monolith and a tightly coupled system are different descriptions**

A **monolith** is an application deployed as a single unit. **Microservices** divide an application into separately deployable services. A monolith can contain modules with clear responsibilities and interfaces. Those modules share a deployment boundary, but that does not mean every module must depend on every other's internals.

James Lewis and Martin Fowler's [original description of microservices](https://martinfowler.com/articles/microservices.html) explicitly discusses organising monoliths around business capabilities. It also explains that some interface changes between separately deployed services still require coordination.

There is a difference in emphasis between sources here. AWS's loose-coupling guidance lists deploying a monolithic workload as an anti-pattern in its reliability guidance. Lewis and Fowler discuss modularity within a monolith. The supportable distinction is that one deployment unit limits independent deployment; it does not, by itself, prove poor internal boundaries.

Likewise, splitting an application into services does not prove that the services can change independently. Microsoft's [design-for-evolution guidance](https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/design-for-evolution) explicitly warns that decomposed applications can retain tight coupling.

#### **Choose the boundary around the work**

Loose coupling is useful when components need different release schedules, when later work can tolerate temporary consumer outages, or when producers should not know every consumer. Those benefits depend on the boundaries and contracts actually supporting that independence.

Some work belongs together. Microsoft recommends **[high cohesion](https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/design-for-evolution)**, meaning that a service's responsibilities logically belong together, alongside loose coupling between services. If a change repeatedly requires coordinated updates elsewhere, that can be a sign that the boundaries need reconsidering. Splitting related responsibilities can create more coordination than it removes.

An immediate answer can justify request-response. A single transaction boundary can be appropriate when changes must succeed or fail together. Private data stores bring their own costs: AWS's [database-per-service guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/database-per-service.html) notes the difficulty of transactions and queries that span services.

Keeping related work in one application can also simplify development at small scale and avoid calls between processes. [DORA's comparison of architecture styles](https://dora.dev/capabilities/loosely-coupled-teams/) identifies these advantages for monoliths. A shared deployment boundary can be a reasonable trade-off when separate releases would provide little value.

For the permit example, a reasonable design option is to keep application recording coherent and make receipt generation later work. That is an architectural judgement based on the example's assumed requirements, rather than a rule for every public service.

To assess an existing system, try a compatible internal change, a deployment and a dependency outage. Can the consumer continue without modification? Can the changed service be released independently? What can users still complete during the outage?

[DORA's guidance on loosely coupled teams](https://dora.dev/capabilities/loosely-coupled-teams/) uses independent change, testing and deployment as practical indicators. Those observations tell you more about coupling than the number of boxes on an architecture diagram.
