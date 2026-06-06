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

You can run a good discovery session. You can get the right people in the room, ask sensible questions, separate the must-haves from the nice-to-haves, and write up a requirements catalogue that's genuinely solid. You understand the business problem better than anyone. And then someone says "great, so what's the design?" and you realise you have absolutely no idea how to get from the pile of requirements in front of you to a diagram with boxes on it.

I know that stuck feeling because it was mine. For a long time I could do the front half of the job well and froze at the back half. The requirements were never the problem. The blank canvas was. Nobody had ever shown me the bit in the middle, the actual mechanics of turning "here is what it must do" into "here is how it will be built."

It turns out there is a method. It isn't magic and it isn't talent you're born with. This is the part I wish someone had handed me years ago.

#### The design is hiding in the requirements

The first thing to unlearn is the idea that you invent a design. You don't. A good high-level design is mostly assembled from the constraints you've already captured. Every meaningful requirement points at a decision, and if you've done discovery properly the requirements have quietly made most of the big calls for you. The job is to read them in the right order and let them push you towards the shape.

Which means the design work starts back in discovery, with the questions you ask. The technical ones matter as much as the functional ones, and they're the ones business-trained architects tend to skip. How quickly must the service recover if it falls over? How much data can it afford to lose? How spiky is the traffic, and are there several different spikes? How sensitive is the data, and where must it legally live? Who runs this once it's built, and do they want to manage servers at all? None of those are feature questions. All of them are design questions wearing requirement clothes.

If a stakeholder can't answer one of them, that's not a dead end. That's a finding. Write down the assumption you're making and flag it. An unanswered "how fast must it recover" is itself a design input, because it tells you the organisation hasn't thought about resilience, and now you get to lead that conversation.

#### Read the requirements as decisions

Once you have the answers, the trick is to stop reading requirements as a feature list and start reading them as a series of forks in the road.

"The data is a set of records that link together" is not a feature. It's a decision: you need a relational database, not a pile of files and not a key-value store. "Customers can change their order until an 11pm cut-off, then we generate a report" tells you there's a scheduled job and a moment where state freezes. "Sign-ups spike hard whenever we run a TV advert and the site fell over last time" is the single most important sentence in the brief, because it tells you the front door has to absorb a flood without passing it straight through to the database.

Get into the habit of asking, for every requirement, "what does this force me to choose?" Do it line by line and you'll find the architecture starts to assemble itself in front of you. Most requirements only point one way once you know what you're looking at.

#### Lean on patterns instead of starting blank

Here's the part that closes the gap fastest. You almost never design from nothing, because the problem in front of you is nearly always a variation on a problem that has been solved thousands of times. Experienced architects aren't smarter in the moment. They've just seen the shapes before and recognise which one they're looking at.

So the fastest way to get good is to learn a small library of common shapes and what each is for. These aren't a formal standard with a capital S, and you should be honest about that if anyone asks. They're a practical starter set, the arrangements you'll meet again and again, and the major cloud providers publish reference architectures for every one of them. Learn these and you have a vocabulary to reach for instead of a blank page.

The static site. A website with no real back end to speak of: marketing pages, documentation, a brochure. Files in object storage with a content delivery network in front. Cheap, fast, almost nothing to break. The mistake here is over-building it. If the requirements don't describe logic and data, don't reach for servers.

The three-tier web application. The workhorse, and probably 60% of what you'll ever build. A presentation layer the user touches, an application layer that holds the logic, and a data layer that stores the records, kept in separate tiers so each can scale and be secured on its own. Anything with user accounts, a database and pages that do things tends to start here.

The serverless application. The same logic as a three-tier app, but instead of running servers that sit there waiting, your code runs only when something calls it, and you pay close to nothing when it's idle. The natural fit for spiky or unpredictable load, and for small teams who don't want to babysit infrastructure. The trap is reaching for it reflexively. Steady, predictable, heavy workloads sometimes belong on something more conventional.

The containerised application. For when you've outgrown a simple deployment but want to run the same thing reliably across environments. Containers package an application with everything it needs to run, and an orchestrator keeps the right number of copies healthy. Powerful, and more operational overhead. The requirements should justify it before you choose it.

The event-driven, decoupled architecture. The answer to that "the site fell over during the advert" problem. Instead of the front door passing every request straight to the back end, requests land in a queue and are processed at a steady pace the system can actually handle. The flood fills the buffer instead of drowning the database. If your requirements mention spikes, bursts, or any rhythm where load arrives faster than it can be dealt with, this is the pattern that saves you.

The data pipeline. For requirements about reporting, analytics and "we need to see trends." Data flows from where it's created into a store designed for querying, gets transformed along the way, and comes out the far end as dashboards. Whenever ops or policy say "we currently spend half of Monday pulling numbers into a spreadsheet by hand," this is the shape that answers it.

The hybrid or migration architecture. Real organisations rarely start from a clean sheet. There's an old system that can't move yet, a data centre mid-exit, a thing that has to keep talking to a thing. This pattern is about the bridge between old and new, and in government it's the rule rather than the exception.

Most real designs are two or three of these stitched together, not one. A grant-application service might be a three-tier app for the portal, a queue to absorb the launch-day rush, a scheduled job for the overnight reporting, and a data pipeline for the dashboards. Recognising which patterns combine is most of the skill.

#### Then harden it before anyone else does

A design that works in your head works on a good day. The step that separates a credible architect from a hopeful one is walking the bad day on purpose, before a review board does it for you.

Point at every box in your diagram and ask what happens when it dies. If the answer is "the service goes down" or "we lose data," you've found a single point of failure to fix or a risk to name out loud. Ask roughly where the money goes, so you can defend value for money without being ambushed. Ask how many separate locked doors stand between an attacker and the sensitive data, because a review will want layers, not one big wall. You don't need every answer to be perfect. You need to have asked the questions first, and to have a deliberate position on each, including the trade-offs you're choosing to accept.

That last part matters more than it sounds. "We're single-region because the recovery target gives us room and multi-region isn't worth the cost" is a strong answer. The same design with no explanation is a weakness. The design didn't change. Whether you'd thought about it did.

#### Where to start if this is you

If you recognise yourself in the stuck feeling at the top of this piece, the way out is not more theory. It's reps. Take a service you already understand and design it end to end: ask the technical questions, read each requirement as a decision, pick the patterns, draw it, then walk the bad day. Do it badly the first time. Do another the week after. The recognition that experienced architects make look like instinct is just a few dozen of these quietly accumulated.

The requirements were never your weak spot. The blank canvas was, and the blank canvas is beatable. You read the constraints, you reach for a shape you've seen before, and you pressure-test it before someone else does. That's the whole trick, and nobody is born knowing it.
