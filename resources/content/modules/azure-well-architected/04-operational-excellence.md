---
title: "Operational Excellence"
category: "azure-well-architected"
sequenceOrder: 4
estimatedMinutes: 15
---

# Operational Excellence

## Introduction

The Operational Excellence pillar of the Azure Well-Architected Framework focuses on the processes and practices that keep applications running in production. It covers development practices, deployment strategies, monitoring, and incident management — the full lifecycle of operating a cloud workload.

For UK government teams, operational excellence aligns closely with GDS Service Standard points 8 (iterate and improve frequently), 11 (choose the right tools and technology), and 14 (operate a reliable service). The Government Service Manual provides detailed guidance on running services that this pillar complements with Azure-specific practices.

This module covers how to design, deploy, and operate Azure workloads effectively.

## Development Practices

### Infrastructure as Code

All Azure infrastructure should be defined in code using:

- **Bicep** — Azure's native IaC language, purpose-built for Azure Resource Manager
- **Terraform** — multi-cloud IaC tool with strong Azure provider support
- **ARM Templates** — JSON-based templates (Bicep compiles to ARM, and is generally preferred)

Infrastructure as Code ensures environments are reproducible, changes are auditable, and deployments are consistent. For government services subject to audit and governance requirements, IaC provides an auditable trail of every infrastructure change.

### Source Control and Branching

Use Git for all code and configuration. Azure DevOps Repos or GitHub (both available to government organisations) provide hosted Git repositories with pull request workflows.

Adopt a branching strategy that supports your release cadence:
- **Trunk-based development** — short-lived feature branches merged frequently to main. Recommended for teams practising continuous deployment.
- **Git Flow** — longer-lived branches for teams with scheduled releases. More complex but provides clear release management.

### Code Quality

Integrate quality checks into your development workflow:
- Automated linting and formatting (enforced in CI)
- Unit and integration tests with minimum coverage thresholds
- Static analysis for security vulnerabilities (e.g., SonarQube, Snyk)
- Dependency scanning for known vulnerabilities

Azure DevOps Pipelines and GitHub Actions both support these checks as pipeline stages.

## Deployment Strategies

### CI/CD Pipelines

Automate your deployment pipeline from commit to production:

1. **Build** — compile, test, and package the application
2. **Test** — run unit, integration, and acceptance tests
3. **Stage** — deploy to a staging environment for final validation
4. **Production** — deploy using a safe deployment strategy

Azure DevOps Pipelines provides native integration with Azure services. GitHub Actions is an alternative with growing Azure integration support.

### Safe Deployment Practices

Minimise the risk of deployments causing outages:

- **Blue/Green deployments** — Azure App Service deployment slots allow you to deploy to a staging slot, validate, and swap to production with zero downtime
- **Canary deployments** — route a small percentage of traffic to the new version using Azure Front Door or Application Gateway
- **Feature flags** — decouple deployment from release using Azure App Configuration feature management
- **Ring-based deployments** — deploy progressively to wider audiences (internal users, then beta users, then all users)

All production deployments should be automated, tested, and reversible. Manual deployments to production should be treated as an exception requiring approval.

### Database Migrations

Database schema changes are often the riskiest part of a deployment. Adopt practices that reduce risk:

- Use migration tools (Entity Framework Migrations, Flyway, Liquibase) for versioned, repeatable schema changes
- Design migrations to be backward-compatible — the old application version should work with the new schema
- Separate data migrations from schema migrations
- Test migrations against a copy of production data before applying to production

## Monitoring and Observability

### Azure Monitor

Azure Monitor is the comprehensive monitoring platform for Azure:

- **Metrics** — numerical data collected at regular intervals (CPU, memory, request count)
- **Logs** — structured event data stored in Log Analytics workspaces
- **Alerts** — notifications triggered by metric thresholds or log query results
- **Workbooks** — interactive reports combining metrics, logs, and text

### Application Insights

Application Insights provides application-level monitoring:

- **Request tracking** — latency, throughput, and failure rates for every endpoint
- **Dependency tracking** — performance of calls to databases, APIs, and external services
- **Exception tracking** — automatic capture of unhandled exceptions with stack traces
- **Distributed tracing** — end-to-end request tracking across microservices
- **Live Metrics** — real-time view of application performance during incidents

