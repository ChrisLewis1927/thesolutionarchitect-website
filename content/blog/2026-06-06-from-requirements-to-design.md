---
title: From requirements to design
date: 2026-06-06T01:30:00.000Z
category: Architecture
excerpt: >
  You can run a good discovery and write a solid requirements document, and
  still find the page stays blank when someone asks for the design. Here's a
  method for turning captured requirements into a high-level architecture, and a
  starter set of patterns to build from.
author: The Solution Architect
---
There's a particular kind of stuck that doesn't get talked about much. You run a good discovery session, ask sensible questions, separate the must-haves from the nice-to-haves and write up a solid requirements document. Then someone says "great, so what's the design?", and you realise you've no idea how to get from that pile of requirements to a diagram with boxes on it.

It's especially common if you came into architecture from the business side, and what stops you is rarely the requirements so much as the blank canvas. Turning "here's what it must do" into "here's how it will be built" isn't often taught, but there is a method for it and anyone can learn it.

# **The design is hiding in the requirements**

The first thing to unlearn is the idea that you invent a design. A good high-level design is mostly assembled from constraints you've already captured, because every meaningful requirement points at a decision, and if discovery went well the requirements have quietly made most of the big calls for you. Your job is to read them in the right order and let them push you towards the shape.

That means design work really starts in discovery, where the technical questions matter as much as the functional ones. How quickly must the service be back after it falls over, a target you'll hear called the recovery time objective (RTO)? How much data could it afford to lose, measured as the time since the last recovery point, a target known as the recovery point objective (RPO)? AWS has [a clear explanation of both](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html). How spiky is the traffic, and is there more than one kind of spike? How sensitive is the data, and are there rules about where it can be stored? And who runs this once it's built, and do they want to manage servers at all? Not one of those is a feature question, but every one is a design question wearing requirement clothes.

If a stakeholder can't answer one of them, that's a finding rather than a dead end. Write down the assumption you're making and flag it, because an unanswered "how fast must it recover?" is a design input in its own right. It may well mean the organisation hasn't thought about resilience yet, in which case you get to lead that conversation.

# **Read the requirements as decisions**

Once you have the answers, the trick is to stop reading requirements as a feature list and start reading them as a series of forks in the road. *"The data is a set of records that link together"* sounds like a feature, but it's really a decision that points you towards a relational database rather than a pile of files or a key-value store. *"Customers can change their order until an 11pm cut-off, then we generate a report"* tells you there's a scheduled job and a moment when the data freezes. *"Sign-ups spike hard whenever we run a TV advert and the site fell over last time"* is probably the most important sentence in the brief, because it tells you the front door has to absorb a flood without passing it straight through to the database.

