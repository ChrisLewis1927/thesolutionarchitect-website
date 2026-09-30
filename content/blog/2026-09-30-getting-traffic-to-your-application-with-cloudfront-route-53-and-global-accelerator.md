---
title: Getting traffic to your application with CloudFront, Route 53 and Global
  Accelerator
date: 2026-09-30T17:06:00.000Z
category: Cloud
excerpt: Understand how CloudFront, Route 53 and Global Accelerator solve
  different traffic problems, from caching and private origins to DNS routing
  and cross-Region failover.
author: The Solution Architect
---
Putting an application in AWS does not automatically make it fast everywhere or resilient when an endpoint fails. You still need to decide where users enter, what can be cached, and how traffic moves when something goes wrong.

Imagine a web service running in London. Static files sit in Amazon S3, dynamic requests go to an application behind a load balancer, and users may be anywhere. Three AWS services are often mentioned together, but they solve different problems:

* **CloudFront** handles HTTP and HTTPS requests at AWS edge locations, where it can cache content and forward requests to an origin.
* **Route 53** answers DNS queries, helping a client find the address it should use.
* **Global Accelerator** gives applications static anycast IP addresses and routes TCP or UDP traffic through the AWS global network.

Keeping those jobs separate makes the design much easier to reason about.

#### **Start with CloudFront: move the web front door closer**

CloudFront is a content delivery network. A user connects to a CloudFront edge location, and CloudFront either serves a cached response or sends the request to an **origin** such as S3, an Application Load Balancer or another web server.

Caching is the obvious benefit, but not the only one. CloudFront terminates the viewer's TLS connection at the edge and can reuse persistent connections to custom origins, avoiding repeated connection setup. AWS also connects CloudFront edge locations to Regions over its network backbone. [AWS documents CloudFront's origin connection behaviour](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html).

Dynamic or personalised content can therefore benefit even when caching is disabled. It will not make every application faster, so measure from the places your users actually work.

#### **Cache only when the same response can safely be reused**

A **cache key** tells CloudFront when two requests are equivalent for caching. By default, the URL path forms part of that key; a cache policy can also include selected query strings, headers and cookies. If two requests produce the same cache key and a valid cached object exists, CloudFront can return that object without calling the origin.

Only include a value when it genuinely changes the response. A language parameter might belong in the key; a tracing header usually does not. Unnecessary values create more variants, lower the cache hit ratio and send more work back to the origin.

An **origin request policy** can forward extra headers, cookies or query strings without adding them to the cache key. Values already in the key are forwarded automatically. [AWS explains cache and origin request policies together](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html).

**Be particularly careful with authentication.** If the origin uses `Authorization` to decide who may see a response, do not let different users share one cached response. Either design the cache key to separate the responses safely or disable caching.

Check the time-to-live settings as well. A cache policy with a minimum TTL above zero can keep a response cached even when the origin sends `private`, `no-store` or `no-cache`. Setting the minimum, default and maximum TTLs to zero disables caching. [AWS documents these cache-policy rules](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-key-understand-cache-policy.html).

#### **Protect the origin, not just the public URL**

Putting CloudFront in front of an application is most useful when users cannot simply bypass it and call the origin directly.

For an S3 bucket origin, **origin access control (OAC)** lets CloudFront make authenticated requests to the bucket. A bucket policy can then grant access to the CloudFront distribution rather than making the bucket public. OAC also supports SSE-KMS when the distribution has the required KMS permissions. S3 website endpoints are different: they are treated as custom origins and cannot use OAC. [AWS documents the S3 origin pattern](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).

For application traffic, **CloudFront VPC origins** can reach an Application Load Balancer, Network Load Balancer or EC2 instance in a private subnet. The origin security group still has to allow CloudFront traffic. Check the restrictions early: VPC origins do not support gRPC, and an NLB with a TLS listener cannot be used as a VPC origin. [AWS lists the current requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html).

AWS WAF can inspect web requests at CloudFront, while AWS Shield provides DDoS protections for AWS edge services. These controls reduce exposure, but they do not replace the application's own authentication and authorisation.

#### **Route 53 chooses a DNS answer; traffic does not pass through it**

This distinction prevents a lot of confusion. Route 53 is a DNS service. It answers a lookup such as “where should `example.com` go?” The client then connects to the returned destination.

**Latency-based routing** chooses among the AWS Regions for which you created latency records, using AWS measurements of latency between users and AWS Regions. It is not a live speed test of every request.

**Geolocation routing** follows the geographic rules you configure. Route 53 usually estimates location from the DNS resolver, but can use a shortened client IP when EDNS Client Subnet is supported. It is useful for localisation; it does not, by itself, guarantee data residency. [AWS documents Route 53 geolocation routing and how location is estimated](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo.html).

With **failover routing**, Route 53 can return a secondary destination when the primary is unhealthy. Clients and resolvers may still use a cached answer until its TTL expires, so there is no single failover time for every client. [AWS explains the DNS and TTL trade-offs](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/best-practices-dns.html).

#### **Global Accelerator keeps the client-facing address stable**

A standard Global Accelerator gives the application static anycast IP addresses. Users enter the AWS network at an edge location, and AWS routes TCP or UDP traffic towards a healthy configured endpoint such as an ALB, NLB or EC2 instance.

If an active endpoint becomes unhealthy, Global Accelerator directs **new connections** elsewhere without changing the client-facing IP address. Existing connections are not moved, so clients still need retry and reconnect behaviour. [AWS explains the routing and health checks](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-how-it-works.html).

This is the key difference from DNS failover. Route 53 changes the answer clients receive when they next resolve the name. Global Accelerator keeps the address stable and changes where traffic behind that address is sent. Neither removes the need to decide what happens to sessions, writes and application state during a failure.

#### **CloudFront origin failover is useful, but know the boundary**

CloudFront can also fail over from a primary to a secondary origin when a qualifying request fails. The important catch is the HTTP method: origin failover applies only to `GET`, `HEAD` and `OPTIONS`, not `POST`, `PUT` or other writes. Serving pages from a secondary origin therefore does not prove that form submissions or orders will survive the same failure. [AWS documents the behaviour](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/high_availability_origin_failover.html).

#### **Put the pieces together**

A common web pattern is a Route 53 alias pointing to CloudFront. CloudFront can then use different cache behaviours to send static paths to an S3 bucket protected by OAC and dynamic paths to a private Application Load Balancer through a VPC origin. AWS WAF can inspect requests at CloudFront.

That does not mean every design also needs Global Accelerator. Choose it when you specifically need stable anycast addresses, TCP or UDP acceleration, or health-based routing at that layer.

| Question                                                             | Service to examine first |
| -------------------------------------------------------------------- | ------------------------ |
| Can this HTTP response be served or processed near the user?         | CloudFront               |
| Which DNS destination should the client be given?                    | Route 53                 |
| Do clients need stable anycast IPs and health-based TCP/UDP routing? | Global Accelerator       |

Before calling the design resilient, test the things users actually do: a cache hit, a private request from two different users, an unavailable origin, and a write while the preferred Region or endpoint is down. Those tests expose mistakes that a tidy architecture diagram can hide.
