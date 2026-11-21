---
title: What an API is, without the jargon
date: 2026-11-21T17:33:00.000Z
category: Cloud
excerpt: "An API is the way one piece of software asks another piece of software
  for something and gets an answer back. "
author: The Solution Architect
---
The word API turns up in nearly every delivery meeting, and almost nobody stops to explain it. By the third time you've heard it, asking feels like admitting you should already know, so you nod along and look it up later, only to find explanations written for people who understood it in the first place. This one starts from nothing and leaves no acronyms hanging.

# **One program asking another for something**

An API is the way one piece of software asks another piece of software for something and gets an answer back. Picture a records office where you can't go through the filing cabinets yourself, so instead you go to a counter, make one of the specific requests they accept, and somebody brings back exactly what you asked for and nothing else. An API is that counter, built for software rather than people, and everything else here is detail about how the asking is done.

You'll hear two words constantly, and neither is any more complicated than that. The program doing the asking is the **client** and the program doing the answering is the **server**, so when a mobile app asks a government service for your licence details, the app is the client and whatever answers is the server. It works the same way whether the two belong to different organisations or sit inside one service. The letters stand for application programming interface, which nobody finds especially helpful, so you can safely forget them.

# **Go and look at one**

You can watch this happening in about a minute, and it's worth doing once because it makes the rest far more concrete. Open a website you use in Chrome, right-click anywhere on the page and choose [Inspect](https://developer.chrome.com/docs/devtools/open), then pick the Network tab and reload the page, and you'll see a list start filling up. Other browsers have something very similar, and if your work laptop has it locked down, as plenty do, a personal one works just as well.

Every line in that list is one request the page has made. Some fetch things you can see, like the page's text, styling, images and fonts, while others come back as blocks of labelled data you never see directly, and those are the API calls. Clicking the [Fetch/XHR filter](https://developer.chrome.com/docs/devtools/network/reference) above the list hides most of the rest so you're left looking mainly at those.

The first useful lesson here is that a web page isn't one thing arriving from one place but a dozen or more separate requests, often to systems owned by different people. That's why a service that seems to be down is often just one of those requests failing while the rest carry on.

# **What a request looks like**

A request is simply an address and an instruction, like this one.

```
GET https://example.gov.uk/licences/12345
```

The address says which thing you want and the word in front of it says what you want done with it, and every request you'll ever see is a variation on those two parts. Four instructions cover most of what you'll meet. **GET** fetches something and is meant to leave it unchanged, **POST** usually creates something new, **PUT** puts a new version in place of whatever is at that address, and **DELETE** removes it.

Two more words get used as though everybody already knows them. That address is called an **endpoint**, so a system that exposes three endpoints simply accepts requests at three addresses. And when somebody asks whether it's a REST API, they're asking, loosely speaking, whether it's arranged the way I've just described, with addresses naming things and instructions saying what to do with them. Government's [API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) describe REST as a good way to design an API, so the answer is usually yes, and it rarely changes anything you need to know.

Many requests also carry a key or a token, which is how the answering system knows who's asking. So when a team says they're waiting on an API key, they're waiting for permission to make requests that are tied to them, which means their use can be counted, limited or switched off.

# **What comes back**

The answer usually arrives as text in a format called JSON, which those same standards recommend wherever possible. Send the request above and you might get something like this back.

```json
{
  "licence_number": "12345",
  "status": "active",
  "expires": "2027-04-30",
  "penalty_points": 3
}
```

Labels sit on the left and values on the right with a colon between each pair, text goes inside quotation marks while numbers don't, and the whole thing is wrapped in curly brackets, and those few rules cover most of what you'll meet.

It looks unremarkable, and that's rather the point. Because it's plain text, any system written in any language on any kind of computer can read it, which is a big part of why it ended up everywhere, and a person can read it too, even though it isn't really written for one.

