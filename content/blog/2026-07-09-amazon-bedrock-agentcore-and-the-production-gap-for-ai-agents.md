---
title: Amazon Bedrock AgentCore and the production gap for AI agents
date: 2026-07-10T00:50:00.000Z
category: Architecture
excerpt: AI agents are easy to demo and hard to run safely. Amazon Bedrock
  AgentCore is AWS's attempt to turn agent prototypes into governed, observable,
  production workloads.
author: The Solution Architect
---
I came away from AWS Summit Washington with one thought that has stuck with me ever since, which is that building an AI agent isn't really the hard bit any more.
 
That probably sounds odd, given how new agents still feel, but the barrier to a working proof of concept has fallen remarkably quickly, to the point where a developer can stitch together a model, a prompt, a few tools and a little memory in a surprisingly short time. Where things get difficult is a few weeks later, when somebody asks whether that agent should be allowed anywhere near a real business process.
 
That question is the gap Amazon Bedrock AgentCore is trying to close. Rather than offering another foundation model or a smarter chatbot wrapper, AWS is supplying the boring production plumbing that has to surround an agent before anyone can trust it. I mean boring as a compliment, because in architecture the boring parts are usually where a system becomes real.
 
# **The demo is not the system**
 
If you've sat through a few agent demos you'll know how they go. A user asks for something, the model reasons about it and calls a tool, and the room nods because the agent has done something an ordinary chatbot never could, which is take an action. That's exactly the moment the risk changes, though. When a chatbot gets something wrong you have an information problem, but an agent that gets something wrong may already have updated a record or sent an email, so now you have an action problem.
 
To make that concrete, let's follow one example through the rest of this post. Imagine an agent that helps a council caseworker handle a change-of-circumstances request by reading the resident's case record, checking the eligibility rules, updating the record and drafting a letter. As soon as you picture it running in a real council, the questions start to pile up. You'd want to know whose authority it's acting under, what it can see and change, and what happens if someone slips a malicious instruction into the request. You'd also want to know where its memories end up, how you'd prove afterwards what it did, and how you'd test something that might take a different route every time it runs. No amount of clever prompting answers any of that, which is why I think of them as architecture questions.
 
# **What AgentCore is actually for**
 
AWS describes [AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html) as an agentic platform for building, deploying and operating agents securely at scale with any framework and any foundation model. In practice you can use its services together or pick out only the ones you need, alongside open-source frameworks such as LangGraph, CrewAI and Strands Agents and models hosted inside or outside Amazon Bedrock. That flexibility matters because organisations rarely arrive with a clean slate, and a platform that only worked once every team had rewritten everything in one approved framework wouldn't get very far.
 
The way I find most useful to think about AgentCore is as a set of managed services for everything a team would otherwise have to build around the agent themselves. The family has grown since launch, with extras such as Harness, a managed agent loop, but here I'll stick to the services that decide whether an agent is ready for production. None of them will make your agent any cleverer, but together they turn it into something you can actually run, so let's work through them in roughly the order you'd meet them.
 
# **Runtime gives the agent somewhere to live**
 
The first thing any agent needs is somewhere to run, and a script on a developer's laptop won't cope with real users, long-running tasks and the unpredictable paths agents tend to take. [AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html) is AWS's managed, serverless home for agents and tools, and it speaks both the Model Context Protocol (MCP) and Agent-to-Agent (A2A). If you choose the microVM compute type, each user session gets a dedicated microVM with its own CPU, memory and filesystem, which is shut down and sanitised when the session ends.
 
