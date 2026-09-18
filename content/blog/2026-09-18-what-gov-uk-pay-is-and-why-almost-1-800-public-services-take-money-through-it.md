---
title: What GOV.UK Pay is, and why almost 1,800 public services take money through it
date: 2026-09-18T11:43:00.000Z
category: Government
excerpt: GOV.UK Pay is the shared payment platform behind almost 1,800 public
  services. What it does, who can use it, what it costs, and who processes the
  money.
author: The Solution Architect
---
Renewing a passport. Paying a parking fine. Sending money to someone in prison. Registering a birth certificate copy. A great many interactions with the state end with a payment, and every one of those payments needs a card form, a receipt, a refund route, a way of proving the transaction happened, and a way of getting the money into the right bank account.

For most of the history of digital government, every organisation solved that problem on its own. GOV.UK Pay exists so they don't have to. It is a shared payment platform built by the Government Digital Service, and in its first decade it has [handled close to £10 billion across almost 1,800 public services](https://gds.blog.gov.uk/2026/09/02/gov-uk-pay-at-10-how-it-started-and-how-its-going/).

The technology is the least interesting part of it. The argument behind it is that a payment page is the last thing a government service should have to build for itself.

#### **The problem it was built to solve**

GDS describes the pre-Pay world in [two images](https://gds.blog.gov.uk/2026/09/02/gov-uk-pay-at-10-how-it-started-and-how-its-going/). At one end, "cheques being posted accompanied by home-printed PDF forms". At the other, "commercially-branded, inaccessible payment pages".

The second is the more damaging of the two. A user part-way through a GOV.UK service would be handed off to a page carrying a payment supplier's logo, styled nothing like the service they started in, and often failing basic accessibility standards. Every organisation that wanted to take card payments had to procure a provider, meet the Payment Card Industry Data Security Standard, handle its own refunds and disputes, and build the page. Hundreds of public bodies were each solving an identical problem, badly and expensively.

The first service to move onto the platform was the Ministry of Justice's "Send money to someone in prison". The pattern it set has held for everything since: the service handles the thing the user came to do, and the platform handles the money.

#### **What it actually does**

Pay provides hosted payment pages in the GOV.UK style. A service creates a payment through the API, redirects the user to Pay, and gets the result back. Card details never touch the service's own systems, which is where most of the compliance saving comes from.

It [takes card payments, Apple Pay and Google Pay, payments over the phone or by post (MOTO), and recurring payments](https://www.gov.uk/government/publications/govuk-pay/govuk-pay) on a schedule the organisation sets. Refunds, full or partial, can be issued from the admin tool or the API. There is reporting and reconciliation data, payout tracking, dispute records, and webhooks for payment events. Pages can carry the organisation's own logo and colours, be shown in Welsh, and return the user to a page the service controls once the payment finishes. The platform is WCAG 2.1 AA compliant and PCI DSS compliant, and it integrates with GOV.UK Forms and finance software.

[Payment links, added in 2018](https://gds.blog.gov.uk/2026/09/02/gov-uk-pay-at-10-how-it-started-and-how-its-going/), matter more than the feature list suggests. They let a team with no developers produce a working payment page for a fee, which is how a lot of smaller organisations start.

#### **Who can use it, and what it costs**

Most of the public sector is [eligible](https://www.payments.service.gov.uk/using-govuk-pay/): central government departments, local authorities, the armed forces, the NHS including trusts, and emergency services. The exclusions are narrow but real. Public bodies cannot use it for commercial purposes, and organisations classified as "enterprises" under the Subsidy Control Act 2022 cannot use it at all.

The pricing is unusual enough to state plainly. "[GOV.UK Pay is free to use. You only pay transaction fees to your Payment Service Provider (PSP)](https://www.payments.service.gov.uk/cost-benefits-of-pay/)." There is no licence fee, no minimum transaction volume, and no charge for training, software upgrades, new feature releases, branding, PCI DSS compliance or accessibility updates. The only cost an adopting organisation carries is the per-transaction fee it would pay any card processor.

Getting started is deliberately quick. Creating an account takes a couple of minutes, and an organisation can be taking real payments the same day using payment links. Building a full API integration is a project; putting a fee online is not.

#### **Two payment providers, split along an old line**

Behind the platform sit two commercial card processors, and which one an organisation gets depends on whether it is a Crown body.

Central government, arm's length bodies and the NHS use Worldpay, contracted through Government Banking. Everyone else — local authorities, police forces, the armed forces, government-owned charitable groups — uses GOV.UK Pay's own non-Crown provider, which is now [Adyen, replacing Stripe](https://gds.blog.gov.uk/2026/06/02/building-for-the-future-making-change-simple-on-gov-uk-pay/). Around 1,000 services are moving across, and GDS's position is that "there will be no discernible difference for paying users and no loss in functionality".

The Adyen arrangement is also the route to pay by bank, which is in development. GDS expects it to "reduce fraud and lost payments, as well as saving significant money for government", which is a reasonable expectation given that bank-to-bank payments avoid card interchange entirely.

This is the quiet advantage of a shared platform. A change of card processor affecting a thousand services was negotiated and delivered centrally. Under the old model it would have been a thousand separate procurements.

#### **What the numbers look like after ten years**

Pay [took four years to process its first £1 billion](https://gds.blog.gov.uk/2026/09/02/gov-uk-pay-at-10-how-it-started-and-how-its-going/). It now does that in roughly five months.

The current figures: nearly £10 billion in total, across more than 135 million transactions, on almost 1,800 services run by over 600 organisations, at [more than 70,000 payments a day](https://www.payments.service.gov.uk/). The largest single user is HM Passport Office, which joined in 2020 and puts through 6.5 to 7 million transactions a year; its busiest month on record was January 2023, at 1.11 million payments.

Local government adoption tells a more interesting story. 157 UK local authorities use Pay, which is 41% of them, and they accounted for 3.5 million transactions in 2025-26. That also means the majority of councils are not yet on the platform. Satisfaction among adopting organisations sits at a Net Promoter Score of +40, with 90% reporting satisfaction in the 2025 survey, up from 83% the year before.

#### **What it does not do**

Pay is a payment platform, not a finance system. Matching payments to ledgers, chasing exceptions and closing the books remain the organisation's job. It will not tell anyone whether the fee is set correctly, whether the service should be charging at all, or whether the payment step sits in the right place in the user's task. Those are service design and policy questions, and adopting a shared platform does not answer them.

It also does not remove transaction fees, and Crown bodies do not get a choice of processor. And GDS itself has [moved department twice in as many years](https://www.gov.uk/government/news/machinery-of-government-changes-fact-sheet), from the Cabinet Office to DSIT and, in 2026, into the Department for Digital, Culture, Media and Sport. That is a fair question for any organisation weighing up a dependency, though the platform has outlasted every reorganisation so far.

A shared payment platform is unglamorous infrastructure, and that is the point of it. The real measure of GOV.UK Pay is how few of the people using it have any idea it is there.