Instrument all applications with Application Insights. The overhead is minimal and the operational visibility is invaluable.

### Dashboards and Alerting

Create Azure Dashboards for different audiences:

- **Operations dashboard** — real-time health, error rates, and infrastructure metrics
- **Business dashboard** — transaction volumes, user activity, and service KPIs
- **Cost dashboard** — current spend, trends, and budget status

Configure alerts for conditions that require human attention. Avoid alert fatigue by:
- Setting meaningful thresholds based on SLOs, not arbitrary values
- Using dynamic thresholds that adapt to normal patterns
- Routing alerts to the right team through action groups
- Regularly reviewing and tuning alert rules

## Incident Management

### Incident Response

Define clear incident response procedures:

1. **Detection** — automated alerts or user reports
2. **Triage** — assess severity and impact
3. **Communication** — notify stakeholders and update status pages
4. **Investigation** — use Application Insights and Log Analytics to diagnose
5. **Mitigation** — apply a fix or workaround
6. **Resolution** — confirm the issue is fully resolved
7. **Post-incident review** — document lessons learned and improvement actions

### Post-Incident Reviews

Conduct blameless post-incident reviews for all significant incidents. Focus on:

- What happened and what was the impact?
- How was the incident detected?
- What was the timeline of response actions?
- What could be improved in detection, response, or prevention?
- What specific actions will be taken, by whom, and by when?

Document findings and track improvement actions. Share learnings across teams to prevent similar incidents elsewhere.

## Automation

### Azure Automation

Azure Automation provides:

- **Runbooks** — PowerShell or Python scripts for operational tasks
- **Update Management** — automated OS patching for VMs
- **Configuration Management** — desired state configuration for VMs

Use runbooks for routine operational tasks: starting/stopping environments, rotating credentials, cleaning up old resources, and generating operational reports.

### Azure Logic Apps

For workflow automation that integrates with external systems, Logic Apps provides a low-code platform with hundreds of connectors. Common operational uses include:

- Automated incident notification to Microsoft Teams or Slack
- Integration between Azure alerts and ticketing systems (ServiceNow, Jira)
- Scheduled data exports and reporting

## Key Takeaways

- Define all infrastructure as code using Bicep or Terraform for reproducibility and auditability
- Automate deployments with safe deployment strategies including blue/green and canary patterns
- Instrument all applications with Application Insights for comprehensive observability
- Conduct blameless post-incident reviews and track improvement actions
- Automate routine operational tasks to reduce toil and human error

## Practical Examples

### Example 1: CI/CD Pipeline for a Government Service

A government digital team implements a CI/CD pipeline using Azure DevOps for a citizen-facing service. The pipeline runs unit tests and static analysis on every pull request. Merges to main trigger automated deployment to a staging slot on Azure App Service, followed by integration tests. After passing tests, the slot is swapped to production with automatic rollback if health checks fail within 5 minutes. Deployment frequency increases from monthly to daily, while deployment-related incidents drop to zero.

### Example 2: Operational Monitoring Setup

A department implements comprehensive monitoring for a case management system. Application Insights tracks request latency (SLO: p95 under 500ms), error rates (SLO: under 0.1%), and dependency health. Azure Monitor alerts notify the on-call engineer via PagerDuty when SLOs are breached. A Grafana dashboard (connected to Azure Monitor) displays real-time service health in the team area. Monthly operational reviews use Application Insights data to identify performance trends and plan capacity changes.

---
keyTakeaways:
  - Define all infrastructure as code using Bicep or Terraform for reproducibility
  - Automate deployments with safe strategies including blue-green and canary patterns
  - Instrument all applications with Application Insights for comprehensive observability
  - Conduct blameless post-incident reviews and track improvement actions
  - Automate routine operational tasks to reduce toil and human error

practicalExamples:
  - Implement CI/CD with Azure DevOps deployment slots and automatic rollback
  - Set up Application Insights monitoring with SLO-based alerting and operational dashboards
