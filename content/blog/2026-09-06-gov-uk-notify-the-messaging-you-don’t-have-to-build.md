---
title: "GOV.UK Notify: the messaging you don’t have to build"
date: 2026-11-23T17:52:00.000Z
category: Government
excerpt: >
  GOV.UK Notify sends emails, text messages and letters for public services
  without every team building its own messaging platform. Here’s what it offers,
  what it costs and what architects need to design around.
author: The Solution Architect
---
Sooner or later almost every public service needs to tell someone something, whether that's confirming a form has arrived or asking them to retry a failed payment. It sounds like a solved problem until you start building it and realise you've quietly signed up for a text message gateway, email delivery, bounce handling, templates, monitoring and some way of reaching the people who need a letter.
 
[GOV.UK Notify](https://www.notifications.service.gov.uk/) is the government's answer, a service built and run by the Government Digital Service that sends emails, text messages and letters for public services, so yours supplies the recipient and the message while Notify handles delivery and reports back. It's open to [specified public sector organisations](https://www.notifications.service.gov.uk/features/who-can-use-notify), including central and local government, the NHS and GP surgeries, the armed forces, emergency services and state-funded schools, but not charities, housing associations or universities. Suppliers can use it on an eligible organisation's behalf, provided that organisation creates the service and invites them in as team members.
 
# **What Notify gives you**
 
Emails can carry your organisation's branding and a reply-to address, and any file you send goes as an encrypted download link rather than an attachment. Text messages can show who they're from, go to international numbers and, if you switch it on, receive replies. Letters can be built from a template or uploaded as a finished PDF, and Notify prints them, puts them in envelopes and posts them by economy, second class, first class or international mail.
 
Everything else is built from templates with personalisation, which you can send one at a time from the website, in bulk by uploading a spreadsheet, or from your own system through the [Notify API and client libraries](https://www.notifications.service.gov.uk/using-notify/api-documentation). Notify reports each message's status, although "delivered" doesn't tell you anyone has read it, and it [doesn't track opens or clicks](https://www.notifications.service.gov.uk/using-notify/delivery-times).
 
# **What it costs**
 
Emails are free, and each service gets an [annual allowance of free text messages](https://www.notifications.service.gov.uk/pricing/free-text-message-allowance), 20,000 for central government departments and national organisations, 10,000 for local authorities and regional organisations and 5,000 for state-funded schools and most other organisations, while GP surgeries and pharmacies get none. The allowance renews on 1 April, unused messages don't carry over, and Notify describes it as discretionary.
 
At [November 2026 prices](https://www.notifications.service.gov.uk/pricing), a [single 160-character text message](https://www.notifications.service.gov.uk/pricing/text-messages) beyond the allowance costs 2.4p plus VAT. Longer messages count as more than one, and if you use non-standard characters that happens after 70 characters rather than 160, while messages to many international numbers cost more or use more of the allowance. A [one-sheet letter](https://www.notifications.service.gov.uk/pricing/letters) by economy mail costs 63.8p plus VAT, rising with extra sheets and faster postage, and since Royal Mail rate rises feed through, check current prices before building a business case.
 
Notify also advertises no monthly charge, no setup fee and no procurement process, which is an odd thing to get excited about until you've sat through a procurement. You still need assurance and a budget for texts and letters, though, and an organisation new to Notify has to accept its data processing and financial agreement before its first service goes live.
 
# **Security and data protection**
 
Notify's [security guidance](https://www.notifications.service.gov.uk/features/security) says it's designed for information classified as OFFICIAL, including OFFICIAL-SENSITIVE, and must not be used for SECRET or TOP SECRET. Its [terms of use](https://www.notifications.service.gov.uk/terms-of-use) also require you to check that Notify meets your organisation's standards for information handling, cyber security and data protection, both before you ask to go live and at regular intervals afterwards.
 
Neither email nor text messages can be encrypted end to end. Notify tries to protect emails in transit with TLS, but if the recipient's mail server doesn't support it the email goes without that protection, and the Service Manual's guidance on [emailing your users](https://www.gov.uk/service-manual/technology/how-to-email-your-users) says to leave out sensitive information such as bank details. A sensible pattern is to treat the message as a prompt and keep anything sensitive behind a properly protected sign-in.
 
Your organisation is the [data controller](https://www.notifications.service.gov.uk/privacy) and GDS is the processor, so, as the [ICO explains](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/what-does-it-mean-if-you-are-a-controller), responsibility for the lawful basis, the privacy information you give people and deciding whether you need a data protection impact assessment stays with you.
 
Notify [deletes message content and recipient details](https://www.notifications.service.gov.uk/using-notify/data-retention-period) after seven days by default, and you can set that anywhere from 3 to 90 days, so if you need a longer audit trail, keep it in your own service. Files sent by email run on a separate clock, available for [26 weeks by default](https://docs.notifications.service.gov.uk/rest-api.html#send-a-file-by-email) and configurable from 1 to 78 weeks.
 
# **Things that catch teams out**
 
Every new service starts in [trial mode](https://www.notifications.service.gov.uk/features/trial-mode), where it can only send a few messages a day to its own team and no letters at all. Going live takes some setup tasks and a request, and Notify says the switch can take up to one working day.
 
Sending is also asynchronous, because although Notify [commits to sending 95% of emails and text messages within 10 seconds](https://www.notifications.service.gov.uk/using-notify/delivery-times), its providers can keep trying to deliver them for up to 72 hours, so a successful API call doesn't mean anyone has received anything yet. That's why an integrated service should use [callbacks](https://docs.notifications.service.gov.uk/rest-api.html), where Notify posts delivery and failure statuses to an endpoint you protect with a bearer token. If a callback fails, Notify retries every five minutes up to five times, so make your endpoint safe to receive the same update twice, and query the API to fill in anything that never arrives.
 
The [limits](https://docs.notifications.service.gov.uk/rest-api.html#limits) need planning for as well, since the API accepts up to 3,000 messages a minute and a live service can send up to 250,000 emails, 250,000 text messages and 20,000 letters a day. Size against your peak rather than your average, and decide how your service will queue and retry when Notify or a provider is unavailable.
 
Because files arrive as a download link, which Notify says is [more secure and less likely to be marked as spam](https://www.notifications.service.gov.uk/using-notify/send-files-by-email) than an attachment, your message has to help people recognise and trust that link, so test the wording with users.
 
# **When to look elsewhere**
 
Notify is for transactional messages and updates that people have signed up for, because its terms rule out unsolicited messages, and if you send subscription emails you [must let people opt out](https://www.notifications.service.gov.uk/using-notify/unsubscribe-links). Replies to texts and emails can come back to you, but routing them to a caseworker or tracking a conversation is your service's job.
 
Templates are constrained as well, supporting personalisation, optional content and a [small set of formatting](https://www.notifications.service.gov.uk/using-notify/formatting) such as headings, bullet points and inset text, but not bold, italics or the free-form layout of a custom HTML email. So if you need real-time chat, rich interactive content or full design control, you need a different tool.
 
# **Where it fits**
 
Point 8 of the [Technology Code of Practice](https://www.gov.uk/guidance/the-technology-code-of-practice), “share, reuse and collaborate”, asks you to find out whether government has already solved a problem before building something new, and its [supporting guidance](https://www.gov.uk/guidance/share-and-reuse-technology) names GOV.UK Notify as the common platform for notifications. That makes Notify the first thing to check rather than an automatic decision, and an assurance review should still look at user needs, channel choice, accessibility, classification, privacy, volumes, failure handling, ownership and cost.
