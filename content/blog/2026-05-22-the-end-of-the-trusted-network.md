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

Zero Trust, a term [John Kindervag coined at Forrester in 2010](https://www.nist.gov/blogs/taking-measure/zero-trust-cybersecurity-never-trust-always-verify), is the response to all of this. The shorthand is "never trust, always verify". Every request, whether internal or external, human or machine, on a corporate laptop or a personal phone, gets authenticated and authorised on its own merits. Network location stops being enough on its own, identity, device and context carry the decision. The name does oversell it slightly. As the NCSC [points out](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust), there is plenty of trust in a zero trust architecture, it just has to be earned for each request, and can't be inherited from the network.

[Microsoft's three guiding principles](https://learn.microsoft.com/en-gb/security/zero-trust/) are the most quoted summary:

1. **Assume breach:** Design as though the attacker is already on your network. Once you do, encrypting internal traffic and microsegmentation look like common sense.
2. **Verify explicitly:** Make access decisions on everything you know. Who the user is, whether their device is healthy, where they're coming from, what they're trying to reach, whether the request looks anything like their normal behaviour. No single factor is enough.
3. **Least privilege:** Give the minimum access required, for the shortest sensible duration. When something does go wrong, and it eventually will, you want the damage to stay small.

The NCSC's [eight zero trust architecture design principles](https://www.ncsc.gov.uk/collection/zero-trust/architecture-design-principles) cover the same ground in more detail, and they are the better reference for a UK government design.

# **What this looks like in practice**

You can't buy a Zero Trust architecture as a product. You assemble it from capabilities, usually over years.

Identity sits at the heart of the approach, with strong multi-factor authentication applied to all users (not just admins) and SSO managed through a central identity provider. Conditional access policies add another layer of protection by assessing factors such as the user, device, location and level of risk before granting access. Increasingly, we are are also adopting passwordless authentication using technologies such as FIDO2 security keys or certificates, reducing reliance on passwords and providing stronger protection against phishing attacks.

Devices become a trust signal. A managed laptop with full-disk encryption, current patches and working endpoint protection is treated differently from a random tablet on a hotel Wi-Fi. BYOD doesn't have to mean unrestricted access, it usually means web-only access, virtual desktops, or some other form of containment.

The network itself becomes untrusted by default. Traffic between services is encrypted even inside your own environment whilst microsegmentation limits what any compromised host can reach. Private applications sit behind connectors or proxies and have no public address, so there is less for an attacker to find.

Applications and APIs participate too. Every service authenticates the caller and service-to-service traffic uses mutual TLS or signed tokens. The days of "the call came from inside the cluster, so it must be fine" are over.

And underneath all of this sits data, classified by sensitivity, encrypted at rest and in transit, monitored for unusual access patterns, with every read and write logged somewhere a security team can review.

# **What it costs**

Of course, there are challenges to consider. Moving to zero trust isn't cheap, and it's certainly not something you can introduce overnight. The NCSC [makes this clear](https://www.ncsc.gov.uk/collection/zero-trust/demystifying-zero-trust?utm_source=chatgpt.com), warning that the transition can be expensive, disruptive and demanding on resources. It's also important to understand that zero trust doesn't mean getting rid of everything you already have. Take VPNs, for example. They can continue working alongside zero trust controls, and there's no reason to remove them simply for the sake of it. Then there are legacy systems, some of which simply weren't designed to support zero trust principles. In these situations, you may need to maintain a [mixed environment](https://www.ncsc.gov.uk/guidance/zero-trust-building-a-mixed-estate?utm_source=chatgpt.com), keeping older systems appropriately isolated while introducing stronger controls elsewhere. There's also the question of resilience. When your organisation relies heavily on an identity provider and policy engine to control access, those components become critical infrastructure. If they fail, people could find themselves unable to access the systems they need, so reliable recovery mechanisms and emergency access arrangements are essential.

# **The UK government angle**

For anyone designing or building services in UK government, zero trust is becoming an increasingly important consideration, although it's worth pointing out that it isn't actually mandatory. The NCSC provides [guidance ](https://www.ncsc.gov.uk/collection/zero-trust)on how to approach it, while the government's [Secure by Design policy](https://www.security.gov.uk/policy-and-guidance/secure-by-design/policy/) highlights zero trust as an example of the flexible, risk-based security architecture organisations should be working towards. I've covered [the ten principles of Secure by Design](https://thesolutionarchitect.uk/secure-by-design-ten-principles-and-what-they-ask-of-your-project) separately, but the important thing to understand here is that zero trust isn't necessarily the right answer for every situation. The NCSC encourages organisations to assess their risks first and consider whether more targeted security controls could achieve the same outcome without the additional complexity.

It's interesting to compare this with the United States, where the government took a more prescriptive approach. In 2022, the White House issued memorandum [M-22-09](https://zerotrust.cyber.gov/federal-zero-trust-strategy), requiring federal civilian agencies to work towards a defined zero trust security strategy.

But here's the thing: whether zero trust is mandatory or not, you're increasingly likely to be asked about it. In my experience, these questions regularly come up during design reviews and architecture governance boards, where fellow architects and cyber security teams want to understand how a proposed solution approaches identity, access and security. Simply pointing to a VPN and a perimeter firewall isn't going to be enough. You'll need to explain how your design protects individual resources, verifies who's accessing them and limits what they can do once they're inside.

# **Where to start**

One of the biggest mistakes with zero trust is treating it like a traditional IT project, with a start date, a delivery plan and a point where everyone declares it finished. Unfortunately, it doesn't work like that. You can't simply flick a switch and suddenly have a zero trust architecture. It's a gradual process, and the sensible approach is to start where the risks are greatest. That might mean securing privileged accounts, tightening access to administrative tools or improving protection around sensitive data. Rather than trying to change everything at once, focus on getting the fundamentals right in one area first, making sure identities are properly verified, devices meet the required security standards and users only have access to what they genuinely need. Once you've demonstrated that the approach works, gradually expand it out.

And this doesn't mean traditional network security suddenly becomes irrelevant. Firewalls, VPNs and other perimeter defences still have an important role to play, they're just no longer enough on their own. The real change is recognising that security shouldn't depend entirely on where someone happens to be connected from. Instead, it needs to be built into every layer of the architecture and continually reviewed as the organisation evolves. That's perhaps the most important thing to remember about zero trust: it's not a destination you eventually reach, but an approach to security that you keep improving over time.
