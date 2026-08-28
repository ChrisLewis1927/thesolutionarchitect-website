---
title: Designing for containerised workloads on AWS
date: 2026-08-27T14:11:00.000Z
category: Cloud
excerpt: Containers underpin a large share of how applications run on AWS, and
  getting the most from them comes down to a small set of decisions made in the
  right order.
author: The Solution Architect
---
Designing for containerised workloads on AWS

Containers give you a repeatable way to package and run software, but choosing to use containers does not tell you how the application should be structured or which AWS services it should use. Those decisions still start with the workload.

Do not begin by asking whether the application should use ECS, EKS or Fargate. First write down what the workload needs. The answers give you criteria against which the AWS options can be compared.

Question

Why it affects the design

Does the organisation already use Kubernetes?

This may make EKS a better organisational fit than introducing a second orchestration model.

Does the workload require a GPU, privileged access, a particular instance type or host-level software?

Some managed compute options restrict access to the underlying host.

Is demand steady, highly variable or unpredictable?

The utilisation pattern affects scaling, capacity management and cost.

What data must survive when a container is replaced?

This determines whether the application needs a database, object storage, block storage or a shared file system.

What are the availability and recovery requirements?

These affect placement, scaling, storage and failure-handling decisions.

What must be logged, measured and traced?

Containers are disposable, so operational data normally needs to leave the container.

This is the architecture work. The service choice comes afterwards.

Containers do not mean microservices

Loose coupling is useful because a component can change or fail without every dependent component having to change with it. A load balancer is one way to achieve this when several interchangeable targets serve request traffic. Queues, events, streams and workflows are other ways of reducing direct dependencies.

<!-- EXISTING IMAGE 1:
     Reuse the current "Tight coupling versus loose coupling" diagram here.
     Preserve the current image asset and styling.
-->

The important point is the interface between components, not the presence of a particular AWS service.

The same applies to microservices. A monolith can be containerised, and a containerised application does not need to be decomposed into microservices.

<!-- EXISTING IMAGE 2:
     Reuse the current "Monolith versus microservices" diagram here.
     Preserve the current image asset and styling.
-->

Microservices can allow parts of an application to be deployed and scaled independently, but they also introduce network communication, distributed failure modes, additional security boundaries and more operational components. Use them when those trade-offs are justified by the application's domain, scaling needs, release model or team structure.

What a container is

A virtual machine provides a virtualised machine with its own guest operating system and kernel. A container normally runs as an isolated process while sharing the host operating system kernel with other containers on that host.

<!-- EXISTING IMAGE 3:
     Reuse the current "Virtual machines versus containers" diagram here.
     Preserve the current image asset and styling.
-->

A container image packages the application with the files, libraries and configuration needed for it to run. Images are usually smaller than complete virtual-machine images, and containers can generally be started with less infrastructure overhead than provisioning a new VM.

Packaging the runtime environment also improves consistency between environments. It does not make the application completely independent of its surroundings: processor architecture, configuration, networking, identity, storage and external services still matter.

Images, layers and Amazon ECR

A container image is made from read-only layers. When a container runs, it receives a writable layer for changes made during that container's lifetime. Removing the container removes that writable layer.

<!-- EXISTING IMAGE 4:
     Reuse the current "Container image layers" diagram here.
     Preserve the current image asset and styling.
-->

Keep production images focused on what the application actually needs. Smaller images require less storage and network transfer and can reduce the number of unnecessary packages and vulnerabilities shipped with the application.

Container images commonly use the Open Container Initiative image format. Amazon Elastic Container Registry (ECR) stores Docker and OCI-compatible images and artefacts. Private repositories can be protected with IAM and repository policies, and ECR provides vulnerability-scanning capabilities.

Image tags are convenient labels, but deployments that require an exact immutable image can identify it by its content digest.

<!-- EXISTING IMAGE 5:
     Reuse the current "Build and deploy pipeline" diagram here.
     Preserve the current image asset and styling.
-->

Choose the orchestrator: ECS or EKS

Once there are enough containers that deployment, replacement and scaling need to be coordinated, an orchestrator manages that work.

Amazon Elastic Container Service (ECS) is AWS's native container orchestration service. Amazon Elastic Kubernetes Service (EKS) provides managed Kubernetes on AWS.

Consider

ECS

EKS

Operating model

AWS-native ECS APIs and concepts

Kubernetes APIs and ecosystem

Existing skills

Useful where the team primarily operates AWS services

Useful where Kubernetes skills and tooling already exist

Portability

Workload definition is ECS-specific

Kubernetes provides a common orchestration API, although AWS-specific integrations can still reduce portability

Operational complexity

Generally fewer orchestration components for the team to operate