That isolation is worth slowing down on, because agents are messy workloads that hold intermediate state, write files and pick up where they left off. If one caseworker's session could bleed into another's, you'd have a serious problem before the model had answered a single question. Bear in mind, though, that since August 2026 Runtime has also offered an Instances compute type, which can host several collaborating agents on one shared instance, so check which isolation model you're actually getting. AWS is also clear that [Runtime doesn't map sessions to users for you](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-security-best-practices.html), which means your own application still has to make sure a session really belongs to the person using it.
 
# **Memory is a data store, so govern it like one**
 
Once the agent has somewhere to run, it needs to remember things, because useful work rarely happens in a single exchange. Our caseworker's agent has to keep track of what the resident has already said and which step of the process it has reached. [AgentCore Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html) handles that in two layers, with short-term memory holding the conversation within a session and long-term memory carrying important facts, preferences and summaries across sessions.
 
That's genuinely useful, and it should also make you a little nervous in exactly the right way, because memory is a data store in everything but name. Anything an agent remembers about a resident needs the same classification, retention rules, access control, deletion and audit as any other personal data. So the real question is what the agent is allowed to remember, for how long, about whom and under whose governance. AWS added time-to-live for long-term memory records in October 2026, which helps, although somebody still has to decide what the right retention period is. Given the choice, I'd rather live with a slightly limited stateless agent than a careless stateful one.
 
# **Deciding what the agent can touch**
 
If I had to point to the most important part of an agent, I'd usually point at its tools rather than its model, because the tools are where the agent's decisions turn into real changes. [AgentCore Gateway](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html) gives agents a single, secure entry point to tools, other agents and models. It can turn your existing APIs, Lambda functions and services into MCP-compatible tools, and it handles authentication in both directions, checking who's allowed in and presenting the right credentials to each tool on the way out. Alongside it, [AgentCore Identity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html) treats each agent as a workload identity and manages the credentials it needs to act on a user's behalf, keeping an audit trail as it goes.
 
Between them, these two sit at the centre of gravity of the whole platform. Without a proper identity model, an agent turns into a strange shared service account with a better vocabulary, and nobody can say with any confidence on whose behalf it acted. Without a proper gateway, every new integration becomes a bespoke trust decision buried somewhere in the code. In our example, the agent should update the case record as that particular caseworker, with that caseworker's permissions, and never as an all-powerful system user. That's the clearest way I know to show why the security boundary belongs in the platform around the model rather than in the model itself.
 
Two of the tools an agent might reach for deserve a closer look, because they're as risky as they are powerful. [AgentCore Browser](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html) gives agents an isolated browser for working with web applications, with a live view so a person can watch or step in, optional session recording to your own S3 bucket and CloudTrail logging. [AgentCore Code Interpreter](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html) gives agents a sandbox for writing and running code, and you decide how far that sandbox can reach, from limited access to AWS services through to the public internet or private resources inside your own VPC. Unsurprisingly, these are the features that look most like magic in a demo and attract the most scrutiny in a design review. Expect to be asked what files can move in and out, which systems the agent can sign in to, who can watch the recordings and which network mode the sandbox genuinely needs, because good answers to those questions are what make an agent deployable.
 
# **Policy belongs outside the model**
 
A common mistake is to assume that an agent can be instructed into behaving safely, as though a carefully worded system prompt were enough on its own. AWS's own [Well-Architected guidance for agentic AI](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentsec02-bp01.html) is blunt about this, saying that authorisation done only through prompt instructions isn't enough because prompts can be manipulated.
 
[AgentCore Policy](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html) takes a different route by sitting on the Gateway, intercepting each tool call that passes through it and checking it against your policies before letting it through. You can write those policies in Cedar, AWS's open-source policy language, or in Dogwood, a newer superset of Cedar that AWS now recommends. If you'd rather not learn either, you can describe a rule in plain English and let the service draft and validate one for you. In our example, a policy could refuse any payment change above a set amount, or allow it only for users with a particular role, and it would hold firm whatever the prompt happened to say.
 
The important idea here is where the control sits. A rule buried in a prompt can be misunderstood, ignored or argued around, whereas a rule enforced at the tool boundary behaves like any other enterprise control, because it's deterministic and you can inspect and audit it. That's the real difference between asking an agent to behave and designing a system that limits what it can do.
 
# **Knowing it still works**
 
Traditional monitoring tells you whether a service is up, how quickly it responded and whether it threw an error. With an agent you need all of that, plus a view of the route it took through each model call and tool invocation and the point where things went wrong. [AgentCore Observability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html) provides that tracing in an OpenTelemetry-compatible format and stores it in Amazon CloudWatch, so it can feed into the monitoring you already run.
 
Seeing what happened is only half the job, though, because you also need to judge whether what happened was any good, and that's where [AgentCore Evaluations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/evaluations.html) comes in. It scores how well agents complete tasks, handle edge cases and stay consistent, using built-in evaluators that rely on a model as the judge. You can add custom evaluators too, written either as judge prompts or as code in a Lambda function. This matters because agents aren't deterministic in the way traditional services are, so a happy-path demo proves very little. What you really need is evidence, gathered over time, that the agent keeps picking the right tool, stays inside policy and copes with changes to its prompt, model or tools, since in production the question is whether it keeps working rather than whether it worked once.
 
# **When one agent becomes ten**
 
Everything so far has assumed a single agent, but success has a habit of multiplying them, and while one agent is a project, ten agents are a platform problem. [AWS Agent Registry](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/registry.html), generally available since August 2026, is a managed catalogue where teams publish agents, MCP servers, tools and skills, approve them through a workflow and let both people and agents search for what already exists.
 
Without something like it, teams end up duplicating tools, rebuilding similar agents and losing track of what has actually been approved. A registry won't solve governance on its own, and AWS points out that it doesn't verify the packages or endpoints its records point to, but it does give governance somewhere to live. That matters a great deal in a larger organisation, where the hard question soon becomes whether anyone knows which agents exist, who owns them, what they can reach and whether they should still be running.
 
# **Where I would start**
 
AgentCore doesn't remove the need for architecture, but it does change the shape of the conversation. Instead of asking whether we can build an agent that does something, we start asking whether we can operate it safely, measurably and within clear boundaries. Before any agent went live, I'd want to know which identity it uses and how that relates to the user's, which tools it can reach and through which gateway, and which policies are enforced outside the model. I'd also want to know what it remembers and how that data is classified and kept, which telemetry and evaluations show it's good enough, and who owns it when the model, prompt, tools or business rules change. Those are familiar architecture questions wearing new clothes, and if anything agentic AI has made them far more visible than they used to be.
 
As for where to begin, the worst approach is to announce an enterprise agent strategy and start with the platform diagram. I'd pick one narrow workflow where an agent has a genuine reason to exist, ideally with a clear user goal, a small set of tools, visible risk boundaries and an outcome you can measure. Then I'd build the agent and its production wrapper side by side, rather than waiting until the demo is popular to ask the hard questions, because by that point the architecture debt has usually already formed.
 
What makes AgentCore interesting is that it acknowledges the part of the story that agent hype tends to skip. The value lies less in making agents clever and more in making them governable enough to use, and that gap between a prototype and a system is exactly where solution architects need to be paying attention.
 
*First published in July 2026 and updated in November 2026 to reflect changes to AgentCore since then.*
