---
title: "Security Guardrails for AI Systems"
category: "security"
sequenceOrder: 1
lastUpdated: "2024-06-01"
---

## Introduction

Deploying AI systems in government contexts requires robust security guardrails to protect against adversarial attacks, data leakage, and misuse. The NCSC provides guidance on securing machine learning systems that should be followed alongside Secure by Design principles.

## Threat Landscape

AI systems face unique security threats including prompt injection, model poisoning, data exfiltration through model outputs, and adversarial inputs designed to cause misclassification. Solution architects must consider these threats during design.

## Recommended Controls

Key security controls for AI systems in government include input validation and sanitisation, output filtering to prevent data leakage, rate limiting and abuse detection, audit logging of all AI interactions, and regular model evaluation against adversarial test suites.

## Practical Application

When designing AI-enabled services, architects should apply defence-in-depth principles. Place AI components behind API gateways with authentication, implement content filtering on both inputs and outputs, and ensure all interactions are logged for audit purposes.
