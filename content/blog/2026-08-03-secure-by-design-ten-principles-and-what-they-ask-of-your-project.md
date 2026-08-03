---
title: "Secure by Design: ten principles and what they ask of your project"
date: 2026-08-03T09:26:00.000Z
category: Governance
excerpt: Ten mandatory principles, five clusters of activity, and a spend
  approval process that now checks you're following them.
author: The Solution Architect
---
I have written the security section of a design document after every other decision was already settled. The hosting was chosen, the integration pattern agreed, the delivery plan had dates on it, and then somebody asked what the security story was. What I wrote was a description of the controls we could still afford to bolt on. It looked like design. It was closer to an apology.

Most architects working in government have done a version of that, and most of us knew at the time it was the wrong shape. Secure by Design is the policy response to it. It's now mandatory across central government, it sits underneath the Cyber Security Standard and the Service Standard, and it will come up in assurance conversations whether or not you have prepared for it.

Here's what it actually is, why it carries more weight than the phrasing suggests, and how to apply the ten principles on a real project without turning the whole thing into a documentation exercise.

#### What Secure by Design is

Secure by Design aims to improve government's cyber resilience by building security practices into digital delivery from the start, and keeping them there for the whole life of the service. It was developed by the Department for Science, Innovation and Technology with a cross government working group, the Government Security Group, the NCSC and industry contributors. The Government Cyber Unit maintains the guidance now.

It has three parts. The policy sets out who it applies to and what they must do. The principles are ten outcomes a delivery team has to meet. The activities are recommended practices that help you get there, and they are explicitly tailorable.

The ten principles are mandatory for central government departments and arm's length bodies. They are optional for the rest of the public sector, though optional here tends to mean "until your first serious conversation with a department that funds you". If you're a supplier, the requirements reach you through your contract rather than directly, and your buyer's security contact is the person who can tell you which ones apply.

Organisations can add their own principles and reshape the activities to fit how they work, provided the ten core principles are still met. The Ministry of Defense has done exactly that, mapping the approach onto its own environment and project life cycle. That flexibility is real and worth using, because the generic activities are written for a hypothetical average project and yours isn't one.

#### Why it has more weight than it looks

On first reading, Secure by Design sounds like advice. Ten sensible outcomes, some suggested practices, no scoring scheme. Plenty of teams have filed it accordingly. That's a mistake, because it's been wired into several places where money and approval get decided.

The government Cyber Security Standard requires every organisation delivering new digital services or technical infrastructure to meet the ten principles. Service Standard point 9, on creating a secure service that protects users' privacy, tells service teams they must follow them, so it appears at service assessments as well. It's outcome 9 in the Government Cyber Action Plan. The Service Manual folds it into what designing a decent service means.

Then there is spend. The Digital Assurance Playbook replaced the old digital and technology spend control approval process on 1 April 2026, and it tells reviewers to check that initiatives are following their organisation's Secure by Design approach, and that teams are engaging security professionals early. So the mechanism that used to catch a weak Technology Code of Practice answer now catches a weak Secure by Design answer too.

Timescales are staged. Group 1 covers ministerial departments, arm's length bodies running government Critical National Infrastructure, and organisations running the priority government services. Group 2 is everyone else in central government. Chief digital information officers are accountable for adoption in their organisations, which matters more than it sounds, because it means somebody senior has their name against it and will eventually ask you for evidence.

#### The ten principles, read as an architect

The official wording is short and outcome shaped. What follows is each principle with the thing it tends to mean once you are holding a design document.

* **Create responsibility for cyber security risk.** Name a risk owner senior enough to make decisions stick, and make sure they know they own it. This is the principle most often failed quietly. A project with no named risk owner doesn't have a slow security process, it has no security process, because nobody can accept a residual risk.
* **Source secure technology products.** Do continuing due diligence on the platforms, software and code you did not write, and feed findings back to the supplier. Continuing is the operative word. A one off assessment at procurement tells you about a product that no longer exists by the time you go live.
* **Adopt a risk driven approach.** Establish the project's risk appetite, then keep a live assessment of cyber risk. A document written once in discovery doesn't count. Risk appetite in particular is worth pinning down early, because every argument about proportionality later is really an argument about appetite that nobody wrote down.
* **Design usable security controls.** Research how people really work, then design controls they won't route around. Every workaround in a government office started life as a control that made a reasonable task unreasonable.
* **Build in detect and respond security.** Assume you will be compromised at some point and design the logging, monitoring, alerting and response to match. Test it. An alerting pipeline nobody has ever fired in anger is a hypothesis, not a capability.
* **Design flexible architectures.** Build so that new controls can be added later without a rewrite. This is the most architectural principle on the list and the one that quietly justifies a lot of decisions you were going to argue for anyway, such as clean interfaces, externalised configuration and avoiding hard coded trust between components.
* **Minimise the attack surface.** Only the capabilities, software, data and hardware the service needs. It also saves money to run, which is the version of this argument that lands in a business case.
* **Defend in depth.** Layer the controls so one failure doesn't open the whole service. Old idea, still true, and still the thing that separates a design that survives a bad day from one that doesn't.
* **Embed continuous assurance.** Produce evidence that the controls work at go live and keep producing it afterwards. The word continuous is doing real work here, because most assurance in government is still an event.
* **Make changes securely.** Put security into the design, build and deploy process so the security impact of a change is weighed alongside cost and delivery date. If your change advisory process cannot answer "what does this do to our risk position", it isn't doing this.

