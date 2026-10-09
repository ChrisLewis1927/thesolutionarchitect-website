---
title: What the AWS Well-Architected Framework is, and how its six pillars shape
  a workload
date: 2026-10-09T18:13:00.000Z
category: Cloud
excerpt: An application can work perfectly and still be badly architected. The
  AWS Well-Architected Framework uses six pillars to help identify weaknesses in
  security, reliability, performance, operations, cost and sustainability.
  Here's what each pillar covers and how they help architects make better design
  decisions.
author: The Solution Architect
---
An application can work perfectly and still be badly architected.

It might rely on one server that nobody can rebuild. Its database might be backed up every night, but nobody has tested restoring it. Administrators may have far more access than they need. The infrastructure could be twice the size required, while the team has no idea which part of the application is generating most of the AWS bill.

None of those problems necessarily stops the application working today.

The AWS Well-Architected Framework is intended to expose them before they become bigger problems. AWS describes it as a consistent way of reviewing workloads against cloud architecture best practices and identifying areas for improvement.

At the centre of the framework are six pillars: **operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability**.

They are not six independent boxes to tick. They are six different ways of looking at the same workload.

#### **It is a review framework, not an architecture**

Well-Architected does not tell you to use Amazon ECS instead of Lambda, PostgreSQL instead of DynamoDB, or three Availability Zones instead of two.

It asks the questions that help you decide whether the choices you have made are sensible for the workload.

AWS uses the term **workload** quite broadly. It is not just the resources shown on an architecture diagram. It includes the components delivering the service, the people operating them, the processes around them and things such as runbooks and operational procedures.

That distinction is useful. A beautifully designed AWS environment can still be difficult to operate if nobody knows what to do when it fails.

AWS also expects trade-offs. A development environment may accept lower availability to reduce cost. A public-facing service with strict recovery requirements may deliberately spend more for additional resilience. Performance may be critical to one workload and relatively unimportant to another.

The framework gives you a structure for making those decisions deliberately rather than discovering them through an incident.

#### **Operational excellence: can we actually run this thing?**

Operational excellence deals with what happens after an architecture diagram becomes a running service.

Can the team see what the workload is doing? Can it deploy changes safely? Is the infrastructure repeatable? What happens at 2am when an alarm fires?

AWS guidance includes making small reversible changes, using automation, improving operational procedures, implementing observability and anticipating failure.

Take a containerised application running on Amazon ECS. Getting the containers running is only part of the design.

The team also needs useful logs and metrics, alarms that indicate something meaningful has gone wrong, a deployment process, a way to roll back a bad release and instructions for dealing with common failures. Ideally the infrastructure and configuration are defined as code so the environment can be recreated rather than depending on someone remembering how it was originally configured.

Operational excellence is therefore closely tied to how the team works. A service that can only be operated by the person who built it has an architectural problem, even if every AWS resource is configured correctly.

#### **Security: who can do what, and what are we protecting?**

The security pillar looks at protecting data, systems and assets.

Identity is a large part of it. AWS recommends a strong identity foundation based on principles such as least privilege, separation of duties and reducing dependence on long-lived credentials.

But security extends much further than IAM policies.

Data may need encryption in transit and at rest. Activity needs to be logged so suspicious behaviour can be investigated. Network and application layers need appropriate controls. Teams need to understand what information the workload holds and how sensitive it is.

There is also the question people sometimes leave until too late: what happens when a security incident actually occurs?

AWS explicitly includes preparing for security events in the pillar. Detecting an incident is much less useful if nobody knows who should respond, what should be isolated or how evidence will be preserved.

The framework treats security as something designed through the workload rather than a security product added around the outside of it. AWS says security and operational excellence are generally not areas that should simply be traded away to improve another pillar.

#### **Reliability: what happens when something fails?**

Reliability is not the same as preventing failure.

Servers fail. Deployments go wrong. Dependencies become unavailable. Networks experience problems. People make mistakes.

The question is whether the workload can continue performing its intended function or recover when those things happen.

AWS reliability guidance includes automatically recovering from failure, testing recovery procedures, scaling horizontally, managing capacity and controlling infrastructure changes through automation.

A database backup is a good example of the difference.

Creating an automated backup gives you a copy of the data. Reliability asks whether you can restore it, how long the restore takes, how much data could be lost and whether the application actually works afterwards.

The same applies to availability. Running an application across multiple Availability Zones can protect it from some infrastructure failures, but it does not protect it from every failure. A faulty deployment, corrupted data or dependency failure can affect every Availability Zone at once.

A reliable architecture therefore starts with the failure scenarios that matter and designs recovery around them.

#### **Performance efficiency: are we using the right resources for the job?**

Performance efficiency is about using computing resources efficiently while still meeting the workload's performance requirements.

That wording matters because the fastest possible architecture is rarely the objective.

