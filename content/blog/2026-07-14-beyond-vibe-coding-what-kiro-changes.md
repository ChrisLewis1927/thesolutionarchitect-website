---
title: "Beyond vibe coding: what Kiro changes"
date: 2026-07-14T00:50:00.000Z
category: Architecture
excerpt: AI tools make it easy to prompt your way to working code and call it
  done. Kiro puts a specification back in front of the generation, and that
  makes it far more interesting to architects than another code assistant.
author: The Solution Architect
---
I went to AWS Summit Washington, D.C. expecting agentic AI to dominate the agenda, and it did. Every other session had an agent in it somewhere. The one that stayed with me, though, had nothing flashy about it. It was about spec-driven development with a tool called Kiro, and about whether AI-assisted development can be given enough structure to build real systems, the kind someone has to secure, maintain and operate for years after the demo.

That's where it gets interesting for architects, so that's what this piece is about.

#### **The problem with vibe coding**

Vibe coding is an unkind name but a fairly accurate one. You describe what you want, the AI produces some code, you run it, and you keep prompting until the result looks right. For a prototype or an experiment that's fine. The trouble starts when the prototype quietly becomes the product, because nothing in that loop ever forced anyone to make a decision on the record.

A prompt is a wish, not a requirement. A chat history won't pass for a design document, and a passing test only proves the code does what the code does, which may bear little resemblance to what the business originally asked for. The code can look convincing long before the design is sound, and with these tools it usually does.

Kiro's answer is to move the centre of gravity away from the conversation and towards a specification.

#### **Start with the specification**

Kiro's workflow creates three artefacts before it writes a line of application code. A requirements file captures what needs to be built, with user stories and acceptance criteria. A design file describes how the solution should work, covering architecture, components, interfaces and testing. A tasks file breaks that design into individual pieces of implementation work. Only then does the tool start building.

On paper that's a small change. In practice it's the difference between asking the AI to jump straight from a vague idea to working code and making it walk through requirements, design and implementation in order, which is how a properly run delivery works anyway.

#### **Plan before you build**

The clearest message from the session was also the least fashionable one: plan before you build. That shouldn't need saying, but AI tools make it remarkably easy to skip. When a tool can generate a working screen or API in minutes, planning feels like delay. The visible result arrives so quickly it creates the impression that most of the difficult work is already done.

It isn't. The difficult work is deciding what happens off the happy path. What happens when the data is incomplete? Who is allowed to perform the action? What gets logged? What happens when the service next door is unavailable? Who supports this after the original developer has moved on? Those are design questions, and no amount of generated code answers them. A specification creates a pause before assumptions harden into code.

Take "create a secure login page". It sounds clear until you ask what secure means here. Multi-factor authentication or not? Which identity provider? How long does a session last? What happens after five failed attempts? What gets written to the logs? What are the accessibility requirements? Leave those open and the AI fills the gaps itself. Sometimes it fills them sensibly. Sometimes it makes choices that are flatly unsuitable for your organisation or your service, and you find out later. Structured requirements drag those assumptions into the light before implementation begins.

#### **A design you can challenge**



Once the requirements exist, Kiro produces a design and breaks it into executable tasks. For me this is the part that makes it more relevant to architects than most AI coding tools, because the design becomes something you can argue with. You can check it against the existing estate, ask whether the security controls are adequate, whether the proposed technology is on the approved list, and whether the interfaces and data flows make sense. None of that means accepting the generated design as given. It means there's something concrete to review before the code already exists.   

The chain it leaves behind is the real prize: requirement to design to task to implementation to test. That traceability earns its keep during assurance, testing, handover and every future change, because the team ends up with a record of why something exists instead of reverse engineering the answer from the code.

#### **Memory, access and automatic checks**

Three more features round out the picture, and each one maps onto a familiar governance concern.

Steering files give the AI persistent project knowledge: the approved technology stack, the repository structure, coding standards, testing approach, security requirements and architectural principles. That deals with a common weakness in these tools, which is that they behave as though every conversation is the first one. Instead of re-explaining the same rules every session, teams make the rules part of the context whenever Kiro proposes or implements a change. It doesn't guarantee compliance, but it beats leaving the standards in a document nobody opens. It also hints at something architects have wanted for years: principles the tooling actually applies, rather than principles that live on a wiki.

MCP, the Model Context Protocol, lets Kiro connect to external tools and information sources, such as current documentation, repositories, APIs and internal standards. Better context, and a fresh set of governance questions. Which systems can it reach, and with what permissions? Which sources count as authoritative? What data can it retrieve, what actions can it perform, and how is any of that audited? The more capable the assistant becomes, the more identity, access control and audit matter. Connecting an AI tool to real systems is useful. Connecting it without clear boundaries is asking for trouble.

Hooks run actions automatically when files change or tasks complete: tests, formatting, security scans, accessibility checks, validation against project standards. None of those controls are new. What's new is that they sit inside the AI-assisted workflow instead of being left until the end, and the cheapest time to find a problem is while the change is being made.

#### **What this means for architects**

There's a tendency to talk about AI development tools as though they remove the need for architecture. I'd bet on the opposite. As implementation gets faster, poor decisions get implemented faster too. A weak requirement becomes working code in minutes. A bad pattern replicates across an entire codebase before anyone has had a chance to challenge it.

Standing in front of the technology to slow it down is a losing game, and the wrong one anyway. The job is to make sure the acceleration happens in the right direction: define the constraints the AI works within, review the designs it generates, decide which tools and data it can touch, and keep human accountability unambiguous. An AI tool can suggest an architecture. It can't accept the organisational risk when that architecture fails.

#### **The structure is the point**

Code generation is the least interesting thing about Kiro. Plenty of tools generate code. What deserves attention is the structure it puts around the generation: define the requirement, produce the design, break it into tasks, give the AI persistent standards, connect it to controlled sources, automate the routine checks, and test the intended rules rather than a handful of examples.

Vibe coding is fine when the result is disposable. For anything that has to be secure, maintained, assured or operated by a team, it won't do. The future of AI-assisted development is unlikely to be a blank prompt box we keep typing into until an application looks finished. It'll be a controlled engineering process in which requirements, designs, standards and tests shape what the AI is allowed to produce. That's delivery discipline as it has always been. The difference is that it's finally becoming executable.
