---
title: "The UK Government's Technology Code of Practice: a quiet but powerful
  piece of policy"
date: 2026-11-24T17:07:00.000Z
category: Governance
excerpt: The Technology Code of Practice is a set of criteria to help government
  design, build and buy technology. Here's what its thirteen points ask of
  teams, who checks it now that spend controls have gone, and where it falls
  short.
author: The Solution Architect
---
If you've ever wondered why a particular government service feels coherent, why it works on your phone, why it lets you sign in without three printed forms or why it doesn't ask you the same question twice, there's a good chance the Technology Code of Practice had a hand in it. It rarely makes headlines, but it shapes a lot of what gets built and bought across UK public sector technology, so here's what it is and what each of its thirteen points asks of teams.

# **What it is**

The Technology Code of Practice (TCoP, if you're being efficient) is a set of criteria to help government design, build and buy technology. The Government Digital Service publishes it and describes it as the agreed standard for cross-government projects and programmes.

It applies to any technology project, whatever the budget, and the guidance asks teams to follow as many of its points as are practical. Until April 2026 it was also one of the standards assurers weighed under digital and technology spend controls, but those controls have since been [removed](https://www.gov.uk/government/publications/digital-assurance-playbook/digital-assurance-playbook) and departments now make most of their own spending decisions. 

Unlike ISO 27001, there's no certificate at the end of it, just thirteen principles, each backed by more detailed guidance, that steer teams away from the kinds of mistakes that produced expensive legacy systems in the past.

# **The thirteen points**

## **1. Define user needs**

Start by understanding who you're building for and what they need to do, rather than building what someone in a meeting room assumed they'd need. There's no sensible way to judge a technology choice until you know who it's for.

## **2. Make things accessible and inclusive**

Technology paid for by the public has to work for the public, including disabled people, people on older or low-spec devices and people who aren't confident with English. For most public sector websites and apps it's the law as well, since the [accessibility regulations](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps) expect them to meet WCAG 2.2 at level AA unless an exemption applies.

## **3. Be open and use open source**

Publish your code and use open source software, which the TCoP says improves transparency, flexibility and accountability, with the practical bonus that other teams can reuse what you've built.

## **4. Make use of open standards**

Build on open standards so your technology can talk to other technology and be upgraded or expanded later. That's what helps stop a department buying a system today that can't exchange data with the one it buys three years from now.

## **5. Use cloud first**

Consider public cloud before anything else. The [Cloud First policy](https://www.gov.uk/guidance/government-cloud-first-policy) has been around since 2013 and was last reviewed in 2023, and it's mandatory for central government and strongly recommended for the rest of the public sector. You can still choose something else, but you have to be able to evidence the decision, the business case and the value for money behind it.

## **6. Make things secure**

Keep systems and data safe with security that's proportionate to the risk. The TCoP doesn't reinvent security guidance, so point 6's own page, last updated in 2021, points to HMG security policy and the National Cyber Security Centre's guidance. The main TCoP page now also sends teams to Secure by Design, which I've [covered separately](https://thesolutionarchitect.uk/secure-by-design-ten-principles-and-what-they-ask-of-your-project).

## **7. Make privacy integral**

Build privacy in from the start rather than bolting it on at the end. In practice that means collecting only the personal data you need, having a clear lawful basis for processing it under UK GDPR, and carrying out a data protection impact assessment wherever the processing is likely to be high risk.

## **8. Share, reuse and collaborate**

Before building something new, find out whether government has already solved the problem, and make whatever you build easy for others to reuse. Common platforms like [GOV.UK Notify](https://thesolutionarchitect.uk/gov-uk-notify-the-messaging-you-don%E2%80%99t-have-to-build), [GOV.UK Pay](https://thesolutionarchitect.uk/what-gov-uk-pay-is-and-why-almost-1-800-public-services-take-money-through-it) and [GOV.UK One Login](https://thesolutionarchitect.uk/what-gov-uk-one-login-actually-gives-you) exist precisely so that fifteen teams don't each build their own slightly worse version of the same thing.

## **9. Integrate and adapt technology**

New technology has to work with the unglamorous systems you already have, and the guidance asks for a considered, risk-aware approach to anything new or emerging. Taken together, they make a good argument against big bang replacements, where everything changes at once.

## **10. Make better use of data**

Treat data as an asset and improve how you collect, store, share and analyse it. The guidance leans on the Data Standards Authority and the Data Ethics Framework.

## **11. Define your purchasing strategy**

Think commercially as well as technically. The guidance favours breaking work into smaller contracts where that improves value, warns against customisations that stop you upgrading later, and asks for a break clause of no more than two years where that's economic. It also wants contracts to be explicit about who owns government data, and asks you to plan how knowledge and capability come back when a contract ends.

## **12. Make your technology sustainable**

The newest point, added in November 2021, asks teams to think about sustainability across the whole lifecycle of their technology, from the energy it uses to how long its equipment lasts and what happens to it at the end, whether that's reuse, buy-back or recycling.

## **13. Meet the Service Standard**

If you're building a service as part of the project, it also has to meet the [Service Standard](https://www.gov.uk/service-manual/service-standard), a separate set of fourteen points covering how to design, build and run a service.

# **What it changes in practice**

Most of the points seem obvious once you've read them, and their real value is the shared vocabulary they give assurers for pushing back on weak proposals. If a business case says "we'll host this on-premises because that's how we've always done it", an assurer can point at point 5 and ask for the evidence.

It gives teams something to point at internally too, because "the TCoP says we need to consider this" carries weight with senior stakeholders who might otherwise prefer the comfortable option.

# **Where it falls short**

How hard the TCoP bites depends on who's checking, and since spend controls went, that's mostly your own department. [G-Cloud](https://thesolutionarchitect.uk/what-g-cloud-is-and-why-so-much-public-sector-technology-is-bought-through-it) suppliers are contractually required to support buyers in meeting it, but a determined department can still produce a business case that ticks every box on paper and ship something nobody asked for.

The sustainability point is the clearest gap, because it asks you to measure and report your progress without saying which ICT measures to use. On AI, the TCoP does little more than point you to the [AI Playbook for the UK Government](https://www.gov.uk/government/publications/ai-playbook-for-the-uk-government), which is where the real guidance lives.

# **The short version**

If you work on UK public sector technology, it's worth knowing the TCoP well by the end of your first month, and most of its principles travel well beyond government too. You can read the current version, with links to the detailed guidance on each point, at [gov.uk/guidance/the-technology-code-of-practice](https://www.gov.uk/guidance/the-technology-code-of-practice).
