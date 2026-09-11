---
title: What the AWS Well-Architected Framework is actually for
date: 2026-09-11T15:35:00.000Z
category: Cloud
excerpt: The AWS Well-Architected Framework helps teams assess cloud workloads
  against six pillars covering operations, security, reliability, performance,
  cost and sustainability. This guide explains what the framework is, how
  reviews work, and why trade-offs matter.
author: The Solution Architect
---
Sooner or later someone on a cloud programme says the design needs to be "well architected". Heads nod. The phrase turns up in the business case, the architecture review board paper and the supplier's slide deck, and nobody stops to ask what it would take to prove it.

The AWS Well-Architected Framework is a structured set of awkward questions about a system, asked before an outage, a breach or an invoice asks them for you. That's all it is. It's more useful than it sounds.

#### Where it came from

AWS began developing the ideas behind the framework internally in 2012 and [publicly released the Well-Architected Framework whitepaper in October 2015](https://docs.aws.amazon.com/wellarchitected/latest/framework/document-revisions.html). It's a free framework, written by AWS about building on AWS, and it has been revised regularly since. The public version started with four pillars, added operational excellence in 2016, and gained a sixth, sustainability, in December 2021.

Alongside the framework sits the [AWS Well-Architected Tool](https://aws.amazon.com/well-architected-tool/), a service in the AWS console that helps teams work through the questions, record their answers and build an improvement plan. AWS makes no additional charge for using the tool itself. One piece of vocabulary helps. AWS calls the thing being reviewed a workload: ["a set of components that together deliver business value"](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html). In government terms, that's often a service, or a clearly bounded part of one.

#### Six questions in plain English

The framework is organised around six pillars. Each contains its own design principles, questions and best practices, but the basic concerns are straightforward.

![AWS Well-Architected Framework showing the six questions to ask about a workload](/images/blog/slide1.png)

You don't need to be deeply technical to understand those six concerns. A delivery manager can ask whether the service will recover when something fails. A finance business partner can challenge whether the design represents good value. A senior responsible owner can ask what risks are being accepted. The technical detail sits underneath, in the design principles and best practices. That's where architects and engineers need to provide the evidence behind the answers.

#### Trade-offs are the whole point

One of the easiest mistakes to make is to treat the six pillars like six scores that all need to be pushed as high as possible. They don't. AWS [explicitly says that teams make trade-offs between pillars based on their business context](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html). What matters for a development environment may be very different from what matters for a critical public service.

![AWS Well-Architected trade-offs showing that the right balance depends on the workload](/images/blog/slide2.png)

The important part is that the trade-off is conscious. The team should understand what it is giving up, why, what the consequences are and who has the authority to accept them. AWS adds an important qualification: security and operational excellence are generally not traded off against the other pillars.

This is where the framework becomes more than a technical checklist. It gives people a shared vocabulary for discussing priorities and making those decisions explicit. When the choice spends public money or accepts risk on someone else's behalf, that record matters more than the diagram.

#### What a review actually looks like

The word "review" can make this sound like an audit or a formal gate. AWS describes it differently. The framework calls a Well-Architected review ["a constructive conversation about architectural decisions"](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) and says it is not an audit mechanism. It should be [a lightweight process measured in hours rather than days](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html), using a blame-free approach. You don't need AWS in the room. In practice, you define the workload, work through the framework, identify risks and turn the gaps into improvements.

![AWS Well-Architected Review showing how questions turn into improvements](/images/blog/slide3.png)

The important bit is the last step: you do it again. AWS recommends using the framework throughout the life of the workload rather than saving it for one formal review.

Timing matters too. AWS recommends reviewing early enough in the design process to avoid difficult one-way-door decisions, and again before go-live. A one-way door is a decision that is difficult or expensive to reverse. Many other decisions are two-way doors and can go through a lighter process. Knowing the difference helps teams spend their time on the choices that are actually hard to undo.

#### What happens when you find a problem

The AWS Well-Architected Tool can identify high-risk and medium-risk issues. AWS describes a [high risk issue](https://docs.aws.amazon.com/wellarchitected/latest/userguide/workloads.html) as a choice that might result in significant negative impact to the business. Medium-risk issues have a lower potential impact. The tool uses those findings to help build an improvement plan, but it doesn't make the decision for you.

Your organisation still has to decide what to address first, what can be accepted for now and who owns that decision. That's an important distinction, a framework can identify risk. It cannot accept that risk on behalf of the organisation.

#### Lenses add more context

The six pillars form the core framework, but AWS also publishes lenses for particular technologies and sectors.

These extend the core guidance into areas such as serverless, machine learning, data analytics, financial services and [government](https://docs.aws.amazon.com/wellarchitected/latest/government-lens/government-lens.html). The Government Lens is particularly relevant for public-sector architects because it adds government-specific considerations around service outcomes, governance and accountability. Organisations can also create [custom lenses](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses-custom.html), giving them a way to bring some of their own standards and governance expectations into the same review process.

#### What it won't do for you

It's still an AWS framework about AWS. The questions travel well, and both [Microsoft](https://learn.microsoft.com/azure/well-architected/) and [Google](https://cloud.google.com/architecture/framework) publish their own Well-Architected frameworks, but the detailed AWS best practices naturally point towards AWS services and patterns. Treat it as one input into the architecture process, not the architecture process itself.

It also doesn't replace what government already asks of you. The [NCSC Cloud Security Principles](https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles), the [Technology Code of Practice](https://www.gov.uk/guidance/the-technology-code-of-practice) and the [Service Standard](https://www.gov.uk/service-manual/service-standard) still apply where relevant. A clean Well-Architected review won't, by itself, carry a service through assurance or a service assessment, and it won't make the decision for you.

A high-risk issue tells you where to look. Someone with the authority to accept the risk still has to decide what to do about it. That person is rarely the architect.

#### The uncomfortable truth

Saying a system works today doesn't tell you whether it is well architected.

The harder questions are whether you understand the compromises that got you there, whether the risks are visible and whether the right people agreed to them. That's why the framework matters to people who may never open the AWS console. At first glance it looks like a technical standard. In practice, much of its value comes from forcing a team to make its decisions, risks and trade-offs explicit. The framework won't make those decisions for you, it just makes it much harder to pretend you didn't make any.
