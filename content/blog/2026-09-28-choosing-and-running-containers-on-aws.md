---
title: Choosing and running containers on AWS
date: 2026-09-28T16:15:00.000Z
category: Cloud
excerpt: "Amazon ECS coordinates containers without requiring Kubernetes. Amazon
  EKS provides managed Kubernetes, making it useful when you need its API,
  existing tools or established team skills. "
author: The Solution Architect
---
A container that starts successfully is a useful beginning. Running it reliably means answering a few more questions: what happens when traffic grows, capacity disappears, a release goes wrong, or a request becomes slow?

The choices below connect those questions, from selecting a platform to knowing when someone needs to intervene. The practical examples use Amazon ECS and a web application behind an Application Load Balancer (ALB), which distributes incoming requests.

#### **Choose a platform your team can operate**

Amazon ECS coordinates containers without requiring Kubernetes. Amazon EKS provides managed Kubernetes, making it useful when you need its API, existing tools or established team skills. Kubernetes compatibility can help reuse application definitions, but AWS-specific networking, permissions and storage still need consideration when moving elsewhere.

For a team without a Kubernetes requirement, ECS is a sensible starting point. EKS deserves consideration when that ecosystem solves a real problem. Neither removes the need to understand application health, access and networking; EKS Auto Mode does reduce infrastructure work such as managing worker machines. See the [ECS overview](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) and[ EKS Auto Mode responsibilities.](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)

Then choose the compute underneath. **Fargate** removes worker-machine management, while **EC2 managed by your team** gives more host control. **ECS Managed Instances** offers EC2 capabilities with AWS managing provisioning, scaling and patching. Check requirements such as GPUs and host access before choosing. Compare utilisation and operating effort too: [Compute Savings Plans also cover eligible Fargate usage](https://aws.amazon.com/fargate/faqs/), so discounts alone do not settle the decision.

#### **Use Spot where interruptions are manageable**

In ECS, a **task** is a running copy of a definition containing one or more containers. A **service** tries to maintain the requested number of tasks. A capacity provider strategy decides which compute providers receive them.

A service can combine ordinary Fargate capacity with discounted, interruptible Fargate Spot. The strategy’s **base** places a minimum number on one provider first; **weights** divide the remaining placements. The illustration shows how the allocation works.

![](/images/blog/5.2.1-mixed-capacity-providers.png)

Size the non-Spot portion for the traffic you need to serve if Spot disappears. AWS does not automatically replace unavailable Fargate Spot capacity with ordinary Fargate. Also, a single strategy cannot combine Fargate providers with EC2 Auto Scaling group providers.

Fargate Spot gives two minutes’ interruption notice. The application must handle SIGTERM, its shutdown signal, and finish or safely hand off work. The container’s default stop timeout is only 30 seconds; Fargate allows up to 120 seconds. Test shutdown under load rather than assuming the warning prevents dropped requests.

#### **Scale on a measure that matches the work**

Target tracking adjusts the service’s task count to keep a chosen metric near a target, within configured minimum and maximum limits. The useful question is whether adding tasks actually reduces the pressure that metric measures.

![](/images/blog/5.2.2-the-target-tracking-loop.png)

Requests per target can work well when requests require similar amounts of work. CPU can be a better fit for processing-heavy tasks. Memory is useful only if its utilisation falls predictably as work is spread across more tasks. Custom metrics are also supported: the choice is not limited to three built-in options.

Load-test the application to choose a target that leaves room for tasks to start. Adding application tasks will not fix an overloaded database. For predictable peaks, scheduled scaling can add capacity beforehand. On EC2, make sure the underlying fleet can grow too.

#### **Make a failed release easy to recover from**

A **rolling deployment** replaces tasks gradually. It is ECS’s default and can automatically roll back when configured failure checks trigger. A **blue/green deployment** runs old and new versions alongside each other, allowing traffic to return to the old version while it is retained. That recovery option needs extra capacity during the release.

ECS natively supports blue/green, canary and linear strategies. A **canary** sends a small share of traffic to the new version before moving the rest; **linear** shifts traffic in equal steps. CodeDeploy is another supported controller, but it is no longer required for these traffic-shifting patterns.

![](/images/blog/5.2.3-blue-green-traffic-shift.png)

Choose checks that catch a release which starts successfully but behaves badly, such as a rise in application errors. Enable alarm-based rollback explicitly. Alarms are not the only rollback mechanism: supported failure checks and lifecycle hooks can also stop a bad release. A **bake period** gives the new version time to reveal problems before the old version is retired.

#### **Keep evidence after a task has gone**

Logs explain individual events, metrics show patterns over time, and traces follow a request across services. Export them while the application runs so that replacing a task does not remove the evidence you need.

Start simply: application output sent through the awslogs driver goes to CloudWatch Logs. For supported Linux workloads, FireLens adds filtering and routing through Fluent Bit or Fluentd. A **sidecar** is a supporting container running alongside the application; the diagram shows logging and tracing examples.

![](/images/blog/5.2.4-telemetry-off-the-task.png)

Enable Container Insights with enhanced observability when you need task and container detail. For traces, instrument the application with OpenTelemetry and use a collector such as AWS Distro for OpenTelemetry (ADOT) to export them. Adding a collector alone does not make uninstrumented application code produce traces.

#### **Alert when someone needs to act**

For a web application, begin with failed requests and slow responses. Then add early warnings where losing capacity needs action before users are affected. A sustained shortage of healthy tasks may deserve an urgent alert even while requests still succeed. AWS recommends alerts tied to operational or business impact.

![](/images/blog/5.2.5-alarm-on-symptoms-not-resources.png)

Track both load-balancer-generated and application-generated 5xx errors. For latency, p99 is the value at or below which 99% of measured responses fall. It exposes slow responses that an average can hide, but the ALB’s TargetResponseTime ends when the target starts sending response headers; it is not the user’s complete page-load time. [See AWS’s metric definitions.](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html)

Use service events and stopped-task details to investigate the cause. Exit code 137 means the process received SIGKILL; memory exhaustion is one possible explanation. Check the recorded reason before changing resource sizes. AWS documents [exit codes](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-diags.html) and [stopped-task investigation.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/stopped-task-errors.html)

A useful next step is a small test under realistic traffic: replace a task, increase demand and deploy a version that fails a check. Confirm that capacity responds, the release recovers and the evidence explains what happened. Those observations give you a stronger basis for running the application than a successful startup alone.[](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
