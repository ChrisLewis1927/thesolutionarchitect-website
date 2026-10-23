---
title: What Amazon Route 53 is, and how DNS gets users to your application
date: 2026-10-23T16:07:00.000Z
category: Cloud
excerpt: Amazon Route 53 is AWS's DNS service, helping users find applications
  and directing them towards the right endpoints. This guide explains how Route
  53 works, including hosted zones, DNS records, routing policies, health checks
  and failover, and what architects need to consider when designing resilient
  applications.
author: The Solution Architect
---
You have built an application in AWS. It runs behind an Application Load Balancer, the database is working, and everything is ready for users. But there is still a fairly basic problem to solve. How does someone typing your application's web address into a browser actually reach it?

The application might be running on servers in London, behind a load balancer with an AWS-generated hostname. Your users don't know that hostname, and you wouldn't want them to have to remember it. They expect to type something familiar, such as `www.example.com`, and arrive at the right place.

This is where Amazon Route 53 comes in.

[Amazon Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/) is AWS's Domain Name System (DNS) service. Its main job is to answer questions about domain names, including which IP addresses an application should be reached through. It can also register domain names, monitor the health of application endpoints, and use different rules to decide which destination to return.

There is an important distinction to understand from the beginning. Route 53 does not normally carry the application's web traffic. It helps the client find the destination. The client then connects to that destination directly.

That distinction becomes particularly important when you start designing for performance, availability and disaster recovery.

#### **Start with DNS**

Every device communicating over an IP network uses Internet Protocol (IP) addresses to identify where it needs to send traffic. For example, an IPv4 address might look like `192.0.2.44`.

Remembering those addresses would make using the internet rather difficult, particularly when the infrastructure behind a website changes. DNS solves that problem by allowing people and applications to use names instead.

Think of DNS as a directory. You know the name of the service you want, and DNS helps you find the address needed to reach it.

Suppose someone enters `www.example.com` into their browser.

The browser asks a DNS resolver for the information it needs. A resolver is a service that looks up DNS records on behalf of a client. It might be operated by an internet service provider, a corporate network or another DNS provider.

If the resolver already has a valid cached answer, it can return that. Otherwise, it works through the DNS hierarchy to identify the authoritative name servers for the domain.

An authoritative name server holds the DNS records that define the answers for a particular domain. If the domain uses Route 53 for DNS hosting, the resolver can query a Route 53 name server.

Route 53 looks up the relevant record and returns an answer, such as an IP address. The resolver passes that answer back to the browser, which can then establish a connection to the application.

AWS describes this sequence in its [explanation of how internet traffic is routed](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/welcome-dns-service.html).

Notice where Route 53's involvement ends. Once the browser has the address, its HTTP or HTTPS requests go to the destination. They do not need to travel through Route 53.

#### **Domain registration and DNS hosting are different jobs**

Route 53 can register domain names, but registering a domain and hosting its DNS records are separate activities.

A domain registrar manages the registration of a name, such as `example.com`. DNS hosting determines what answers are returned when someone looks up that name.

You can use Route 53 for both. When you register a new domain through Route 53, AWS creates a public hosted zone and configures the domain to use the name servers assigned to it.

Alternatively, you can keep a domain registered with another provider and use Route 53 only for DNS hosting. You create a hosted zone in AWS and update the name server settings at your registrar to delegate DNS for the domain to Route 53.

AWS explains both arrangements in [configuring DNS routing for a new domain](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-new-domain.html).

For an architect, the distinction matters during migrations. Moving an application into AWS does not require transferring ownership or registration of its domain. You can change the DNS hosting arrangement independently.

It also means DNS is something that needs to be included in a migration plan. Building the new application is only part of the work. You still need to decide when its domain records will point to the new environment.

#### **Hosted zones are where the records live**

The main configuration object in Route 53 is a **hosted zone**.

A hosted zone is a collection of DNS records for a domain and its subdomains. For example, a hosted zone for `example.com` might contain records for the main website, an application API and the organisation's email service.

