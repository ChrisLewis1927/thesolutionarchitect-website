---
title: From a sentence to a number
date: 2026-06-17T09:08:00.000Z
category: Architecture
excerpt: You can fill a requirements catalogue a business analyst would envy,
  then freeze the moment someone says "now design it". The gap is smaller than
  it feels. It's the move from a sentence a stakeholder said to the quality it's
  really asking for, and from that quality to a number you can build against.
  Here's the move.
author: The Solution Architect
---
There's a move in this job that no book teaches you, and you don't notice it's missing until the moment you need it.

You can run a good discovery session. You can separate the must-haves from the nice-to-haves and write up a requirements catalogue that a business analyst would be proud of. You understand the problem better than anyone in the room. Then someone says "great, so what's the design?" and you reach for the patterns you've read about a hundred times, and nothing connects. The patterns are all still sitting there in your head. They just won't attach to the sentences in front of you.

I know that gap because I lived in it for years. The front half of the job came easily. The requirements were never my problem. What I couldn't do was get from "it needs to be reliable" to an actual decision, and reading more about three-tier apps never once helped, because the thing I was missing wasn't in those books.

Here's what the books give you. They give you destinations: three-tier, serverless, event-driven, the whole catalogue of shapes. What no book drills is the road that gets you from a sentence a stakeholder said to the right destination. And that road has a middle to it that almost nobody names out loud.

### **There's a junction in the middle**

Think of the work as a bridge with three parts. What they say, then what they actually mean, then what you reach for. The first part is the sentence the stakeholder gives you. The third part is the pattern you'll eventually pick. The part in the middle is a quality attribute, and it's the part that connects the other two.

If you're business-trained, you probably own the first part already. Gathering requirements is the thing you're good at. And you've spent your reading time staring at the third part, trying to memorise the shapes. The middle is the bit that was never installed, which is exactly why the shapes wouldn't attach. There is no road straight from the sentence to the pattern. You go sentence, then attribute, then pattern, always through the middle. Name the quality first and the shape stops being a guess.

### **Most requirements are a chord, not a note**

A stakeholder almost never hands you one clean quality. They name one and quietly bury two or three more underneath it.

"It can't fall over at our busiest time of year" sounds like a single thing. It's at least three. It's availability, because they want it up. It's scalability, because "busiest time of year" is a seasonal spike and the real design driver is load. And it's probably durability too, because if it does stumble under that load, nobody wants to lose what people submitted. The junior move is to design for the word they actually said. The experienced move is to hear the whole chord and write down every note, including the ones nobody played out loud.

So your first reflex on any requirement, before anything else, is to ask which qualities are really in play here. Not just the one in the sentence. The hidden ones are usually where the project lives or dies.

### **The eight you design against**

Here is the working set I keep in my head. Eight qualities that apply to any system anywhere, whether it's a bank, a shop or a mobile game. The trick to each one is that it resolves to a question, and the question resolves to a number.

**Availability**. Is it up when someone needs it? The question is what an hour of downtime actually costs, and when it would hurt most. The number is a percentage you're designing to, paired with a price for being down.

**Scalability**. Does it hold up when load climbs? The question is about volumes and spikes: daily, seasonal, event-driven, and which direction they're trending. The number is the peak load you must absorb and the shape of the curve getting there.

**Performance**. Is it quick enough? The question is what response time is acceptable, and at what load. The number is a latency target tied to a stated level of demand, because "fast" with no load behind it means nothing.

**Security**. Who is allowed to see and do what, and how is the data protected in flight and at rest? The question is how sensitive the data is and who genuinely needs which access. The output here is a data classification and an access map. Resist the urge to write down the mechanism yet. The access model and the encryption are answers, and they come later.

**Durability**. If you lost the last few minutes of this data, what would break? The question is how much data the organisation can actually afford to lose. The number is an acceptable data-loss window, and it's the one most people forget to ask for.

**Recoverability**. How fast can you be back after a fall? The question is how long the service can be down before it genuinely hurts. The number is a recovery time. And recoverability is always a pair: a recovery time for the service and a data-loss window for the data. Capture the first and miss the second and you've designed half a resilience story.

**Cost**. What's the budget posture? The question covers the build budget, the run budget, and what you'd be willing to trade away if cost started to bite. The output is a budget and an honest appetite for trade-offs.

