---
title: Designing for containerised workloads on AWS
date: 2026-08-28T15:57:00.000Z
category: Cloud
excerpt: >
  This post covers the main choices involved in running containerised
  applications on AWS: how containers differ from virtual machines, how Amazon
  ECR, ECS, EKS and Fargate fit together, the other compute options available,
  and how state and observability affect the design.


  - Explain the practical difference between a container and a virtual machine.

  - Explain the roles of Amazon ECR, ECS and EKS.

  - Compare managed and self-managed compute options for container workloads.

  - Choose storage and observability approaches from workload requirements rather than service names.
author: The Solution Architect
---
Containers give you a repeatable way to package and run software, but choosing to use containers does not tell you how the application should be structured or which AWS services it should use. Those decisions still start with the workload.

## Start with the workload

Do not begin by asking whether the application should use ECS, EKS or Fargate. First write down what the workload needs. The answers give you criteria against which the AWS options can be compared.

* **Does the organisation already use Kubernetes?** - Existing Kubernetes skills, tooling and platform standards may make EKS a better organisational fit than introducing a second orchestration model.
* **Does the workload need specialist compute or host access?** - Requirements such as GPUs, privileged access, particular instance types or host-level software affect which compute options are available.
* **Is demand steady, variable or unpredictable?** - The utilisation pattern affects scaling, capacity management and cost.
* **What data must survive when a container is replaced?** -This determines whether the application needs a database, object storage, block storage or a shared file system.
* **What are the availability and recovery requirements?** - These affect placement, scaling, storage and failure-handling decisions.
* **What must be logged, measured and traced?** - Containers are disposable, so operational data normally needs to leave the container.

***This is the architecture work. The service choice comes afterwards.***

## Containers do not mean microservices

Loose coupling is useful because a component can change or fail without every dependent component having to change with it. A load balancer is one way to achieve this when several interchangeable targets serve request traffic. Queues, events, streams and workflows are other ways of reducing direct dependencies.

![](/images/blog/1-tight-versus-loose-coupling.png)

The important point is the interface between components, not the presence of a particular AWS service.

The same applies to microservices. A monolith can be containerised, and a containerised application does not need to be decomposed into microservices.

![](/images/blog/2-monolith-v-microservices.png)

Microservices can allow parts of an application to be deployed and scaled independently, but they also introduce network communication, distributed failure modes, additional security boundaries and more operational components. Use them when those trade-offs are justified by the application's domain, scaling needs, release model or team structure.

## What a container is

A virtual machine behaves like a separate computer, with its own operating system running on virtualised hardware. A container normally runs as an isolated process while sharing the host operating system kernel with other containers on that host.

![](/images/blog/3-virtual-machines-v-containers.png)

A container image packages the application with the files, libraries and configuration needed for it to run. Images are usually smaller than complete virtual-machine images, and containers can generally be started with less infrastructure overhead than provisioning a new VM.

Packaging the runtime environment also improves consistency between environments. It does not make the application completely independent of its surroundings: processor architecture, configuration, networking, identity, storage and external services still matter.

## Images, layers and Amazon ECR

A container image is made from read-only layers. When a container runs, it receives a writable layer for changes made during that container's lifetime. Removing the container removes that writable layer.

![](/images/blog/4-container-image-layers.png)

Keep production images focused on what the application actually needs. Smaller images require less storage and network transfer and can reduce the number of unnecessary packages and vulnerabilities shipped with the application.

Container images commonly use the Open Container Initiative image format. Amazon Elastic Container Registry (ECR) stores Docker and OCI-compatible images and artefacts. Private repositories can be protected with IAM and repository policies, and ECR provides vulnerability-scanning capabilities.

Image tags are convenient labels, but deployments that require an exact immutable image can identify it by its content digest.

![](/images/blog/4.620build20deploy-20pipeline.png)

## Choose the orchestrator: ECS or EKS

Once there are enough containers that deployment, replacement and scaling need to be coordinated, an orchestrator manages that work.

Amazon Elastic Container Service (ECS) is AWS's native container orchestration service. Amazon Elastic Kubernetes Service (EKS) provides managed Kubernetes on AWS.

### Consider ECS when

