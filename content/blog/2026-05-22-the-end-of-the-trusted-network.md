---
title: The end of the trusted network
date: 2026-06-04T10:28:00.000Z
category: Architecture
excerpt: "For decades, network security worked like a castle: thick walls, a
  guarded gate, and the assumption that anyone inside belonged there. That model
  is finished. Applications have left the data centre, users have left the
  office, and attackers have learned to walk through the front door. Here's what
  Zero Trust actually means, why the perimeter died, and why UK government
  architects can no longer treat it as optional."
author: The Solution Architect
---
For decades, network security looked something like a medieval castle. You built thick walls (firewalls, VPNs, network segregation), and once someone made it past the gate you mostly trusted them. The crown jewels sat in the middle, protected by the assumption that anyone close enough to touch them must belong there.

That model no longer works on its own. It has been failing for years, but the past decade made it impossible to pretend otherwise.

# **Why the walls came down**

Three things broke the perimeter, and none of them are reversing:

1. **Your applications left the data centre:** They're in AWS, Azure, three different SaaS platforms, and a vendor's environment you don't even have a contract with. The perimeter you spent years hardening now wraps around an empty building.
2. **Your users left the office:** They work from kitchens and trains and hotel lobbies, on devices you may or may not own. Routing everything through the corporate VPN became a bottleneck, and a successful VPN login said nothing about whether the person or the device behind it deserved access to everything on the other side.
3. **Attackers got better:** Phishing a credential, compromising a contractor, slipping malware into a software update. the NCSC describes it as [common in breaches](https://www.ncsc.gov.uk/collection/zero-trust/introduction) for an attacker to gain a foothold and then move sideways, because everything already on the network is trusted. Once they were in, the castle worked against the defender.

"Inside the network" was only ever a stand-in for "trustworthy", and it stopped being a good one.

# **What Zero Trust actually means**

Zero Trust, a term [John Kindervag coined at Forrester in 2010](https://www.nist.gov/blogs/taking-measure/zero-trust-cybersecurity-never-trust-always-verify), is the response to all of this. The shorthand is "never trust, always verify". Every request, whether internal or external, human or machine, on a corporate laptop or a personal phone, gets authenticated and authorised on its own merits. Network location stops being enough on its own, identity, device and context carry the decision.

The name does oversell it slightly. As the NCSC [points out](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust), there is plenty of trust in a zero trust architecture, it just has to be earned for each request, and can't be inherited from the network.

[Microsoft's three guiding principles](https://learn.microsoft.com/en-gb/security/zero-trust/) are the most quoted summary:

1. **Assume breach:** Design as though the attacker is already on your network. Once you do, encrypting internal traffic and microsegmentation look like common sense.
2. **Verify explicitly:** Make access decisions on everything you know: who the user is, whether their device is healthy, where they're coming from, what they're trying to reach, whether the request looks anything like their normal behaviour. No single factor is enough.
3. **Least privilege:** Give the minimum access required, for the shortest sensible duration. When something does go wrong, and it eventually will, you want the damage to stay small.

The NCSC's [eight zero trust architecture design principles](https://www.ncsc.gov.uk/collection/zero-trust/architecture-design-principles) cover the same ground in more detail, and they are the better reference for a UK government design.

# **What this looks like in practice**

You can't buy a Zero Trust architecture as a product. You assemble it from capabilities, usually over years.

Identity sits at the heart of the approach, with strong multi-factor authentication applied to all users (not just admins) and SSO managed through a central identity provider. Conditional access policies add another layer of protection by assessing factors such as the user, device, location and level of risk before granting access. Increasingly, we are are also adopting passwordless authentication using technologies such as FIDO2 security keys or certificates, reducing reliance on passwords and providing stronger protection against phishing attacks.

Devices become a trust signal. A managed laptop with full-disk encryption, current patches and working endpoint protection is treated differently from a random tablet on a hotel Wi-Fi. BYOD doesn't have to mean unrestricted access, it usually means web-only access, virtual desktops, or some other form of containment.

The network itself becomes untrusted by default. Traffic between services is encrypted even inside your own environment whilst microsegmentation limits what any compromised host can reach. Private applications sit behind connectors or proxies and have no public address, so there is less for an attacker to find.

Applications and APIs participate too. Every service authenticates the caller and service-to-service traffic uses mutual TLS or signed tokens. The days of "the call came from inside the cluster, so it must be fine" are over.

And underneath all of this sits data: classified by sensitivity, encrypted at rest and in transit, monitored for unusual access patterns, with every read and write logged somewhere a security team can review.

# **What it costs**

None of this is free. The NCSC [says plainly](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust) that zero trust can be costly, disruptive and resource-intensive, and that existing controls should stay in place until the new ones give equal protection. That includes the VPN: the two can run side by side, and replacing it is not the goal. Some legacy systems can't take part at all, which leaves you running a [mixed estate](https://www.ncsc.gov.uk/guidance/zero-trust-building-a-mixed-estate) with those systems fenced off, and the identity provider and policy engine become things your whole organisation depends on, so they need the resilience and emergency access to match.

# **The UK government angle**

For anyone building services in UK government, zero trust is certainly the direction of travel, though it isn't a mandate. The NCSC publishes [zero trust guidance](https://www.ncsc.gov.uk/collection/zero-trust), and the government's [Secure by Design](https://www.security.gov.uk/policy-and-guidance/secure-by-design/policy/) policy names zero trust as an example of the adaptable, risk-based security architecture it expects (I've written about [Secure by Design's ten principles](https://thesolutionarchitect.uk/secure-by-design-ten-principles-and-what-they-ask-of-your-project) separately). The NCSC also asks you to decide if your risks warrant it, or whether targeted controls would do the same job. The US went further, a 2022 White House memo ([M-22-09)](https://zerotrust.cyber.gov/federal-zero-trust-strategy) required federal civilian agencies to work to a zero trust strategy.

In my experience the questions arrive whether or not there's a mandate. At design review and at governance boards, the architects and the cyber teams ask how a design handles zero trust. A VPN diagram and a perimeter firewall on their own won't answer them.

# **Where to start**

The biggest mistake is treating Zero Trust as a single project with a launch date. Nobody flips a switch and arrives. The teams making real progress pick their highest-risk areas, usually privileged access, admin tooling, or sensitive data stores, and apply Zero Trust thinking there first. They get identity, device posture, and least privilege right in one place, prove the model works, then expand outwards.

The castle walls still have a job, but they are no longer the whole defence. What gets built alongside them is years of patient work, and as the NCSC puts it, you never complete it.
