---
title: "Sustainability Pillar"
category: "aws-well-architected"
sequenceOrder: 6
estimatedMinutes: 15
---

# Sustainability Pillar

## Introduction

The Sustainability pillar, added to the AWS Well-Architected Framework in 2021, focuses on reducing the environmental impact of running cloud workloads. It addresses the growing recognition that technology decisions have environmental consequences, and that architects have a responsibility to minimise the carbon footprint of the systems they design.

For UK government architects, sustainability is not optional. The Greening Government ICT and Digital Services Strategy sets targets for reducing the environmental impact of government technology. The UK has committed to net zero emissions by 2050, and the public sector is expected to lead by example. Architecture decisions — from instance selection to data retention policies — directly influence whether these commitments are met.

This module covers how to design, build, and operate AWS workloads with sustainability in mind.

## Understanding Environmental Impact

### The Carbon Footprint of Cloud Computing

Cloud computing's environmental impact comes from three main sources:

- **Operational energy** — electricity consumed by servers, networking, and cooling
- **Embodied carbon** — emissions from manufacturing, transporting, and disposing of hardware
- **Supporting infrastructure** — data centre construction, water usage for cooling, and backup power systems

AWS reports that moving on-premises workloads to AWS can reduce the carbon footprint by up to 80%, primarily because AWS operates at a scale that enables more efficient use of resources. However, this does not mean cloud workloads have zero impact — inefficient architectures still waste energy.

### Shared Responsibility for Sustainability

Similar to the security shared responsibility model, sustainability is a shared responsibility. AWS is responsible for the sustainability of the cloud (efficient data centres, renewable energy procurement), while customers are responsible for sustainability in the cloud (efficient architectures, right-sized resources, appropriate data management).

## Region Selection

### Choosing Low-Carbon Regions

Different AWS regions have different carbon intensities based on the local electricity grid's energy mix. AWS publishes carbon intensity data for each region.

The EU (Ireland) region, commonly used by UK government services, benefits from Ireland's significant investment in renewable energy. The EU (London) region is another option, though the UK grid's carbon intensity varies more throughout the day.

When data sovereignty requirements allow flexibility, consider the carbon intensity of available regions as a factor in your selection. For UK government services, data sovereignty typically limits choices to EU (London) and EU (Ireland), both of which have relatively favourable carbon profiles.

## Resource Optimisation

### Right-Sizing for Sustainability

Every over-provisioned resource wastes energy. An EC2 instance running at 10% CPU utilisation is consuming electricity to power and cool 90% unused capacity. Right-sizing is therefore both a cost optimisation and a sustainability practice.

Use Compute Optimizer to identify over-provisioned resources. Target higher utilisation rates — 60-70% average CPU for compute workloads is a reasonable target that balances performance headroom with resource efficiency.

### Graviton Processors

AWS Graviton processors (ARM-based) deliver up to 60% better energy efficiency than comparable x86 instances for many workloads. Migrating to Graviton instances is one of the highest-impact sustainability improvements you can make.

Most modern application stacks (Java, Python, Node.js, .NET 6+, Go) run on Graviton without modification. Container-based workloads simply need ARM-compatible images.

### Serverless and Managed Services

Serverless architectures are inherently more sustainable because resources are allocated only when needed. A Lambda function consumes compute resources only during execution — there is no idle capacity consuming energy.

Similarly, managed services like Fargate, Aurora Serverless, and DynamoDB on-demand allow AWS to optimise resource utilisation across many customers, achieving higher efficiency than individual dedicated resources.

## Data Management

### Data Lifecycle Policies

Storing data consumes energy — for the storage media, cooling, and redundancy. Implement data lifecycle policies that move data to appropriate storage tiers and delete data that is no longer needed.

- Use S3 Lifecycle policies to transition objects from Standard to Infrequent Access to Glacier based on access patterns
- Set retention policies for CloudWatch logs — do you really need 12 months of debug-level logs?
- Archive or delete old database records that are no longer operationally relevant

For government services, balance data retention requirements (which may be mandated by legislation or policy) with sustainability goals. Keep what you must, but do not keep everything by default.