Each record provides information about a particular name. The type of record determines what that information represents.

Some common record types are:

* **A records** associate a name with an IPv4 address.
* **AAAA records** associate a name with an IPv6 address.
* **CNAME records** associate one DNS name with another DNS name.
* **MX records** specify mail servers for a domain.
* **TXT records** hold text information, commonly used for purposes such as domain verification and email authentication.

AWS maintains the full list of [supported DNS record types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html).

Imagine an organisation running a website and an API. Both sit behind AWS load balancers, but they serve different purposes.

The website might use `www.example.com`, while the API uses `api.example.com`. Both names can be managed within the same hosted zone, with separate records pointing towards the appropriate resources.

The applications themselves do not have to run in the same AWS Region, or even in AWS. Route 53 can provide DNS answers for resources hosted outside AWS as well.

#### **Why AWS uses alias records**

One Route 53 feature you will encounter frequently is the **alias record**.

An alias is an AWS-specific extension to DNS. It allows Route 53 to direct DNS queries towards supported AWS resources, including Application Load Balancers, CloudFront distributions and API Gateway endpoints.

Suppose your application sits behind an Application Load Balancer. AWS assigns that load balancer a DNS name, but you want users to access it through `www.example.com`.

You can create an alias record pointing to the load balancer. Route 53 then returns the appropriate IP addresses for that resource. If those addresses change, Route 53 can reflect the change without you maintaining a list of addresses yourself.

Aliases also solve a limitation of CNAME records.

Standard DNS does not permit a CNAME at the root of a hosted zone, sometimes called the *zone apex*. For a hosted zone named `example.com`, that means you cannot create a CNAME record directly at `example.com`.

A supported Route 53 alias record can be created there.

There is another difference worth knowing. When an alias points to an AWS resource, you cannot set its time-to-live value independently. Route 53 uses the TTL associated with the resource. An alias pointing to another record in the same hosted zone uses that record's TTL.

AWS explains the restrictions and behaviour in [choosing between alias and non-alias records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html).

For most straightforward AWS-hosted web applications, an alias pointing to a load balancer or CloudFront distribution is a sensible starting point.

#### **Route 53 can choose between different destinations**

So far, Route 53 has simply returned information for a particular destination. It becomes more interesting when an application has multiple possible destinations.

AWS calls the rules used to select between them **routing policies**.

The simplest policy is appropriately named *simple routing*. It works for straightforward arrangements where a single resource, or a set of values within one record, serves a particular name.

Other policies give you more control.

**Weighted routing** allows multiple records to be assigned relative weights. For example, you could configure two application environments with weights of 90 and 10, so Route 53 normally selects their records in a 90:10 proportion.

This can be useful when introducing a new application version. You might initially give the new environment a small weighting, observe its behaviour, and adjust the weights as confidence increases.

There is an important qualification, though. The weights influence DNS answers, not an exact percentage of application requests or individual users. DNS resolvers cache responses, and many users might share a resolver. A 90:10 configuration does not guarantee that exactly 10% of HTTP requests reach the new environment.

**Latency-based routing** is intended for applications deployed across multiple AWS Regions. Route 53 uses AWS latency measurements to select an appropriate Region from the latency records you have configured.

For example, an application might be deployed in London and Frankfurt. Route 53 can select between them based on its latency data.

That does not mean it performs a live performance test of your application for every user. The measurements relate to network latency between users and AWS Regions, and the selected Region is not necessarily the one physically closest to the user.

**Geolocation routing** uses geographic rules. You might configure one destination for queries associated with the United Kingdom and another for queries associated with other countries.

AWS explains that location is estimated using IP address information. Depending on the resolver, Route 53 may use the resolver's location or a shortened client IP address supplied through the EDNS Client Subnet extension.

This is useful for localisation, but it should not be mistaken for a guaranteed way to identify a user's physical location or enforce data residency requirements.

