---
title: What GOV.UK One Login actually gives you
date: 2026-09-10T17:30:00.000Z
category: Government
excerpt: "GOV.UK One Login is two products wearing one name: a sign-in service
  and an identity checking service, chosen separately. What each level actually
  means, what the integration involves, and what you inherit by adopting it."
author: The Solution Architect
---
Every department has the same conversation at some point. A service needs users to sign in. Someone suggests building an account system. Someone else asks whether they are supposed to be using One Login, and nobody in the room can say with confidence what that would actually mean.

GOV.UK One Login is two products wearing one name. Working out which one you're buying is most of the job.

### **Where it came from**

GOV.UK Verify closed to new users in April 2023 after years of poor coverage. Government Gateway, the thing most people actually used, dates from 2001 and HMRC and others have been quietly dependent on it ever since. Between them they left central government with dozens of separate account systems, each with its own password reset flow, its own support queue and its own view of who you are.

One Login is the answer, built by GDS, which since DSIT's abolition in July 2026 sits in the reconstituted Department for Digital, Culture, Media and Sport (DCMS). The numbers are no longer small: as of October 2025 more than 13.2 million people had proven their identity through it, and by January 2026 it had reached 122 integrated services. HMRC began routing new users through it in February 2026, which is the point at which it stopped being an experiment.

### **Sign-in and identity are two different things**

This is the distinction that catches teams out. One Login does authentication and it does identity verification, and you choose them separately.

Authentication answers "is this the same person who made this account?" It comes in two levels. Cl is email and password only, which suits a service holding nothing personal. Cl.Cm adds two-factor by SMS or authenticator app, and it is the default.

Identity confidence answers a different question: "is this person who they say they are in the real world?" That is P0 (don't ask), P1 (low confidence, enough to make synthetic identities harder) or P2 (medium confidence, which is where most services with real consequences land). Any identity confidence at all requires Cl.Cm underneath it.

Plenty of services need the first and not the second. Booking an MOT doesn't require proof of who you are. Claiming money does. Settle which one your service genuinely needs before anyone opens the technical documentation, because that choice drives cost, journey length and drop-off far more than any code you will write.

### **What the integration looks like**

OpenID Connect, authorisation code flow. If you have integrated with any OIDC provider you already know the shape: pull the discovery metadata, send the user to /authorize, swap the code for tokens, call /userinfo.

The setup is generating a key pair, registering for a client ID, configuring your sector identifier and redirect URIs, and choosing your vectors of trust. You build against an integration environment first, with separate production configuration when you are ready. PKCE and JWT-secured authorisation requests are both supported.

User attributes come through scopes and claims, and at P2 those can include address, passport and driving licence data. Ask for the minimum. Every claim you request is a data protection conversation you will have to have later, and the more you take the harder your DPIA gets.

For a competent team this is a sprint, maybe two. The technical integration has never been the expensive part.

### **Proving who someone is**

If you ask for identity confidence, One Login does the checking and hands you the result. Users can do it in the app by scanning a photo ID, or through the website using documents and knowledge-based questions.

The route people forget is the in-person one. Someone enters their details online, picks a branch, then takes a customer letter and photo ID to a participating Post Office, where staff scan the document and take their photo. The result usually arrives by email within a day.

That matters more than it sounds. Every digital identity scheme fails the same group of people, and having a counter someone can walk up to is the difference between an inclusive service and one that quietly excludes anyone without a smartphone and a passport.

### **What you are signing up to**

Adopting a central platform means adopting its constraints and its risk register.

One Login is still in beta and not everything has moved. Universal Credit, to pick the obvious example, doesn't use it. The Government Gateway migration for existing users is under way rather than finished, and the stated aim of replacing every sign-in route on GOV.UK runs to 2030. If your service has an existing user base, that migration is yours to plan.

The assurance position deserves reading properly rather than taking on trust. A GovAssure review reported in May 2025 found One Login met 21 of the 39 outcomes in the Cyber Assessment Framework, up from five the year before, and its Secure by Design implementation target slipped from January to October 2025. That is a programme improving quickly from a bad start. It is still a risk your SRO accepts on your behalf, and they should accept it knowingly.

The counterweight is real, though. You get no password storage, no account recovery flows, no bespoke 2FA, no identity checking operation, and a sign-in journey tested against more users than your service will ever see. That is a great deal of undifferentiated work you never have to build or maintain.

Which leaves one question worth answering honestly at the start of a discovery rather than the end of a build. Does your service have a genuine reason to be different? Most don't. Writing your own sign-in to find that out is an expensive way to learn it.
