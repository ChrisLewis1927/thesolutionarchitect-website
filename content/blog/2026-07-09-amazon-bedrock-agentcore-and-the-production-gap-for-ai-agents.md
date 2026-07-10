---
title: Amazon Bedrock AgentCore and the production gap for AI agents
date: 2026-07-10T00:50:00.000Z
category: Architecture
excerpt: AI agents are easy to demo and hard to run safely. Amazon Bedrock
  AgentCore is AWS's attempt to turn agent prototypes into governed, observable,
  production workloads.
author: The Solution Architect
---
I came away from AWS Summit Washington with one thought that has stuck with me: building an AI agent is not the hard bit.

That sounds wrong, because agents still feel new. They reason, call tools, remember context, interact with systems, and sometimes behave in ways that are difficult to predict. But as a proof of concept, the barrier has fallen quickly. A developer can now stitch together a model, a framework, a prompt, a few tools and a bit of memory in a surprisingly short amount of time.

The hard part starts when someone asks whether that agent is allowed anywhere near a real business process.

That is the gap Amazon Bedrock AgentCore is trying to close. It is not another foundation model. It is not just a better chatbot wrapper. It is AWS's attempt to provide the boring production plumbing around agents: runtime isolation, identity, tool access, memory, policy, observability, evaluation and lifecycle management.

Boring is doing a lot of work there. In architecture, boring is usually where the system becomes real.

#### **The demo is not the system**

Most agent demos follow the same pattern. A user asks for something. The model reasons about it. It calls a tool. The tool returns something useful. The model gives a tidy answer. Everyone nods because the demo has crossed a line that normal chatbots could not cross: it has done something.

That is also where the risk changes.

A chatbot that gives a poor answer creates an information problem. An agent that calls a tool creates an action problem. It might read a customer record, raise a ticket, update a CRM opportunity, run code, query a database, send an email, or trigger a workflow. Once you let a model take action, the architecture has to answer harder questions.

Who is the agent acting for? What is it allowed to call? What data can it see? What happens if the prompt is manipulated? Where does memory live? How do you prove what happened afterwards? How do you test a system that can take different paths on different runs?

Those are not prompt engineering questions. They are architecture questions.

#### **What AgentCore is actually for**

AWS describes Amazon Bedrock AgentCore as an agentic platform for building, deploying and operating agents securely at scale, using any framework and foundation model. The current documentation is explicit that the services can be used together or independently, and that they work with open source frameworks as well as models hosted inside or outside Amazon Bedrock.

That matters, because organisations rarely arrive with a clean slate. One team may be using LangGraph. Another may have built around Strands Agents. A supplier may already have something running against a non-AWS model. A platform that only works if everyone rewrites everything in one approved framework is not much of a platform.

The more useful framing is this: AgentCore is a set of managed services for the things teams otherwise have to build around the agent.

![](/images/blog/chatgpt-image-jul-9-2026-11_56_16-pm.png)

The components have grown since the original launch, but the architectural shape is consistent. You need somewhere to run the agent. You need a way for it to authenticate and access tools. You need memory. You need a safe way to execute code or interact with websites. You need policy controls. You need telemetry. You need evaluation. Eventually, if agents spread across an organisation, you need a registry so people can find and govern what already exists.

None of that makes the agent intelligent by itself. It makes the agent operable.

#### **Runtime: where the agent actually lives**

The first production problem is hosting. A local script is fine for a demo, but it is not enough when an agent needs to handle real users, long-running tasks, stateful reasoning and unpredictable execution paths.

AgentCore Runtime is AWS's managed hosting environment for agents and tools. The documentation describes it as secure, serverless and purpose-built for deploying and running AI agents or tools. It supports different frameworks, different large language models, Model Context Protocol and Agent-to-Agent communication. It also provides session isolation, with each user session running in a dedicated microVM with isolated CPU, memory and filesystem resources.

![](/images/blog/agentcore-runtime-architecture-overview.png)

That isolation point is worth pausing on. Agents are messy workloads. They can reason over intermediate state, generate files, call tools, resume work, and maintain context over time. If one user's session can bleed into another's, the architecture has failed before the model has even answered.

Session isolation does not remove every risk, but it gives architects a much better starting position than a shared runtime with optimistic assumptions.

#### **Memory: useful, dangerous, necessary**

Agents need memory because useful work rarely happens in a single turn. A support agent needs to know what the customer already said. A workflow agent needs to know what step it reached. A personal assistant needs to remember preferences. A multi-agent system may need shared state between specialist agents.

AgentCore Memory is AWS's managed service for short-term and long-term agent memory. The documentation separates short-term memory, which captures turn-by-turn context within a session, from long-term memory, which can retain key facts, preferences and summaries across sessions. 

![](/images/blog/agentcore-memory-system-diagram.png)

This is useful, but it should make architects nervous in exactly the right way.

Memory is not just a feature. It is a data store. It needs data classification, retention rules, access control, deletion behaviour and auditability. The question is not simply whether an agent can remember. The question is what it is allowed to remember, for how long, for whom, and under what governance.

A stateless agent may be limited. A careless stateful agent may be worse.

#### **Gateway and Identity: tool access is the real boundary**

The most important part of an agent is often not the model. It is the tool it is allowed to call.

AgentCore Gateway provides a managed way to connect agents to tools, other agents and models through a secure entry point. AWS says Gateway can convert APIs, Lambda functions and existing services into MCP-compatible tools, and can handle both ingress and egress authentication in a managed service.

![](/images/blog/agentcore-gateway-architecture-overview.png)

AgentCore Identity then deals with the related identity and credential problem. AWS describes it as an identity and credential management service for AI agents and automated workloads, supporting authentication, authorisation and credential management so agents and tools can access AWS resources and third-party services on behalf of users while maintaining security controls and audit trails. 