More Kubernetes concepts and lifecycle decisions remain relevant, although EKS Auto Mode can manage more of the underlying infrastructure

Do not choose EKS simply because Kubernetes is widely used. Choose it when Kubernetes itself provides value: for example, because it is an organisational platform standard, existing workloads depend on Kubernetes APIs or the team needs its ecosystem and operating model.

Choose where the containers run

Orchestration and compute are separate decisions. The available compute models also differ between ECS and EKS.

ECS compute options

AWS Fargate runs ECS tasks without requiring you to provision or patch EC2 instances. You specify task CPU and memory, networking and IAM configuration. AWS provides the underlying compute capacity, while you still decide how the application itself scales.

Amazon ECS Managed Instances is useful when the workload needs capabilities from the EC2 instance range, such as particular processors, GPUs or other host capabilities, but you still want AWS to manage provisioning, scaling, patching and maintenance of the instances.

EC2 capacity providers leave more responsibility with your team. They make sense when you need control that the managed options do not provide, such as custom host configuration or other instance-level requirements.

EKS compute options

EKS can run workloads on EC2-backed nodes or Fargate. EKS Auto Mode can also manage much of the node lifecycle and associated compute, networking, load-balancing and storage infrastructure.

Fargate for EKS has limitations that matter when evaluating it. For example, it does not support GPUs, privileged containers, DaemonSets, EBS volumes or Fargate Spot.

<!-- EXISTING IMAGE 6:
     Do not reuse the existing "Orchestrator and launch type matrix" unchanged.
     It presents EC2 and Fargate as the complete compute choice and is now incomplete.
     Preserve the existing asset for reference, but omit it from the published lesson unless
     it is separately updated to reflect the current ECS and EKS compute models.
-->

The decision is therefore not simply "managed equals Fargate" and "control equals EC2". Compare the workload's host requirements, operational model, scaling pattern and expected utilisation before choosing.

Keep persistent state outside disposable containers

A container should be replaceable without losing important application state. That does not mean every workload is stateless. It means persistent state should be stored somewhere with the required durability and lifecycle.

Requirement

Possible AWS storage

Objects such as documents, images or exports

Amazon S3

Relational or application data

A suitable managed database such as Amazon RDS or Aurora

Shared file-system access

Amazon EFS

Persistent block storage

Amazon EBS where supported by the selected orchestration and compute model

Temporary working data

Ephemeral task, pod or node storage where losing the data is acceptable

Storage semantics come before the service name. EFS and EBS are not interchangeable: one provides shared file storage while the other provides block storage, and support differs between ECS, EKS and their compute options.

Send logs and metrics somewhere that survives the container

Containers can be replaced frequently, so do not rely on files inside a container as the permanent operational record. Applications commonly write logs to standard output and standard error and have the container platform forward them to a logging destination.

Amazon CloudWatch provides metrics and logs for AWS container workloads. ECS Container Insights with enhanced observability can add task-level and container-level performance information and make it easier to correlate metrics with logs.

FireLens is an ECS log-routing capability. It can use Fluent Bit or Fluentd to route container logs to supported AWS or partner destinations and can be used with ECS workloads running on Fargate or EC2-based capacity.

EKS has its own observability choices, including CloudWatch, Prometheus and OpenTelemetry tooling. The right combination depends on what the organisation already operates and which metrics, logs and traces are needed.

A worked decision

Consider an illustrative internal API. Demand varies during the working day, it does not require Kubernetes, GPUs, privileged host access or a custom operating system, and the application itself is stateless. Persistent records are stored in a managed database and generated files in object storage.

The main evaluation criteria are therefore low infrastructure-management effort, automatic replacement of failed tasks, straightforward scaling and integration with existing AWS networking and identity.

ECS on Fargate would be a reasonable option to evaluate because none of the stated requirements needs access to the underlying hosts and there is no requirement for Kubernetes. ECS Managed Instances or EC2-backed ECS could still be preferable if later analysis showed that sustained utilisation, specialised compute or host-level requirements changed the trade-off.

That is the important architecture pattern: the requirement produces the criteria, the criteria are used to compare the options, and the evidence supports the final decision.

Summary

Containers package an application and its runtime dependencies, but they do not decide the shape of the application around them. Start with the workload and its operational requirements.

Use ECR to store container images. Choose ECS when its AWS-native orchestration model fits the organisation, or EKS when Kubernetes provides a specific benefit. Then choose a compute model according to the workload's host requirements, operational responsibility, scaling pattern and cost profile.

Finally, treat containers as replaceable. Persistent application data and operational evidence should live in services whose lifecycle is independent of an individual container.

<!--
Preserve the existing "Back to the blog", related-guide links and s