Notice the date while you're there. Government's [date and time standard](https://www.gov.uk/government/publications/open-standards-for-government/date-times-and-time-stamps-standard) says to use ISO 8601 in government systems, which puts the year first, then the month, then the day, so that nobody has to guess whether 09/08 means the ninth of August or the eighth of September. Small rules like that make up a surprising amount of what data standards actually are.

# **The number that comes with every answer**

Every answer also comes back with a number that tells the asking program what happened, and you've almost certainly seen one already, because 404 is the code behind most "page not found" screens.

The [first digit](https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes) tells you most of the story. Codes in the 200s mean it worked, with **200** being the plain "OK". Codes in the 400s mean the problem is at the asking end, so **400** means the request didn't make sense, **404** means the thing you asked for isn't there and **429** means you're asking too often and should slow down. Codes in the 500s mean something has gone wrong at the other end, and **500** is the general-purpose "something broke here".

These matter more than they look, because a program can't read an apology. The number is what tells it whether to give up, try again in a moment or show the user an error, so if a provider gets its numbers wrong, thousands of copies of somebody else's software can make the wrong decision at once.

# **Why any of this matters in government**

Without APIs, two services that need the same information have two poor options. Either one copies the data and it starts going stale from the day it's copied, or a person retypes it from one screen into another, which is slower and produces mistakes nobody catches for months.

With an API, the organisation that owns the information holds it once and everybody else asks for it when they need it. That's really the whole argument, and it's why the [Technology Code of Practice](https://thesolutionarchitect.uk/the-uk-governments-technology-code-of-practice-a-quiet-but-powerful-piece-of-policy) asks teams to share, reuse and collaborate rather than rebuild. There's even a cross-government catalogue at [api.gov.uk](https://www.api.gov.uk/) where public sector organisations list their APIs so others can find them.

It's also why "can we integrate with them?" is a question with a real answer. If a service has an API you can ask it for things, and if it doesn't, your options shrink to a copy of the data, a spreadsheet or a person.

# **Three ways APIs catch people out**

You don't need to build an API to be caught out by one, and it tends to happen in one of three ways.

The first is that somebody changes it, perhaps renaming or dropping a field or changing what one means, and everything built on top of it breaks, often so quietly that nobody notices for weeks. That's why teams version their APIs, and why the government standards say you must tell users when an old version is no longer supported and give them time to move, so the useful question to ask any provider is how much warning you'd get.

The second is that the other end goes down, and if your service needs four other services to answer before it can respond, you've inherited all four of their bad days. Depending on somebody else's API means depending on their reliability, their maintenance windows and their funding, and my post on [tightly and loosely coupled architectures](https://thesolutionarchitect.uk/tightly-and-loosely-coupled-architectures-what-actually-depends-on-what) looks at how to design around that.

The third is that anything open really is open. If a web page can fetch something without you logging in, so can anybody else who works out the address, and hiding a field on screen doesn't protect it, because the data has still arrived in the browser. [OWASP lists this](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/) among its top API security risks, and it's the [same argument as zero trust](https://thesolutionarchitect.uk/the-end-of-the-trusted-network) at a smaller scale, since what protects information is a control on the data rather than a screen that chooses not to show it.

# **If you end up responsible for one**

You don't need to be technical to ask the questions that matter, and four of them catch most problems early. Who is using this, and do we have a way to contact them? What happens to them when we change it, and how much notice will they get? What does each answer contain, and can we justify every field being in there? And what does our service do on the day the thing we depend on stops answering?

None of those are really technical questions, because they're all about what has been promised to somebody else. That promise is what people mean by an API's contract, and the government standards suggest writing it down as an OpenAPI document, a file both people and machines can read, as the first output of designing one. The [API strategy and design guide](https://thesolutionarchitect.uk/guide-api-strategy-and-design) picks up from there if you want to go further.

# **What it comes down to**

Strip it all back and an API is an address, an instruction and a block of labelled text coming back, and once you've seen one request and one answer, most of the remaining difficulty is vocabulary rather than concept. The word sounds as though it's guarding something complicated, but what it's really guarding is a counter, a list of things you're allowed to ask for, and an agreement about what comes back.
