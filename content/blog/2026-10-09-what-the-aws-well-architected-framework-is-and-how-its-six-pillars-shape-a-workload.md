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

It might rely on one server that nobody can rebuild. Its database might be backed up every night, but nobody has tested restoring it. Administrators may have far more access than they need. The infrastructure could be twice the size required, while the team has no idea which part of the application generates most of the AWS bill.

None of that stops the application working today. The [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) is intended to expose those problems before they become bigger ones. AWS describes it as a consistent set of best practices, with questions for evaluating an architecture against them.

At its centre are six pillars: operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability. Each is a different way of looking at the same workload.

## A review framework, not an architecture

Well-Architected does not tell you to use Amazon ECS instead of Lambda, PostgreSQL instead of DynamoDB, or three Availability Zones instead of two. It asks the questions that help you decide whether the choices you have made are sensible for the workload.

AWS [defines a workload](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html) as a set of components that together deliver business value, where a component is code, configuration and AWS resources. The questions reach well beyond those resources, though. They ask about the people operating the service, the processes around them and things such as runbooks. A beautifully designed AWS environment can still be difficult to operate if nobody knows what to do when it fails.

## Operational excellence: can we actually run this thing?

Operational excellence deals with what happens after an architecture diagram becomes a running service. Can the team see what the workload is doing? Can it deploy changes safely? What happens at 2am when an alarm fires?

AWS guidance includes making small, reversible changes, automating where it is safe to, building in observability and anticipating failure.

Take a containerised application on Amazon ECS. Running containers are only part of the design. The team also needs useful logs and metrics, alarms that mean something, a way to roll back a bad release and instructions for common failures. Ideally the infrastructure is defined as code, so the environment can be rebuilt without relying on anyone's memory.

A service that can only be operated by the person who built it has an architectural problem, even if every AWS resource is configured correctly.

## Security: who can do what, and what are we protecting?

The security pillar covers protecting data, systems and assets.

Identity is a large part of it. AWS recommends a strong identity foundation built on least privilege, separation of duties and less reliance on long-lived credentials. The pillar extends well past IAM policies: encryption in transit and at rest, logging so that suspicious activity can be investigated, controls at every layer, and knowing what data the workload holds and how sensitive it is.

Then there is the question people leave too late: what happens when an incident actually occurs? AWS includes preparing for security events in the pillar. Detecting an incident is much less useful if nobody knows who responds, what gets isolated or how evidence is preserved.

## Reliability: what happens when something fails?

Servers fail. Deployments go wrong. Dependencies become unavailable. People make mistakes. Reliability asks whether the workload can keep performing its intended function, or recover, when those things happen.

AWS guidance includes recovering from failure automatically, testing recovery procedures, scaling horizontally, not guessing capacity and managing change through automation.

Backups show the difference. An automated backup gives you a copy of the data. Reliability asks whether you can restore it, how long that takes, how much data you could lose and whether the application works afterwards.

Availability is similar. Running across multiple Availability Zones protects against some infrastructure failures, but a faulty deployment, corrupted data or a failed dependency can hit every zone at once. A reliable design starts with the failure scenarios that matter and works back from them.

## Performance efficiency: are we using the right resources for the job?

Performance efficiency is about using computing resources efficiently while still meeting the workload's requirements. The fastest possible architecture is rarely the objective.

A service may need an API response within a set time, or a batch finished before the working day starts. The architecture should meet those requirements without unnecessary resources or complexity.

AWS encourages experimenting, because the cloud makes it cheap to compare resource types and configurations, and choosing technology around the characteristics of the workload. Amazon RDS and DynamoDB can both store application data, but they solve different problems. The choice should start with relationships, query patterns, consistency requirements and expected traffic, not with an assumption that one service is inherently faster.

## Cost optimisation: what are we paying for, and why?

Cloud removes much of the need to buy infrastructure years before it is needed, but it also makes waste easier to create. An oversized database running every hour of the year still costs money. So do forgotten development environments, old snapshots and storage nobody has reviewed since launch.

AWS defines the pillar as delivering business value at the lowest price point, and recommends treating financial management as an ongoing capability rather than something you do after the bill arrives. Costs should be measurable and attributable, so teams know where the money goes and can decide whether it is justified.

None of this means picking the cheapest architecture. The test is whether you know what each extra expense buys and can explain why you are paying for it.

## Sustainability: how much resource does the workload really need?

Sustainability became the sixth pillar in 2021. Its focus is the environmental impact of cloud workloads, particularly energy consumption and efficient use of resources.

It overlaps with cost: switching off resources nobody uses reduces both. Sustainability goes further by asking what resources each useful unit of work needs, such as compute per transaction or storage per user. [AWS guidance](https://docs.aws.amazon.com/wellarchitected/latest/framework/sus-design-principles.html) includes maximising utilisation, removing idle resources, adopting more efficient hardware and software as they appear and using managed services.

Take data retention. Keeping every log, export and intermediate file indefinitely consumes storage and the infrastructure that manages it. A sensible lifecycle policy helps cost, security and sustainability at once.

## One decision can affect several pillars

Consider auto scaling. Adding and removing compute capacity with demand can improve reliability, because the application is less likely to run out of capacity, and performance, because resources arrive when demand rises. It can also cut cost and idle resource when demand falls.

Other decisions pull in different directions. Spreading infrastructure across more Availability Zones improves reliability while increasing cost and resource consumption. Caching improves performance, but done badly it introduces security or data consistency problems.

AWS expects these trade-offs, with one exception: it says security and operational excellence are generally not traded off against the other pillars.

## How a review works

AWS provides the [Well-Architected Tool](https://docs.aws.amazon.com/wellarchitected/latest/userguide/tutorial.html) in the console to structure a review. You define the workload and answer questions for each pillar. AWS also publishes [lenses](https://docs.aws.amazon.com/wellarchitected/latest/userguide/definitions.html), which add question sets for particular kinds of workload, and you can write your own.

From your answers the tool identifies high-risk and medium-risk issues, which feed an improvement plan. A milestone records the state of the workload at a point in time, so a later review can show what has changed.

AWS [recommends reviewing](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html) early in design, before go-live and after significant architectural changes, and describes the review as a conversation, not an audit. A high-risk issue is something worth understanding, and there may be a legitimate reason to accept it, as long as that decision is visible.

## What the framework does not give you

Well-Architected cannot tell you what your users need, what level of risk your organisation should accept or which business outcome matters most. It is not evidence that a workload complies with a law, security standard or organisational policy either. Those need their own assessment.

Nor does answering every question once make an architecture permanently well designed. Services change, workloads grow, teams change and old assumptions stop being true.

That is why I find the six pillars more useful as questions than as categories:

* Can we operate it?
* Can we protect it?
* Can it survive failure?
* Does it perform as required?
* Do we understand what it costs?
* Are we wasting resources?

If a team can answer those with evidence, the architecture diagram becomes considerably more useful. If it cannot, the framework gives you somewhere sensible to start looking.
