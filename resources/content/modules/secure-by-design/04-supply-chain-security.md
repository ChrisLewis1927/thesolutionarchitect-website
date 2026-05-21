---
title: "Supply Chain Security"
category: "secure-by-design"
sequenceOrder: 4
estimatedMinutes: 15
---

# Supply Chain Security

## Introduction

Supply chain security addresses the risks that arise from dependencies on third-party software, services, and suppliers. Modern software systems are built on layers of third-party components — open source libraries, cloud services, SaaS platforms, and commercial software. Each dependency introduces potential vulnerabilities, and attackers increasingly target the supply chain as a way to compromise many organisations through a single attack.

The SolarWinds attack in 2020, the Log4Shell vulnerability in 2021, and the XZ Utils backdoor attempt in 2024 demonstrated the scale of supply chain risk. For UK government architects, supply chain security is a critical concern addressed by the Secure by Design framework, NCSC guidance, and government procurement standards.

This module covers the risks, principles, and practical measures for securing the software supply chain.

## Understanding Supply Chain Risk

### The Software Supply Chain

Your software supply chain includes everything that contributes to your running system:

- **Open source libraries** — the packages your application depends on (npm, PyPI, NuGet, Maven)
- **Transitive dependencies** — the packages your dependencies depend on (often hundreds or thousands)
- **Container base images** — the operating system and runtime in your container images
- **Build tools** — compilers, bundlers, CI/CD tools, and their plugins
- **Cloud services** — the cloud provider's services and their underlying infrastructure
- **SaaS platforms** — third-party services your application integrates with
- **Development tools** — IDEs, extensions, and developer productivity tools

Each link in this chain is a potential attack vector. An attacker who compromises a popular npm package can potentially affect thousands of applications that depend on it.

### Types of Supply Chain Attacks

**Dependency confusion** — an attacker publishes a malicious package with the same name as an internal package to a public registry. If the build system checks the public registry first, it downloads the malicious package.

**Typosquatting** — an attacker publishes a package with a name similar to a popular package (e.g., "lodahs" instead of "lodash"), hoping developers will install it by mistake.

**Compromised maintainer** — an attacker gains access to a legitimate maintainer's account and publishes a malicious update to a trusted package.

**Build system compromise** — an attacker compromises the CI/CD pipeline to inject malicious code during the build process.

**Backdoored dependencies** — an attacker contributes seemingly benign code to an open source project that contains a hidden backdoor, as attempted with XZ Utils.

## Securing Dependencies

### Dependency Inventory

You cannot secure what you do not know about. Maintain a complete inventory of all dependencies:

- **Direct dependencies** — packages explicitly listed in your package manifest
- **Transitive dependencies** — packages pulled in by your direct dependencies
- **Development dependencies** — packages used only during development and build
- **Runtime dependencies** — packages required in the running application

Use Software Bill of Materials (SBOM) tools to generate and maintain this inventory automatically. CycloneDX and SPDX are the two main SBOM formats.

### Vulnerability Scanning

Continuously scan dependencies for known vulnerabilities:

- **Snyk** — commercial tool with strong open source support and developer experience
- **Dependabot** — GitHub's built-in dependency scanning and automated updates
- **OWASP Dependency-Check** — open source tool for Java, .NET, and other ecosystems
- **Trivy** — open source scanner for containers, filesystems, and Git repositories
- **npm audit / pip audit** — ecosystem-specific vulnerability checking

Integrate scanning into your CI/CD pipeline so that builds fail when critical vulnerabilities are detected. Configure automated pull requests for dependency updates.

### Dependency Pinning and Lock Files

Pin dependency versions to ensure reproducible builds:

- Use lock files (package-lock.json, Pipfile.lock, go.sum) and commit them to source control
- Pin container base images to specific digests, not just tags
- Verify package integrity using checksums or signatures where available
- Review dependency updates before merging — automated updates should still be reviewed

### Private Package Registries

For organisations with internal packages, use a private package registry to prevent dependency confusion:

- Configure your build system to check the private registry first for internal package names
- Use scoped packages (e.g., @department/package-name) to namespace internal packages
- Consider using a registry proxy (Artifactory, Nexus) that caches public packages and provides an additional scanning layer

## Securing the Build Pipeline

### Pipeline Integrity

Your CI/CD pipeline is a high-value target. If an attacker can modify your pipeline, they can inject malicious code into every deployment:

