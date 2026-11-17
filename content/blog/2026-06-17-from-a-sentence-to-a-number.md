---
title: From a sentence to a number
date: 2026-06-17T09:08:00.000Z
category: Architecture
excerpt: >-
  "It needs to be reliable" is one of the most common sentences in any brief and
    one of the least useful, because it doesn't say which quality matters or what
    level would be good enough. Here's how to turn sentences like that into figures
    you can design against, using eight qualities that apply everywhere and four
    more that matter in government.
author: The Solution Architect
---
Ask a room of stakeholders if the new service needs to be reliable and every hand goes up. Then ask each of them what reliable means, and one will talk about uptime, one will talk about speed and a third will talk about not losing anybody's data. That gap between what people say and what they mean by it is where a lot of designs start to go wrong, long before anyone has picked a technology.

I've written about choosing patterns in [From requirements to design](https://thesolutionarchitect.uk/from-requirements-to-design), and this post is its companion. It covers the step just before that choice, where you take something a stakeholder has said, work out which quality of the system they're really talking about and agree a figure precise enough to design against.

# **Hearing the quality behind the words**

It helps if you picture three stages in a row, with the stakeholder's sentence at one end and the pattern you eventually choose at the other. Between them sits the quality attribute, meaning the property of the system that the sentence is really about, such as availability or performance, and it's what lets the other two connect.

If your route into architecture was through analysis or delivery work, you're probably strong at the first stage already, and you may have spent your study time on the last one, only to find the patterns don't seem to fit the sentences in your notes. That's usually because the middle stage got skipped, and once you name the quality behind a sentence, the sensible options narrow very quickly.

# **One sentence usually carries several qualities**

Stakeholders rarely hand you a single, tidy quality. The one they mention usually has two or three others tucked in behind it, and the unspoken ones matter just as much.

Take "the service has to cope with the January rush". On the surface that's scalability, because January brings far more users than March, but it's also availability, since coping means staying up while the rush is happening. It's very likely about protecting data too, because nobody who submits a tax return or a grant application that week will forgive you for losing it. A musician would call that a chord rather than a single note, and the habit worth building is hearing every note, even the quiet ones underneath.

So whenever a requirement lands, write down every quality it involves rather than just the obvious one, because the ones nobody mentioned often decide whether the project succeeds.

# **Eight qualities worth pinning down**

This is the working list I use. It isn't a formal standard (that would be [ISO/IEC 25010](https://www.iso.org/standard/78176.html), which defines nine product quality characteristics), but it's tuned to designing cloud services, which is why cost and day-to-day running sit alongside the familiar qualities, and each one comes with a question aimed at getting a number.

1. **Availability** is about whether the service is there when somebody wants to use it. You're asking what an hour offline would really cost, in money, reputation or harm to the people who depend on it, and when an outage would do the most damage. The answer becomes a percentage target, which is worth converting into time so everyone knows what they're agreeing to, since 99.9% still allows roughly eight and three-quarter hours of downtime a year while 99.99% allows less than an hour, and the two come with very different price tags.
2. **Scalability** is about how the service copes as demand grows. You're asking about volumes and their rhythm, whether that's a lunchtime peak, a seasonal surge or a one-off event, and which way the numbers are heading. What you want back is the highest load the service must handle and how quickly it builds.
3. **Performance** is about whether the service feels quick enough, so you're asking how long people can reasonably be kept waiting and at what level of use. The figure is a response-time target linked to a specific amount of traffic, for example 95% of pages loading within two seconds while 2,000 people use the service at once, because a speed target with no load attached can't be tested.
4. **Security** covers who may see and change what, and how the data is protected in transit and at rest. You'll be asking what kind of information the service holds, how damaging a leak would be and who really needs to touch it, and you're aiming for a classification of the data plus a map of who needs what. Encryption settings and identity products can wait, because they're solutions that only make sense once it's clear what needs protecting and from whom.
5. **Durability** asks how much recent data the organisation could live without if the worst happened. The figure that captures it is the RPO, short for recovery point objective, which AWS describes as the [maximum acceptable time since the last point you can recover data from](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_objective_defined_recovery.html). An RPO of fifteen minutes means accepting that, in a bad enough failure, the last fifteen minutes of work might be gone, which is something a service owner should agree to knowingly. Cloud providers use the same word for how unlikely their storage is to lose an object, which describes the platform rather than what your organisation can tolerate.
6. **Recoverability** asks how quickly the service must be back up and running after a serious failure. The figure here is the RTO, short for recovery time objective, meaning the longest acceptable gap between the service going down and working again. RTO and RPO always travel as a pair, since a plan that restores the service in ten minutes but brings back yesterday's data has only solved half the problem.
7. **Cost** is about the money available to build the service and, just as importantly, to run it year after year. You're asking about both budgets and what the organisation would give up if the bill started to climb, and you come away with a budget and a candid view of which qualities could bend to fit it.
8. **Operability** is about who will look after the service after go-live and how much they can realistically take on. You're asking whether there's an in-house team, what skills it has and what it would rather hand to a managed service, and the result is an operating model rather than a feature.

Durability and operability are the two most often left off, probably because nobody raises them unprompted, so if you rarely ask about them yourself, treat that as a gap in your own checklist.

