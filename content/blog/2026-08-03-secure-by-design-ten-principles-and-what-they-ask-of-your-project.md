---
title: "Secure by Design: ten principles and what they ask of your project"
date: 2026-11-21T15:31:00.000Z
category: Governance
excerpt: Ten mandatory principles, five clusters of activity, and a spend
  approval process that now checks you're following them.
author: The Solution Architect
---
You've probably read a design document where the security section felt like an afterthought. By the time anyone asked about security, the hosting had been chosen and the delivery plan already had dates on it, so what went on the page was a list of the controls the project could still bolt on. It looked like design but read more like an apology, and most of us in government architecture have seen enough of those documents to know they're the wrong way round.

Secure by Design is the government's answer to that problem. Central government now has to meet it when building new services or making significant changes to existing ones. It's written into both the Cyber Security Standard and the Service Standard, and it will come up at assurance whether you've prepared for it or not. So let's look at what it is, why it carries more weight than its gentle phrasing suggests, and how to apply it on a real project without drowning in paperwork.

# **What Secure by Design actually is**

At its heart, [Secure by Design](https://www.security.gov.uk/policy-and-guidance/secure-by-design/about/) is about building security into digital delivery from the very start and keeping it there for the whole life of the service. It's owned by the Government Cyber Unit, which is part of the Department for Digital, Culture, Media and Sport, and it was developed with a cross-government working group alongside the Government Security Group, the [NCSC](https://www.ncsc.gov.uk/) and industry experts.

It comes in three layers, with the [policy](https://www.security.gov.uk/policy-and-guidance/secure-by-design/policy/) setting out who it applies to and what they must do, the [principles](https://www.security.gov.uk/policy-and-guidance/secure-by-design/principles/) describing ten outcomes a delivery team has to achieve, and the [activities](https://www.security.gov.uk/policy-and-guidance/secure-by-design/activities/) offering recommended practices for getting there, which you're explicitly allowed to tailor.

The principles are mandatory for central government departments and arm's length bodies and optional for the rest of the public sector. They apply to new services and infrastructure and to significant changes, such as work that needs a Treasury business case. Services that are simply running or in routine maintenance sit outside the policy for now, with the expectation that they'll come into scope or be retired over time. Suppliers usually meet them through their contracts, and the guidance suggests checking with your security contacts to see which ones apply.

Organisations can also add principles of their own and reshape the activities, as long as the ten core principles are still met, which is what the [Ministry of Defence](https://www.digital.mod.uk/policy-rules-standards-and-guidance/secure-by-design) has done for its own environment and project life cycle. That flexibility is worth using, because the generic activities are written for an average project and yours almost certainly isn't one.

# **Why it carries more weight than it first appears**

On a first read it can sound like friendly advice, with ten sensible outcomes and no obvious scoring scheme, and plenty of teams have filed it away on that basis. That's a mistake, because it's now wired into the places where money and approval actually get decided.

The [Cyber Security Standard](https://www.security.gov.uk/policy-and-guidance/the-cyber-security-standard/) requires organisations delivering new digital services and technical infrastructure to comply with the ten principles, and it says you prove it by reaching a "high" confidence profile in the Secure by Design self assessment tracker. [Point 9 of the Service Standard](https://www.gov.uk/service-manual/service-standard/point-9-create-a-secure-service) tells service teams they must follow the principles, so you can expect them at service assessments as well, and Secure by Design is also outcome 9 in the Government Cyber Action Plan.

Money is the other lever, because the [Digital Assurance Playbook](https://www.gov.uk/government/publications/digital-assurance-playbook/digital-assurance-playbook), which replaced the old digital and technology spend control process on 1 April 2026, asks for initiatives to be checked against their organisation's Secure by Design approach and for teams to involve their security professionals early. That means the route that used to catch a weak [Technology Code of Practice](https://thesolutionarchitect.uk/the-uk-governments-technology-code-of-practice-a-quiet-but-powerful-piece-of-policy) answer can now catch a weak Secure by Design answer too.

Adoption is staged across [two groups](https://www.security.gov.uk/policy-and-guidance/secure-by-design/implementation/), with ministerial departments, bodies running government Critical National Infrastructure and organisations running the priority government services in Group 1, and every other central government organisation in Group 2. Chief digital information officers are accountable for adoption, which means somebody senior has their name against it and will sooner or later be asking you for evidence.

# **The ten principles, read as an architect**

Each principle is officially a short outcome, so it helps to translate it into what it means when you're the one holding the design document.

* **Principle 1 - create responsibility for cyber security risk -** name a risk owner senior enough for their decisions to stick. I'd say it's the principle most often failed quietly, because without a named owner nobody can accept a residual risk, and the project has no real way of making a security decision at all.
* **Principle 2 - source secure technology products -** carry out continued due diligence on the platforms, software and code you didn't write, and share anything you find with the supplier so they can improve the product. The word continued matters here, because a one-off check at procurement describes a product that will have moved on by the time you go live.
* **Principle 3 - adopt a risk-driven approach -** establish the project's risk appetite and keep a live assessment of cyber risk. It's well worth pinning the appetite down early, since most later arguments about proportionality turn out to be arguments about an appetite nobody wrote down.
* **Principle 4 - design usable security controls -** research how people really work and design controls they won't be tempted to route around, since plenty of office workarounds started life as a control that made a reasonable task unreasonable.
* **Principle 5 - build in detect and respond security -** assume vulnerabilities and incidents will happen, and build in logging, monitoring, alerting and response to match. You're also expected to test them, because an alert that has never fired is really only a hypothesis.
* **Principle 6 - design flexible architectures -** build services, and update legacy components, so that new security controls can be added without a rewrite. That quietly supports decisions you'd probably want to make anyway, such as clean interfaces, externalised configuration and avoiding hard-coded trust between components.
* **Principle 7 - minimise the attack surface -** keep only the capabilities, software, data and hardware the service needs. The guidance points out that this also makes it cheaper to run, which is the argument that tends to land in a business case.
* **Principle 8 - defend in depth -** layer your controls so that one failure doesn't open up the whole service. It's an old idea, but it still separates designs that survive a bad day from those that don't.
* **Principle 9 - embed continuous assurance -** show that the controls work at go-live and keep showing it afterwards. Continuous is the important word, because a lot of government assurance still happens as a one-off event.
* **Principle 10 - make changes securely -** weigh the security impact of every change alongside its cost and delivery date. If your change process can't say what a change does to your risk position, it isn't there yet.

Taken together, the ten describe a delivery team that owns its security decisions with security professionals working alongside it, instead of throwing designs over the wall and waiting for conditions to come back, and that cultural shift is usually the part that takes longest to land.

# **From principles to activities**

Principles tell you what good looks like, but they don't tell you what to do on a Tuesday afternoon, and that's where the activities come in. They're grouped into five areas covering preparing a secure service, understanding the security landscape, managing cyber security risks, anticipating and responding to vulnerabilities, and maintaining continuous assurance. Most of what sits inside them, from threat modelling to vulnerability management, is work you'll have seen done well on one project and badly on another. What Secure by Design really adds is a clear expectation that it happens, and early enough to change the design.

One activity deserves a closer look, and that's the [self assessment tracker](https://www.security.gov.uk/policy-and-guidance/secure-by-design/activities/tracking-secure-by-design-progress/). The guidance says Secure by Design isn't an assurance process in its own right, yet the tracker gives each delivery phase a low, medium or high confidence profile, and as we've seen a high profile is how the Cyber Security Standard expects you to show compliance. Your SRO and service owner sign it off before it goes to your internal assurance team, so it carries real weight, although the guidance is also clear that a high profile doesn't necessarily mean the service is secure. I find it most useful as an honest picture of progress for the risk owner, because a team that chases the score tends to get the score and very little else.

# **Applying it on a real project**

Whether you're picking this up halfway through delivery or starting something new, there's an order of work I've found holds up well, and it starts with getting the risk owner named before you design anything. That means a senior person with the authority to accept residual risk on behalf of the organisation, such as the SRO or service owner, rather than a security representative or somebody's delegate on the RAID log. Everything downstream depends on it, because a risk that nobody can accept has a habit of turning into a delay six weeks before go-live.

At the same time, get security into the business case. Security work costs money, and if that cost isn't visible in the funding envelope you'll spend the whole build negotiating for it, so include the people you'll need, the assurance activity and the running cost of any monitoring you're promising.

With an owner and a budget in place, do the asset and threat work while the design is still soft. That means documenting what the service is made of, deciding which parts matter most, sourcing a threat assessment and threat modelling the design you're actually proposing, because doing all of that after the build is really just a gap analysis with a nicer name.

The controls set that comes out of that work is a decision, so record it in an [architecture decision record](https://thesolutionarchitect.uk/guide-architecture-decision-records) that says what you chose, what you rejected and the risk appetite you were working to. When somebody asks a year later why the service lacks a control that now looks obvious, that record protects both the decision and the person who made it.

Treat detect and respond as a proper part of the service, with a cost, an owner and a support model of its own. Be specific about who receives an alert, what they do with it and how you'd find out if the pipeline had quietly stopped working.

Procurement is the step architects skip most often, usually because it feels like somebody else's job, until the contract turns out to give you no way of requiring a fix. The Cabinet Office publishes [modular security schedules](https://www.security.gov.uk/policy-and-guidance/contracting-securely/) with Secure by Design requirements built in, in supplier-led, buyer-led and developer versions, and each one ends with an evaluation table that the supplier completes when the buyer requires them to meet the principles. Deciding whether those requirements belong in the contract is the buyer's responsibility, so make sure somebody on your side has actually made that call.

Finally, update the self assessment whenever the design or the evidence changes, rather than waiting for a quarterly reminder, because a document that's refreshed once a quarter will always be telling you about last quarter.

# **Where it gets hard**

In my experience three things make this genuinely difficult, and legacy is the most obvious of them. Principle 6 asks you to update legacy components, yet some of them can't be updated at any sensible price. The honest answer is usually containment and a plan, recorded as a risk somebody has formally accepted, which is also how the policy expects non-compliance to be handled.

Supplier-run services come second, because your ability to meet several of the principles depends almost entirely on what the contract says, and retrofitting those terms later is slow and expensive. That's exactly why the procurement step matters more than its rather dull reputation suggests.

Pace is the third, and the one people talk about least. Doing this properly costs time in discovery and alpha, just when the pressure to show something working is at its strongest. The guidance describes Secure by Design as continuous improvement rather than a compliance process, which is right in spirit, but it can also tempt a team under pressure to keep deferring the harder activities. The confidence profile makes that harder to hide than it used to be, and the best defence is still a risk owner who asks for the self assessment often enough that any deferral shows.

# **Before your next design starts**

Everything I've mentioned lives on [security.gov.uk](https://www.security.gov.uk/policy-and-guidance/secure-by-design/), including a [preparation checklist](https://www.security.gov.uk/policy-and-guidance/secure-by-design/implementation/download-preparation-checklist/) that shows where your organisation stands today. The policy also names zero trust as an example of the adaptable architecture principle 6 is after, so my post on [zero trust](https://thesolutionarchitect.uk/the-end-of-the-trusted-network) makes a natural next read. The best time to read the activities is before your next design starts rather than halfway through your next assurance meeting.

On most of the projects I've worked on, knowing what good security looked like was never the hard part, and what really made the difference was making those decisions early enough for the answer to still change the design.
