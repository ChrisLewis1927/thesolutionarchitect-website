---
title: The end of the trusted network
date: 2026-11-24T17:05:00.000Z
category: Architecture
excerpt: For decades, network security worked rather like a medieval castle. You
  built thick walls out of firewalls, VPNs and network segregation, and once
  someone was through the gate you mostly trusted them. The crown jewels sat in
  the middle, protected by the assumption that anyone close enough to touch them
  must belong there, and that model no longer works on its own.
author: The Solution Architect
---
For decades, network security worked like a medieval castle. You built thick walls out of firewalls, VPNs and network segregation, and once someone was through the gate you mostly trusted them. The crown jewels sat in the middle, protected by the assumption that anyone close enough to touch them must belong there. That model no longer works on its own.

# **Why the walls came down**

Three changes broke the perimeter. Firstly, applications left the data centre. Many of them now sit across AWS, Azure and a handful of SaaS platforms, so the perimeter you spent years hardening wraps around a building that now has very little inside of it. 

Secondly, users left the office, and now work from kitchens, trains and hotel lobbies on devices you may or may not own. Routing it all through a corporate VPN created a bottleneck, and a successful VPN login often proved little more than that the credentials were valid, not that the device was healthy or that the person needed everything on the other side.

Finally, attackers got better at getting in, whether by phishing a password, compromising a contractor or hiding malware in a software update. The National Cyber Security Centre (NCSC) notes that it's [common in breaches](https://www.ncsc.gov.uk/collection/zero-trust/introduction) for an attacker to gain a foothold and then move sideways across the network, which works because everything already on the network is trusted. Being inside the network was only ever a stand-in for being trustworthy, and it stopped being a good one.

# **What zero trust actually means**

A [NIST blog post](https://www.nist.gov/blogs/taking-measure/zero-trust-cybersecurity-never-trust-always-verify) credits John Kindervag with coining the term zero trust while he was at Forrester Research in 2010, and its shorthand is "never trust, always verify". In a zero trust architecture, the network loses its built-in trust, so every request, from inside or outside and from a person or a machine, is checked against an access policy on its own merits. Network location stops being enough, and identity, device and context carry the decision instead.

The name oversells it slightly, as the NCSC [points out](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust), because there's still plenty of trust in a zero trust architecture, it just has to be earned and kept up for each request, rather than inherited from the network.

Microsoft sums it up in [three guiding principles:](https://learn.microsoft.com/en-gb/azure/security/fundamentals/zero-trust) 

* **Verify explicitly** means basing every access decision on everything you know, such as the user, the health of their device, their location and whether the request looks normal for them. 
* **Use least privilege access** means giving the minimum access for the shortest sensible time, so the damage stays small when something goes wrong.  
* **Assume breach** means designing as though the attacker is already inside, at which point encrypting internal traffic and segmenting the network start to look like common sense. 

For a UK government design, the NCSC's [seven zero trust architecture design principles](https://www.ncsc.gov.uk/collection/zero-trust/architecture-design-principles) cover the same ground in more depth and make the better reference.

# **What it looks like in practice**

The NCSC describes zero trust as an architectural approach rather than something you can buy off the shelf, so you assemble it from capabilities.

Identity sits at the heart of it. That means strong multi-factor authentication for every user rather than just administrators, single sign-on through a central identity provider, and conditional access policies that weigh up the user, device, location and risk before letting a request through. Passwordless sign-in with FIDO2 security keys or certificates goes further still, because both resist phishing far better than passwords and one-time codes.

Devices become a trust signal as well. A managed laptop with full-disk encryption, current patches and working endpoint protection is treated differently from an unknown tablet on hotel Wi-Fi. Personal devices often get a more contained kind of access, such as browser-only access or a virtual desktop, rather than being shut out altogether.

The network itself is treated as untrusted, so traffic between services is encrypted even inside your own environment and microsegmentation limits what a compromised host can reach. Private applications can sit behind connectors or proxies with no public address, which leaves less for an attacker to find. Applications and APIs authenticate every caller too, using mutual TLS or signed tokens between services, rather than trusting a call because it came from inside the cluster. Underneath it all, data is classified by sensitivity, encrypted at rest and in transit, and access to it is logged where your security team can review it.

# **What it costs**

None of this is cheap or quick. The NCSC [warns](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust) that zero trust can be expensive, disruptive and demanding on resources, and that a full migration may mean rearchitecting many systems over several years. It doesn't mean ripping out what you have, either, since zero trust and a VPN can work together, provided traffic isn't trusted just because it arrived through the VPN.

Some legacy systems were never designed for this, so you may end up running a [mixed estate](https://www.ncsc.gov.uk/guidance/zero-trust-building-a-mixed-estate), with those systems kept in tightly defined segments while stronger controls go in everywhere else. Resilience matters more, too, because once access depends on an identity provider and a policy engine, an outage there can lock people out of the systems they need, so recovery and emergency access have to be part of the design.

# **The UK government angle**

The government's [Secure by Design policy](https://www.security.gov.uk/policy-and-guidance/secure-by-design/policy/) doesn't mandate zero trust itself, but it does require risk-based and adaptable security architectures and gives zero trust as an example of one. Zero trust isn't automatically the right answer, either, and the NCSC [says it should be adopted deliberately](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust), starting from your own organisation's security challenges and asking whether more targeted controls could deliver similar benefits without the extra complexity. My post on [the ten Secure by Design principles](https://thesolutionarchitect.uk/secure-by-design-ten-principles-and-what-they-ask-of-your-project) covers the wider policy.

Mandated or not, in my experience you're increasingly likely to be asked about it. It comes up regularly at design reviews and architecture governance boards, where architects and cyber security teams want to know how a solution handles identity and access. Pointing at a VPN and a perimeter firewall won't satisfy them, so be ready to explain how your design protects each resource, verifies who's reaching it and limits what they can do once they're in.

# **Where to start**

Zero trust doesn't fit the shape of a traditional IT project, with a start date, a delivery plan and a day when everyone declares it finished. It's gradual, and the sensible place to begin is wherever the risk is greatest, which might mean privileged accounts, administrative tools or your most sensitive data. Get the fundamentals right in that one area first, so identities are properly verified, devices meet your standards and people reach only what they need, then widen it out once you've shown it works.

None of this makes traditional network security irrelevant, because firewalls, VPNs and other perimeter defences still have a job to do, even if they can't carry the whole load any more. What really changes is that security stops depending on where someone connects from and gets built into every layer instead, which makes zero trust a way of working that keeps improving rather than a project you finish.