This is the architectural centre of gravity.

Without a proper identity model, an agent becomes a strange shared service account with better vocabulary. It can do things, but nobody can confidently explain on whose behalf it acted. Without a proper tool gateway, every integration becomes a bespoke trust decision hidden inside code.

That is not sustainable. Agents need to be treated as workloads with identities, permissions and controlled tool access. The model should not be the security boundary. The platform around it should be.

#### **Browser and Code Interpreter: when agents touch the outside world**

Two AgentCore capabilities are especially interesting because they deal with actions that are powerful and risky: browsing the web and executing code.

AgentCore Browser provides an isolated browser environment for agents to interact with web applications. AWS describes session isolation, live viewing, CloudTrail logging and session replay capabilities as part of the browser tooling.

AgentCore Code Interpreter gives agents a sandboxed environment for writing and running code. The documentation positions this as a way to improve accuracy and handle complex tasks, while avoiding the risk of running arbitrary model-generated code in an unsafe environment. 

These are the sort of features that can look like magic in a demo. They are also the sort of features that will rightly attract scrutiny in design review.

Can the agent download files? Can it upload them? Can it browse authenticated systems? Can a human watch or intervene? Are sessions recorded? Where are those recordings stored? What network access does the sandbox have? What happens if generated code tries to reach something it should not?

Again, these are not objections to agents. They are the questions that make agents deployable.

#### **Policy: guardrails need to sit outside the model**

A common mistake is assuming the agent can be instructed into safety. Give it a clear system prompt. Tell it not to do dangerous things. Ask it to be careful. Hope the model obeys.

That is not enough.

AgentCore Policy is designed to enforce controls around agent-to-tool interactions. AWS says Policy can intercept agent traffic through AgentCore Gateway and evaluate each request against policies before allowing tool access. Policies can be written in Cedar, AWS's open source policy language, and AWS also describes natural language policy authoring that generates and validates candidate policies. 

![](/images/blog/agentcore-policy-flow-diagram.png)

The important point is where the control sits. If policy is buried inside the prompt, the agent can misunderstand it, ignore it, or be manipulated around it. If policy sits outside the agent code at the tool boundary, you get something closer to a normal enterprise control: deterministic, inspectable and auditable.

For architects, that is the difference between asking an agent to behave and designing a system that limits what it can do.

#### **Observability and evaluation: logs are not enough**

Traditional application monitoring tells you whether a service is up, how long it took to respond, and whether it threw an error. Agents need that, but they need more.

You need to see the route the agent took: the model calls, the reasoning steps, the tool invocations, the intermediate outputs, the latency, the token usage and the failure points. AgentCore Observability is intended to provide traces, debugging and monitoring for agent performance, with telemetry stored in Amazon CloudWatch and emitted in OpenTelemetry-compatible format. 

Evaluation is the other half of that story. AgentCore Evaluations provides automated assessment for how agents and tools perform tasks, handle edge cases and maintain consistency across different inputs and contexts. AWS says it supports built-in and custom evaluators, using traces from supported frameworks and LLM-as-a-judge techniques. 

![](/images/blog/wo-evaluation-modes-comparison.png)

This is important because agents are not deterministic in the same way as traditional services. You cannot rely only on unit tests and a happy-path demo. You need evidence over time. Did the agent choose the right tool? Did it stay inside policy? Did it complete the task? Did it expose data? Did it degrade after a prompt change, model change or tool update?

The production question is not "does it work once?" It is "how do we know it keeps working acceptably?"

#### **Registry: when agents become a platform problem**

One agent is a project. Ten agents are a platform problem.

AWS Agent Registry is currently documented as a managed discovery service for organising, curating and discovering resources such as MCP servers, tools, agents, agent skills and custom resources. The documentation describes approval workflows, semantic and keyword search, and access through public APIs or an MCP endpoint. 

That becomes relevant as soon as multiple teams start building. Without a registry, teams duplicate tools, rebuild similar agents, lose track of what is approved, and create quiet technical debt. A registry does not solve governance by itself, but it gives governance somewhere to live.

For larger organisations, that may be one of the more important parts of the platform. The difficult question will not be whether an agent can be built. It will be whether the organisation knows what agents already exist, who owns them, what they can access, and whether they should still be running.

#### **What this changes for architects**

AgentCore does not remove the need for architecture. It changes the shape of the conversation.

The old question was: can we build an agent that does this?

The better question is: can we operate an agent that does this safely, measurably and within boundaries?

That leads to a different checklist.

What identity does the agent use? What identity does the user use? Which tools are exposed, and through what gateway? What policies are enforced outside the model? What memory is retained? What is the data classification? What telemetry is captured? What evaluations prove the agent is good enough? What happens when the model, prompt, tool schema or business rule changes? Who owns the agent after go-live?

Those are familiar architecture questions wearing new clothes. Identity, access control, integration, observability, resilience, audit, data governance, lifecycle management. Agentic AI has not made those things obsolete. It has made them more visible.

#### **Where I would start**

The worst way to approach this is to declare an enterprise agent strategy and start with the platform diagram.

Start with one narrow workflow where an agent has a genuine reason to exist. Pick something with a clear user goal, a limited set of tools, visible risk boundaries and a measurable outcome. Build the agent, but design the production wrapper at the same time: identity, permissions, memory, policy, observability and evaluation.

Do not wait until the demo is popular before asking those questions. By then the architecture debt has already formed.

AgentCore is interesting because it acknowledges the thing that tends to be missing from agent hype. The value is not just in making agents clever. The value is in making them governable enough to use.

That is the gap between a prototype and a system. It is also where solution architects need to be paying attention.
