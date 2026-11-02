---
title: "Ingress and egress: understanding which way network traffic flow"
date: 2026-11-02T15:54:00.000Z
category: Cloud
excerpt: Ingress and egress describe the direction network traffic travels, but
  the distinction depends on where you are looking from. This article explains
  how inbound and outbound traffic works, how firewalls and NAT control
  connections, and why understanding both matters for network security, cloud
  architecture and data transfer costs.
author: The Solution Architect
---
When designing an application, we spend a lot of time thinking about how users and other systems connect to it. We configure firewalls, open ports, restrict access and decide which services can communicate with each other.

Two terms that regularly appear in those conversations are **ingress** and **egress**. They sound technical, but describe something straightforward: the direction network traffic is travelling.

The interesting part is that the direction depends on where you are looking from. Understanding that distinction helps explain how firewalls work, why private servers can still reach the internet and how outbound traffic can become a security risk.

#### **What ingress and egress actually mean**

In networking, the terms describe traffic crossing a boundary:

- **Ingress (inbound):** Traffic entering a network, system or application.
- **Egress (outbound):** Traffic leaving a network, system or application.

Think about the entrance to an office building. People coming through the doors are entering (ingress), while people leaving are exiting (egress).

Network traffic works in much the same way.

Imagine a website hosted on a server. When someone visits the website, their browser sends a request to the server. That request is ingress traffic from the server's perspective.

The server processes the request and sends the webpage back. That response is egress traffic.

Both directions are involved in a normal interaction.

This distinction is important because ingress and egress describe the **direction of traffic**, rather than whether the traffic is good, bad, trusted or untrusted.

#### **Direction depends on where you are standing**

Consider an application that retrieves information from a database.

The application sends a query to the database, which processes it and returns the results.

From the application's perspective, the query is egress traffic because it is leaving the application.

From the database's perspective, exactly the same query is ingress traffic because it is arriving at the database.

The response reverses those directions.

This is why ingress and egress should always be considered relative to a particular boundary. That might be an individual server, a subnet, an entire network or a cloud environment.

A database query travelling between two servers can be egress from one and ingress to another, even though neither server communicates with the public internet.

#### **How firewalls use ingress and egress rules**

Firewalls use rules to decide which traffic can enter or leave a system.

An ingress rule might allow HTTPS connections on port 443, enabling users to access a website. Another rule might restrict database connections on port 5432 so that only an application server can reach it.

Egress rules work in the opposite direction. They control which destinations a system can contact.

For example, an application might need to contact an external payment provider over HTTPS. An outbound rule could permit that connection while restricting other destinations.

There is an important detail here: **allowing a connection does not necessarily mean opening both directions separately.**

Many modern firewalls are *stateful*. They remember an established connection and automatically permit its return traffic.

If an application initiates an allowed outbound HTTPS connection, a stateful firewall recognises the response as part of that connection. It does not normally require a separate inbound rule.

A *stateless* firewall treats traffic in each direction independently. You must ensure the rules permit both the original traffic and its response.

AWS provides a useful example of this distinction. [Security groups are stateful](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html), while [network access control lists (NACLs) are stateless](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html).

The underlying principles apply well beyond AWS.

#### **Outbound access does not mean inbound access**

One of the more useful networking patterns is allowing a server to make outbound connections without allowing external systems to initiate connections to it.

Imagine an application server that needs to download software updates and contact an external API, but should never be directly accessible from the internet.

A common solution is Network Address Translation (NAT).

The server initiates an outbound connection through a NAT device. The device translates its network address, allowing the request to reach its destination and the response to find its way back.

However, an external system cannot simply initiate a new connection to the private server through that NAT device.

[AWS NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html) are one implementation of this pattern.

This is also why a private subnet does not necessarily mean a server has no internet access. Private resources can be configured for outbound connectivity while remaining inaccessible to unsolicited inbound connections.

#### **Why egress deserves as much attention as ingress**

Security discussions often concentrate on ingress. We want to prevent unauthorised users from reaching our systems, protect public endpoints and restrict access to databases.

But allowing unrestricted egress creates its own problems.

Consider an application that has been compromised. Even if an attacker cannot connect directly to the server, malicious software running on it might be able to initiate outbound connections.

That could allow information to be sent to an external destination, a process known as **data exfiltration**.

Restricting egress helps reduce that risk. Instead of allowing an application to communicate with any destination, network controls can limit it to the services and endpoints it actually needs.

This does require some thought. Applications may depend on external APIs, software repositories, monitoring services and authentication providers.

Blocking everything without understanding those dependencies can break a perfectly functioning service.

Where supported, private service endpoints offer another option. For example, [VPC endpoints](https://docs.aws.amazon.com/prescriptive-guidance/latest/secure-outbound-network-traffic/accessing-aws-resources.html) can connect workloads privately to certain cloud services without requiring an internet gateway or NAT gateway.

#### **There is a cost consideration too**

In cloud computing, egress also appears in billing discussions.

Cloud providers may charge for data leaving their infrastructure, particularly when it is transferred to the public internet or between geographical regions.

For example, [AWS generally provides free data transfer into its cloud from the internet](https://aws.amazon.com/about-aws/global-infrastructure/global-network/faqs/), but applies charges to certain outbound transfers, subject to allowances and exceptions. Transfers between Availability Zones or Regions can have their own charges.

Network egress and billable internet data transfer are therefore not quite the same thing.

An application sending a database query to another server is producing outbound traffic, but that does not automatically mean it has incurred an internet data transfer charge.

For systems handling large volumes of data, understanding the actual traffic path matters when estimating running costs.

#### **What this means when designing a system**

When reviewing a network or application architecture, I find it useful to consider the traffic from the perspective of each component.

For every connection, there are a few practical questions worth answering:

- Which system initiates the connection?
- Where does the traffic need to go?
- Which network boundaries does it cross?
- What needs to be permitted for the connection and its response?
- Does the destination need to be accessible over the internet at all?

These questions help identify where access is necessary, where it can be restricted and whether traffic is following the intended path.

The simplest way to remember the terminology is that **ingress enters and egress exits**.

Just remember to establish whose entrance or exit you are talking about. The same packet can be leaving one system while entering another, and that difference is what makes the terminology useful when designing and securing networks.