### Efficient Data Transfer

Data transfer between regions, between AZs, and between services consumes network resources and energy. Minimise unnecessary data movement:

- Use VPC endpoints to keep traffic within the AWS network
- Compress data before transfer where practical
- Cache frequently accessed data close to where it is consumed
- Avoid architectures that shuttle large datasets between services unnecessarily

## Software and Architecture Patterns

### Efficient Code

Software efficiency directly impacts sustainability. Code that completes a task in 100ms rather than 500ms uses less compute time and therefore less energy. This is particularly relevant for Lambda functions, where you pay for (and consume resources for) every millisecond of execution.

Optimise hot paths in your code. Profile your applications to identify inefficient algorithms or unnecessary processing. Choose efficient serialisation formats — Protocol Buffers or MessagePack rather than verbose XML for high-throughput internal APIs.

### Asynchronous and Event-Driven Patterns

Event-driven architectures are more sustainable than polling-based ones. A system that polls an SQS queue every second consumes resources continuously, while an event-driven Lambda trigger consumes resources only when messages arrive.

Similarly, use EventBridge for event routing rather than building custom polling mechanisms. Let AWS manage the infrastructure for waiting, and consume resources only for processing.

### Appropriate Redundancy

While reliability requires redundancy, excessive redundancy wastes resources. A development environment does not need Multi-AZ RDS. A test environment does not need three-AZ Auto Scaling. Match your redundancy level to the environment's requirements.

## Measuring and Improving

### AWS Customer Carbon Footprint Tool

The AWS Customer Carbon Footprint Tool provides visibility into the carbon emissions associated with your AWS usage. Use it to establish a baseline and track improvements over time.

The tool reports emissions by service, region, and time period, allowing you to identify the highest-impact areas for optimisation.

### Sustainability Metrics

Incorporate sustainability metrics into your architecture reviews:

- Resources provisioned vs resources utilised
- Percentage of workloads on Graviton processors
- Data storage growth rate vs data access frequency
- Percentage of environments with automated scheduling

Track these metrics alongside cost and performance metrics to build a complete picture of your architecture's efficiency.

## Key Takeaways

- Sustainability is a shared responsibility — architects control sustainability in the cloud through design decisions
- Right-sizing and Graviton migration are the highest-impact improvements for most workloads
- Implement data lifecycle policies to avoid storing data unnecessarily
- Use serverless and event-driven patterns to eliminate idle resource consumption
- Measure your carbon footprint and track improvements using the AWS Customer Carbon Footprint Tool

## Practical Examples

### Example 1: Greening a Government Data Platform

A government department's data analytics platform runs on i3.2xlarge instances 24/7, processing batch jobs that run for 4 hours each night. By migrating batch processing to Graviton-based instances (c7g.2xlarge) with Auto Scaling that terminates instances after processing completes, the team reduces compute hours by 83% and energy consumption per compute hour by 60%. Combined with S3 Intelligent-Tiering for the data lake (which moves 70% of data to Infrequent Access tier), the platform's estimated carbon footprint drops by 75%.

### Example 2: Sustainable Development Practices

A digital service team implements sustainability practices across their development lifecycle. Non-production environments are scheduled to run only during business hours (saving 70% of compute). CI/CD pipelines use Graviton-based Spot instances for builds. CloudWatch log retention is set to 30 days for development and 90 days for production (down from unlimited). Docker images are optimised to reduce size by 60%, reducing storage and transfer energy. The team tracks their carbon footprint monthly and includes sustainability metrics in their quarterly architecture reviews.

---
keyTakeaways:
  - Sustainability is a shared responsibility and architects control it through design decisions
  - Right-sizing and Graviton migration are the highest-impact improvements for most workloads
  - Implement data lifecycle policies to avoid storing data unnecessarily
  - Use serverless and event-driven patterns to eliminate idle resource consumption
  - Measure your carbon footprint and track improvements over time

practicalExamples:
  - Migrate batch processing to Graviton instances with Auto Scaling to reduce carbon footprint by 75%
  - Implement environment scheduling and log retention policies as standard sustainability practices
