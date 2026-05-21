---
title: "Secure Development Practices"
category: "secure-by-design"
sequenceOrder: 3
estimatedMinutes: 15
---

# Secure Development Practices

## Introduction

Secure development practices ensure that security is built into software from the first line of code, not bolted on after development is complete. The Secure by Design framework emphasises that security is everyone's responsibility — not just the security team's — and that secure development practices should be embedded into the daily workflow of every developer.

For solution architects, understanding secure development practices is essential for two reasons: first, you need to design architectures that support secure development (CI/CD pipelines with security gates, secure coding standards, dependency management); second, you need to review and guide development teams to ensure security practices are followed.

This module covers the practical secure development practices that government development teams should adopt.

## Secure Coding Standards

### Input Validation

Every piece of data that enters your system from an external source is potentially malicious. Validate all input:

- **Allowlist validation** — define what is acceptable and reject everything else. This is more secure than blocklist validation (trying to identify and block known bad patterns).
- **Type checking** — ensure data matches the expected type (string, number, date, email)
- **Length limits** — enforce maximum lengths to prevent buffer overflows and denial of service
- **Range checking** — ensure numeric values fall within expected ranges
- **Format validation** — use regular expressions or parsing libraries for structured data (dates, postcodes, National Insurance numbers)

Validate on the server side, always. Client-side validation improves user experience but provides no security — it can be bypassed trivially.

### Output Encoding

Output encoding prevents injection attacks by ensuring that data is treated as data, not as code:

- **HTML encoding** — encode user-supplied data before inserting it into HTML to prevent Cross-Site Scripting (XSS)
- **SQL parameterisation** — use parameterised queries or ORM frameworks to prevent SQL injection. Never concatenate user input into SQL strings.
- **URL encoding** — encode data before inserting it into URLs
- **JSON encoding** — use JSON serialisation libraries rather than string concatenation

Modern frameworks (React, Angular, Django, Rails, ASP.NET) provide automatic output encoding for most contexts. Ensure your team understands when automatic encoding applies and when manual encoding is needed.

### Authentication and Session Management

Implement authentication and session management using established libraries and frameworks:

- Use GOV.UK One Login for citizen-facing authentication where available
- Use OAuth 2.0 / OpenID Connect for API authentication
- Generate session tokens using cryptographically secure random number generators
- Set appropriate session timeouts (balance security with usability)
- Invalidate sessions on logout and password change
- Protect session cookies with Secure, HttpOnly, and SameSite attributes

Do not implement your own authentication system. Authentication is complex and the consequences of getting it wrong are severe. Use established identity providers and libraries.

### Error Handling and Logging

Handle errors securely:

- Never expose stack traces, database errors, or internal system details to users
- Log errors with sufficient detail for debugging but without sensitive data (passwords, tokens, personal data)
- Use structured logging (JSON format) for consistent, searchable log entries
- Include correlation IDs in logs to trace requests across services
- Ensure logging cannot be used as an attack vector (log injection)

For government services, logging must also support audit requirements. Log who did what, when, and from where — but be mindful of data protection requirements when logging personal data.

## Dependency Management

### Third-Party Dependencies

Modern applications depend on hundreds of third-party libraries. Each dependency is a potential attack vector:

- **Dependency scanning** — use tools like Snyk, Dependabot, or OWASP Dependency-Check to identify known vulnerabilities in dependencies
- **Automated updates** — configure automated pull requests for dependency updates (Dependabot, Renovate)
- **Lock files** — use package lock files (package-lock.json, Pipfile.lock, Gemfile.lock) to ensure reproducible builds
- **Minimal dependencies** — evaluate whether each dependency is necessary. Fewer dependencies mean a smaller attack surface.

### Container Image Security

For containerised applications:

- Use minimal base images (Alpine, distroless) to reduce the attack surface
- Scan container images for vulnerabilities (Trivy, Snyk Container, ECR scanning)
- Do not run containers as root — use a non-root user in the Dockerfile
- Pin base image versions to specific digests, not just tags
- Rebuild images regularly to incorporate base image security patches

### Software Bill of Materials (SBOM)

Generate and maintain a Software Bill of Materials — a complete inventory of all components in your software. SBOMs enable:

- Rapid identification of affected systems when a new vulnerability is disclosed
- Compliance with government procurement requirements
- Transparency about the software supply chain

Tools like Syft, CycloneDX, and SPDX can generate SBOMs automatically as part of your build process.

