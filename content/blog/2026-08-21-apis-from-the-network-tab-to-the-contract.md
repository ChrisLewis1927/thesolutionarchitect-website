---
title: "APIs: from the network tab to the contract"
date: 2026-08-21T08:07:00.000Z
category: Cloud
excerpt: An API is the set of promises one piece of software makes to another.
  Here is what you may ask me, here is the shape of what comes back, here is how
  I behave when something goes wrong, and here is what I will not change without
  telling you first. The mechanics take an afternoon to learn. The promises
  outlive the code, the team and usually the contract that paid for it, which is
  the part worth your attention.
author: The Solution Architect
---
An API is the set of promises one piece of software makes to another: 

* Here is what you may ask me
* Here is the shape of what comes back
* Here is how I behave when something goes wrong
* Here is what I will not change without telling you first. 

The mechanics take an afternoon to learn. The promises outlive the code, the team and usually the contract that paid for it.

Everything below is that sentence unpacked, starting with the easiest way to see it.

### **Open the network tab**

Pick a public service you use often, open your browser's developer tools, go to the network tab and reload the page. You are now watching the page assemble itself.

The HTML document arrives first. Then stylesheets and scripts, then fonts, then images, often from an address that looks like nonsense because a content delivery network is serving them from a data centre near you. Sort the list by type and a handful of requests fall outside all of that. They go to a different host name, usually with an api or content prefix in front of the familiar domain, and what comes back is data instead of page.

A modern page is assembled in the browser out of a dozen separate conversations, each with its own owner, its own cache behaviour and its own way of failing, so when somebody reports that the service is broken the useful question is which of those conversations broke.

The data calls tell you about the design as well. An endpoint named for what a screen needs, something like home page tiles, is doing presentation shaped work for one front end. An endpoint named for something the organisation owns, applications or licences or vehicles, is doing domain work and can serve anyone who asks. Both are legitimate. Building the first while telling everyone you have built the second is how you end up with an API that serves one screen beautifully and nobody else at all.

### **Anything the browser can call, anyone can call**

Copy the address of one of those images out of the network tab and paste it into a fresh browser tab. It loads. No key, no session, no permission. Do the same with a public content endpoint and you get back exactly what the website got, in any tool that can make an HTTP request.

