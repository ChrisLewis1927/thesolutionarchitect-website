---
title: "Threat Modelling Fundamentals"
category: "secure-by-design"
sequenceOrder: 1
estimatedMinutes: 10
---

## Introduction

Threat modelling is a core practice in the Secure by Design framework. It helps architects identify and mitigate security risks early in the design process.

## STRIDE Model

The STRIDE model categorises threats into six types: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.

Apply STRIDE to each component in your architecture to systematically identify potential threats.

## Government Context

In UK government, threat modelling should align with NCSC guidance and consider the specific threat landscape for public sector services.

---
keyTakeaways:
  - Perform threat modelling early in the design phase, not as an afterthought
  - Use STRIDE or similar frameworks to ensure systematic coverage
  - Align threat models with NCSC guidance for government services

practicalExamples:
  - Apply STRIDE analysis to a citizen-facing authentication flow to identify spoofing and elevation of privilege risks
  - Document threat mitigations in your architecture decision records for governance board review