A service may need an API response within a particular time, support a known number of concurrent users or process a batch before the start of the working day. The architecture needs to satisfy those requirements without adding unnecessary resources and complexity.

AWS encourages experimentation because cloud infrastructure makes it relatively easy to compare different resource types and configurations. It also encourages the use of managed and serverless services where they make sense, and choosing technology around the characteristics of the workload.

A database is a simple example.

Amazon RDS and DynamoDB can both store application data, but they solve different problems. Choosing between them should start with things such as relationships, query patterns, consistency requirements and expected traffic rather than the assumption that one AWS service is inherently more performant than another.

The same principle applies throughout an architecture. Compute, storage, databases, networks and caching should be selected around what the workload actually does.

#### **Cost optimisation: what are we paying for, and why?**

Cloud removes much of the need to buy infrastructure years before it is needed, but it does not automatically make an application cheap.

It can make waste easier to create.

An oversized database running every hour of the year still costs money. So do forgotten development environments, unnecessary data transfers, old snapshots and storage that nobody has reviewed since the application launched.

The cost optimisation pillar looks at delivering the required business value at the lowest appropriate cost.

AWS recommends treating financial management as an ongoing capability rather than looking at the bill after the architecture has been built. Costs should be measurable and attributable so teams understand where money is being spent and can decide whether that expenditure is justified.

This is different from choosing the cheapest architecture.

Adding redundancy may increase cost while substantially improving reliability. Better monitoring creates additional logging and storage costs but may make the service easier to operate. The right answer depends on what the workload needs to achieve.

Cost optimisation means knowing that the extra expense exists and being able to explain why you are paying it.

#### **Sustainability: how much resource does the workload really need?**

Sustainability became the sixth Well-Architected pillar in 2021.

Its focus is the environmental impact of cloud workloads, particularly energy consumption and the efficient use of resources.

There is an obvious overlap with cost optimisation. Switching off resources that nobody uses can reduce both cost and energy consumption.

The sustainability pillar goes further by asking teams to consider the resources required for each useful unit of work. That might mean compute per transaction, storage per user or infrastructure required to process a particular dataset.

AWS guidance includes improving utilisation, removing idle resources, adopting more efficient hardware and software as they become available, using managed services appropriately and reducing unnecessary data processing and movement.

Data retention is a good example. Keeping every log, export, intermediate file and historical dataset indefinitely consumes storage and the infrastructure required to manage it. A sensible lifecycle policy can address cost, security and sustainability at the same time.

That overlap between pillars is normal.

#### **One design decision can affect several pillars**

Consider Auto Scaling.

Adding or removing compute capacity in response to demand can improve reliability because the application is less likely to run out of capacity. It can improve performance because additional resources arrive when demand rises. It can reduce cost by removing capacity when it is no longer needed, and it can improve sustainability by reducing idle resources.

Other decisions pull in different directions.

Adding more infrastructure across Availability Zones can improve reliability while increasing cost and resource consumption. Collecting more telemetry may improve security and operations while increasing storage costs. Caching content can improve performance and reduce load on the origin, but badly designed caching can introduce security or data consistency problems.

There is rarely one architecture that maximises every pillar simultaneously.

AWS explicitly recognises these trade-offs. The useful part is making them visible.

#### **How a Well-Architected review works**

AWS provides the Well-Architected Tool in the AWS console to structure the review.

You define the workload and work through questions covering the six pillars. The questions are designed to establish which recommended practices apply and where the architecture may contain risks.

The tool can identify **high-risk issues** and **medium-risk issues**, which can then feed an improvement plan. A milestone records the state of the workload at a particular point, allowing another review to show how the architecture has changed.

This should not be treated as a one-off exercise immediately before production.

AWS recommends reviewing architectures throughout their lifecycle, including during design, before go-live and after significant architectural changes.

More importantly, AWS describes the review as a conversation rather than an audit.

That changes how it should be used. Finding a high-risk issue does not mean somebody failed an architecture test. It means the team has found something worth understanding and deciding what to do about.

There may even be a legitimate reason for accepting the risk.

The important part is that the decision is visible.

#### **What the framework does not give you**

Well-Architected cannot tell you what your users need, what level of risk your organisation should accept or which business outcome matters most.

It is also not evidence that a workload complies with a particular law, security standard or organisational policy. Those requirements still need their own assessment.

Nor does answering every question once make an architecture permanently well designed.

Cloud services change. Workloads grow. Teams change. New dependencies appear and old assumptions stop being true.

An architecture that was reasonable two years ago may no longer be the best option.

That is why I find the six pillars more useful as questions than as categories.

Can we operate it?

Can we protect it?

Can it survive failure?

Does it perform as required?

Do we understand what it costs?

Are we wasting resources?

If a team can answer those questions with evidence, the architecture diagram becomes considerably more useful. And if it cannot, the Well-Architected Framework gives you somewhere sensible to start looking.
