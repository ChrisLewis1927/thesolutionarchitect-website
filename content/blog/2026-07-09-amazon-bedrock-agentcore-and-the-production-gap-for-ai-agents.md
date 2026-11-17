---
title: Amazon Bedrock AgentCore and the production gap for AI agents
date: 2026-07-10T00:50:00.000Z
category: Architecture
excerpt: AI agents are easy to demo and hard to run safely. Amazon Bedrock
  AgentCore is AWS's attempt to turn agent prototypes into governed, observable,
  production workloads.
author: The Solution Architect
---
I came away from AWS Summit Washington with one thought that has stuck with me, and it's that building an AI agent isn't really the hard bit any more.
 
That sounds odd, because agents still feel new. They reason, call tools, remember context and occasionally do things nobody predicted. Yet the barrier to a working proof of concept has fallen remarkably quickly, and a developer can now stitch together a model, a prompt, a few tools and a little memory in a surprisingly short time. The hard part starts later, when someone asks whether that agent should be allowed anywhere near a real business process.
 
That's the gap Amazon Bedrock AgentCore is trying to close. Rather than another foundation model or a smarter chatbot wrapper, it's AWS's attempt to supply the boring production plumbing an agent needs before anyone can trust it. Boring is the important word there, because in architecture the boring parts are usually where a system becomes real.
 
# **The demo is not the system**
 
Most agent demos follow a familiar pattern. A user asks for something, the model reasons about it, calls a tool and replies with a tidy answer, and everyone nods because the demo has crossed a line that ordinary chatbots never could. It has actually done something, and that's exactly where the risk changes. A chatbot that gives a poor answer creates an information problem, whereas an agent that calls a tool creates an action problem.
 
Let's make that concrete with an example I'll come back to as we go. Imagine an agent that helps a council caseworker handle a change-of-circumstances request by reading the resident's case record, checking the eligibility rules, updating the record and drafting a letter. Straight away you need to know whose authority it's acting under, what it can see and call, and what happens if someone slips a malicious instruction into the request. You also need to know where its memories are kept, how you'd prove what it did, and how you'd test something that might take a different route every time. Those are architecture questions rather than prompt-engineering ones.
 
# **What AgentCore is actually for**
 
AWS describes [AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html) as an agentic platform for building, deploying and operating agents securely at scale with any framework and any foundation model. You can use its services together or on their own, with open-source frameworks such as LangGraph, CrewAI and Strands Agents, and with models hosted inside or outside Amazon Bedrock.
 
That flexibility matters more than it might first appear, because organisations rarely arrive with a clean slate. One team might be using LangGraph while a supplier is already running something against a non-AWS model, and a platform that only works once everyone has rewritten everything in one approved framework isn't much of a platform.
 
The most useful way I've found to think about AgentCore is as a set of managed services for everything a team would otherwise build around the agent themselves. The family has grown since launch, with extras such as Harness, a managed agent loop, but the services below are the ones that decide whether an agent is ready for production. They won't make it any cleverer, but they will make it something you can operate.
 
# **Runtime gives the agent somewhere to live**
 
The first production problem is simply hosting. A script on a laptop is fine for a demo, but it won't cope with real users, long-running tasks and the unpredictable paths agents tend to take.
 
[AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html) is AWS's managed, serverless hosting for agents and tools, and it speaks both the Model Context Protocol (MCP) and Agent-to-Agent (A2A). With the microVM compute type, each user session gets a dedicated microVM with its own CPU, memory and filesystem, which is shut down and sanitised when the session ends.
 
That isolation is worth pausing on, because agents hold intermediate state, generate files and pick up where they left off. If one caseworker's session could bleed into another's, the architecture would have failed before the model had answered a single question. There are two caveats, though. Since August 2026 Runtime has also offered an Instances compute type that can host several collaborating agents on one shared instance, so check which isolation model you're actually getting. AWS is also clear that [Runtime doesn't map sessions to users for you](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-security-best-practices.html), so your own backend still has to make sure a session belongs to the person using it.
 
# **Memory is a data store, so govern it like one**
 
Agents need memory because useful work rarely happens in a single turn. Our caseworker's agent has to remember what the resident has already said and which step it has reached. [AgentCore Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html) handles this in two layers, with short-term memory capturing the conversation within a session and long-term memory keeping important facts, preferences and summaries across sessions.
 
That's genuinely useful, and it should also make architects nervous in exactly the right way, because memory is a data store in everything but name. It needs classification, retention rules, access control, deletion and audit like any other store holding personal data. The real question is what the agent is allowed to remember, for how long, about whom and under whose governance. AWS added time-to-live for long-term memory records in October 2026, which helps, but somebody still has to decide what the right period is. A stateless agent might be limited, but a careless stateful one can be far worse.
 
# **Gateway and Identity decide what the agent can touch**
 
If I had to point to the most important part of an agent, I'd usually point at the tools it's allowed to call rather than at the model. [AgentCore Gateway](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html) gives agents a single, secure entry point to tools, other agents and models. It can turn existing APIs, Lambda functions and services into MCP-compatible tools, and it handles authentication in both directions, checking who's allowed in and presenting the right credentials to each tool on the way out. [AgentCore Identity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html) treats each agent as a workload identity and manages the credentials it needs to act on a user's behalf, keeping an audit trail as it goes.
 