The browser holds no privileged position. It is a client with a user interface bolted on. Whatever the page can fetch without credentials, anybody can fetch without credentials, at whatever volume they like. So the front end is not a security control, and hiding a field in the interface hides nothing at all. If the endpoint returns a National Insurance number and the page declines to display it, you have disclosed a National Insurance number to anyone who thought to look. It is the same argument as the [trusted network](https://thesolutionarchitect.uk/the-end-of-the-trusted-network) one, a layer further down.

The government's API technical and data standards make the same point as a design rule. A response should answer the question that was asked and go no further: if the question is whether someone is eligible, the answer is true or false, and not the record that proves it. Data minimisation shows up in your endpoint design long before it shows up in a privacy notice.

An open read endpoint is also a capacity commitment. You are serving traffic you do not control, at a rate the caller chooses, and caching and rate limits are how that stays affordable. The standards go further and tell you to enforce your quotas even when you have spare capacity, so that consumers get a consistent experience on the days you do not.

# **JSON is easy. The agreement is not**

Almost everything comes back as JSON: keys and values inside curly braces, keys in double quotes, objects nesting inside other objects to whatever depth you need. Values are strings, numbers, booleans, arrays, nested objects and null. It won because it needs nothing special to read or write, and it survives being passed between systems that agree on nothing else.

The part of the syntax that causes arguments is null. A field that exists and carries no value makes a different claim about the world from a field that is absent, and consumers will guess differently unless you tell them which you mean. That one ambiguity produces more defects than the rest of the format put together, and most of them are found in production by somebody else.

What JSON gives you is a syntax. What it does not give you is an agreement, and that catches people out most visibly at the storage end. A document store accepts whatever shape you send it, which is useful when you cannot know the shape of the data in advance. It also means the validation your relational schema used to do has not gone away. It has moved into every consumer of that data, usually somewhere with less scrutiny and no test coverage.

So the fields need defining where both sides can see them: types, units, formats, which are optional, what an empty value means. The government standards settle some of it for you. UTF-8 for text. ISO 8601 for dates and times, so 09/08 stops meaning two different days depending on where your consumer sits. One casing convention for keys, chosen and kept. Small print, until you are joining data from four organisations and it becomes most of the work.

### **REST is a style, and the style is the point**

REST, representational state transfer, is the shape most of these APIs take. It is a style rather than a standard, and it is certainly not a protocol. There is no syntax to learn and no library you are obliged to use, which is most of why it spread. The style comes down to a few habits.

**Resources are nouns, usually plural.** Endpoints are named for things. Applications, licences, vehicles. What you do to the thing belongs in the HTTP method. The moment you write an endpoint called getApplicationById you have stopped doing REST and started doing remote procedure calls with extra ceremony.

**The method carries the verb.** GET reads, POST creates, PUT and PATCH update, DELETE removes. The one to take seriously is GET, which must be safe. No side effects, ever, because caches, crawlers, prefetchers and retry logic all assume it and none of them will ask you first.

**Hierarchy stays shallow.** Sub resources sit underneath the resource they belong to, and the government standards cap that at three levels deep. Reaching the third is itself the prompt to stop and look again, because what you usually have at that point is two resources that have been folded into one path.

None of that makes an API fast or secure by itself. REST carries no performance guarantee and no security model; both come from what you build around it. What the style buys you is predictability, and any competent developer can guess your third endpoint after reading your first two. It is the default and not the only option, though. The standards say to build RESTful where it fits and accept that it does not suit everything, streaming being their own example, and there is separate guidance on GraphQL. Everything below applies whichever shape you pick.

#### **Versioning is a promise about the future**

The interesting part of API design is never the first release. It is the fifteenth change, two years later, when you no longer know everyone who depends on you.

Additive changes are safe: a new optional field, a new endpoint, a new value in a list that clients ignore when they do not recognise it. Breaking changes remove a field, rename it, tighten validation, or make something optional mandatory. The worst of them alters what an existing value means while leaving the schema untouched, because nothing looks different and everything downstream is quietly now wrong.

When a break is unavoidable you version, and you run the old version alongside the new one while consumers move across. That is the part people underestimate: a version number commits you to operating two things at once for as long as the slowest team takes to migrate, so you need a deprecation policy with real dates in it, and you need to know who your consumers are. You cannot retire what you cannot see. That is the unglamorous argument for API keys, registration and a published catalogue: between them they give you the list of people you owe a phone call before you change anything.

Central government has a formal version of this. Public sector organisations publish details of their APIs in the catalogue at api.gov.uk so that other organisations can find them, and listing yours there is a condition of getting one of the api.gov.uk domains. Appearing in the catalogue does not make an API publicly accessible and is not meant to; it is a discovery mechanism for the [Technology Code of Practice](https://thesolutionarchitect.uk/the-uk-governments-technology-code-of-practice-a-quiet-but-powerful-piece-of-policy) expectation to share and reuse. An API nobody can find is an API somebody else pays to build again.

### **The documentation is the interface**

Hand written API documentation drifts from the implementation within about a fortnight of the first hotfix. The answer is a machine readable definition, and OpenAPI 3 is the one to reach for; the Open Standards Board recommends it for government use. One structured file describes every endpoint, method, parameter, response code and data contract in the API.

From that file you get rendered documentation with a working console, generated client libraries, mock servers so other teams can build against you before you have finished, and contract tests that fail the build the moment code and definition disagree.

### **What sits behind the endpoint**

You should know roughly what is on the other side, because that is where your seams are. A route handler bound to a path such as /users reads the request and writes the response. A controller behind it works out what the response should contain. Services behind that do the work, and one of them, only ever one, is allowed to talk to the database. That last constraint is the point of the whole arrangement: because a single component touches the data store, you can change the store, put a cache in front of it or split it in two without touching anything a caller can see. The route handler is the promise. Everything behind it is an implementation detail you have kept the right to change, and preserving that right is most of what a boundary is for.

Real endpoints do more than fetch a row: a create request might validate, write, then send a confirmation, some of it in parallel, while hundreds of other requests are in flight. Which is why "the API is slow" is so rarely one thing: a slow query, a synchronous call out to something else that is slow, or work being done inside the request that had no business being there. Anything the caller does not need to wait for should not happen inside the request. Accept the work, acknowledge it, do the slow part afterwards. Nobody's connection should be held open while a mail server thinks about its life choices.

### **Where APIs get expensive**

Three costs turn up in year two instead of at launch.

**Chattiness**. A screen that needs ten resources and makes ten calls to draw itself is fine on a wired connection in an office and dreadful on a phone on a bus. The fix is an endpoint shaped for that screen, sitting in front of your domain APIs and doing the assembly server side, or parameters that let a caller ask for everything in one round trip. At bulk scale the standards have their own answer. Where the data is open and not restricted, let people download the whole dataset instead of paging through a million records: rate limits will throttle them anyway, and a dataset that changes halfway through the download hands them inconsistent records.

**Dependency chains.** Availability multiplies. Four services at 99.9 per cent, each needing the next, puts you at roughly 99.6 per cent before your own code has done a single thing wrong. The Service Manual puts it plainly: rely on a third party API and you have tied your availability to theirs. So every outbound call needs a timeout, every dependency needs a decision about what happens while it is unavailable, and users need telling honestly what is degraded. Failing well is a design decision, made deliberately or by default.

**The synchronous habit.** Request and response is the easy model and the wrong one for anything long running: batch processing, document generation, payments that clear overnight, anything waiting on a human decision. There the caller submits the job, gets an acknowledgement and a reference straight away, then either polls for the result or is called back when it is ready. Events and webhooks are a different shape for a different problem, and picking that shape early costs far less than retrofitting it around an interface everyone has already built against.

### **The questions governance will ask**

Everything above applies to any API anywhere. Take one through a design authority or a Service Standard assessment in the public sector and a fairly predictable set of questions arrives.

Who are your consumers, and how do they find you? Where is your OpenAPI definition published? What is your versioning and deprecation policy, and how much notice does a consumer get? What data does each response carry, at what classification, and can you defend every field in it? How do callers authenticate, and how tightly are their tokens scoped? What is your rate limit, and what happens to a caller who hits it? What does your service do when something you do not own stops answering? Is it in the catalogue?

Almost none of that is about code. All of it is the promise, written down somewhere another person can hold you to.

### **The plumbing was never the hard part**

The technology here is the shallow end. A data format with six value types. A handful of HTTP methods. Status codes that mean what they have always meant. A definition file. A layered handler with one component allowed near the database. I put off learning any of it for years on the assumption that it went deeper than it does.

If you want the reps, take an API your service already depends on and answer the governance questions above as though you owned it. Where is its definition? What notice would you get before it changed? What happens to your service the day it returns 500 for an hour? You will probably fail two or three, and those are the promises nobody ever made you.

None of the mechanics is the design. The design is the promise: what you return, what you accept, what you will never break without warning, how you behave when something you depend on goes dark, and who you owe a conversation before any of it changes. The plumbing turned out to be straightforward the moment I stopped avoiding it. Keeping the promise is the job, and that one never gets easier.