**Failover routing** is designed for active-passive arrangements. You specify primary and secondary destinations, allowing Route 53 to return the secondary when the primary is considered unhealthy.

Route 53 also supports geoproximity, IP-based and multivalue answer routing. These address more specialised needs, such as adjusting routing around geographic resource locations, selecting responses from defined IP ranges, or returning several healthy records.

All eight supported policies are explained in AWS's [routing policy documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html).

The choice is an architectural decision. Latency routing is concerned with network performance, while failover routing addresses an availability requirement. Weighted routing can support a controlled deployment. These are different problems, even though they all influence DNS responses.

#### **Health checks and what happens when something fails**

Imagine an application running in two AWS Regions. London is the primary environment and Frankfurt is available as a secondary.

If the London application becomes unavailable, you want users to reach Frankfurt instead.

Route 53 supports health checks that can monitor endpoints using HTTP, HTTPS or TCP. Health checking can also use the state of a CloudWatch alarm or other health checks.

For an application endpoint, a health check might periodically request a dedicated health endpoint to see whether the application responds as expected.

You can associate health information with routing policies so that Route 53 selects a healthy destination when answering DNS queries.

For some AWS resources, such as Elastic Load Balancing load balancers, alias records can use an option called **Evaluate Target Health**. This allows Route 53 to consider the resource's health information without requiring a separate Route 53 endpoint health check for the load balancer.

The detail matters because simply creating a failover record does not automatically mean Route 53 understands whether your application is functioning correctly. You need to configure the appropriate health evaluation.

[AWS documents how health checks and routing decisions work together](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-how-route-53-chooses-records.html).

But there is a limitation that every architect should understand.

**DNS failover is not instantaneous.**

A DNS resolver might have cached the original London address. It can continue returning that cached response until the applicable time-to-live, or TTL, expires.

The TTL is a value, expressed in seconds, that tells resolvers how long a DNS answer may be cached.

For example, a record with a TTL of 60 seconds allows a compliant resolver to cache the answer for that period. Reducing the TTL can help clients discover changes sooner, but it does not force existing connections to move to the new destination.

AWS recommends considering the trade-off between shorter TTLs, which improve responsiveness to DNS changes, and longer TTLs, which reduce lookup frequency. Its [DNS best practices](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/best-practices-dns.html) discuss common settings for failover scenarios.

There is a less obvious behaviour too. If all the records in a routing group are considered unhealthy, Route 53 can still return an answer rather than returning no destination at all. AWS deliberately uses this behaviour to reduce the risk that failed or misconfigured health checks make an incident worse.

The practical consequence is that a DNS response does not prove an application is healthy.

And even successful DNS failover does not mean your application has recovered. If Frankfurt depends on a database that only exists in London, sending users to Frankfurt will not solve the database problem.

Route 53 can help users discover a different endpoint. Database replication, application state, session handling, retries and recovery procedures remain separate design concerns.

#### **Public DNS and private DNS**

Not every DNS name needs to be available on the public internet.

Route 53 supports both public and private hosted zones.

A **public hosted zone** contains records intended to be resolved through public DNS. This is the arrangement used for externally accessible websites and applications.

A **private hosted zone** contains DNS records available through the Route 53 VPC Resolver in associated Amazon Virtual Private Clouds (VPCs). A VPC is a logically isolated network environment within AWS.

For example, an organisation might have an internal application using `reports.internal.example.com`. It could create a private hosted zone associated with the VPCs that need to resolve that name.

Resources in those VPCs can then use the private DNS records without publishing them through the public authoritative DNS service.

However, private DNS does not itself enforce access control to an application. Network routing, security groups and application authentication still need to be designed appropriately.

AWS explains the behaviour in [working with private hosted zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-private.html).

#### **What about applications outside AWS?**

Private DNS becomes particularly relevant in hybrid environments, where some systems run in AWS and others remain in an organisation's data centre.

Suppose an application in an AWS VPC needs to connect to an internal database using a DNS name managed by an on-premises DNS server.