- **Pipeline as code** — define pipelines in version-controlled files, subject to the same review process as application code
- **Immutable build environments** — use fresh, clean build environments for each build rather than persistent build agents
- **Signed commits** — require GPG-signed commits to verify the identity of code authors
- **Branch protection** — require pull request reviews and status checks before merging to main
- **Least privilege** — CI/CD service accounts should have only the permissions needed for their specific tasks

### Build Provenance

Build provenance provides a verifiable record of how a software artefact was built:

- What source code was used (commit hash)
- What build environment was used
- What dependencies were included
- Who triggered the build
- What the build process was

SLSA (Supply-chain Levels for Software Artifacts) is a framework for improving build integrity. Aim for at least SLSA Level 2 (authenticated build service with provenance generation).

### Artefact Signing

Sign your build artefacts (container images, packages, binaries) so that consumers can verify their authenticity:

- Use Sigstore/cosign for container image signing
- Use GPG for package signing
- Verify signatures before deployment to production

## Supplier and Service Security

### Cloud Provider Security

Your cloud provider is a critical part of your supply chain. Evaluate cloud provider security using:

- **NCSC Cloud Security Principles** — 14 principles for evaluating cloud services
- **Compliance certifications** — ISO 27001, SOC 2, CSA STAR
- **Government accreditation** — check whether the service is listed on the Digital Marketplace or has been assessed for government use
- **Shared responsibility model** — understand what the provider secures and what you are responsible for

### Third-Party Service Assessment

For SaaS and third-party services, assess:

- **Data handling** — where is your data stored, who can access it, how is it protected?
- **Security practices** — does the provider follow secure development practices, conduct penetration testing, have an incident response plan?
- **Contractual protections** — are there SLAs for security, data breach notification requirements, and audit rights?
- **Exit strategy** — can you extract your data and migrate to an alternative if needed?

For government procurement, these assessments should align with the Technology Code of Practice and departmental security policies.

### Supplier Incident Response

Plan for security incidents in your supply chain:

- How will you be notified if a supplier has a security incident?
- What is your process for assessing the impact on your service?
- Can you isolate or replace a compromised supplier quickly?
- Do you have alternative suppliers or fallback options for critical services?

## Government Context

### NCSC Supply Chain Security Guidance

The NCSC provides specific guidance on supply chain security for government:

- Understand your supply chain and the risks it introduces
- Establish control over your supply chain through contracts, assessments, and monitoring
- Verify that security requirements are met throughout the supply chain
- Plan for supply chain incidents

### Procurement and Contracts

Government procurement should include security requirements:

- Security standards that suppliers must meet (Cyber Essentials Plus as a minimum)
- Right to audit and assess supplier security practices
- Incident notification requirements (timelines and detail)
- Data handling and protection requirements
- Secure development practices requirements

## Key Takeaways

- Maintain a complete inventory of all dependencies using SBOM tools
- Continuously scan dependencies for vulnerabilities and automate updates
- Secure your CI/CD pipeline as a high-value target with pipeline-as-code and least privilege
- Assess third-party services against NCSC Cloud Security Principles and government standards
- Plan for supply chain incidents with isolation strategies and alternative suppliers

## Practical Examples

### Example 1: Responding to a Critical Vulnerability

A critical vulnerability is disclosed in a widely-used logging library. The department's security team uses SBOMs generated during each build to identify all affected services within 3 hours. The automated dependency scanning pipeline has already created pull requests with the patched version for each affected repository. The team reviews and merges the updates, and automated CI/CD pipelines deploy the fixes to production within 24 hours. Services that cannot be immediately updated are mitigated through WAF rules that block the specific attack pattern. The entire response is documented and reviewed in a post-incident review.

### Example 2: Securing the Build Pipeline

A government development team implements supply chain security for their CI/CD pipeline. GitHub branch protection requires two approvals for merges to main, with signed commits enforced. The pipeline runs in ephemeral GitHub Actions runners (no persistent build agents). Dependabot creates automated PRs for dependency updates, reviewed weekly. Container images are built from pinned base images, scanned with Trivy, and signed with cosign. An SBOM is generated for each release using Syft and stored alongside the release artefacts. The team achieves SLSA Level 2 build provenance within three months.

---
keyTakeaways:
  - Maintain a complete inventory of all dependencies using SBOM tools
  - Continuously scan dependencies for vulnerabilities and automate updates
  - Secure your CI/CD pipeline as a high-value target with pipeline-as-code and least privilege
  - Assess third-party services against NCSC Cloud Security Principles
  - Plan for supply chain incidents with isolation strategies and alternative suppliers

practicalExamples:
  - Use SBOMs and automated scanning to respond to a critical vulnerability within 24 hours
  - Implement pipeline security with signed commits ephemeral runners and artefact signing