* The team primarily works with AWS services.
* There is no requirement for Kubernetes APIs or tooling.
* You want an AWS-native orchestration model with fewer Kubernetes-specific concepts to operate.
* ECS-specific workload definitions are acceptable.

### Consider EKS when

* Kubernetes is already an organisational platform standard.
* Existing workloads or tooling depend on Kubernetes APIs.
* The team already has Kubernetes skills and operating practices.
* The Kubernetes ecosystem provides a specific benefit.

Kubernetes provides a common orchestration API, although AWS-specific integrations can still reduce portability. EKS also leaves more Kubernetes concepts and lifecycle decisions relevant to the team, although EKS Auto Mode can manage more of the underlying infrastructure.

Do not choose EKS simply because Kubernetes is widely used. Choose it when Kubernetes itself provides value.

## Choose where the containers run

Orchestration and compute are separate decisions. The available compute models also differ between ECS and EKS.

### ECS compute options

**AWS Fargate** runs ECS tasks without requiring you to provision or patch EC2 instances. You specify task CPU and memory, networking and IAM configuration. AWS provides the underlying compute capacity, while you still decide how the application itself scales.

**Amazon ECS Managed Instances** is useful when the workload needs capabilities from the EC2 instance range, such as particular processors, GPUs or other host capabilities, but you still want AWS to manage provisioning, scaling, patching and maintenance of the instances.

**EC2 capacity providers** leave more responsibility with your team. They make sense when you need control that the managed options do not provide, such as custom host configuration or other instance-level requirements.

### EKS compute options

EKS can run workloads on EC2-backed nodes or Fargate. EKS Auto Mode can also manage much of the node lifecycle and associated compute, networking, load-balancing and storage infrastructure.

Fargate for EKS has limitations that matter when evaluating it. For example, it does not support GPUs, privileged containers, DaemonSets, EBS volumes or Fargate Spot.

The decision is therefore not simply "managed equals Fargate" and "control equals EC2". Compare the workload's host requirements, operational model, scaling pattern and expected utilisation before choosing.

## Keep persistent state outside disposable containers

A container should be replaceable without losing important application state. That does not mean every workload is stateless. It means persistent state should be stored somewhere with the required durability and lifecycle.

* **Object storage** - For documents, images, exports and other object data, Amazon S3 may be appropriate.
* **Relational or application data** - For persistent relational data, a managed database such as Amazon RDS or Aurora may be appropriate.
* **Shared file-system access** - For workloads that need a shared file system, Amazon EFS may be appropriate.
* **Persistent block storage** - For workloads that need block storage, Amazon EBS may be appropriate where it is supported by the selected orchestration and compute model.
* **Temporary working data** - Ephemeral task, pod or node storage can be used where losing the data is acceptable.

Storage semantics come before the service name. EFS and EBS are not interchangeable: one provides shared file storage while the other provides block storage, and support differs between ECS, EKS and their compute options.

## Send logs and metrics somewhere that survives the container

Containers can be replaced frequently, so do not rely on files inside a container as the permanent operational record. Applications commonly write logs to standard output and standard error and have the container platform forward them to a logging destination.

Amazon CloudWatch provides metrics and logs for AWS container workloads. ECS Container Insights with enhanced observability can add task-level and container-level performance information and make it easier to correlate metrics with logs.

FireLens is an ECS log-routing capability. It can use Fluent Bit or Fluentd to route container logs to supported AWS or partner destinations and can be used with ECS workloads running on Fargate or EC2-based capacity.

EKS has its own observability choices, including CloudWatch, Prometheus and OpenTelemetry tooling. The right combination depends on what the organisation already operates and which metrics, logs and traces are needed.

## Summary

Containers package an application and its runtime dependencies, but they do not decide the shape of the application around them. Start with the workload and its operational requirements.

Use ECR to store container images. Choose ECS when its AWS-native orchestration model fits the organisation, or EKS when Kubernetes provides a specific benefit. Then choose a compute model according to the workload's host requirements, operational responsibility, scaling pattern and cost profile.

Finally, treat containers as replaceable. Persistent application data and operational evidence should live in services whose lifecycle is independent of an individual container.