AWS provides **Route 53 VPC Resolver**, which supports DNS resolution inside VPCs and forwarding queries between AWS and other networks.

An outbound Resolver endpoint can forward selected DNS queries from a VPC towards DNS servers on another network. An inbound Resolver endpoint allows DNS queries from an external network to reach the VPC Resolver.

With the appropriate networking and forwarding rules, this allows applications in AWS to resolve names managed on-premises, and on-premises systems to resolve names held in private hosted zones.

AWS describes this in [what is Route 53 VPC Resolver?](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html).

For a new architect, the important point is that public DNS hosting and private DNS resolution are related but different concerns.

You might use Route 53 to publish the name of your public website, while also using private hosted zones and Resolver endpoints to support communication between internal applications.

#### **How it fits into a typical AWS architecture**

Consider an illustrative public service application hosted in AWS.

Users access the service through `www.example.com`. The application runs behind an Application Load Balancer, which distributes requests across application instances.

A straightforward arrangement would work like this:

1. A public Route 53 hosted zone contains the DNS records for `example.com`.
2. An alias record for `www.example.com` points to the Application Load Balancer.
3. When a DNS resolver queries Route 53, it receives the appropriate IP address information for the load balancer.
4. The user's browser connects to the load balancer.
5. The load balancer forwards the request to an appropriate application target.

Route 53 and the load balancer have different responsibilities.

Route 53 provides the DNS answer. The load balancer handles incoming application connections and distributes them among its targets.

If you later introduce Amazon CloudFront, you might change the alias to point to a CloudFront distribution instead. CloudFront can then handle web requests at AWS edge locations, caching suitable responses and forwarding others to the application origin.

The architectural pattern changes, but Route 53 is still handling DNS.

#### **Costs and operational responsibilities**

Route 53 is a chargeable AWS service, and the costs depend on which features you use.

AWS charges for hosted zones and eligible public DNS queries. Domain registration is charged separately, and additional charges can apply to features such as health checks, Resolver endpoints and Traffic Flow.

Certain alias queries to supported AWS resources are provided without a Route 53 DNS query charge, although other charges may still apply.

Rather than relying on figures that may change, the current charges and exceptions are documented on the [official Route 53 pricing page](https://aws.amazon.com/route53/pricing/).

Operationally, DNS also needs some attention.

Route 53 can record public DNS queries in CloudWatch Logs, and CloudTrail can record configuration activity performed through the console or APIs. VPC Resolver has separate query logging capabilities.

Public DNS query logs only show the queries that actually reach Route 53. Requests answered from a resolver's cache will not appear as new authoritative DNS queries.

These facilities can help with troubleshooting and auditing, particularly when diagnosing unexpected changes or routing behaviour. AWS covers them in its [logging and monitoring documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/logging-monitoring.html).

For production applications, DNS configuration should also be managed with the same care as other infrastructure. Changes to records can affect the ability of users and dependent systems to reach a service, even when the application itself is functioning normally.

#### **What Route 53 does not do**

It is worth being clear about the boundaries of the service.

Route 53 does not host your application, terminate its normal HTTPS connections or process the requests it receives. Those responsibilities belong to other components of the architecture.

It does not replace a load balancer, because DNS routing and application request distribution operate differently.

It does not guarantee immediate recovery when an application fails. Cached DNS answers, existing connections and the readiness of alternative infrastructure all affect recovery.

And although it supports geographic routing, it does not guarantee where application data is stored or processed. Those requirements must be addressed through the architecture of the application and its underlying services.

Perhaps the most important architectural question is whether changing a DNS answer actually produces the outcome you need.

If the application is stateless and both environments are independently capable of serving requests, DNS failover may be a useful part of its resilience design. If the application depends on shared data, long-running sessions or services that cannot operate in the secondary environment, DNS failover alone will achieve very little.

Route 53 provides a way to make application endpoints discoverable and to influence which endpoints clients use. Understanding that boundary is what allows an architect to use it properly.
