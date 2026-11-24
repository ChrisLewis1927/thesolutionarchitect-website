---
title: What the AWS Well-Architected Framework is, and how its six pillars shape
  a workload
date: 2026-11-24T17:38:00.000Z
category: Cloud
excerpt: An application can work perfectly and still be badly architected. The
  AWS Well-Architected Framework uses six pillars to help identify weaknesses in
  security, reliability, performance, operations, cost and sustainability.
  Here's what each pillar covers and how they help architects make better design
  decisions.
author: The Solution Architect
---
An application can work perfectly and still be badly architected. It might rely on a single server that can't be rebuilt, or a database backed up every night that nobody has ever tried to restore, while administrators have far more access than they need and the team can't say which part drives most of the AWS bill.

None of that stops it working today, and the [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/framework.html) is there to expose those problems before they grow. AWS describes it as a set of foundational questions that help you see whether an architecture lines up with cloud best practices, organised around six pillars covering operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability.

# **A review framework, not an architecture**

The framework won't choose between Amazon ECS and Lambda for you, or between two Availability Zones and three. It asks the questions that help you judge whether the choices you've made suit the workload.

AWS [defines a workload](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html) as a set of components that together deliver business value, where a component is the code, configuration and AWS resources behind a requirement. The questions reach well beyond those resources, though, into the people running the service, the processes around them and things like runbooks, because a beautifully designed AWS environment can still be hard to operate if nobody knows what to do when it fails.

## **1. Operational excellence**

Operational excellence is about what happens once the architecture diagram becomes a running service, and it really asks whether you can run the thing. Can the team see what the workload is doing, deploy changes safely and cope at 2am when an alarm fires? AWS's guidance includes making small, reversible changes, automating where it's safe to, building in observability and anticipating failure.

For a [containerised application](https://thesolutionarchitect.uk/designing-for-containerised-workloads-on-aws) on Amazon ECS, the running containers are only part of the design. The team also needs useful logs and alarms, a way to roll back a bad release and instructions for common failures, ideally with the infrastructure defined as code so nobody has to rebuild it from memory. A service that only its builder can operate has an architectural problem, however well each AWS resource is configured.

## **2. Security**

The security pillar covers protecting data, systems and assets, and asks who can do what and what you're protecting. Identity is a large part of it, and AWS recommends a strong identity foundation built on least privilege, separation of duties and less reliance on long-lived credentials. It reaches well past IAM policies, though, into encryption in transit and at rest, logging that lets you investigate suspicious activity, controls at every layer and knowing how sensitive your data is.

AWS also includes preparing for security events, the part that's easiest to leave too late, because detecting an incident is far less useful if nobody knows who responds, what gets isolated or how evidence is preserved.

## **3. Reliability**

Servers fail, deployments go wrong, dependencies become unavailable and people make mistakes, so reliability asks whether the workload can keep doing its job, or recover, when those things happen. AWS's guidance includes recovering from failure automatically, testing recovery procedures, scaling horizontally, not guessing capacity and managing change through automation.

An automated backup gives you a copy of the data, but reliability asks whether you can restore it, how long that takes, how much you could lose and whether the application works afterwards. Running across several Availability Zones protects against some infrastructure failures, too, while a faulty deployment or corrupted data can hit every zone at once, so a reliable design starts from the failures that matter and works back.

## **4. Performance efficiency**

Performance efficiency is about using computing resources efficiently while still meeting the workload's requirements, so the fastest possible architecture is rarely the goal. An API might need to respond within a set time, or a batch finish before the working day starts, and the design should manage that without unnecessary resources or complexity.

AWS encourages experimenting, because the cloud makes it cheap to compare resource types and configurations, and choosing technology to suit the workload's characteristics. Amazon RDS and DynamoDB both store application data but solve different problems, so the choice should start from your data's relationships, query patterns and consistency needs rather than an assumption that one is faster.

## **5. Cost optimisation**

Cloud removes much of the need to buy infrastructure years in advance, but it also makes waste easier to create, from an oversized database running all year to forgotten development environments and old snapshots.

AWS defines the pillar as delivering business value at the lowest price point, and recommends treating financial management as an ongoing capability rather than something you do after the bill arrives. Costs should be measurable and attributable, so teams know where the money goes. That doesn't mean picking the cheapest architecture, because the real test is whether you can explain what each extra expense buys.

## **6. Sustainability**

Sustainability became the sixth pillar in 2021, and its focus is the environmental impact of cloud workloads, particularly energy consumption and making efficient use of resources. It overlaps with cost, since switching off resources nobody uses reduces both, but it goes further by asking how much resource each useful unit of work needs, such as compute per transaction or storage per user. [AWS's guidance](https://docs.aws.amazon.com/wellarchitected/latest/framework/sus-design-principles.html) includes maximising utilisation, adopting more efficient hardware and software as it appears and using managed services.

Data retention is a good illustration, because keeping every log, export and intermediate file forever uses storage and the infrastructure behind it, so a sensible lifecycle policy helps cost, security and sustainability at once.

# **One decision can affect several pillars**

Auto scaling shows how a single decision can help several pillars at once. Adding and removing compute capacity with demand can help reliability, because the application is less likely to run out of capacity, and performance, because resources arrive as demand rises, while also cutting cost and idle resource when demand falls.

Other decisions pull in different directions, though. Spreading infrastructure across more Availability Zones improves reliability but increases cost and resource use, and caching improves performance but, done badly, can introduce security or data consistency problems. AWS expects you to make these trade-offs based on your business context, although it says security and operational excellence are generally [not traded off](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html) against the other pillars.

# **How a review works**

AWS provides the [Well-Architected Tool](https://docs.aws.amazon.com/wellarchitected/latest/userguide/tutorial.html) in the console to structure a review, in which you define the workload and answer questions for each pillar. AWS also publishes [lenses](https://docs.aws.amazon.com/wellarchitected/latest/userguide/definitions.html) that add question sets for particular kinds of workload, and you can write your own. From your answers the tool identifies high-risk and medium-risk issues that feed an improvement plan, and saving a milestone records the state of the workload at that point, so a later review can show what has changed.

The framework had a major update in November 2026, which [split it into two areas](https://aws.amazon.com/blogs/architecture/announcing-updates-to-the-aws-well-architected-framework-3/). Well-Architected Cloud Foundations covers environment-wide decisions such as multi-account structure, identity and cost governance, which every workload then inherits, while Well-Architected Cloud Workloads covers how each workload is designed, built and run, and the six pillars remain.

AWS [recommends reviewing](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html) early in design, so you avoid decisions that are hard to undo, again before go-live, and after any significant architectural change, and it describes the process as a conversation rather than an audit. You won't fix every issue straight away, and AWS's advice is to prioritise them against your business context and have a playbook ready for anything you leave unaddressed.

# **What the framework doesn't give you**

Well-Architected can't tell you what your users need, how much risk your organisation should accept or which business outcome matters most. Nor is it evidence that a workload complies with a law, a security standard or an organisational policy, because those need their own assessment. Answering every question once doesn't make an architecture well designed for good, either, because services, workloads and teams all change.

That's why I find the six pillars more useful as questions than as categories. Can we operate it, can we protect it, can it survive failure, does it perform as required, do we understand what it costs, and are we wasting resources? If a team can answer those with evidence, the architecture diagram becomes far more useful, and if it can't, the framework gives you a sensible place to start looking.
