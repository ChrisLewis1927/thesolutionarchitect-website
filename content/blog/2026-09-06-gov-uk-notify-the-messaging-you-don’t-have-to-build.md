---
title: "GOV.UK Notify: the messaging you don’t have to build"
date: 2026-09-06T10:08:00.000Z
category: Government
excerpt: >
  GOV.UK Notify sends emails, text messages and letters for public services
  without every team building its own messaging platform. Here’s what it offers,
  what it costs and what architects need to design around.
author: The Solution Architect
---
Every service I’ve built eventually needs to tell someone something. Their form has been received, an account has been created in the CRM, their payment did not go through, so they need to try again.

It sounds like one of the most solved problems in software. Then you sit down to build it and realise you have quietly signed up for an SMS gateway, email delivery, bounce handling, templates, monitoring and some way to reach people who need a letter.

[GOV.UK Notify](https://www.notifications.service.gov.uk/) is a government service that sends emails, text messages and letters on behalf of public services. Your service provides the recipient, the message and the channel; Notify handles the delivery and reports what happened. This means service teams do not need to build or buy separate systems for sending each type of message.

Notify is built by the Government Digital Service. In September 2026, the Notify site reported 12,670 services across 1,754 organisations.

Notify is available to [specified public sector organisations](https://www.notifications.service.gov.uk/features/who-can-use-notify), including central government departments, local authorities, the armed forces, the NHS, emergency services and state-funded schools. Suppliers can use it on behalf of an eligible organisation, but that organisation must create the service and add the supplier’s team members.

### **What Notify gives you**

Notify supports three outbound channels:

* **Email**: unlimited free sending, organisation branding, a reply-to address and the option to provide a file through an encrypted download link instead of an attachment.
* **Text message**: sender IDs, international sending and an optional receiving number for replies.
* **Letter**: printing, folding, enveloping and postage using economy, second class, first class or international mail. You can create a letter from a template or upload a finished PDF.

Across the three channels, you create templates and add personalisation for each recipient. Notify reports message status, although “delivered” does not mean the recipient has read it.

You can send a batch manually by uploading a spreadsheet, or integrate a service or back-office system through the [Notify API and client libraries](https://www.notifications.service.gov.uk/using-notify/api-documentation).

### **What it costs**

The [current Notify pricing](https://www.notifications.service.gov.uk/pricing) is simple, but the detail matters:

* Emails are free, with no annual allowance. Daily service limits still apply.
* Each eligible service gets an [annual text-message allowance.](https://www.notifications.service.gov.uk/pricing/free-text-message-allowance) Central government departments and national organisations receive up to 20,000 free messages; local authorities and regional organisations receive 10,000; state-funded schools and most other eligible organisations receive 5,000. GP surgeries receive no free allowance. The allowance is discretionary and renews on 1 April.
* After the allowance, a [single 160-character text message](https://www.notifications.service.gov.uk/pricing/text-messages) costs 2.4 pence plus VAT. Longer messages, messages containing non-standard characters and messages sent internationally can use more of the allowance or cost more.
* A [one-sheet economy letter](https://www.notifications.service.gov.uk/pricing/letters) starts at 63.8 pence plus VAT. The price changes with the number of sheets and postage class.

Notify says there is no monthly charge, setup fee or procurement process. That removes the need to procure a messaging platform, but it does not remove governance, assurance or the need to budget for chargeable text messages and letters. An eligible organisation must accept [Notify’s terms](https://www.notifications.service.gov.uk/terms-of-use) and, if it is new to the platform, its data processing and financial agreement.

No procurement process is an odd thing to get excited about, until you have sat through one.

### **The constraints that actually matter**

Notify’s[ security guidance](https://www.notifications.service.gov.uk/features/security) says it is designed for information classified as **OFFICIAL**, including **OFFICIAL-SENSITIVE**. It must not be used for **SECRET** or **TOP SECRET** information. Before requesting live access, your organisation must confirm that Notify meets its requirements for information handling, cyber security and data protection, and repeat that assessment at appropriate intervals.

Email and text messages cannot provide end-to-end encryption. Notify tries to protect email in transit using TLS, but it will send without TLS if the recipient’s mail server does not support it. The [Service Manual guidance on emailing users](https://www.gov.uk/service-manual/technology/how-to-email-your-users) says to leave sensitive information out of emails. A sound pattern is to use the message as a prompt and keep sensitive details behind an appropriately protected sign-in.

The [organisation sending the notifications is the data controller](https://www.notifications.service.gov.uk/privacy), while GDS is the data processor. Your organisation remains responsible for the purpose and lawful basis of the processing, its privacy information, the accuracy of recipient data and message content, and deciding whether a data protection impact assessment is required.

Notify [deletes message content and recipient details](https://www.notifications.service.gov.uk/using-notify/data-retention-period) after seven days by default. A live service can set this retention period to between 3 and 90 days. If you need a longer audit trail, keep the necessary reference and status data in your own service under an agreed retention policy.

Files sent by secure download link have a separate retention period. According to the [Notify API documentation](https://docs.notifications.service.gov.uk/rest-api.html#send-a-file-by-email), they remain available for 26 weeks by default, configurable from 1 to 78 weeks. Do not assume that the seven-day message-history setting also covers those files.

### **Things that bite in practice**

A new service starts in trial mode. It can only send to its own team members, with daily limits of 50 emails and 50 text messages, and it cannot send letters. Notify says moving to live can take up to one working day once the service has completed the required tasks.

Sending is asynchronous. Notify commits to sending 95% of emails and text messages within 10 seconds, but its providers may continue trying to deliver them for up to 72 hours. A successful API request therefore does not prove that the user received the message, and Notify does not track whether an email was opened or a link was clicked.

For an integrated service, configure callbacks so Notify can post delivery and failure statuses to an endpoint protected by a bearer token. Notify retries a failed callback every five minutes, up to five times. Make the endpoint safe to process repeated callbacks, and reconcile missing updates by querying the API.

The default [API limit](https://docs.notifications.service.gov.uk/rest-api.html#limits) is 3,000 messages a minute. A live service also has daily limits of 250,000 emails, 250,000 text messages and 20,000 letters. Size against peak demand rather than an average, and agree how the service will queue, retry and recover when Notify or a downstream provider is unavailable.

A file “sent by email” is a link to a Notify-hosted download, not an attachment. Notify considers this safer, but the message still needs to help the recipient recognise and trust the link. Test that wording with users.

### **When to reach for something else**

Notify is for transactional messages and updates that people have subscribed to receive. Its [terms prohibit unsolicited messages](https://www.notifications.service.gov.uk/terms-of-use), and subscription emails must give people a way to opt out.

It can receive text replies through a dedicated number and route email replies to an inbox you choose. It does not provide the case-management or conversation workflow around those replies; your service must handle that.

The templates are deliberately constrained. They support personalisation, optional content and a limited set of Markdown formatting, but not the unrestricted layout and styling of a custom HTML email. If the need is real-time in-app chat, highly interactive content, unrestricted visual design or information classified above **OFFICIAL**, use a different capability.

### **Where it fits**

The [Technology Code of Practice](https://www.gov.uk/guidance/the-technology-code-of-practice) asks government teams to avoid duplicated effort and unnecessary cost by sharing and reusing technology. Its [supporting guidance](https://www.gov.uk/guidance/share-and-reuse-technology) specifically names GOV.UK Notify as a common platform to consider for user notifications.

That makes Notify a strong option to assess, not an automatic architecture decision. An assurance review should still cover user needs, channel choice, accessibility, classification, privacy, message content, volumes, failure handling, operational ownership and cost.