So for every requirement, get into the habit of asking *what does this force me to choose?* Do that and the architecture starts to assemble itself, because many requirements only point one way once you know what you're looking at. The ones that don't are where [the real trade-offs live](https://thesolutionarchitect.uk/why-architecture-decisions-arent-really-technical-problems).

# **Lean on patterns instead of starting blank**

You almost never design from nothing, because the problem in front of you is usually a variation on one that's been solved many times before, and experienced architects have simply seen the shapes often enough to recognise which one they're looking at.

The quickest way to get good is to learn a small library of common shapes. These seven aren't a formal standard, but you'll meet them again and again, and the [AWS](https://aws.amazon.com/architecture/) and [Azure](https://learn.microsoft.com/azure/architecture/) architecture centres publish reference architectures for most of them.

## **The static site**

A marketing website or a set of documentation pages usually needs no complicated back end, just files served from something like object storage, often with a content delivery network (CDN) in front to speed things up. It's cheap, reliable and easy to look after.

## **The three-tier web application**

This is the workhorse you'll probably meet most, with a presentation tier the user touches, an application tier that holds the logic and a data tier that stores the records, kept separate so each can scale and be secured on its own. Anything with user accounts and a database tends to start here.

## **The serverless application**

Serverless often keeps the same tiers but runs them differently. Your code runs only when something triggers it, so the compute bill falls to almost nothing when nobody's about, although storage still costs money and some databases charge for capacity even when they're idle. It suits spiky or unpredictable load and small teams who'd rather not babysit infrastructure, but it shouldn't become your default, because steady, heavy workloads can be better value on something more conventional.

## **The containerised application**

A container packages an application with everything it needs, so it behaves consistently across environments, and an orchestrator keeps the right number of copies healthy. That brings more to operate, so let the requirements justify it, and my post on [designing for containerised workloads](https://thesolutionarchitect.uk/designing-for-containerised-workloads-on-aws) goes further.

## **The queue in the middle**

This is the answer to the advert problem. Requests land in a queue and get processed at a pace the system can cope with, so the flood fills the buffer instead of drowning the database. The catch is that the user gets "thanks, we've got it" and the real work happens seconds or minutes later, which is fine for a sign-up form but no good for checking a bank balance. Microsoft documents it as [queue-based load levelling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling) and notes that it may not suit callers who need a quick, synchronous reply. It's a close relative of event-driven architecture, and my post on [loose coupling](https://thesolutionarchitect.uk/tightly-and-loosely-coupled-architectures-what-actually-depends-on-what) looks at both.

## **The data pipeline**

When the requirements are about reporting and trends, data flows from where it's created into a store designed for querying, gets transformed along the way and comes out as dashboards. Whenever someone says "we spend half of Monday pulling numbers into a spreadsheet by hand", this is the shape you want.

## **The hybrid or migration architecture**

Real organisations rarely start from a clean sheet, because there's often an old system that can't move yet or a data centre halfway through an exit, and this pattern is the bridge between old and new.

Put the two habits together and the earlier examples map out like this.

| What the requirement says                                                 | What it forces you to choose                     | Pattern it points at                         |
| ------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| "The data is a set of records that link together"                         | A relational database                            | Three-tier web application                   |
| "Customers can change their order until 11pm, then we generate a report"  | A scheduled job and a point where data freezes   | Scheduled job alongside the main application |
| "Sign-ups spike when we run a TV advert and the site fell over last time" | A buffer between the front door and the database | The queue in the middle                      |
| "We spend half of Monday pulling numbers into a spreadsheet"              | A store built for querying, fed automatically    | Data pipeline                                |

Real designs often stitch two or three of these together. A grant-application service might use a three-tier app for the portal, a queue to absorb the launch-day rush, a scheduled job for the overnight reporting and a data pipeline for the dashboards, and spotting which patterns combine is a big part of the skill.

# **Then harden it before anyone else does**

A design that works in your head works on a good day, so walk through the bad day on purpose, before a review board does it for you.

Point at every box in your diagram and ask what happens when it dies. If the answer is "the service goes down" or "we lose data", you've found a single point of failure to fix or a risk to call out. Ask roughly where the money goes, so you can defend value for money without being ambushed, and ask how many separate locked doors stand between an attacker and the sensitive data, since a review will want layers rather than one big wall. The answers needn't be perfect, but you should ask the questions and take a deliberate position on each, including the trade-offs you're accepting. My post on [the AWS Well-Architected Framework](https://thesolutionarchitect.uk/what-the-aws-well-architected-framework-is-and-how-its-six-pillars-shape-a-workload) gives you a ready-made list of them.

"We're single-region because the recovery target gives us room and multi-region isn't worth the cost" is a strong answer, while the same design with no explanation looks like a weakness. The design hasn't changed at all, only whether you'd thought about it.

# **Where to start if this is you**

If you recognise the stuck feeling from the top of this piece, the way out is reps rather than more theory. Take a service you already understand and design it end to end using the steps above, bad day included. Do it badly the first time and do another the week after, because the recognition that looks like instinct in experienced architects is mostly a lot of these, quietly accumulated.
