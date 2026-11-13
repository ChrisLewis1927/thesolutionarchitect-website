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

I've seen this scenario play out quite a few times. A team needs to choose between building a custom integration and buying a commercial product. The architect produces a thorough comparison of features, performance, scalability and security. On those measures the custom build clearly wins.

But the decision goes the other way. The commercial product wins.

The decision was never only about technical merit. It was about risk appetite: the programme board would rather pay more for a product with a vendor behind it than accept the risk of maintaining custom code with a team that might change. It was about timeline. The minister needs something demonstrable in three months, and the custom build would take six. It was about skills, because the operational team can't maintain a custom integration long-term. And it was about commercial relationships, since the department already has a contract with the vendor, and using it looks far simpler than running a new procurement. That assumption needs checking with commercial colleagues, because the [Procurement Act 2023](https://www.gov.uk/government/publications/procurement-act-2023-guidance-documents-manage-phase/guidance-contract-modifications-html) limits how far an existing contract can be extended or widened.

None of those factors appear in the comparison. But they all shape the decision. An architect who only presents the technical analysis has done half the job.

# **What architecture decisions are really about**

That build-versus-buy decision turned on four things: risk appetite, timeline, skills and commercial relationships. Two more sit alongside them. One is political context: does the option align with departmental strategy, and will it survive a change of minister? The other is whole-life cost, which is whether the department can afford to run the thing for five years as well as build it.

Risk appetite varies widely between organisations, and even between programmes in the same department, so the balance has to be worked out each time. A good architecture decision weighs all of these alongside technical feasibility. A purely technical one ignores most of them.

## **The architect's real job**

Technical analysis still matters. But the architect's job isn't to find the technically optimal solution. It's to find the solution that best serves the organisation given its constraints.

Sometimes that means recommending the option that scores lower on performance or flexibility because the team can run it, the department can afford it and it will survive the next spending review. That is good architecture. An architect who holds out for the best technical answer at the expense of delivery, cost or the team's ability to run it is solving the wrong problem.

When you recommend an option that isn't the strongest technically, say so plainly:

*Option B is not the strongest technical choice. Option A would give us better performance and more flexibility. But Option B can be delivered within our timeline, maintained by our current team, and avoids a new procurement. Given our constraints, I recommend Option B, with a plan to revisit in 18 months.*

That recommendation is honest about trade-offs, grounded in context, and defensible to anyone who asks why.

### **How to make better architecture decisions**

Start by separating the decisions that are yours from the ones that are not. The design is yours to decide. Build versus buy, funding and timeline usually belong to the programme, and there your job is to make sure the people deciding understand what they are choosing.

1. Understand the full context: the technical requirements, and the organisational, political and financial picture around them.
2. Present options honestly, with trade-offs across all of those dimensions.
3. Make your recommendation clear, and explain it in terms your audience cares about.
4. Accept that the decision might go a different way. That is fine as long as the decision-makers understood the trade-offs.
5. Record the decision and the reasons for it in an architecture decision record. The government's [ADR Framework](https://www.gov.uk/government/publications/architectural-decision-record-framework/architectural-decision-record-framework) sets out what one should contain.

#### **What this asks of you**

Architecture is the art of making good-enough decisions with incomplete information under real-world constraints.

The technical skills that made you a good developer are necessary but not sufficient. Political awareness, stakeholder management, communication and pragmatism are what separate a competent architect from an excellent one. A syllabus can name them. [TOGAF has a chapter on stakeholder management.](https://pubs.opengroup.org/togaf-standard/adm-techniques/chap01.html) You only get good at them by doing the work, making mistakes and noticing what actually drives decisions in your organisation.
