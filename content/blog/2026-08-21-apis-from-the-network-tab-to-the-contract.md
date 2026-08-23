---
title: What an API is, without the jargon
date: 2026-08-21T08:07:00.000Z
category: Cloud
excerpt: "An API is the way one piece of software asks another piece of software
  for something and gets an answer back. "
author: The Solution Architect
---
The word turns up in every delivery meeting and almost nobody stops to explain it. By the third time you have heard it, asking feels like admitting you should have known, so you nod and look it up later, and what you find is written for people who already understand it.

This starts from nothing. No assumed knowledge, no acronyms left hanging.

### **One program asking another for something**

An API is the way one piece of software asks another piece of software for something and gets an answer back. Everything else in this piece is detail about how the asking is done.

Picture a records office. You cannot walk in and go through the filing cabinets yourself. You go to a counter, make one of the specific requests they accept, and somebody brings back exactly what you asked for and nothing else. An API is that counter, built for software rather than people.

Two words you will hear constantly and which mean nothing more complicated than this. The program doing the asking is the **client**. The program doing the answering is the **server**. A phone app asking a government service for your licence details is the client; the thing that answers is the server. Swap the app for a spreadsheet or another department's system and nothing changes. The two programs can belong to different organisations or sit inside the same service, and the arrangement works the same way either way.

The letters stand for application programming interface, which nobody finds helpful, so it is safe to forget them.

### **Go and look at one**

You can watch this happening in about a minute, and it is worth doing once because it makes the rest concrete.

Open a website you use, right click anywhere on the page and choose Inspect. A panel opens. Find the tab labelled Network and reload the page. A list starts filling up. If your work laptop has that locked down, and plenty do, it works the same on a personal one.

Every line in that list is one request the page has made. Some are fetching things you can see: the text and structure of the page, the styling that makes it look like something rather than a wall of text, the images, the fonts. Others are fetching something you cannot see directly. They come back as blocks of labelled data, and those are the API calls.

The first useful thing to take from that list is that a web page is not one thing arriving from one place. It is a dozen or more separate requests, often to different systems owned by different people. When someone says the service is down, one of those requests has usually failed rather than all of them.

### **What a request looks like**

A request is an address and an instruction. Here is one:

*`GET https://example.gov.uk/licences/12345`*

The address says which thing you want. The word in front of it says what you want done with it. Every request you will ever see is a variation on those two parts.

There are four instructions you will see most of the time:

* **GET** fetches something and changes nothing.
* **POST** creates something new.
* **PUT** updates something that already exists.
* **DELETE** removes it.

Two pieces of vocabulary while we are here, because both get used as though everybody knows them. That address, the specific one you send a request to, is called an **endpoint**. When somebody says a system exposes three endpoints, they mean it accepts requests at three addresses. Nothing more.

And when somebody asks whether it is a REST API, they are asking whether it is arranged the way described above, with addresses naming things and instructions saying what to do with them. Most of the time the answer is yes, and it rarely changes anything you need to know.

Many requests also carry a key or a token alongside them, which is how the answering system knows who is asking. If you have heard a team say they are waiting on an API key, that is what they meant: permission to make requests, tied to them, so it can be counted, limited or switched off.

### **What comes back**

The answer arrives as text, in a format called JSON. Send the request from the last section and this is what comes back:

*`{`*

 *` "licence_number": "12345",`*

 *` "status": "active",`*

 *` "expires": "2027-04-30",`*

 *` "penalty_points": 3`*

*`}`*

Labels on the left, values on the right, a colon between them. Text values sit inside quotation marks and numbers do not. The whole thing is wrapped in curly brackets. Those few rules cover most of what you will meet.

It looks unremarkable and that is the point. It is plain text, so any system written in any language on any kind of computer can read it, which is why it ended up everywhere. A person can read it too, though it is not really written for one.

Notice the date. Government guidance requires dates in that order, year then month then day, precisely so that nobody has to guess whether 09/08 means the ninth of August or the eighth of September. Small rules like that one are most of what data standards are.

### **When it goes wrong**

Every answer comes back with a number attached, and the number tells the asking program what happened. You have seen one of these already, because 404 is the one websites put on their error pages.

* **200** means it worked.
* **400** means you asked for something in a way that made no sense.
* **404** means the thing you asked for is not there.
* **429** means you are asking too often and should slow down.
* **500** means something broke at their end rather than yours.

These matter more than they look, because a program cannot read an apology. The number is what tells it whether to give up, try again in a moment, or show the user an error. Get the numbers wrong and thousands of copies of somebody else's software make the wrong decision at once.

### **Why any of this matters in government**

Think about what happens without APIs. Two services need the same information, so either one copies the data and it starts going stale from the day it is copied, or a person retypes it from one screen into another, which is slower and produces mistakes nobody catches for months.

An API means the organisation that owns the information holds it once, and everybody else asks for it when they need it. That is the whole argument, and it is why the [Technology Code of Practice](https://thesolutionarchitect.uk/the-uk-governments-technology-code-of-practice-a-quiet-but-powerful-piece-of-policy) pushes departments to share and reuse rather than rebuild. There is a public catalogue at [api.gov.uk](https://www.api.gov.uk/) where organisations list theirs so others can find them.

It is also the reason "can we integrate with them" is a question with an answer. If a service has an API, you can ask it for things. If it does not, your options are a copy of the data, a spreadsheet, or a person.

### **Three things that go wrong**

You do not need to build one of these to be caught out by them.

**Somebody changes it.** A field gets renamed, or dropped, or starts meaning something slightly different. Everything built on top of it breaks, often quietly, and sometimes nobody notices for weeks. This is why teams version their APIs and give notice before changing them, and why the useful question to ask of any provider is how much warning you would get.

**The other end goes down.** If your service needs four other services to answer before it can respond, you have inherited all four of their bad days. Depending on somebody else's API means depending on their reliability, their maintenance windows and their funding.

**Anything open is genuinely open.** If a web page can fetch something without a password, so can anybody else who works out the address. Hiding a field so it does not appear on screen does not hide it, because the data still arrived. It is the [same argument as Zero Trust](https://thesolutionarchitect.uk/the-end-of-the-trusted-network), at a smaller scale: what protects information is a control on the data, not the fact that the screen chose not to show it.

### **If you end up responsible for one**

You do not need to be technical to ask the questions that matter, and these four are the ones that catch problems early.

Who is using this, and do we have a way to contact them? What happens to them when we change it, and how much notice do they get? What information does each answer contain, and can we justify every field being in there? What does our service do on the day the thing we depend on stops answering?

None of those are technical questions. They are all about what has been promised to somebody else.

### **What it comes down to**

An address, an instruction, and a block of labelled text coming back. That is an API, and once you have seen one request and one answer, most of the remaining difficulty is vocabulary rather than concept.

The word sounds like it is protecting something complicated. What it is protecting is a counter, a list of things you are allowed to ask for, and an agreement about what comes back.
