---
title: Why architecture decisions aren't really technical problems
date: 2026-05-21T21:02:00.000Z
category: Governance
excerpt: The biggest mistake new architects make is treating every decision as a
  technical one. That's understandable. Most of us came from technical roles
  where the right answer was determined by benchmarks, specs, and best practice.
  But architecture doesn't work that way.
author: The Solution Architect
---
The biggest mistake new architects make is treating every decision as a technical one. That's understandable. Most of us came from technical roles where the right answer was determined by benchmarks, specs, and best practice. But architecture doesn't work that way.

Most architecture decisions are really about people, politics, and money. The technical bit is often the easiest part.

#### **The decision that looks technical but isn't**

I've seen this scenario play out dozens of times. A team needs to choose between building a custom integration and buying a commercial product. The architect produces a thorough technical comparison covering features, performance, scalability, security, and maintenance burden. The analysis clearly favours the custom build.

But the decision goes the other way. The commercial product wins.

Why? Because the decision was never really about technical merit. It was about risk appetite: the programme board would rather pay more for a product with a vendor behind it than accept the risk of maintaining custom code with a team that might change. It was about timeline. The minister needs something demonstrable in three months, and the custom build would take six. It was about skills, because the operational team can't maintain a custom integration long-term. And it was about commercial relationships, since the department already has a contract with the vendor and extending it is far simpler than running a new procurement.

None of those factors appear in a technical comparison. But they all shape the decision. An architect who only presents the technical analysis has done half the job.

#### **What architecture decisions are really about**

Architecture decisions sit at the intersection of several concerns. There's technical feasibility, obviously — can we build it, will it work, will it scale? There's organisational capability: can our team actually build and maintain it, and do we have the skills? There's political context — does this align with departmental strategy, and will it survive a change of minister? There's financial reality, which is not just whether we can afford to build it, but whether we can afford to run it for five years. There are time constraints, because timelines have political consequences. And there's risk tolerance, which varies wildly between organisations and even between programmes in the same department.

A good architecture decision balances those. A purely technical one ignores most of them.

#### **The architect's real job**

Technical analysis still matters. Of course it does. But the architect's job isn't to find the technically optimal solution. It's to find the solution that best serves the organisation given its constraints.

Sometimes that means recommending a technically inferior option because it's more maintainable, more affordable, or more politically viable. That's not a compromise. It's good architecture.

The key is honesty. When you recommend an option that isn't technically optimal, say so plainly:



*"Option B is not the strongest technical choice. Option A would give us better performance and more flexibility. But Option B can be delivered within our timeline, maintained by our current team, and avoids a new procurement. Given our constraints, I recommend Option B, with a plan to revisit in 18 months."*



That's an architecture decision. It's honest about trade-offs, grounded in context, and defensible to anyone who asks why.

#### **How to make better architecture decisions**

If you want to make better architecture decisions, stop thinking of yourself as a technical decision-maker. Start thinking of yourself as a decision facilitator. Your job is to understand the full context — the technical requirements, yes, but also the organisational, political, and financial picture around them. Present options honestly, with trade-offs across all those dimensions and not just the technical ones. Make your recommendation clear, and explain it in terms your audience actually cares about. Accept that the decision might go differently than you'd choose, and that's fine as long as the decision-makers understood the trade-offs. Then document the decision properly, so future teams understand not just what was decided but why.

#### **The uncomfortable truth**

The best technical solution often isn't the right solution. The architect who insists on technical purity at the expense of delivery, affordability, or organisational capability isn't being rigorous. They're being naive.

Architecture is the art of making good-enough decisions with incomplete information under real-world constraints. The sooner you accept that, the more effective you'll be.

The technical skills that made you a good developer are necessary but not sufficient. The political awareness, the stakeholder management, the communication, the pragmatism — those are what separate a competent architect from an excellent one. You won't find them on any certification syllabus. You learn them by doing the work, making mistakes, and paying attention to what actually drives decisions in your organisation.