Together these form the architectural centre of gravity. Without a proper identity model, an agent becomes a strange shared service account with a better vocabulary, and nobody can confidently say on whose behalf it acted. Without a proper gateway, every integration becomes a bespoke trust decision buried in the code. In our example, the agent should update the case record as that caseworker, with that caseworker's permissions, and never as an all-powerful system user. The security boundary belongs in the platform around the model rather than in the model itself.
 
# **Browsing the web and running code**
 
Two capabilities deserve a closer look because they're both powerful and risky. [AgentCore Browser](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html) gives agents an isolated browser for working with web applications, with a live view so a person can watch or step in, optional session recording to your own S3 bucket, and CloudTrail logging. [AgentCore Code Interpreter](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html) gives agents a sandbox for writing and running code, and you decide how far that sandbox can reach, from limited access to AWS services through to the public internet or private resources inside your own VPC.
 
These are the features that look like magic in a demo and, quite rightly, attract the most scrutiny in a design review. You'll want to know what files can move in and out, which systems the agent can sign in to, who can watch the recordings and which network mode the sandbox genuinely needs. Asking isn't an objection to agents, because the answers are precisely what make one deployable.
 
# **Policy belongs outside the model**
 
A common mistake is assuming an agent can be instructed into safety with a careful system prompt. AWS's own [Well-Architected guidance for agentic AI](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentsec02-bp01.html) is blunt that authorisation done only through prompt instructions isn't enough, because prompts can be manipulated.
 
[AgentCore Policy](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html) sits on the Gateway instead, intercepting the agent's tool calls and checking each one against your policies before letting it through. Policies are written in Cedar, AWS's open-source policy language, or in Dogwood, a newer superset of Cedar that AWS now recommends. If you'd rather not learn either, you can describe a rule in plain English and let the service draft and validate one for you. In our example, a policy could refuse any payment change above a set amount, or allow it only for users with a particular role, whatever the prompt happened to say.
 
What matters is where the control sits. A rule buried in the prompt can be misunderstood, ignored or argued around, whereas a rule enforced at the tool boundary behaves like any other enterprise control because it's deterministic, inspectable and auditable. That's the difference between asking an agent to behave and designing a system that limits what it can do.
 
# **Observability and Evaluations tell you it still works**
 
Traditional monitoring tells you whether a service is up, how quickly it responded and whether it threw an error. With an agent you also want to see the route it took, every model call and tool invocation along the way, and the point where things went wrong. [AgentCore Observability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html) provides that tracing in an OpenTelemetry-compatible format and stores it in Amazon CloudWatch, so it can feed the monitoring you already run.
 
[AgentCore Evaluations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/evaluations.html) is the other half of the story. It scores how well agents complete tasks, handle edge cases and stay consistent, using built-in evaluators that rely on a model as the judge, alongside custom evaluators written as judge prompts or as code in a Lambda function. That matters because agents aren't deterministic in the way traditional services are, so a happy-path demo proves very little. What you need is evidence, gathered over time, that the agent picks the right tool, stays inside policy and survives changes to its prompt, model or tools. In production, the question is whether it keeps working acceptably, not whether it worked once.
 
# **When one agent becomes ten**
 
One agent is a project, but ten agents are a platform problem. [AWS Agent Registry](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/registry.html), generally available since August 2026, is a managed catalogue where teams publish agents, MCP servers, tools and skills, approve them through a workflow and let people and agents search for what already exists.
 
Without something like it, teams duplicate tools, rebuild similar agents and lose track of what's been approved. A registry won't solve governance on its own, and AWS points out that it doesn't verify the packages or endpoints that records point to, but it does give governance somewhere to live. For a larger organisation the hard question soon becomes whether anyone knows which agents exist, who owns them, what they can reach and whether they should still be running.
 
# **What this changes for architects**
 
AgentCore doesn't remove the need for architecture, but it does change the shape of the conversation. The old question was whether we could build an agent that does this, and the better one is whether we can operate it safely, measurably and within clear boundaries. Before go-live, I'd want clear answers to these questions.
 
- Which identity does the agent use, and which does the user use?
- Which tools are exposed, and through which gateway?
- Which policies are enforced outside the model?
- What does the agent remember, and how is that data classified and retained?
- What telemetry is captured, and which evaluations prove the agent is good enough?
- What happens when the model, prompt, tools or business rules change, and who owns the agent after go-live?
Those are familiar architecture questions wearing new clothes. Agentic AI hasn't made identity, access control, observability, audit or data governance obsolete, and if anything it has made them far more visible.
 
# **Where I would start**
 
The worst way to approach this is to announce an enterprise agent strategy and begin with the platform diagram. I'd start instead with one narrow workflow where an agent has a genuine reason to exist, ideally with a clear user goal, a small set of tools, visible risk boundaries and an outcome you can measure. Build the agent, but design its production wrapper at the same time, and don't wait until the demo is popular before asking those questions, because by then the architecture debt has already formed.
 
What makes AgentCore interesting is that it acknowledges the thing agent hype tends to skip. The value lies less in making agents clever and more in making them governable enough to use, and that's the gap between a prototype and a system. It's also exactly where solution architects need to be paying attention.
 
*First published in July 2026 and updated in November 2026 to reflect changes to AgentCore since then.*
