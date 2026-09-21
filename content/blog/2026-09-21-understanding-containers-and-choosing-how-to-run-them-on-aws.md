---
title: Understanding containers and choosing how to run them on AWS
date: 2026-09-21T13:39:00.000Z
category: Cloud
excerpt: essential concepts from container fundamentals, orchestration services
  and incorporating persistent storage.
author: The Solution Architect
---
Packaging an application into a container is only one part of running it. The image still needs to be stored, the application needs somewhere to execute, and something needs to keep it available when traffic changes or a process fails. AWS offers services for each of these jobs, which is why the names can be confusing at first.

It helps if you separate three decisions: 

1. How the application is packaged
2. How its containers are coordinated
3. Who manages the machines underneath

Images address the first. Amazon ECS and Amazon EKS address the second. Compute options such as AWS Fargate and Amazon EC2 address the third.

#### **What a container actually is**

For a typical Linux container, the application runs as one or more processes sharing the kernel of its host. The kernel is the part of the operating system that manages hardware and system resources. Linux namespaces give processes separate views of things such as process IDs, network interfaces and filesystems. Control groups, or cgroups, account for resources and can limit or prioritise their use. [CPU shares](https://docs.docker.com/engine/containers/resource_constraints/), for example, express relative priority under contention; they are not a hard CPU cap. These mechanisms work alongside other security controls. [Docker explains these isolation mechanisms in its security documentation.](https://docs.docker.com/engine/security/)

A virtual machine has its own guest kernel. A container image can include operating system libraries and tools, but a standard Linux container does not boot its own kernel. Containers can also run inside virtual machines, as they commonly do on EC2. The two approaches are often used together. [Docker’s container overview](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) describes this distinction.

![Side-by-side virtual machine and container stacks, contrasting separate guest operating systems with a shared host kernel.](/images/blog/5.1.1-virtual-machines-and-containers.png)

*A simplified comparison. The VM side shows one application per VM, but a VM can run several applications: the guest kernel belongs to the VM. Hypervisor arrangements vary, and the container host can itself be a VM.*

Sharing a kernel can reduce overhead and help containers start quickly, although actual startup time depends on image downloads, available capacity and application initialisation. It also creates a shared security dependency: a host kernel compromise can put other containers on that host at risk.

For ECS on Fargate, each task has its own isolation boundary and does not share a kernel with other tasks. Containers within the same task share that boundary. Separate accounts and VPCs address different concerns, such as administrative and network separation; they are not interchangeable with runtime isolation. [AWS documents the task isolation differences between Fargate and shared container hosts.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)

**Build changes into the image.** A reliable deployment process builds and tests a new image, then replaces the old containers. Editing a running container is technically possible, but changes to its writable layer are lost when that container is removed. Persistent application data belongs in storage designed to outlive it. [Docker’s layer model](https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/) explains why.

## Why image layers make build order matter

A container image combines filesystem layers with configuration describing how the container should run. Layers are identified by their content, allowing identical layers to be reused where the local image store or registry supports it. A running container adds a writable layer above the image. [See Docker’s explanation of image layers.](https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/)

The build cache avoids repeating work whose instructions and relevant inputs have not changed. Consider a Python application: copying `requirements.txt` and installing dependencies before copying the application code means a source edit can reuse the dependency installation. Copying the entire project first makes source changes invalidate the dependency step as well. For Node.js, the same principle applies to the package manifest and lockfile. [Docker recommends ordering build steps around how frequently their inputs change.](https://docs.docker.com/build/cache/optimize/)

![Build steps arranged from a base image through operating system packages and dependencies to application code at the top.](/images/blog/5.1.2-image-layers-and-the-build-cache.png)

*Stable inputs go earlier in this linear build. Application code is rebuilt when its inputs change or its cache is unavailable, not on every push. Earlier steps can also lose their cached results. The COPY labels are shorthand rather than complete Dockerfile instructions.*

In a linear sequence, invalidating one step also invalidates subsequent dependent steps. Independent stages in a more complex build can still reuse their caches. A registry push does not itself trigger a rebuild, and an unchanged package-install command may stay cached even when newer packages become available upstream. Cache reuse and dependency updates therefore need separate consideration. [Docker documents the cache invalidation rules.](https://docs.docker.com/build/cache/invalidation/)

## Where Amazon ECR fits

Amazon Elastic Container Registry, or ECR, stores images for deployment. Its private registries belong to an AWS account and Region, with access controlled through IAM. [The ECR registry documentation](https://docs.aws.amazon.com/AmazonECR/latest/userguide/Registries.html) describes this model.

ECR can also check images for known vulnerabilities. Basic scanning covers operating system packages and supports manual or push-triggered scans. Enhanced scanning integrates with Amazon Inspector, adds supported programming language packages, and can scan on push or continuously. Scanning has to be configured; it is not a guarantee that an image is safe. [AWS compares the scanning options here.](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html)

A pull through cache stores images from supported upstream registries in ECR. Once cached, an image can still be served if an upstream refresh fails. The first fetch still needs the upstream image to be available, so this reduces external dependencies without eliminating them. Also, applying tag immutability to a cache repository prevents it from refreshing an existing tag. [ECR’s cache documentation explains these behaviours.](https://docs.aws.amazon.com/AmazonECR/latest/userguide/pull-through-cache.html)

**Make releases identifiable.** Use an image digest to identify the exact application image being deployed, and retain the images needed for rollback. Immutable release tags can help prevent accidental replacement. Pinning a base image improves build reproducibility, but it does not, by itself, identify the finished application release. [Docker describes the benefits and update trade-offs of digest pinning.](https://docs.docker.com/build/building/best-practices/#pin-base-image-versions)

## How ECS turns an image into a running service

Amazon Elastic Container Service coordinates containers using a few related objects. A **task definition** describes one or more containers: their images, resource requirements, ports, environment settings, secret references, logging and IAM roles. Each update creates a numbered revision. A **task** is an instance of that definition.

A **service** maintains the desired number of tasks and replaces failed tasks. It can also integrate with a load balancer and coordinate deployments. A task can run independently of a service too, which suits work intended to finish rather than run continuously. A **cluster** is the logical grouping for these workloads. [AWS explains task definitions, tasks and services together.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)

![An ECS cluster contains a service with three tasks. A task definition describes the tasks, and a capacity provider connects workloads to compute.](/images/blog/5.1.3-the-ecs-object-model.png)

*The main ECS relationships. A cluster groups workloads and their compute options; it does not guarantee reserved capacity or provide a security boundary. The capacity examples shown are not exhaustive: ECS Managed Instances is another option.*

A **capacity provider** connects workloads to a compute option. These include Fargate, Fargate Spot, EC2 Auto Scaling groups and ECS Managed Instances. Managed Instances lets AWS handle instance provisioning, scaling and patching while providing access to EC2 capabilities such as GPUs and specialised instance types. [AWS describes Managed Instances and its capacity providers here.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ManagedInstances.html)

Containers in one task are placed together. With Linux `awsvpc` networking, they share the task’s network namespace and can communicate through `localhost`. That is useful for an application and a supporting proxy or logging container, often called a sidecar. Shared networking depends on the network mode, rather than simply on being in the same task. [See the ECS task networking documentation.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking-awsvpc.html)

## Two IAM roles with different jobs

The easiest way to distinguish the task execution role from the task role is to ask who needs the permission.

The **task execution role** authorises the ECS or Fargate agent to perform operations on the task’s behalf. Depending on the configuration, these include pulling private images, retrieving secrets referenced by the task definition and sending logs to CloudWatch Logs. Some happen at startup; logging can continue throughout the task’s lifetime. [AWS lists the execution role’s uses here.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html)

The **task role** supplies permissions to the application containers. An application reading an S3 object or sending an SQS message normally uses credentials associated with this role. It can also use the task role to retrieve a secret directly through an AWS API. [AWS explains how task role credentials reach containers.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)

![A conceptual diagram contrasting agent access to images, secrets and logging with application access to AWS APIs.](/images/blog/5.1.4-task-execution-role-and-task-role.png)

*The distinction is the actor using the permissions. The agent box represents platform activity, not an application container that belongs inside the task. Execution role activity is not limited to “before start”.*

Failure timing gives a useful clue, but it is not a diagnosis. An image pull or secret retrieval failure can involve permissions, networking or a missing resource. An application access-denied error can involve its task role, a resource policy or another policy restriction. Check the actual error before changing permissions. [AWS’s startup troubleshooting guidance](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/resource-initialization-error.html) includes several network-related causes.

**Reference secrets instead of writing their values into the task definition.** ECS can inject a referenced secret into the container’s environment at startup. The value still exists in that environment and must be protected. Rotation does not automatically refresh an already running container; start new tasks, or design the application to retrieve updated secrets itself. [AWS documents secret injection and its limitations.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)

## Connecting containers to each other

With `awsvpc`, each ECS task receives its own elastic network interface, and security groups apply to that interface. Tasks can reuse the same security groups; each does not need a uniquely created group. This mode is required for Fargate and is useful on EC2 when you want network rules applied at task level. Plan for subnet address capacity and, on EC2, network interface limits. [AWS’s networking guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking-awsvpc.html) covers the details.

ECS Service Connect is an optional way to connect ECS services using short names, proxy-based load balancing and consistent connection metrics. It uses AWS Cloud Map namespaces to group participating services. It needs configuration and is not a universal default. There is no extra Service Connect feature charge, but the proxy consumes compute and associated services can still incur costs. [See the Service Connect overview and pricing notes.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-connect.html)

The connection method should fit the caller and protocol. DNS-based discovery can suit simpler needs. An Application Load Balancer is a common entry point for HTTP and HTTPS applications, while other traffic patterns may need different routing or load balancing.

## Choosing the operating model

ECS and EKS are orchestrators. Fargate and EC2 provide compute. Keeping those choices separate makes the comparison more useful: first decide how the team wants to define and operate workloads, then choose infrastructure that meets their requirements.

![A starting decision tree: Kubernetes requirements lead to EKS, while ECS compute choices depend on infrastructure requirements and management preferences.](/images/blog/5.1.5-choosing-an-aws-container-service.png)

*A starting point rather than a complete service map. ECS Managed Instances adds managed EC2 capacity, Fargate also offers Spot capacity for eligible ECS workloads, and Express Mode supports private as well as public HTTPS applications.*

### When Kubernetes is part of the requirement

Amazon EKS is a natural candidate when a team needs the Kubernetes API, existing Helm charts, operators or established Kubernetes tooling. The benefit is compatibility with that ecosystem. The work includes managing application configuration, access controls, networking and compatibility with supported Kubernetes versions.

EKS Auto Mode reduces infrastructure work by managing capabilities such as node provisioning, scaling, networking, load balancing and block storage integration. Its nodes have a maximum lifetime of 21 days. Managed node groups, self-managed nodes and Fargate offer other ways to run supported workloads, each with different responsibilities and restrictions. [AWS describes Auto Mode’s management responsibilities here.](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)

### When a direct AWS integration is the priority

ECS is a useful starting point for teams that want container orchestration without adopting the Kubernetes API and its ecosystem. The compute choice then depends on the workload:

* **Fargate** removes the need to provision and patch worker machines and provides isolation between tasks. Check its supported task sizes and features: it does not support GPU requests or privileged containers. [AWS lists Fargate task restrictions.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-tasks-services.html)
* **EC2 managed by your team** gives more control over instance types, host configuration and software running on the machines. That flexibility comes with responsibility for the fleet.
* **ECS Managed Instances** provides EC2 capabilities while AWS manages much of the instance lifecycle. It deserves consideration when Fargate’s capabilities do not fit but the team wants less infrastructure maintenance. [Check its capabilities and limitations against the workload.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ManagedInstances.html)

For ECS Linux tasks on Fargate platform version 1.4.0 or later, ephemeral storage starts at 20 GiB and can be configured up to 200 GiB. Downloaded and unpacked container images consume part of that space. This is temporary task storage, so it should not be confused with durable application storage. [AWS documents the storage allowance and platform differences.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-storage.html)

Cost depends on utilisation, resource sizing, purchasing options and the effort of operating the platform. Savings Plans are not exclusive to EC2: Compute Savings Plans also cover eligible Fargate usage. Fargate Spot is available for eligible ECS workloads that can tolerate interruption. [The Fargate FAQs cover both options.](https://aws.amazon.com/fargate/faqs/)

## A simpler route for web applications

ECS Express Mode automates much of the setup around a Fargate web application or API. You provide an image and the necessary execution and infrastructure roles; it configures the ECS service, HTTPS load balancing, scaling and supporting resources. It supports public and private HTTPS applications. The resources are created in your account and remain accessible for further configuration. There is no separate Express Mode fee, although the underlying resources are billed. [AWS explains Express Mode’s scope here.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html)

Express Mode added [custom task definition support in July 2026](https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-ecs-express-mode-custom-task-def/) and [ARM64 support for Graviton in September 2026](https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-ecs-express-mode-arm-architecture/). These make it more flexible than its initial configuration options suggested.

AWS App Runner stopped accepting new customers on 30 April 2026. Existing customers can continue using it, including creating new services and resources. AWS recommends evaluating ECS Express Mode as a migration option; it is not a requirement for existing customers to move immediately. [AWS’s availability notice sets out the change.](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html)

## Batch jobs and workloads outside AWS

AWS Batch adds job queues and scheduling for work that is submitted, processed and completed. It supports compute environments using ECS on EC2, ECS on Fargate, or EKS on EC2. That makes it a different fit from a continuously running web service. [AWS introduces Batch and its compute choices here.](https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html)

The hybrid options solve different problems:

* **ECS Anywhere** connects supported external servers or virtual machines to the AWS-hosted ECS control plane. [ECS Anywhere documentation.](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-anywhere.html)
* **EKS Hybrid Nodes** connects your on-premises or edge machines to an AWS-managed EKS control plane in an AWS Region. [EKS Hybrid Nodes documentation.](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html)
* **EKS Anywhere** runs Kubernetes on infrastructure you manage, including its control plane. It does not require the control plane to run in AWS. [EKS Anywhere overview.](https://anywhere.eks.amazonaws.com/docs/overview/)

For simpler hosting needs, [Lightsail Containers](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-container-services.html) is another option to assess. Whatever the service, check availability in the intended Region and test the features the application actually needs before making the choice.

A useful design starts with the application’s needs and the team’s responsibilities: whether Kubernetes is required, what isolation is needed, which compute capabilities matter, and who will maintain the infrastructure. Those answers narrow the AWS choices far more effectively than comparing service names alone.