# **Why the figure matters more than the wording**

Every one of those questions exists to draw out a figure, and at this stage that figure is the real output, not the pattern. "It needs to be reliable" gives a designer nothing to build against and a reviewer nothing to check. Compare it with something like "99.9% availability during opening hours, because each hour offline delays around £40,000 of payments", which immediately makes some designs look excessive and others sensible, and gives you a ready answer when someone later asks why you chose what you did.

Getting there is the same kind of conversation you already have when gathering requirements, simply aimed at a number rather than a description. For the eight qualities above, a requirement that can't yet be expressed as a figure is better treated as an open question, because vague words are exactly where teams discover, months later, that everyone had a different value in mind.

# **Four more if you work in government**

Those eight hold for any system, public or private. Government adds a second layer that works differently, because it mostly describes obligations you must meet rather than levels you get to choose, so the answers come back as lists, standards and boundaries rather than percentages.

**Compliance** covers the frameworks and laws the service has to satisfy, which in central government usually means the [Service Standard](https://www.gov.uk/service-manual/service-standard), the [Technology Code of Practice](https://thesolutionarchitect.uk/the-uk-governments-technology-code-of-practice-a-quiet-but-powerful-piece-of-policy), UK GDPR and the Data Protection Act 2018, plus any sector-specific rules. What you want is a complete inventory of what applies, and that's the right answer even though no number ever appears.

**Accessibility** means meeting level AA of WCAG 2.2 as a minimum, and it should guide the design from the start rather than being bolted on before launch. It steers you towards properly structured pages, enough colour contrast and never relying on colour alone to carry meaning. The [Service Manual's accessibility guidance](https://www.gov.uk/service-manual/helping-people-to-use-your-service) expects an accessibility audit before public beta, and public sector websites and apps must publish an accessibility statement, so the answer is a standard you can prove you meet.

**Data residency** asks where the data is allowed to live, which is the item I'd raise earliest, because two facts about it regularly surprise people. The first is that, according to [GDS guidance on multi-region cloud](https://www.gov.uk/government/publications/multi-region-cloud-and-software-as-a-service/multi-region-cloud-and-software-as-a-service-html), there's no universal requirement for OFFICIAL data to stay in the UK, provided the legal, data protection and security conditions are met, though organisations can still choose UK hosting for good reasons. The second is that the NCSC advises that public cloud isn't designed to protect SECRET or TOP SECRET information, so if some of the data proves to need that level of protection, the conversation moves from which region to use towards an entirely different hosting arrangement. You want to find that out in the first week rather than in front of a design authority, and the answer is a boundary.

**Retention** asks how long the data must be kept and when it has to go. UK GDPR's [storage limitation principle](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/) means you can't keep personal data for longer than you need it, the ICO expects a retention policy with standard periods wherever possible, and government records can carry further obligations under public records legislation. What you get back is a list of retention periods and the events that trigger them.

Keeping the two layers apart is what makes them useful. The first eight are things you design against, so each ends in a number that helps you choose between patterns. These four are things you must satisfy, so each ends in a list, a standard or a boundary, and there's no point hunting for a percentage where the work calls for a list.

# **Don't file everything under security**

The habit I'd most like you to take from this post is resisting the urge to put anything that sounds serious into the security box. When a stakeholder says "we need to keep this data protected" or "we have to comply with the regulations", they're very often talking about compliance, data location or how long records are kept, and the difference matters because each leads to a different first task altogether. Designing access controls, choosing where to host and writing a retention schedule have very little in common, so filing a requirement in the wrong place means starting the wrong job.

So whenever a requirement seems to be about security, check it against the second layer first and ask whether it's really about confidentiality, compliance, residency or retention. More often than you'd expect, the answer changes where you begin.

# **Practising the translation**

Like most skills in this job, this one improves far more with practice than with reading. Pick a service you know well, write out ten of its requirements, and for each one fill in four columns covering the stakeholder's own words, every quality hiding underneath, the question that would make it measurable and the figure or list you'd push for. Here's how three of them might come out.

| Stakeholder's words                         | Qualities underneath                       | Question to ask                                                                                             | What to agree                                                                                   |
| ------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| "It has to cope with the January rush"      | Scalability, availability, durability      | How many people use it in the busiest hour, and how much submitted data could you lose without real damage? | A peak of 3,000 concurrent users, 99.9% availability through January and an RPO of five minutes |
| "We can't keep people waiting if it breaks" | Recoverability, availability               | If it failed at 4pm on a weekday, how long could users wait before the delay did real harm?                 | An RTO of two hours, agreed with the service owner                                              |
| "The data has to be kept safe"              | Security, compliance, residency, retention | What classification does the data carry, which laws apply, who needs access and how long must it be kept?   | A classification, a list of laws in scope, an access map and retention periods                  |

Try to spread your ten across all eight qualities, because the ones you find yourself avoiding point to your own blind spots. Once the habit sticks, a brief stops looking like a page of loose sentences and starts looking like a set of agreed figures, lists and boundaries, and choosing a pattern becomes a much shorter conversation, which is where [From requirements to design](https://thesolutionarchitect.uk/from-requirements-to-design) picks up.
