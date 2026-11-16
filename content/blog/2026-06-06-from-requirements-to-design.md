---
title: From requirements to design
date: 2026-06-06T01:30:00.000Z
category: Architecture
excerpt: >
  You can run a discovery session, fill a backlog with user stories, and write a
  requirements catalogue a business analyst would be proud of. Then someone says
  "great, now design it" and the page stays blank. This is the gap nobody
  teaches: how to turn a pile of captured requirements into a high-level
  architecture. Here's the method, and a starter set of patterns to build from.
author: The Solution Architect
---
There's a particular kind of stuck that nobody warns you about.

You can run a good discovery session, get the right people in the room, ask sensible questions, separate the must-haves from the nice-to-haves, and write up a requirements document that's solid. You understand the business problem better than anyone, and then someone says "great, so what's the design?" and you realise you have no idea how to get from the pile of requirements in front of you to a diagram with boxes on it.

It's one of the most common places to get stuck, especially if you came into architecture from the business or functional side. The requirements are never the problem, the blank canvas is. Almost nobody gets shown the bit in the middle, the actual mechanics of turning "here is what it must do" into "here is how it will be built."

It turns out there is a method, and anyone can learn it. This is the part every new architect should be handed on day one.

# **The design is hiding in the requirements**

The first thing to unlearn is the idea that you invent a design. A good high-level design is mostly assembled from the constraints you've already captured. Every meaningful requirement points at a decision, and if you've done discovery properly the requirements have quietly made most of the big calls for you. The job is to read them in the right order and let them push you towards the shape.