Read together, they describe a team that owns its own security decisions, with security professionals working alongside it. The older model, where a design goes over the wall to a security function and comes back with conditions attached, is the one being retired. That shift is a bigger cultural change than ten bullet points suggest.

#### From principles to activities

Principles tell you what good looks like. They don't tell you what to do on Tuesday. That's what the activities are for, and they are grouped into five clusters: preparing a secure service, understanding the threats and obligations you are working under, managing cyber security risks, anticipating and responding to vulnerabilities, and maintaining continuous assurance.

Inside those sit the practical pieces of work an architect will recognise. Considering security within the business case. Identifying security resources. Agreeing roles and responsibilities. Understanding business objectives and user needs. Documenting service assets and assessing how important each one is. Sourcing a threat assessment. Threat modelling. A security risk assessment. Agreeing a controls set for the service. Vulnerability management. Observability. Evaluating the security impact of changes. Retiring components securely.

None of it is exotic. Most of it is work you have seen done well somewhere and badly somewhere else. What Secure by Design adds is a stated expectation that it happens at all, at the point in delivery where it can still change the design.

Teams are expected to complete a self assessment as evidence they are meeting the principles. The guidance is careful to say Secure by Design isn't an assurance process in itself, and it means it. The self assessment is there to make progress visible to the risk owner, not to produce a certificate. Treat it as a certificate and you will get the outcome that framing deserves.

#### How to apply it on a real project

If you're picking this up mid delivery, or starting something new and want to do it properly, the sequence below is the one that works.

##### Get the risk owner named before you design anything

Not a security representative, not the SRO's delegate on the RAID log. A senior person with the authority and knowledge to accept a residual risk on behalf of the organisation. Everything downstream depends on this, because a risk you can't get accepted is a risk that turns into a delay six weeks before go live.

##### Put security into the business case, not the design review

The activity is called considering security within the business case for a reason. Security work has a cost, and if that cost isn't visible in the funding envelope, you will spend the whole build negotiating for it. Include the security resource you will need, the assurance activity, and the operating cost of the monitoring you are promising to run.

##### Do the asset and threat work while the design is still soft

Document what the service is made of, decide which parts matter most, get a threat assessment, then threat model against the design you are proposing. Doing this while you can still change the design is the entire point. Doing it after the build is a gap analysis with a nicer name.

##### Agree a controls set and write down what you rejected

The controls set is a decision, and decisions belong in architecture decision records. Record what you chose, what you rejected, and the risk appetite you were working to. Twelve months later, when someone asks why the service doesn't have a control that now looks obvious, that record is what protects both the decision and the person who made it.

##### Design the detect and respond capability as part of the service

Logging, monitoring, alerting and response are service components with cost, ownership and a support model, so treat them that way. Say who receives the alert, what they do with it, and how you will find out that the pipeline has silently stopped working.

##### Handle it properly in procurement

The Cabinet Office publishes modular security schedules for contracting, with Secure by Design requirements built in. There are supplier led, buyer led and developer variants, and each has a Secure by Design evaluation table at the end that the supplier completes when the buyer requires them to meet the principles. As the buyer, it is your responsibility to assess the contract against the scope of Secure by Design and decide whether those requirements belong in it. Suppliers can use the same table to cross reference how their security management plan meets each principle.

This is the part architects most often skip, on the grounds that procurement is somebody else's job. It isn't somebody else's job when the resulting contract has no mechanism for you to require a fix.

##### Keep the assessment alive

Update the self assessment when the design changes, not on a quarterly reminder. The value is in noticing the gap early, and a document refreshed once a quarter can't do that.

#### Where it gets hard

Three places, in my experience.

Legacy is the obvious one. Principle 6 asks you to update legacy components so new controls can be added, and some of those components can't be updated at any sensible price. The honest answer is usually containment and a plan, recorded as a risk somebody has formally accepted, not a pretense that the principle is met.

Supplier delivered services are the second. If a supplier built and runs the thing, your ability to meet several principles depends entirely on what your contract says. Retrofit is slow and expensive, which is why the procurement point above matters more than its dull heading suggests.

Pace is the third, and the least discussed. Doing this properly costs time in discovery and alpha, and the pressure to show something working is real. The guidance frames Secure by Design as continuous improvement rather than a compliance gate, which is generous and correct, and also means a team under delivery pressure can defer it indefinitely while technically still improving. The defense against that is the risk owner asking for the self assessment often enough that deferral becomes visible.

#### The short version

Secure by Design asks delivery teams to own their security risk, work it into the design early, and keep showing that the controls work. Ten principles, five clusters of activity, a self assessment to make progress visible, and enough policy underneath it that ignoring it will eventually cost you an approval.

If you want the source material, the principles, policy, activities and implementation guidance all sit on security.gov.uk, and there is a preparation checklist you can download to see where your organisation currently stands. Read the activities before your next design starts rather than during your next assurance meeting.

For most of the projects I have worked on, knowing what good security looked like was never the hard part. Making the decisions early enough that the answer could still change the design was.