**Operability**. Who runs this once it's live, and what can they handle? The question is whether there's an internal team, what they want to keep in-house, and what should sit with a managed service. The output is an operating model, not a feature.

Two of those eight get skipped far more than the rest. Durability and operability are the quiet ones. If you find yourself never reaching for them, that's worth knowing about yourself, because they don't go away just because nobody asked.

### **The number is the deliverable, not the pattern**

Look again at the third part of each attribute above. Every one of them is a question, and the question exists to force out a number. The number is the deliverable. That distinction is the whole game at this stage.

"It needs to be reliable" is useless to a design. You can't build against it and you can't defend it. "Ninety-nine point nine percent, and an hour of downtime costs us tens of thousands in lost applications" designs itself. That single line rules one architecture out and rules another one in, and when a board asks why, you have the figure ready. The conversation that produced it is the conversation you're already good at. You were just never aiming it at a number.

So here's the line worth pinning above your desk. A requirement you can't put a number on isn't a requirement yet. It's a question you haven't finished asking. The requirement with no number is the one that sinks the project six months later, because everyone assumed a different value for the same word.

### **The tier that sits on top, for public sector**

The eight are universal. They hold for any system on earth. In government there's a second tier stacked on top of them, and it behaves differently, so it's worth keeping the two apart in your head.

**Compliance**. The frameworks and the law you simply have to meet: the Service Standard, the Technology Code of Practice, UK GDPR, plus whatever sector rules apply. This resolves to a list, not a number.

**Accessibility**. WCAG 2.2 AA, and it's a genuine design driver rather than a box at the end. It pushes you towards semantic markup, real contrast, and nothing that signals meaning by colour alone. It resolves to a standard you meet and can evidence.

**Data residency**. Where can this data legally and physically live? This is the one I'd flag hardest for public sector work. The OFFICIAL and SECRET hosting boundary is a genuine show-stopper. If a dataset turns out to need SECRET-rated hosting, it rewrites your whole region and account strategy, and you want to know that on day one, not at the governance board. It resolves to a boundary.

**Retention**. How long must you keep it, and when are you obliged to delete it? This resolves to periods and rules.

The two tiers do different jobs, and that's the point of separating them. Tier one is what you design against, and every item turns into a number that picks a pattern. Tier two is what you must satisfy, and every item turns into a list or a boundary. So if a compliance question produces "I'd want a list of every framework and law in scope," that's exactly the right shape of answer for that kind of requirement, even though it never lands on a percentage. Don't go hunting for a number where a list is what the work actually needs.

### **Security is not a bucket**

One habit is worth drilling above all the others. "Security" quietly turns into a catch-all, and a lot of requirements end up dumped there that don't belong.

Half the time, "the data must be safe" or "we must comply with X" is really a compliance, residency or retention requirement wearing a security coat. And it matters which, because each one sends you to a completely different first action. An access design, an accessibility audit, a residency decision and a retention policy are four separate pieces of work, and they're nothing like each other. Reach for "security" by reflex and you'll start designing access control when the real job was an audit or a hosting decision.

So when a requirement smells like security, stop for a second and run it past that second tier first. Is this confidentiality, or compliance, or accessibility, or residency? Most of the time the honest answer reshuffles where you start.

### **Where to start if this is you**

If you recognised yourself in the gap at the top of this piece, the way out isn't more reading. It's reps.

Take ten requirements from a service you already understand. For each one, write down four things: the sentence the way the stakeholder would actually say it, the quality or qualities sitting underneath it with the hidden ones included, the question you'd ask to turn it into a number, and the number you'd push for. Try to spread them across the eight attributes, because the gaps will teach you something. The attributes you keep skipping are the blind spots you didn't know you had.

You'll learn more from ten of those than from a shelf of architecture books, and the reason is the same reason the books frustrated you in the first place. The patterns were never the hard part. The translation was, and translation is a skill rather than a talent, which means it answers to practice.

A sentence comes in. You name the quality underneath it, and the ones hiding behind that. You ask the question that turns it into a number, or into a list if it lives in the second tier. By the time you've done that across a whole brief, the design has half-built itself before you've drawn a single box. That's the move nobody hands you, and it's the one that makes everything after it possible.
