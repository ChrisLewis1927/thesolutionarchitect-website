---
title: Why architecture decisions aren't really technical problems
date: 2026-11-23T18:26:00.000Z
category: Governance
excerpt: If you come from a technical role, it's natural to treat every
  architecture decision as a technical one, but the choices that matter often
  turn as much on risk, time, skills and money as on the technology.
author: The Solution Architect
---
One of the easiest mistakes a new architect can make is treating every decision as a technical one. It's an understandable habit if you came up through a technical role, where benchmarks, specifications and best practice could usually settle the answer. In architecture the bigger decisions often turn as much on people, politics and money as on technology, and the technical part is sometimes the easiest bit.
 
# **A decision that looks technical**
 
I've seen this play out quite a few times. A team has to choose between building a custom integration and buying a commercial product, and the architect's comparison of features, performance, scalability and security shows the custom build clearly ahead, yet the commercial product wins.
 
It wins because the programme board would rather pay more for a product with a vendor behind it than rely on custom code from a team that might not be there next year. The minister also needs something to show in three months, and the build would take six. The operational team can't support a custom integration long term either, and the department already has a contract with the vendor, so using it looks far simpler than running a new procurement. That last point needs checking with commercial colleagues, though, since procurement law limits how far an existing contract can be changed, whether it comes under the [Procurement Act 2023](https://www.gov.uk/government/publications/procurement-act-2023-guidance-documents-manage-phase/guidance-contract-modifications-html) or the [older rules](https://www.gov.uk/government/publications/procurement-act-2023-guidance-documents-plan-phase/guidance-transitional-and-saving-arrangements-html) that still govern contracts awarded under them.
 
None of that is in the comparison, yet all of it shapes the decision, so an architect who only presents the technical analysis has done half the job.
 
# **What architecture decisions are really about**
 
Risk appetite, time, skills and the commercial relationship are enough to flip a decision like that, and two more often sit alongside them. Political context asks whether the option fits departmental strategy and would survive a change of minister, while whole-life cost asks whether the department can afford to run and eventually retire it, as well as build it. Risk appetite can also vary between organisations, and even between programmes in the same department, so the balance has to be worked out each time.
 
# **The architect's real job**
 
Technical analysis still matters, but it's one input among several, and the job is to find the option that best serves the organisation within its constraints. Sometimes that means recommending something that scores lower on performance or flexibility because the team can run it, the department can afford it and it's more likely to survive the next spending review. An architect who holds out for the best technical answer at the expense of all that is solving the wrong problem. When you do recommend the weaker technical option, say so plainly and set out the trade-offs, because that keeps the recommendation honest and easy to defend, like this.
 
*Option A would give us better performance and more flexibility, but Option B can be delivered within our timeline and run by our current team, and our commercial team has confirmed that our existing contract covers it. Given those constraints I recommend Option B, with a plan to revisit the decision in 18 months.*
 
# **How to make better architecture decisions**
 
Start by working out which decisions are yours. Funding, timeline and build versus buy usually belong to the programme, and even design decisions are often signed off elsewhere. The government's [Architectural Decision Record Framework](https://www.gov.uk/government/publications/architectural-decision-record-framework/architectural-decision-record-framework) names who decides at each level, from the head of a team up to the cross-government Technical Design Council. Whoever makes the call, your part is to understand the whole context, present the options honestly with their trade-offs, and make a clear recommendation in terms your audience cares about, so the decision is made with open eyes.
 
If the decision goes another way, that's fine as long as the trade-offs were understood, with two exceptions. Legal obligations aren't anyone's to trade away, and a security risk should be formally accepted by whoever owns it, as my [Secure by Design post](https://thesolutionarchitect.uk/secure-by-design-ten-principles-and-what-they-ask-of-your-project) explains, rather than quietly absorbed into a wider decision. Either way, record a significant decision like this in an [architecture decision record](https://thesolutionarchitect.uk/guide-architecture-decision-records), which the ADR Framework says should include the context, the consequences and the stakeholders consulted.
 
# **What this asks of you**
 
Architecture is largely the art of making good-enough decisions with incomplete information under real-world constraints. The technical skills that got you here are necessary but not sufficient, and political awareness, stakeholder management, communication and pragmatism go a long way towards separating a competent architect from an excellent one. [The TOGAF Standard gives stakeholder management a chapter of its own](https://pubs.opengroup.org/togaf-standard/adm-techniques/chap03.html), but reading about these skills only gets you so far, and you get good at them by doing the work, making mistakes and noticing what actually drives decisions in your organisation.
