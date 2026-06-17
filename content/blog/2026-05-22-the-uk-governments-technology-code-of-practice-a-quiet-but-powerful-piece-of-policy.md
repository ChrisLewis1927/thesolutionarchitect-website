---
title: "The UK Government's Technology Code of Practice: a quiet but powerful
  piece of policy"
date: 2026-05-28T09:00:00.000Z
category: Governance
excerpt: "The Technology Code of Practice is a set of criteria used to design,
  build and buy technology in central government. It's owned jointly by the
  Government Digital Service and the Central Digital and Data Office, and it
  sits at the heart of the Cabinet Office spend control process. "
author: The Solution Architect
---
If you've ever wondered why a particular government service feels coherent, works on your phone, lets you sign in without three printed forms, and doesn't ask you the same question twice, there's a reasonable chance the team behind it was working to the Technology Code of Practice. It rarely gets headlines, but it shapes a lot of what gets built and bought across UK public sector technology.

Here's what it is, why it exists, and what each of its thirteen points actually asks teams to do.

#### What it is

The Technology Code of Practice (TCoP, if you're being efficient) is a set of criteria used to design, build and buy technology in central government. It's owned jointly by the Government Digital Service and the Central Digital and Data Office, and it sits at the heart of the Cabinet Office spend control process. In practical terms, that means if a department wants approval to spend money on a digital or technology project above a certain threshold, it needs to show how the project aligns with the TCoP. Local authorities use it too, via the Local Digital Declaration.

It was first published in its current form in July 2021, though the underlying ideas go back to a 2013 version. A twelfth point on sustainability was added in November 2021, and the document was last refreshed in July 2025 to reflect the move of the assurance function back to GDS.

It's not a prescriptive standard like ISO 27001. It's a checklist of principles, each backed by more detailed guidance, that pushes teams toward good decisions and away from the kinds of mistakes that have produced expensive legacy systems in the past.

#### The thirteen points



##### 1. Define user needs

Start with research. Understand who you're building for and what they actually need to do, rather than building what someone in a meeting room assumed they need. This is the principle that links the TCoP to the wider Government Design Principles and the Service Standard.

##### 2. Make things accessible and inclusive

Technology paid for by the public has to work for the public. That includes disabled users, people on low-spec devices, and people whose English is shaky. This is a legal requirement under the Public Sector Bodies Accessibility Regulations, not just a nice-to-have.

##### 3. Be open and use open source

Publish code by default. Use open source where it fits. The reasoning is transparency, but also accountability: it's harder to hide a bad decision in a public GitHub repo, and other teams can reuse what you've built.

##### 4. Make use of open standards

Build on open standards so your kit can talk to other kit. This is the principle that prevents a department buying a system today that can't exchange data with a system bought three years from now.

##### 5. Use cloud first

Public cloud should be the default. The Cloud First policy, which this point reflects, has been in place since 2013 and was reconfirmed when the TCoP was rewritten. There are exceptions for genuine reasons, usually security or data sovereignty, but the burden of proof sits with anyone proposing on-premise infrastructure.

##### 6. Make things secure

Apply security proportionate to the risk. The TCoP doesn't reinvent security guidance. It points teams at the National Cyber Security Centre's design principles and at standards like Cyber Essentials.

##### 7. Make privacy integral

Build privacy in from the start, not bolted on at the end. Data Protection Impact Assessments, minimisation of personal data, and clear lawful bases for processing under UK GDPR all sit under this point.

##### 8. Share, reuse and collaborate

If another department has already built it, use theirs. Common platforms like GOV.UK Notify, GOV.UK Pay and One Login exist precisely so that fifteen teams don't each build their own slightly worse version of the same thing.

##### 9. Integrate and adapt technology

Your shiny new system has to work with the unglamorous old systems already in place, and it has to be able to change when requirements change. This is the antidote to the "big bang replacement" projects that have historically gone wrong.

##### 10. Make better use of data

Treat data as an asset. Improve how you collect it, store it, share it (where appropriate) and analyse it. The point links to the broader National Data Strategy work.

##### 11. Define your purchasing strategy

Think commercially. Avoid lock-in. Break large contracts into smaller pieces where it makes sense. Plan for what happens when a contract ends, including how you get your data and capability back from a supplier.

##### 12. Make your technology sustainable

Added in late 2021, this point asks teams to think about the environmental impact of technology decisions across the whole lifecycle: energy use, embodied carbon in hardware, end-of-life disposal, and so on. It's the newest principle and probably the one with the most room to mature.

##### 13. Meet the Service Standard

If what you're building is a service rather than just back-end technology, you also need to pass the Service Standard, a separate but related set of fourteen points used at service assessments.

#### What it actually changes in practice

Reading the points, you might think they're obvious. Most of them are. The TCoP's power isn't in surprising anyone. It's in giving spend control reviewers a shared vocabulary to push back on weak proposals. If a business case says "we'll build this on-premise because that's how we've always done it," a reviewer can point at point 5 and ask for a stronger justification. If a team has skipped user research, point 1 is right there.

It also gives teams something to point at internally. "The TCoP says we need to consider this" carries weight in conversations with senior stakeholders who might otherwise prefer the comfortable option.

#### Where it falls short

The TCoP are principles, not enforcement. A determined department can produce a business case that ticks every box on paper and still ship something nobody asked for. The sustainability point in particular is still light on practical metrics. There's guidance on what to think about, but less on how to measure whether you've done it well.

It also doesn't address some of the harder questions in government technology today: how to handle AI procurement, what to do about the build-versus-buy decision when capable suppliers are scarce, or how to manage the long tail of legacy systems that can't realistically meet the standard. These are areas where guidance is evolving alongside the core code.

#### The short version

If you're working on a public sector technology project in the UK, the TCoP is the document you should be able to recite from memory by the end of your first month. Even if you're outside government, it's a useful lens. Most of the principles travel well to any organisation buying or building digital services.

You can read the current version, with links to detailed guidance on each point, at [gov.uk/guidance/the-technology-code-of-practice.](gov.uk/guidance/the-technology-code-of-practice.)
