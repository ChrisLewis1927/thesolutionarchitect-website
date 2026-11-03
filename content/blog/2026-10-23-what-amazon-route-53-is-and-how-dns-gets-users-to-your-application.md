---
title: What Amazon Route 53 is, and how DNS gets users to your application
date: 2026-10-23T16:07:00.000Z
category: Cloud
excerpt: Follow a web address from the browser to an AWS application, and
  understand where Route 53 fits. A practical introduction to DNS records,
  aliases, routing policies and the limits of DNS failover.
author: The Solution Architect
---
Your application is running in AWS, and you want people to reach it at `www.example.com`. Behind that familiar name might be a load balancer, several application servers and a database.

Amazon Route 53 helps users find the application's endpoint. It is AWS's Domain Name System (DNS) service: it answers queries about names so that browsers and other clients can find the information needed to connect.

## From a web address to your application

For this example, the application sits behind an Application Load Balancer. The load balancer accepts web requests and distributes them across the application's servers.

When someone opens `www.example.com`, two things happen: their browser finds an address, then connects to it.

1. **The browser asks a DNS resolver to look up the name.** The resolver might be provided by an internet service provider, a corporate network or a public DNS service.
2. **The resolver finds the answer.** It can return a valid cached answer immediately. Otherwise, it follows DNS referrals as needed to reach the name servers responsible for the domain. In this example, Route 53 uses the configured record to return IP addresses for the load balancer, which the resolver passes back to the browser.
3. **The browser connects to the load balancer.** Its HTTPS requests go to the load balancer, which forwards them to the application servers.

Route 53 handles the DNS lookup. The load balancer handles the web connection. That division of responsibility is central to [how DNS gets a browser to an application](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/welcome-dns-service.html).

## The configuration behind that answer

In Route 53, DNS records live in a **hosted zone**. A public hosted zone for `example.com` could contain records for `www.example.com`, `api.example.com` and the organisation's email services.

A record's type describes the information it provides. **A records** provide IPv4 addresses, **AAAA records** provide IPv6 addresses, and **CNAME records** map one DNS name to another. AWS documents the [supported record types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html).

For our load balancer, a common choice is an **alias record**. This Route 53 feature lets you reference a supported AWS resource, such as an Application Load Balancer or CloudFront distribution. Route 53 returns the appropriate IP addresses, so you can reference the resource instead of maintaining its changing addresses yourself.

Aliases also work at the domain's root, such as `example.com`, where a standard CNAME is not permitted. AWS explains the details in [choosing between alias and non-alias records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html).

You also need the domain to use the correct name servers. **Domain registration and DNS hosting are separate services:** you can keep your existing registrar and delegate DNS hosting to Route 53 by updating the domain's name server settings. Moving an application into AWS does not require transferring its domain registration. AWS covers this in [configuring DNS for a domain](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-new-domain.html).

## Choosing between destinations

Our example has one load balancer. If the application later has several possible endpoints, Route 53 can use a **routing policy** to choose which record to return.

The policy should follow the requirement:

| Requirement                                            | Policy to consider                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Publish one application's endpoint                     | Simple                                                                                             |
| Gradually introduce a second environment               | [Weighted](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-weighted.html) |
| Choose between AWS Regions using network latency data  | [Latency](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-latency.html)   |
| Use a secondary endpoint when the primary is unhealthy | Failover, with health evaluation                                                                   |



These policies influence DNS answers. With weighted routing, a 90:10 split does not guarantee that exactly 10% of users or web requests reach the second environment: resolvers cache answers, and many users can share a resolver.

Latency routing uses AWS's network latency data to choose among the Regions you configure. It does not measure each application's response time for every request. Other policies support geographic or IP-based selection; the [routing policy documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html) covers the full set.

## What happens when the primary fails?

Suppose the application normally runs in London, with a second environment ready in Frankfurt. Failover routing can return Frankfurt's endpoint when London is considered unhealthy and Frankfurt is considered healthy.

Three parts of that design need attention.

**Detecting the failure.** Route 53 needs suitable health information. You might configure a health check against an application endpoint. For supported AWS resources, including load balancers, an alias can use **Evaluate Target Health** to use the target's health information. Choose a check that reflects the failure you need to detect. AWS explains [how health information affects record selection](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-how-route-53-chooses-records.html).

**Waiting for cached answers.** DNS answers have a time to live, or **TTL**, which tells resolvers how long they may cache them. A resolver with a cached London answer can continue returning it while that answer remains valid. A shorter TTL can help changes become visible sooner, at the cost of more frequent lookups. For aliases to AWS resources, the target determines the TTL. AWS's [DNS best practices](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/best-practices-dns.html) explain the trade-offs.

**Making the alternative usable.** Frankfurt needs the application, data and dependencies required to serve users. If its database is available only in London, changing the DNS answer will not restore the service.

Health detection takes time, caches take time to refresh, and existing connections do not automatically move. A 60-second TTL therefore does not promise recovery within 60 seconds.

There is also a fallback worth knowing: if health evaluation marks both the primary and secondary as unhealthy, Route 53 returns the primary record. Receiving a DNS answer is therefore not evidence that the application is working.

Test failover by checking whether users can complete a real task through the secondary environment.

## Internal applications use DNS too

Route 53 also supports **private hosted zones**, which make DNS records available within associated Amazon Virtual Private Clouds (VPCs). A VPC is an isolated network in AWS. Resolver endpoints and forwarding rules can extend DNS resolution to connected on-premises networks. AWS describes [private hosted zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-private.html) and [VPC Resolver](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html).

Private DNS controls where names can be resolved. Network access and application authentication still need their own controls.

## Treat DNS as production infrastructure

A record change can make a healthy application unreachable. Give DNS configuration clear ownership, review changes and retain an audit trail. Route 53 supports [query logging and CloudTrail records of configuration activity](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/logging-monitoring.html).

Budget for hosted zones, chargeable DNS queries and any additional features you use. Domain registration is charged separately, while qualifying alias queries to AWS resources have no Route 53 DNS query charge. Check the [current pricing](https://aws.amazon.com/route53/pricing/) for the features in your design.

When reviewing the architecture, trace the whole journey: how the name is resolved, where the client connects, and whether an alternative endpoint can actually serve users during a failure. That is where DNS configuration becomes an application design decision.