## Security in CI/CD Pipelines

### Pipeline Security Gates

Integrate security checks into your CI/CD pipeline:

1. **Pre-commit** — secret scanning (detect accidentally committed credentials)
2. **Build** — static analysis (SAST), dependency scanning, container image scanning
3. **Test** — dynamic analysis (DAST), security-focused integration tests
4. **Pre-deployment** — infrastructure compliance scanning (Checkov, tfsec)
5. **Post-deployment** — runtime security monitoring, vulnerability scanning

Each gate should be configured to fail the pipeline for critical and high-severity findings. Medium and low findings should be tracked and addressed within defined SLAs.

### Secret Management

Secrets (API keys, database credentials, certificates) must never be stored in source code:

- Use a secrets management service (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Rotate secrets regularly and automatically where possible
- Use short-lived credentials (temporary security tokens, short-lived certificates) in preference to long-lived secrets
- Implement pre-commit hooks (git-secrets, detect-secrets) to prevent accidental commits of secrets

### Infrastructure Security Scanning

Scan Infrastructure as Code for security misconfigurations:

- **Checkov** — scans Terraform, CloudFormation, Kubernetes, and Bicep for security issues
- **tfsec** — Terraform-specific security scanner
- **KICS** — multi-platform IaC scanner
- **AWS Config Rules / Azure Policy** — runtime compliance checking

These tools catch common misconfigurations like public S3 buckets, unencrypted databases, and overly permissive security groups before they reach production.

## Security Testing

### Static Application Security Testing (SAST)

SAST tools analyse source code for security vulnerabilities without executing the application:

- Identify common vulnerability patterns (injection, XSS, insecure deserialization)
- Run early in the development cycle (IDE plugins, CI pipeline)
- Generate findings that developers can fix before code review

Tools: SonarQube, Semgrep, CodeQL, Checkmarx

### Dynamic Application Security Testing (DAST)

DAST tools test running applications by sending malicious requests:

- Identify vulnerabilities that only manifest at runtime
- Test the application as an attacker would
- Run against staging environments as part of the CI/CD pipeline

Tools: OWASP ZAP, Burp Suite, Nuclei

### Penetration Testing and ITHC

Government services require IT Health Checks (ITHC) — independent penetration tests conducted by CHECK-approved testers:

- Schedule ITHC before the service goes live
- Plan for remediation time after ITHC findings
- Conduct annual ITHC for live services
- Address critical and high findings before go-live; track medium and low findings

## Key Takeaways

- Validate all input on the server side using allowlist validation
- Use parameterised queries and automatic output encoding to prevent injection attacks
- Scan dependencies continuously and automate updates for known vulnerabilities
- Integrate security gates into CI/CD pipelines covering SAST, DAST, dependency scanning, and IaC scanning
- Never store secrets in source code — use dedicated secrets management services

## Practical Examples

### Example 1: Secure CI/CD Pipeline for a Government Service

A government development team implements a secure CI/CD pipeline using GitHub Actions. Pre-commit hooks run detect-secrets to prevent credential leaks. The build stage runs SonarQube for SAST, Snyk for dependency scanning, and Trivy for container image scanning. The test stage deploys to a staging environment and runs OWASP ZAP for DAST. The pre-deployment stage runs Checkov against Terraform configurations. Critical findings fail the pipeline; high findings create Jira tickets with 5-day SLAs. The team reduces security findings in production by 85% within three months of implementing the pipeline.

### Example 2: Dependency Management Strategy

A department establishes a dependency management strategy across its development teams. Dependabot is configured on all repositories to create automated pull requests for dependency updates. A weekly triage meeting reviews Snyk alerts and prioritises remediation. Container base images are rebuilt weekly to incorporate security patches. An SBOM is generated for each release and stored in the architecture repository. When the Log4Shell vulnerability is disclosed, the team uses SBOMs to identify all affected services within 2 hours and deploys patches within 24 hours.

---
keyTakeaways:
  - Validate all input on the server side using allowlist validation
  - Use parameterised queries and automatic output encoding to prevent injection attacks
  - Scan dependencies continuously and automate updates for known vulnerabilities
  - Integrate security gates into CI/CD pipelines covering SAST DAST and IaC scanning
  - Never store secrets in source code use dedicated secrets management services

practicalExamples:
  - Implement a secure CI/CD pipeline with SAST DAST dependency and IaC scanning
  - Establish a dependency management strategy with automated updates and SBOM generation