This means the design work starts in discovery, with the questions you ask. The technical ones matter as much as the functional ones, and they're the ones business-trained architects tend to skip. How quickly must the service recover if it falls over? (You'll hear this called the recovery time objective, or RTO.) How much data can it afford to lose? (That's the recovery point objective, RPO. AWS has [a clear explanation of both](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html).) How spiky is the traffic, and are there several different spikes? How sensitive is the data, and where must it legally live? Who runs this once it's built, and do they want to manage servers at all? None of those are feature questions. All of them are design questions wearing requirement clothes.

If a stakeholder can't answer one of them, that's not a dead end. That's a finding. Write down the assumption you're making and flag it. An unanswered "how fast must it recover" is itself a design input, because it tells you the organisation hasn't thought about resilience, and now you get to lead that conversation.

# **Read the requirements as decisions**

Once you have the answers, the trick is to stop reading requirements as a feature list and start reading them as a series of forks in the road.

*"The data is a set of records that link together"* is not a feature. It's a decision, it points you at a relational database, not a pile of files or a key-value store. *"Customers can change their order until an 11pm cut-off, then we generate a report"* tells you there's a scheduled job and a moment where state freezes. *"Sign-ups spike hard whenever we run a TV advert and the site fell over last time"* is the single most important sentence in the brief, because it tells you the front door has to absorb a flood without passing it straight through to the database.

Get into the habit of asking, for every requirement, *"what does this force me to choose?"* Do it line by line and you'll find the architecture starts to assemble itself in front of you. Many requirements only point one way once you know what you're looking at. The ones that don't are where [the real trade-offs live](https://thesolutionarchitect.uk/why-architecture-decisions-arent-really-technical-problems).

# **Lean on patterns instead of starting blank**

Here's the part that closes the gap the fastest. You almost never design from nothing, because the problem in front of you is nearly always a variation on a problem that has been solved thousands of times. Experienced architects have simply seen the shapes before and recognise which one they're looking at. 

So the fastest way to get good is to learn a small library of common shapes and what each is for. These aren't a formal standard with a capital S, and you should be honest about that if anyone asks. They're a practical starter set, the arrangements you'll meet again and again, and the major cloud providers publish reference architectures for most of them (the [AWS Architecture Center](https://aws.amazon.com/architecture/) and the [Azure Architecture Center](https://learn.microsoft.com/azure/architecture/) are the places to browse). Learn these and you have a vocabulary to reach for instead of a blank page. The most common patterns include:

1. **The static site.** Think of a marketing website, documentation pages or an online brochure. There's no complicated back end or database to worry about, just files served from something like object storage, often with a content delivery network (CDN) to improve performance. It's cheap, reliable and easy to maintain. 
2. **The three-tier web application.** The workhorse, and the shape you'll meet more than any other. A presentation layer the user touches, an application layer that holds the logic, and a data layer that stores the records, kept in separate tiers so each can scale and be secured on its own. Anything with user accounts, a database and pages that do things tends to start here.
3. **The serverless application.** Same three tiers, different way of running them. Instead of servers that sit there waiting, your code runs only when something calls it, so the compute bill drops to almost nothing when nobody's about. One thing to watch, the database usually keeps charging whether anyone's visiting or not. This is the natural fit for spiky or unpredictable load, and for small teams who don't want to babysit infrastructure. The trap is reaching for it as your 'go-to'. Steady, predictable, heavy workloads sometimes belong on something more conventional.
4. **The containerised application.** For when you've outgrown a simple deployment but want to run the same thing reliably across environments. Containers package an application with everything it needs to run, and an orchestrator keeps the right number of copies healthy. Powerful, and more operational overhead. The requirements should justify it before you choose it. ([More on designing for containers](https://thesolutionarchitect.uk/designing-for-containerised-workloads-on-aws).)
5. **The queue in the middle.** The answer to that "the site fell over during the advert" problem. Instead of the front door passing every request straight to the back end, requests land in a queue and are processed at a steady pace the system can actually handle. The flood fills the buffer instead of drowning the database. The user doesn't get an instant answer, they get "thanks, we've got it" and the real work happens a few seconds or minutes later. For a sign-up form that's usually fine, but for checking a bank balance it isn't. If your requirements mention spikes or bursts, and nobody needs the result that second, this is a good pattern to think about. Microsoft documents it as [queue-based load levelling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling), and it's a close relative of event-driven architecture, which is the bigger idea: one part of the system announces that something happened, and other parts react. I've written more about [what loose coupling buys you](https://thesolutionarchitect.uk/tightly-and-loosely-coupled-architectures-what-actually-depends-on-what).
6. **The data pipeline.** For requirements about reporting, analytics and "we need to see trends." Data flows from where it's created into a store designed for querying, gets transformed along the way, and comes out the far end as dashboards. Whenever ops or policy say "we currently spend half of Monday pulling numbers into a spreadsheet by hand," this is the shape that answers it.
7. **The hybrid or migration architecture.** Real organisations rarely start from a clean sheet. There's an old system that can't move yet, a data centre mid-exit, a thing that has to keep talking to a thing. This pattern is about the bridge between old and new, and in government it's the rule rather than the exception.

Put the two habits together, reading requirements as decisions and reaching for a known shape, and it looks like this:

| What the requirement says                                                 | What it forces you to choose                     | Pattern it points at                         |
| ------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| "The data is a set of records that link together"                         | A relational database                            | Three-tier web application                   |
| "Customers can change their order until 11pm, then we generate a report"  | A scheduled job and a point where state freezes  | Scheduled job alongside the main application |
| "Sign-ups spike when we run a TV advert and the site fell over last time" | A buffer between the front door and the database | The queue in the middle                      |
| "We spend half of Monday pulling numbers into a spreadsheet"              | A store built for querying, fed automatically    | Data pipeline                                |

Most real designs are two or three of these stitched together, not one. A grant-application service might be a three-tier app for the portal, a queue to absorb the launch-day rush, a scheduled job for the overnight reporting, and a data pipeline for the dashboards. Recognising which patterns combine is most of the skill.

# **Then harden it before anyone else does**

A design that works in your head works on a good day. The step that separates a credible architect from a hopeful one is walking the bad day on purpose, before a review board does it for you.

Point at every box in your diagram and ask what happens when it dies. If the answer is "the service goes down" or "we lose data," you've found a single point of failure to fix or a risk to name out loud. Ask roughly where the money goes, so you can defend value for money without being ambushed. Ask how many separate locked doors stand between an attacker and the sensitive data, because a review will want layers, not one big wall. You don't need every answer to be perfect. You need to have asked the questions first, and to have a deliberate position on each, including the trade-offs you're choosing to accept. If you want a ready-made list of questions to walk through, [the AWS Well-Architected Framework](https://thesolutionarchitect.uk/what-the-aws-well-architected-framework-is-and-how-its-six-pillars-shape-a-workload) is exactly that.

"We're single-region because the recovery target gives us room and multi-region isn't worth the cost" is a strong answer. The same design with no explanation is a weakness. The design didn't change. Whether you'd thought about it did.

# **Where to start if this is you**

If you recognise yourself in the stuck feeling at the top of this piece, the way out is not more theory. It's reps. Take a service you already understand and design it end to end: ask the technical questions, read each requirement as a decision, pick the patterns, draw it, then walk the bad day. Do it badly the first time. Do another the week after. The recognition that experienced architects make look like instinct is just a few dozen of these quietly accumulated.
