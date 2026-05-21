---
title: "Operational Excellence Pillar"
category: "aws-well-architected"
sequenceOrder: 1
estimatedMinutes: 10
---

## Introduction

The Operational Excellence pillar focuses on running and monitoring systems to deliver business value and continually improving supporting processes and procedures.

Key areas include organisation, preparation, operation, and evolution of workloads.

## Key Principles

Operational excellence in the AWS Well-Architected Framework is built on several core principles that guide how teams should approach running cloud workloads.

- Perform operations as code
- Make frequent, small, reversible changes
- Refine operations procedures frequently
- Anticipate failure
- Learn from all operational failures

## Practical Application

In a UK government context, operational excellence aligns closely with GDS Service Standard points around operating a reliable service and iterating based on feedback.

Consider how your architecture supports automated deployments, monitoring, and incident response.

---
keyTakeaways:
  - Automate operational procedures wherever possible
  - Design for small, reversible changes to reduce blast radius
  - Establish runbooks and playbooks for common operational scenarios

practicalExamples:
  - Use AWS CloudFormation or Terraform to define infrastructure as code for repeatable deployments
  - Implement CloudWatch alarms with automated remediation actions for common failure modes
