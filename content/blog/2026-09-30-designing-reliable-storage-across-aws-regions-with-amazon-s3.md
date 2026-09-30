---
title: Designing reliable storage across AWS Regions with Amazon S3
date: 2026-09-30T16:00:00.000Z
category: Cloud
excerpt: Learn how S3 permissions, versioning, replication and Multi-Region
  Access Points work together to protect data and keep applications available
  across AWS Regions.
author: The Solution Architect
---
A second copy of your data is not resilience on its own. You also need the right applications to reach it, a way back when the latest copy is wrong, and a plan for moving traffic when a Region is unavailable.

Imagine a service in London storing documents in Amazon S3. One application writes finance files, another reads curated data, and the service should keep working if London has a serious outage. That is really three problems:

* **Access**: who can read or change the data?
* **Recovery**: can you get an earlier good copy after a bad overwrite or delete?
* **Regional resilience**: is there a usable copy elsewhere, and can the application reach it?

Keeping those jobs separate makes S3 much easier to design. These examples use S3 general purpose buckets.

#### **Start with access: who is allowed to do what?**

An S3 **bucket** holds objects. An application normally calls S3 using an IAM role, whose policies describe what it may do. The bucket can also have a resource policy describing who may access it.

Access is not decided by one policy in isolation. An applicable explicit `Deny `beats an `Allow`, while controls such as AWS Organizations service control policies (SCPs) and resource control policies (RCPs) can set limits without granting access themselves. [AWS explains the full policy evaluation model.](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)

For private application data, leave S3 Block Public Access enabled unless you have a deliberate reason not to. It can apply at organisation, account, bucket and access-point level, with the most restrictive applicable settings taking effect. [AWS documents how Block Public Access works.](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

If S3 returns `AccessDenied`, find the control that rejected the request before widening permissions. Another broad Allow will not fix an explicit deny or an organisation guardrail.

#### **Split shared-bucket access before the policy becomes a maze**

If several applications share one bucket, their prefixes, network rules and permissions can crowd into a single bucket policy. S3 bucket policies are limited to 20 KB. [AWS recommends access points as one option when access patterns become complex.](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-management.html)

An S3 Access Point gives a workload its own named endpoint and policy. Finance, analytics and ingestion can therefore have clearer access paths while still using the same bucket.

![](/images/blog/5.3.2-access-points-replace-a-monolithic-policy.png)

Restrictions on an access point apply only when requests use that access point; they do not automatically block other permitted routes to the bucket. [AWS covers access-point policies and delegation.](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-points-policies.html)

#### **Cross-account access needs agreement on both sides**

For a role in account A to access a bucket directly in account B, two things must be true: the role must be allowed to make the request, and the bucket must trust that caller. AWS evaluates both accounts, and applicable denies or guardrails can still stop the request. If the objects use server-side encryption with AWS Key Management Service (SSE-KMS), S3 permission is only part of the answer. The caller also needs the relevant KMS permissions, and cross-account sharing requires a customer managed KMS key rather than an AWS managed key.

Versioning is not the same as an independent backup. A specific version can still be permanently deleted if the caller has permission. If you need stronger protection, S3 Object Lock can apply retention periods or legal holds to object versions. Once Object Lock is enabled for a bucket, it cannot be disabled and versioning cannot be suspended.

Lifecycle rules answer a different question again: how long should old versions be kept before they are transitioned or removed? Set that period from the service's recovery and retention needs, not from a generic S3 default.

#### **Replication copies data; Multi-Region Access Points route requests**

Cross-Region Replication (CRR) asynchronously copies eligible objects to another Region. Both buckets need versioning, and S3 needs permission to replicate. Existing objects may need S3 Batch Replication rather than simply turning on a live replication rule.

A Multi-Region Access Point (MRAP) does a different job: it gives the application one global endpoint and routes each request to one associated bucket. It does not create the copies itself, and it does not check whether the chosen bucket already contains the requested object. A read can therefore reach a bucket before replication has delivered that object and return `404 Not Found`.

![](/images/blog/5.3.5-the-multi-region-storage-pattern.png)

For failover, decide which Region may accept writes and how those writes will be synchronised before you switch back. AWS recommends two-way replication and replica modification sync before configuring MRAP failover controls. Moving S3 traffic is only the storage part of recovery; the rest of the application also needs a regional plan. 

Check MRAP constraints before committing to the pattern: requests use Signature Version 4A (SigV4A), private access uses interface rather than S3 gateway endpoints, and associated buckets cannot be added, removed or changed after creation. 

#### **Choose the recovery target before the AWS features**

Ask first: how much recent data could this service afford to lose? That is the recovery point objective, or RPO. If the answer is measured in minutes, replication lag is an architecture decision rather than an implementation detail.

S3 Replication Time Control (RTC) provides a defined replication-time commitment. Its SLA measures the percentage of objects replicated within 15 minutes across each monthly billing cycle and Region pair; service credits begin if that percentage falls below 99.9%. It is not a guarantee that every individual object will arrive within 15 minutes.

A replica is also not a backup: a corrupt or unwanted write can be copied to the second bucket. Keep recoverable versions for as long as you need them, and consider AWS Backup for S3 when you need managed recovery points separate from the live replica.

Resilience also has a cost: destination storage, replication requests, inter-Region transfer, RTC, MRAP, KMS and backups can all add charges. Compare the whole pattern rather than the bucket storage price alone using [Amazon S3 pricing.](https://aws.amazon.com/s3/pricing/)

#### **Put the pieces together**

Permissions decide who can touch the data. Versioning, Object Lock and backups decide what you can recover. Replication decides where copies exist. MRAP decides where requests go. None replaces the others.

Before calling the design resilient, test two failures: recover a known good version after a bad overwrite, and run the application against the alternate Region with recent data. That is where gaps in permissions, keys, replication and failover procedures become visible.[](https://aws.amazon.com/s3/pricing/)[](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-points-policies.html)[](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-management.html)[](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)[](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
