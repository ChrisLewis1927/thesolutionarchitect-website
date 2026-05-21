---
title: "Security Pillar"
category: "aws-well-architected"
sequenceOrder: 2
estimatedMinutes: 12
---

## Introduction

The Security pillar encompasses the ability to protect data, systems, and assets to take advantage of cloud technologies to improve your security posture.

## Identity and Access Management

Implement the principle of least privilege across all AWS accounts and services. Use IAM roles rather than long-lived credentials.

In UK government environments, this aligns with the Secure by Design framework and Zero Trust principles.

## Data Protection

Classify your data and implement appropriate controls. Encrypt data at rest and in transit using AWS KMS and TLS.

## Incident Response

Prepare for security events with automated detection and response mechanisms. Ensure your incident response plan aligns with NCSC guidance.

---
keyTakeaways:
  - Apply least privilege access across all resources
  - Encrypt data at rest and in transit as standard practice
  - Automate security event detection and response

practicalExamples:
  - Configure AWS Organizations with SCPs to enforce security guardrails across accounts
  - Use AWS GuardDuty for automated threat detection aligned with NCSC recommendations
