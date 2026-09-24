> **Raw research notes** produced by a research agent on 2026-09-24 for Lead Follow-Up Rescue. Claims marked UNVERIFIED were not confirmed against primary sources. Not legal advice. The curated synthesis is `../INDUSTRY_RESEARCH.md`.

# Lead Follow-Up Rescue: Outreach Compliance Research (Research A)

**Prepared:** 2026-09-24
**Scope:** US, UK, EU, Canada, Australia, Philippines, plus messaging-platform terms
**Status:** Research notes to inform product design.

> **NOT LEGAL ADVICE.** This is desk research to inform product design. Laws, regulator guidance and platform terms change often, and several sections below could not be verified in this session. Before any rule here is built into the product as a legal requirement, counsel in the relevant jurisdiction should confirm it.

---

## 0. Method, limits, and how to read this report

- **Direct page access was blocked.** The network egress proxy refused every direct fetch I tried. That covered WebFetch and curl on ftc.gov, ecfr.gov, law.cornell.edu, govinfo.gov, uscode.house.gov, federalregister.gov, ico.org.uk, legislation.gov.uk, eur-lex.europa.eu, developers.facebook.com, privacy.gov.ph, acma.gov.au and wikipedia.org. All verification therefore went through a web-search tool that returns extracts of the pages it indexes.
- **How to read quotes.** Quotes marked *(extract)* are the wording the search tool showed for the cited primary page. They are very likely verbatim or near-verbatim, but I could not check them against the rendered page.
- **The search budget ran out partway through.** The session-wide WebSearch quota is 200 calls, shared with other agents in this session. It was used up during Q5 (Philippines). As a result, these could **not** be verified:
  - **Q6:** TCPA and state texting laws
  - **Q7:** messaging-platform rules
  - **Q8:** FTC, EU and UK rules on manipulative tactics
  - **Parts of Q5:** NTC SMS rules, the SIM Registration Act, AFASA, DPA penalty amounts, and bills in the 20th Congress

  Those sections are written from background knowledge (training data to about mid-2026). Every such claim is labeled **UNVERIFIED** and carries my own "background confidence" estimate. They need checking before they are used; §13 is the checklist.
- **Confidence legend:**
  - **[H] High:** primary text or regulator guidance seen in an extract, and consistent across sources.
  - **[M] Medium:** a regulator source was seen, but part of the wording or scope is inferred; or only a reputable secondary source was found.
  - **[L] Low:** thin or indirect evidence.
  - **[U] UNVERIFIED:** not checked in this session.
- **Labeled analysis.** Where I draw a conclusion that no regulator has stated, I label it **Analysis**.

---

## 1. Executive summary

1. **You were right: explicit opt-outs should be permanent for sales outreach.** In every jurisdiction I checked, an explicit opt-out or objection to marketing has no built-in expiry. A seller's own "new material reason" cannot override it. Commercial contact reopens only in two ways:
   - the lead starts a new inbound request (a "solicited" message), or
   - the lead gives fresh affirmative or express consent.

   The spec's "not necessarily permanent suppression… legitimate new signal may be evaluated separately" should be narrowed to lead-initiated contact only. Sources: US email 15 U.S.C. 7704(a)(4) and (a)(4)(B); UK/EU GDPR Art. 21(2)–(3) plus ICO guidance; Canada CRTC; Australia Spam Act Sch. 2 cl. 6; Philippines DPA IRR §34(b). **[H]**
2. **Asking permission to re-contact is itself marketing.** A message that only asks "may I tell you about X?" or "would you like to hear from us again?" counts as direct marketing. The ICO's hotel example says so, and the ICO fined Flybe £70,000 and Honda £13,000 in 2017 for exactly this. The engine must never draft a "permission to re-contact" message to a lead who opted out. **[H]**
3. **CAN-SPAM covers 1:1 sales email, low volumes and B2B.** The FTC says the Act "doesn't apply just to bulk email" and "makes no exception for business-to-business email". A follow-up on a quote the lead requested but has not accepted is **commercial**, not "transactional or relationship". Each commercial email needs:
   - accurate headers
   - a subject line that isn't deceptive
   - an opt-out notice, with a reply mechanism that works for at least 30 days
   - a valid physical postal address
   - a disclosure that it is an ad or solicitation, unless the lead gave affirmative consent

   Opt-outs must be honored within 10 business days. The maximum penalty stays at **$53,088 per email in 2026**, because the 2026 inflation adjustment was cancelled (OMB M-26-11, April 2026). **[H]**
4. **UK: a quote request can support follow-ups, but every message needs an opt-out.**
   - The ICO counts "requesting a quote or asking for more details" as "negotiations for a sale". So the PECR soft opt-in can cover email or SMS follow-ups about similar services, but only if an opt-out was offered when the details were collected **and** in every message.
   - A "solicited" message (one the person specifically asked for) falls outside PECR's consent rule; a later follow-up they did not ask for is unsolicited.
   - Marketing to companies ("corporate subscribers") is outside the consent rule, but sole traders and some partnerships count as individuals.
   - PECR fines rose to £17.5m or 4% of turnover for conduct from **5 Feb 2026** (Data (Use and Access) Act 2025).

   **[H]**
5. **Treat "Not interested" and "No." as objections.** The UK/EU right to object to direct marketing is **absolute**: there is no balancing test. It can be made "verbally or in writing", and the ICO says no specific words are needed. So a "Not interested" or "No." in reply to a sales message should be treated as an objection in the UK and EU. For US email it is legally unclear, but should be treated the same way. **[M–H]**
6. **Canada: exemptions cover the reply and the quote; later chasers need implied consent.**
   - CASL covers email, SMS, instant messaging and "similar accounts", which can include some social media.
   - A message sent in response to an inquiry is exempt from the consent, identification and unsubscribe rules (Electronic Commerce Protection Regulations, s.3(b)).
   - A requested quote needs no consent but still needs identification and an unsubscribe option (s.6(6)).
   - Later chasers rely on implied consent, which lasts **6 months** from the inquiry or **2 years** from a purchase or contract.

   Unsubscribes must be processed within 10 business days, and penalties go up to C$1m (individuals) or C$10m (others) per violation. **[H]**
7. **Australia: consent is needed for any commercial message, including B2B.**
   - Covered channels: email, SMS and instant messages.
   - Consent can be express or inferred.
   - The message must identify the business, by legal name or ABN.
   - It needs a working unsubscribe that doesn't require logging in.
   - A withdrawal takes effect within **5 business days**.

   The penalty unit rose to A$364 on 1 July 2026. In July 2026 the ACMA fined TAB A$2.7m, partly for messaging people who had unsubscribed from specific channels. **[H]**
8. **Philippines: no anti-spam statute, but the Data Privacy Act gives a right to object.**
   - The Cybercrime Act's spam clause was struck down in *Disini* (2014).
   - Bills have been filed since, but I found none enacted.
   - The Data Privacy Act gives an express right to object to direct marketing; after an objection, the controller "shall no longer process" the data (IRR §34(b)).
   - The lawful basis is governed by NPC Circulars 2023-04 (consent; implied consent not allowed) and 2023-07 (legitimate interest).

   The NTC SMS rules, the SIM Registration Act and AFASA (the Anti-Financial Account Scamming Act) could **not** be verified. **[H/M; U where marked]**
9. **Several key areas are UNVERIFIED in this session.** They are summarized from background knowledge only:
   - US texting under the TCPA, and the Florida, Oklahoma and Maryland state versions (FL/OK/MD); CTIA opt-out keywords
   - WhatsApp, Messenger, Instagram, LinkedIn and Viber rules
   - FTC, EU and UK rules on dark patterns

   Examples: the TCPA's 10-business-day revocation rule (effective 11 Apr 2025), quiet hours of 8am–9pm (8am–8pm in FL/OK/MD), WhatsApp's 24-hour window and July 2025 per-message pricing, and Messenger's 7-day HUMAN_AGENT tag.
10. **Recommended core rules:**
    - Suppress the lead permanently, across all channels, on an explicit opt-out or on "not interested".
    - Reopen contact only when the lead starts it, or on fresh consent.
    - Cap unanswered follow-ups.
    - Add a footer that fits the jurisdiction (identity, opt-out line, postal address where required).
    - Guard quiet hours.
    - Allow only truthful content.
    - Minimize the lead data users paste into AI tools.

    See §11–§12.

---

## 2. Q1: US CAN-SPAM Act (15 U.S.C. 7701–7713; 16 CFR Part 316)

### 2.1 Scope: 1:1 emails, low volume, B2B, agents

| Claim | Source and quote | Conf. |
|---|---|---|
| CAN-SPAM applies to every commercial email, including one-to-one and B2B, with no volume threshold. | FTC, *CAN-SPAM Act: A Compliance Guide for Business*, https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business. *(extract)*: "Despite its name, the CAN-SPAM Act doesn't apply just to bulk email. It covers all commercial messages, which the law defines as 'any electronic mail message the primary purpose of which is the commercial advertisement or promotion of a commercial product or service,' including email that promotes content on commercial websites. The law makes no exception for business-to-business email." | H |
| Using someone else to send (e.g., a VA sending for a client) does not shift responsibility; both can be liable. | Same FTC guide *(extract)*: "you can't contract away your legal responsibility to comply with the law. Both the company whose product is promoted in the message and the company that actually sends the message may be held legally responsible." | H |

### 2.2 The "primary purpose" test (16 CFR 316.3)

- **Mixed commercial and "transactional or relationship" (T/R) content (§316.3(a)(2)).** *(extract)* The primary purpose is deemed commercial if "(i) A recipient reasonably interpreting the subject line of the electronic mail message would likely conclude that the message contains the commercial advertisement or promotion of a commercial product or service; or (ii) The electronic mail message's transactional or relationship content does not appear, in whole or in substantial part, at the beginning of the body of the message."
  - Sources: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-316/section-316.3 and https://www.law.cornell.edu/cfr/text/16/316.3
  - **[H]**
- **Commercial plus other non-commercial content (§316.3(a)(3)).** The message is commercial if it fails the subject-line test, or if a recipient "reasonably interpreting the body of the message would likely conclude" its primary purpose is commercial. The factors are placement, proportion, and how color, graphics, type size and style highlight the commercial content.
  - Source: 2005 FTC final rule, https://www.federalregister.gov/documents/2005/01/19/05-974/definitions-and-implementation-under-the-can-spam-act
  - **[M–H]**: read via a paraphrased extract; the list of factors is **[U]**.
- **Commercial content only (§316.3(a)(1)).** Such a message is commercial. **[U]** for the exact wording (background confidence: High).

### 2.3 "Transactional or relationship message" (15 U.S.C. 7702(17))

- **Core test.** *(extract)* A T/R message is one "the primary purpose of which is to facilitate, complete, or confirm a commercial transaction that the recipient has previously agreed to enter into with the sender". The other categories are:
  - warranty, product-recall, or safety or security information
  - account and status information for a subscription, membership, account, loan or other ongoing commercial relationship
  - employment-related information
  - delivery of goods or services, including updates, that the recipient is entitled to under a transaction already agreed

  Sources: https://www.law.cornell.edu/uscode/text/15/7702 and https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7702+edition%3Aprelim%29. **[H]** for "previously agreed to enter into"; **[M]** for the exact wording of the other sub-categories, which is paraphrased.
- **How this applies to Lead Follow-Up Rescue (Analysis).**
  - A follow-up on a quote or proposal that the lead **requested but has not accepted** is not about a transaction the recipient "has previously agreed to enter into". Its purpose is to win the sale, so it is **commercial**.
  - After the client signs, messages that complete or confirm that agreed deal (scheduling, invoices, onboarding) are T/R.
  - Adding upsells to those messages triggers the §316.3 mixed-content test.
  - **[H]** on the text; **[M–H]** on the application. I found no FTC statement on quote follow-ups specifically, but secondary commentary agrees.
- **Consent does not make a message transactional.** If the recipient has given "prior affirmative consent", the only effect is that the "identify as an advertisement" duty is dropped. The opt-out notice and postal address are still required.
  - 15 U.S.C. 7704(a)(5)(A) *(extract)* requires "(i) clear and conspicuous identification that the message is an advertisement or solicitation; (ii) clear and conspicuous notice of the opportunity to decline to receive further commercial electronic mail messages from the sender; and (iii) a valid physical postal address of the sender".
  - §7704(a)(5)(B) *(extract)*: "Subparagraph (A)(i) does not apply to the transmission of a commercial electronic mail message if the recipient has given prior affirmative consent to receipt of the message."
  - Sources: https://codes.findlaw.com/us/title-15-commerce-and-trade/15-usc-sect-7704/ and https://www.law.cornell.edu/uscode/text/15/7704
  - **[H]**
- **Definition of "affirmative consent" (§7702(1)).** Consent given "either in response to a clear and conspicuous request for such consent or at the recipient's own initiative". This matters because a lead's own new request can count as consent. **[U]** (background confidence: High).

### 2.4 The requirements (FTC guide extracts unless noted)

| # | Requirement | Quote / detail | Conf. |
|---|---|---|---|
| 1 | Accurate header information | "Your 'From,' 'To,' 'Reply-To,' and routing information – including the originating domain name and email address – must be accurate and identify the person or business who initiated the message." | H |
| 2 | Subject line not deceptive | "The subject line must accurately reflect the content of the message." Statutory basis: 15 U.S.C. 7704(a)(2). | H (guide); statutory wording U |
| 3 | Identify the message as an ad | "You must disclose clearly and conspicuously that your message is an advertisement." It need not be in the subject line: FTC blog *(extract)*, the Act "doesn't require senders to identify the message as an advertisement in the subject line"; the identification only has to be "clear and conspicuous" (https://www.ftc.gov/business-guidance/blog/2015/08/candid-answers-can-spam-questions). Waived after prior affirmative consent (§7704(a)(5)(B)). | H |
| 4 | Valid physical postal address | "Your message must include your valid physical postal address. This can be your current street address, a post office box you've registered with the U.S. Postal Service, or a private mailbox you've registered with a commercial mail receiving agency established under Postal Service regulations." | H |
| 5 | Opt-out notice and mechanism | The message must give "a clear and conspicuous explanation of how the recipient can opt out of getting email from you in the future", written to be "easy for an ordinary person to recognize, read, and understand". "Give a return email address or another easy Internet-based way to allow people to communicate their choice to you." "Make sure your spam filter doesn't block these opt-out requests." The rule that a menu is allowed only if it includes an "all commercial messages" option is **U** (background: High). | H |
| 6 | Mechanism life and honoring deadline | "Any opt-out mechanism you offer must be able to process opt-out requests for at least 30 days after you send your message. You must honor a recipient's opt-out request within 10 business days." In its 2008 rulemaking the FTC kept the 10-business-day period (https://www.federalregister.gov/documents/2008/05/21/E8-11394/definitions-and-implementation-under-the-can-spam-act). | H / M (2008) |
| 7 | No fee and no extra steps | "You can't charge a fee, require the recipient to give you any personally identifying information beyond an email address, or make the recipient take any step other than sending a reply email or visiting a single page on an Internet website as a condition for honoring an opt-out request." | H |
| 8 | No transfer of opted-out addresses | "Once people have told you they don't want to receive more messages from you, you can't sell or transfer their email addresses, even in the form of a mailing list. The only exception is that you may transfer the addresses to a company you've hired to help you comply with the CAN-SPAM Act." | H |
| 9 | Monitor anyone sending for you | See §2.1. | H |

### 2.5 Is "please remove me" or "stop emailing me" an opt-out that must be honored?

- **Statute.** 15 U.S.C. 7704(a)(3)(A) *(extract)*: a commercial email must contain "a functioning return electronic mail address or other Internet-based mechanism, clearly and conspicuously displayed, that a recipient may use to submit, in a manner specified in the message, a reply electronic mail message or other form of Internet-based communication requesting not to receive future commercial electronic mail messages from that sender at the electronic mail address where the message was received; and remains capable of receiving such messages or communications for no less than 30 days after the transmission of the original message." **[H]**
- **Analysis: the reply is the opt-out.** The statute expressly anticipates opting out by replying. If the drafted email invites a reply to opt out, a reply saying "please remove me" or "stop emailing me" is a request "not to receive future commercial electronic mail messages from that sender". The 10-business-day duty then applies, and the FTC bars requiring anything beyond a reply email. **[H]**
- **Analysis: a different mechanism was specified.** If the email named some other mechanism, the strict statutory duty is tied to "a mechanism provided pursuant to paragraph (3)". Even so, ignoring a clear written request is indefensible, and would add deception and unfairness risk. **[M]**
- **"Not interested."** I found no FTC guidance on whether this is an opt-out request. It says the lead doesn't want the offer, not necessarily that they want the emails to stop. Legally unclear **[U]**. The product should treat it as an opt-out (see §12, rule R2).

### 2.6 Is the opt-out permanent? Can the sender ever email again?

- **Statute.**
  - §7704(a)(4)(A) prohibits sending commercial email "more than 10 business days after the receipt of such request". The FTC guide wording is confirmed; the exact statutory wording is **[U]**.
  - The statute sets **no end date** for the prohibition.
  - §7704(a)(4)(B) *(extract)*: "A prohibition in subparagraph (A) does not apply if there is affirmative consent by the recipient subsequent to the request under subparagraph (A)."
  - Sources: https://www.law.cornell.edu/uscode/text/15/7704 and https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7704+edition%3Aprelim%29
  - **[H]**
- **Conclusion: the opt-out lasts until the lead re-consents.** It does not expire. The only statutory way back to commercial email is later affirmative consent from the recipient: for example, the lead emails asking for information, or clearly agrees to hear from you again. A seller's "new material reason" is not consent. **[H]** on the statutory structure.
  - A secondary source says CAN-SPAM opt-outs "do not expire" (Suped; **[L]** as a source). I found no FTC statement on expiry (**[U]**).
- **Scope.** The opt-out covers commercial email from that sender to that address. Genuinely T/R messages about an agreed transaction (for example, an invoice) remain allowed, because they are not commercial email. **[H]**

### 2.7 Civil penalty as of 2026

- **Current maximum: $53,088 per violating email.** FTC guide *(extract)*: "Each separate email in violation of the CAN-SPAM Act is subject to penalties of up to $53,088." The amount rose from $51,744 on 17 Jan 2025.
  - Sources: https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-publishes-inflation-adjusted-civil-penalty-amounts-2025 and https://www.federalregister.gov/documents/2025/01/17/2025-01361/adjustments-to-civil-penalty-amounts
  - **[H]**
- **What changed in 2026: no increase.** OMB Memorandum **M-26-11** (17 April 2026) cancelled the 2026 inflation adjustment. The October–November 2025 lapse in appropriations meant the Bureau of Labor Statistics never produced October 2025 CPI-U data, which the statute requires, so agencies keep their 2025 amounts. News reports say the FTC confirmed it will keep 2025 levels in a Federal Register notice published 15 Sept 2026.
  - Sources: https://www.whitehouse.gov/wp-content/uploads/2026/04/M-26-11-Cancellation-of-Penalty-Inflation-Adjustments-for-2026-Regarding-the-Federal-Civil-Penalties-Inflation-Adjustment-Act-Improvements-Act-of-2015.pdf ; https://www.federalregister.gov/documents/2026/09/15/2026-18853/civil-penalty-inflation-adjustments ; https://www.inkl.com/news/ftc-freezes-civil-penalty-amounts-for-2026-after-government-shutdown-disrupted-inflation-data
  - **[H]** for the OMB memo; **[M–H]** that the 15 Sept notice is the FTC's.
- **Unverified related points.** CAN-SPAM has no private right of action for recipients (only internet access providers and state attorneys general can sue). It preempts state email laws except their provisions on falsity or deception, such as California B&P 17529.5 on misleading subject lines. **[U]** (background confidence: High / Medium).

---

## 3. Q2: EU GDPR + ePrivacy Directive; UK GDPR + PECR + Data (Use and Access) Act 2025 (DUAA)

### 3.1 The absolute right to object to direct marketing (Art. 21(2)–(3), identical in EU and UK GDPR)

- **Text.**
  - Art. 21(2): "Where personal data are processed for direct marketing purposes, the data subject shall have the right to object at any time to processing of personal data concerning him or her for such marketing, which includes profiling to the extent that it is related to such direct marketing."
  - Art. 21(3): "Where the data subject objects to processing for direct marketing purposes, the personal data shall no longer be processed for such purposes."
  - Sources: https://gdpr-info.eu/art-21-gdpr/ (a mirror of https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)
  - **[H]**
- **ICO: it is absolute.** *(extract)* It is "an absolute right and there are no exemptions or grounds for you to refuse"; when you receive an objection to direct marketing, "you must not process the individual's data for this purpose."
  - Source: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-object/
  - **[H]**
- **What counts as an objection.** ICO *(extract)*: "An individual can make an objection verbally or in writing." An objection can be made to any part of the organisation, and no specific words are needed.
  - Sources: the ICO page above, and https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/respect-peoples-preferences/
  - **[H]**
- **Does "Not interested" count? (Analysis)** Because the ICO says no specific words are needed, a "not interested" or "no" in reply to a sales message is most naturally read as objecting to further marketing. If the meaning is genuinely unclear, the obvious fix is to ask. But asking by email or SMS may itself be marketing (see §3.4), so the safe default is to stop. **[M]**
- **Suppress, don't delete.** ICO *(extract)*:
  - "This does not automatically mean that you need to erase the individual's personal data, and in most cases it will be preferable to suppress their details. Suppression involves retaining just enough information about them to ensure that their preference not to receive direct marketing is respected in future."
  - Also: "you should put their details onto a suppression or 'do not contact' list, instead of deleting them."
  - **[H]**
- **How quickly marketing must stop.**
  - For withdrawn consent, the ICO says *(extract)* you "must stop the direct marketing that the consent covers immediately or as soon as possible".
  - The general deadline for responding to a GDPR rights request is one month (Art. 12(3); **[U]** in this session, background confidence: High).
  - The ICO notes that adopting a fixed 28-day period can keep you within a calendar month. I saw this only in an extract, so its exact context is **[M]**.
  - **Product rule:** stop immediately. **[M–H]**
- **Channel scope (Analysis).** Art. 21 is about processing "for such marketing"; it is not tied to a channel. A general "do not contact me" should be treated as an objection to direct marketing on **all** channels, unless the person clearly limits it (for example, "no calls, email is fine"). **[M]**

### 3.2 Email and SMS marketing rules: B2C vs B2B, and the soft opt-in

**UK (PECR regulations 22 and 23)**

- **Who is protected.** ICO B2B guidance *(extract)*:
  - "Businesses are classed as 'corporate subscribers' under PECR if they are a corporate body with separate legal status (eg companies, limited liability partnerships, Scottish partnerships, and some government bodies)."
  - "sole traders and other types of partnerships are classed as 'individual subscribers' and PECR treats them the same as individuals."
  - "the rule on marketing by electronic mail (eg email or text message) doesn't apply to corporate subscribers."
  - Sole traders and some partnerships can be marketed by electronic mail only "if they have specifically consented, or the 'soft opt-in' applies."
  - Always: "You must not disguise or conceal your identity, and you must provide a valid contact address so they can opt out or unsubscribe."
  - Source: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
  - **[H]**
- **B2B still means GDPR (Analysis).** UK GDPR still applies to a named business contact such as jane.doe@company.com, so the Art. 21 right to object applies in B2B too. **[H]** as analysis; the ICO's exact wording on this is **[U]**.
- **Soft opt-in conditions.** ICO *(extract)*: "You obtained the recipient's contact details. You did so while selling or negotiating to sell a product or service. You are only marketing your similar products and services. You provided the recipient with an opportunity to refuse or opt out when you collected their contact details. You give the recipient an opportunity to refuse or opt out in every subsequent communication."
- **Leads who asked for a quote qualify.** ICO *(extract)*: "A person doesn't need to actually buy anything from you. It's enough if 'negotiations for the sale' took place. This means that they must actively express an interest in buying your products or services. This includes signing up to a free trial of your product or service, requesting a quote or asking for more details about what you offer."
  - Source: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/
  - **[H]**
- **What this means for the product (Analysis).**
  - A UK lead who inquired or asked for a quote can receive email or SMS follow-ups about similar services **without consent**, but only if:
    - an opt-out was offered when their details were collected, **and**
    - every follow-up includes an opt-out.
  - If the user collected the details without offering an opt-out (for example, took a number from a Facebook comment), the soft opt-in is unavailable. The user then needs consent, or the recipient must be a corporate subscriber.
  - **[H]**
- **Social media DMs are covered.** The ICO describes electronic mail as including "emails, texts and direct messages on social media" *(extract, charity soft opt-in news)*. So PECR applies to Instagram, Facebook and LinkedIn DMs as well. **[H]**

**EU (ePrivacy Directive 2002/58/EC, Art. 13, as implemented in each Member State)**

- **Art. 13(2) customer exception.** This applies where contact details were obtained from customers "in the context of the sale of a product or a service". The seller may market its **own similar** products or services, provided the customer can object easily and free of charge both when the details are collected **and** in each message.
  - Source: https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32002L0058
  - **[H]** on substance; I did not retrieve the verbatim text.
- **Unlike the UK, the EU text is narrower.** It speaks of "customers" and a "sale". Whether a bare quote request qualifies varies by Member State. **[M/U]**
- **What changed in 2025: the Inteligo Media ruling.** In CJEU *Inteligo Media*, C-654/23 (13 Nov 2025), the Court held:
  - A **free** user account can be a "sale of a service" under Art. 13(2).
  - A newsletter promoting the site's content is direct marketing.
  - According to commentators, when the Art. 13(2) conditions are met they work as a self-standing legal basis, with no separate GDPR Art. 6 test.
  - Sources: https://curia.europa.eu/juris/liste.jsf?language=en&td=ALL&num=C-654%2F23 ; https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62023CJ0654 ; https://www.taylorwessing.com/en/insights-and-events/insights/2025/11/european-court-of-justice-backs-the-advocate-general ; https://grunecker.de/en/insights/cjeu-expands-possibilities-for-sending-newsletters-without-consent/
  - **[M]**: read only through commentary.
- **B2B varies by country.** Art. 13(5) lets each Member State decide how to protect legal persons.
  - **Germany.** Under §7 UWG, advertising by electronic mail without prior express consent is an unreasonable nuisance whether the recipient is a consumer or a business *(extract)*. There is an existing-customer exception in §7(3). Source: https://www.gesetze-im-internet.de/uwg_2004/__7.html. **[M–H]**
  - **France.** The CNIL says *(extract)* B2B prospecting may rely on legitimate interest where the subject relates to the recipient's profession, provided the person is informed and can object. Source: https://www.cnil.fr/fr/questions-reponses-sur-les-referentiels-relatifs-la-gestion-des-activites-commerciales-et-des. **[M]**
  - **Other states:** not researched. **[U]**
- **The ePrivacy Regulation is dead.** On 11 Feb 2025 the Commission announced, in its 2025 work programme, that it would withdraw the proposed regulation. The 2002 Directive and national laws therefore remain the rules.
  - Sources: https://www.europarl.europa.eu/legislative-train/theme-connected-digital-single-market/file-jd-e-privacy-reform and https://www.hunton.com/privacy-and-information-security-law/european-commission-withdraws-eprivacy-regulation-and-ai-liability-directive-proposals
  - **[H]** for the announcement; the date of the formal withdrawal is **[U]**.

### 3.3 May a lead who inquired receive follow-ups? The ICO's "solicited" vs "unsolicited" distinction; legitimate interests

- **The distinction.** ICO *(extract)*:
  - "Most of the rules in PECR only apply to unsolicited marketing messages, and they do not restrict solicited marketing."
  - "A solicited message is one that is actively requested"; electronic mail marketing "is solicited when someone specifically asks you to send a particular message or type of information, and all other electronic mail marketing is unsolicited."
  - Example: "A person asks you to email them your summer brochure. Sending that brochure is solicited marketing… However, if you email them again about a new offer, they did not ask for that specific email, so it is unsolicited marketing."
  - Sources: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/key-concepts-for-direct-marketing-using-electronic-mail/ and the "How do we comply…" page above.
  - **[H]** on content; **[M]** on which exact ICO page carries the example.
- **How this maps onto follow-ups (Analysis).**
  - Sending the quote the lead asked for is **solicited**.
  - A chaser ("just checking you saw my quote") was not requested, so it is **unsolicited**. It needs the soft opt-in, consent, or a corporate-subscriber recipient.
  - If the lead said "follow up with me in March", a March follow-up is **solicited**.
  - **[M–H]**
- **Legitimate interests (GDPR Art. 6(1)(f)).** EDPB Guidelines 1/2024 (adopted 9 Oct 2024 for consultation) weigh reasonable expectations, for example whether the person is an existing customer and what kind of products are being marketed *(extract)*.
  - Source: https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202401_legitimateinterest_en.pdf
  - **[M]**. Whether a final version was adopted by Sept 2026 is **[U]**.
- **Legitimate interests has limits.** It never overrides the PECR/ePrivacy consent rule for electronic mail, and never survives an Art. 21 objection. **[H]** (Art. 21(3) plus the structure of the rules).

### 3.4 Can the seller re-contact after an objection? No, not even to ask permission

- **ICO hotel example.** *(extract)*: "A hotel sends an email to its previous guests asking them if they would like to consent to receiving its special offers and discounts. Whilst this email doesn't contain any of these discounts or offers, the hotel is still sending it for direct marketing purposes."
  - Source: ICO direct marketing guidance, most likely https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/identify-direct-marketing/
  - **[H]** for the example; **[M]** for the exact page.
- **Flybe and Honda (ICO, March 2017).**
  - Flybe was fined **£70,000** for sending "Are your details correct?" emails, which asked people to update their marketing preferences, to more than 3 million people who had **opted out**.
  - Honda was fined **£13,000** for sending 289,790 "Would you like to hear from Honda?" emails.
  - Both were breaches of PECR regulation 22.
  - Sources: official ICO press release (republished) https://www.wired-gov.net/wg/news.nsf/articles/ICO+warns+UK+firms+to+respect+customers+data+wishes+as+it+fines+Flybe+and+Honda+27032017142000 and https://www.hldataprotection.com/2017/03/articles/international-eu-privacy/ico-issues-fine-for-marketing-emails-disguised-as-service-messages/
  - **[H]**
- **Conclusion.** In the UK and EU there is no lawful way for a seller to start a message, even a "the feature you asked about now exists" note, to someone who objected. Only a lead-initiated (solicited) contact or fresh consent reopens communication. **[H]**

### 3.5 What changed with the Data (Use and Access) Act 2025

- **Higher PECR fines (changed 5 Feb 2026).** PECR enforcement moved onto the Data Protection Act 2018 / UK GDPR regime (DUAA s.115 and Sch. 13).
  - The maximum fine is now **£17.5m or 4% of global annual turnover**, whichever is higher; before, it was £500,000.
  - Breaches that occurred before 5 Feb 2026 stay under the old regime.
  - Sources: ICO commencement statement https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa/ ; ICO summary of the PECR changes https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-duaa-summary-of-the-changes/privacy-and-electronic-communications/ ; the Data (Use and Access) Act 2025 (Commencement No. 6 and Transitional and Saving Provisions) Regulations 2026, SI 2026/82, https://www.legislation.gov.uk/cy/uksi/2026/82/made
  - **[H]**
  - Royal Assent on 19 June 2025 is **[U]** in this session (background confidence: High).
- **Charity soft opt-in (in force 5 Feb 2026).** It applies only to details collected on or after that date; the ICO published final guidance on 28 April 2026. It is irrelevant to commercial users.
  - Source: https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/04/charities-given-new-flexibility-to-contact-supporters-under-data-law-change/
  - **[H]**
- **Complaints procedure.** A new duty for organisations to have one is reported to start on 19 June 2026. **[M]** (ICO extract).

---

## 4. Q3: Canada, CASL (S.C. 2010, c. 23) and its regulations

- **What CASL covers.**
  - An "electronic address" is an email account, an instant-messaging account, a telephone account, or any similar account.
  - Whether a social media account counts as "similar" is decided case by case *(CRTC FAQ extract)*.
  - A commercial electronic message (CEM) sent to such an address needs **(1) consent, (2) identification information, and (3) an unsubscribe mechanism**.
  - Sources: https://crtc.gc.ca/eng/com500/faq500.htm and the Act, https://laws-lois.justice.gc.ca/eng/acts/e-1.6/fulltext.html
  - **[H]**
- **Implied consent through an existing business relationship (s.10(10)).** It exists where, in the relevant period:
  - the recipient bought, leased or bartered something from the sender, accepted a business opportunity, or had a contract with the sender, within **2 years**; or
  - the recipient sent an **inquiry or application** within **6 months**.
  - Source: CRTC implied-consent guidance, https://crtc.gc.ca/eng/com500/guide.htm
  - **[H]**
  - Other forms of implied consent (conspicuous publication and disclosure, s.10(9)(b)–(c)) exist; the details are **[U]**.
- **Express consent.** It is required outside those windows. CRTC rules for requesting it (purpose, identity, statement that it can be withdrawn): **[U]** (background confidence: High).
- **Exemption for replies to a request or inquiry.** Electronic Commerce Protection Regulations (SOR/2013-221), s.3(b): a message "sent in response to a request, inquiry or complaint, or… otherwise solicited by the person to whom the message is sent" is exempt from s.6 **entirely**.
  - CRTC FAQ *(extract)*: "you do not need to comply with section 6 of CASL, meaning you do not need consent, do not need to meet the information requirements, and do not need to add an unsubscribe mechanism."
  - Sources: https://laws-lois.justice.gc.ca/eng/regulations/SOR-2013-221/FullText.html and the CRTC FAQ
  - **[M–H]**: I did not see the regulation's wording directly.
- **Exemption for requested quotes.** s.6(6)(a): a CEM that "provides a quote or estimate for the supply of a product, goods, a service, land or an interest or right in land, if the quote or estimate was requested by the person to whom the message is sent" needs **no consent**, but **must still carry identification and an unsubscribe mechanism**. **[H]**
- **How far the reply exemption stretches (Analysis).** I found no CRTC or ISED text defining its limits.
  - It covers the response or responses that answer the lead's request.
  - Unrequested chasers are not "in response to" a request. They must rely on implied consent (6 months from the inquiry, or 2 years after a purchase or contract) and must include identification and an unsubscribe.
  - **[U]** (no regulator statement found); **[M]** as analysis.
- **Unsubscribe rules.** *(CRTC extracts)*:
  - Process the request "without delay, and no later than 10 business days after receiving it."
  - The unsubscribe mechanism must stay valid "for at least 60 days after you send a CEM."
  - It must be "readily performed": "simple, quick and easy".
  - The mailing address must be valid for at least 60 days.
  - The identification must include a mailing address plus a phone number, email or web address. **[H]**
  - The CRTC Regulations require naming the person on whose behalf the message is sent: **[U]** (background confidence: High).
- **Opting out by other means.** CRTC *(extract)*: "No matter what type of consent you have, if a recipient asks to stop receiving CEMs through your unsubscribe mechanism or by another form of communication, you must respect their request and stop sending them CEMs within 10 business days." **[M]**: the CRTC page carrying this sentence is uncertain (information session or implied-consent guide).
- **After an unsubscribe (Analysis).** Implied consent can no longer be relied on; sending again requires new express consent. **[M]**
- **Penalties.** Administrative monetary penalties of up to **C$1M per violation for individuals** and **C$10M for any other person** *(CRTC)*.
  - Sources: https://crtc.gc.ca/eng/com500/faq500.htm and https://crtc.gc.ca/eng/internet/pub/20260331.htm
  - **[H]**
  - The private right of action was never brought into force: **[U]** (background confidence: High).
- **Related Competition Act rule.** Competition Act ss. 52.01 and 74.011 bar false or misleading sender information, subject lines, or content in electronic messages; this is relevant to fake "Re:" subjects. **[U]** (background confidence: High).

---

## 5. Q4: Australia, Spam Act 2003 and ACMA guidance

- **Coverage.**
  - The Act covers commercial electronic messages: messages that offer, advertise or promote goods, services, land or business opportunities.
  - Channels: email, SMS, MMS and instant messages; voice calls are excluded.
  - Sources: secondary summaries of ss. 5–6. **[M–H]**
  - ACMA *(extract)* says the rules cover "email and SMS". Source: https://www.acma.gov.au/avoid-sending-spam. **[H]**
- **Consent.** It may be express or inferred.
  - ACMA *(extract)*: "you may infer that you have consent to send marketing messages if the recipient has knowingly and directly given their address and it is reasonable to believe they would expect to receive marketing from your business. This is usually when a person has a provable, ongoing relationship with your business, and the marketing is directly related to that relationship."
  - Also: "Inferred consent is not as reliable as getting someone's express consent… it's up to you to prove that you have a person's consent."
  - Sources: https://www.acma.gov.au/avoid-sending-spam and https://www.acma.gov.au/articles/2024-06/consent-expectations-businesses-using-direct-marketing
  - **[H]**
  - **Analysis:** a one-off inquiry is not clearly a "provable, ongoing relationship". For leads, the safer course is express consent, for example "Yes, send me the quote and follow up". **[M]**
- **B2B.** There is no general B2B exemption (**[U]**, background confidence: High). The main B2B route is "conspicuous publication" (Sch. 2 cl. 4).
  - A work address conspicuously published for an employee, director, partner, office-holder or self-employed person, with no statement refusing marketing, is treated as consenting.
  - This covers only messages relevant to that person's work-related business, functions or duties.
  - Source: https://classic.austlii.edu.au/au/legis/cth/consol_act/sa200366/sch2.html
  - **[H]**
- **Identification.** ACMA *(extract)*: "If someone else sends messages on your behalf, the message must still identify you as the business that authorised the message. Use the correct legal name of your business, or your name and Australian Business Number (ABN)." **[H]** This is relevant to VA mode.
- **Unsubscribe.**
  - ACMA *(extract)*: every commercial message must contain an unsubscribe option "that does not require the person to give extra personal information or log in to, or create, an account"; senders "must ensure customers are unsubscribed within 5 business days".
  - The unsubscribe address must be functional for at least 30 days (s.18, secondary source).
  - Withdrawal of consent takes effect at the end of **5 business days** (Sch. 2 cl. 6).
  - Sources: https://www.acma.gov.au/sites/default/files/2024-05/Fact%20sheet%20-%20email%20and%20SMS%20unsubscribe%20rules.pdf and https://classic.austlii.edu.au/au/legis/cth/consol_act/sa200366/s18.html
  - **[H]** / **[M–H]**
  - **Analysis:** cl. 6 treats as a withdrawal any message "to the effect" that the person wants no further messages. A plain-language "stop", or "not interested" in context, likely qualifies. The exact wording is **[U]**; confidence **[M]**.
- **Penalties.** Under s.25, a body corporate with no prior record that commits 2 or more contraventions of the consent rule on one day faces up to **2,000 penalty units** for that day; with a prior record, **10,000** *(extract)*.
  - The penalty unit was A$330 from 7 Nov 2024 to 30 June 2026, and has been **A$364 from 1 July 2026** (Crimes (Amount of a Penalty Unit) Instrument 2026).
  - Sources: http://classic.austlii.edu.au/au/legis/cth/consol_act/sa200366/s25.html and https://www.legislation.gov.au/F2026N00424/asmade/2026-06-16/text/original/pdf
  - **[M–H]**
- **Recent enforcement, 2025–2026.**
  - Telstra (March 2025)
  - Lululemon, **A$702,900** (March 2026), for 370,000+ emails with no unsubscribe
  - Latitude Finance, **A$3.96m** (April 2026)
  - TAB, **A$2.7m** (July 2026). This included 217,000+ emails and SMS sent over 16 days to customers "who had unsubscribed from specific marketing channels".
  - Sources: https://www.acma.gov.au/articles/2025-03/telstra-penalised-spam-breaches ; https://www.acma.gov.au/articles/2026-03/lululemon-penalised-702k-spam-breaches ; https://www.acma.gov.au/articles/2026-04/latitude-finance-pays-396m-more-spam-breaches ; https://www.acma.gov.au/articles/2026-07/tab-pays-27m-telemarketing-and-spam-breaches
  - **[H]**
  - **Lesson from TAB:** an opt-out from one channel must at least be honored on that channel; cross-channel suppression is the safer design.

---

## 6. Q5: Philippines

### 6.1 Verified

- **Right to object to direct marketing (Data Privacy Act IRR §34(b)).** *(extract)*:
  - "The data subject shall have the right to object to the processing of his or her personal data, including processing for direct marketing, automated processing or profiling."
  - "When a data subject objects or withholds consent, the personal information controller shall no longer process the personal data, unless: a) The personal data is needed pursuant to a subpoena; b) The collection and processing are for obvious purposes, including, when it is necessary for the performance of or in relation to a contract or service to which the data subject is a party…; or c) The information is being collected and processed as a result of a legal obligation."
  - Sources: https://privacy.gov.ph/wp-content/uploads/2016/08/10173-IRR-25-Aug-2016.pdf and the amended IRR, https://privacy.gov.ph/wp-content/uploads/2023/06/IRR_RA-10173-as-amended.pdf
  - **[H]**
  - **Analysis:** none of the exceptions covers sales follow-ups, so an objection means stop marketing, with no expiry. **[H]**
- **NPC Circular No. 2023-04 (Guidelines on Consent).** Issued 7 Nov 2023; effective 29 Nov 2023.
  - Consent requires a clear assenting action; inaction or implied consent is **not** allowed; consent must be documented.
  - Direct marketing limited to ordinary (non-sensitive) personal information may rely on legitimate interest, decided case by case.
  - Consent is required where direct marketing significantly affects rights: profiling or tracking-based marketing, behavioral ads, data brokering, location-based advertising.
  - Sources: https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf and https://www.dataguidance.com/opinion/philippines-npc-releases-guidelines-consent-part-0
  - **[H]** for the dates and the no-implied-consent rule; **[M]** for the direct-marketing specifics, which come from summaries.
- **NPC Circular No. 2023-07 (Legitimate Interest).** Effective 14 Jan 2024. A documented legitimate interest assessment (LIA) is required, with a 90-day compliance window to 13 Apr 2024.
  - Source: https://insightplus.bakermckenzie.com/bm/data-technology/philippines-national-privacy-commission-issues-guidelines-on-the-processing-of-personal-information-based-on-legitimate-interest
  - **[M–H]**
- **No anti-spam statute.**
  - Section 4(c)(3) of the Cybercrime Prevention Act (RA 10175), which dealt with "unsolicited commercial communications", was declared **unconstitutional** in *Disini v. Secretary of Justice*, G.R. No. 203335 (February 2014). Source: https://globalfreedomofexpression.columbia.edu/cases/disini-v-the-secretary-of-justice/. **[H]**
  - NPC Advisory Opinion 2020-041 notes that the NPC abides by that ruling. Source: https://privacy.gov.ph/wp-content/uploads/2020/11/Redacted-Advisory-Opinion-No.-2020-041.pdf. **[M]**
- **Bills filed, none enacted.**
  - Senate Bill 2460 (18th Congress), the "Anti-Spam Act of 2021" by Sen. Villanueva, proposed an opt-in mechanism and prior explicit consent for promotional calls and texts. Source: https://legacy.senate.gov.ph/lisdata/3673933113!.pdf
  - House proposals called for a "no call, no text, no e-mail" registry. Source: https://www.pna.gov.ph/articles/1149528
  - Senate subject index: https://issuances-library.senate.gov.ph/subject/anti-spam
  - **No enacted anti-spam law was found as of Sept 2026. [M]** (absence of evidence). The status of 20th Congress (2025–2028) bills is **[U]**.
- **NPC on unsolicited texts.** In Sept 2022 the NPC issued a statement on unsolicited texts containing users' names and held a meeting with telcos on 1 Sept 2022.
  - Source: https://www.privacy.gov.ph/2022/09/statement-of-privacy-commissioner-john-henry-naga-on-unsolicited-text-messages-containing-users-names/
  - **[M]**
- **NPC Advisory No. 2023-01 on deceptive design patterns exists** (verified from a title only).
  - Source: https://val.law/npc-advisory-no-2023-01-guidelines-on-deceptive-design-patterns-and-its-relation-to-the-internet-transactions-act/
  - **[M]** for existence; its content is **[U]**.

### 6.2 UNVERIFIED (background knowledge only; not checked in this session)

- **RA 10173 s.16 data-subject rights.** The rights to be informed, to object, to access, to rectification, to erasure or blocking, and to damages, plus data portability (s.18). **[U]** (background confidence: High)
- **Extraterritorial reach (ss. 4 and 6)** over processing connected to the Philippines. The practical effect is that a Philippines-based VA or freelancer is a personal information controller (PIC) or processor (PIP) for all leads, wherever the leads are. **[U]** (background: Medium)
- **Responsibility for data given to others (s.14 subcontracting; s.21 accountability).** The PIC stays responsible for personal information transferred to third parties for processing, in the Philippines or abroad. This is relevant to pasting leads into AI tools. **[U]** (background: High)
- **Penalties.**
  - Criminal penalties, for example: unauthorized processing (s.25), 1–3 years and PHP 500k–2m for ordinary personal information, 3–6 years and PHP 500k–4m for sensitive information; processing for unauthorized purposes (s.28).
  - NPC administrative fines under NPC Circular 2022-01, reportedly calculated as a percentage of annual gross income, with caps.
  - **[U]** (background: Medium; the figures must be checked)
- **NTC Memorandum Circular No. 03-03-2009 (broadcast messaging).** It governs broadcast and push SMS by content providers and telcos: opt-in and opt-out (e.g., "STOP" keywords) and sending restrictions. The details (hours, frequency caps, keywords) are **[U]** (background: Low–Medium). It targets application-to-person (A2P) broadcast messaging, not manual person-to-person (P2P) texts.
- **SIM Registration Act, RA 11934 (signed Oct 2022).** SIMs must be registered; false registration and spoofing are penalized. Relevance: users send from registered SIMs; the Act does not regulate marketing content. **[U]** (background: High)
- **Anti-Financial Account Scamming Act (AFASA), RA 12010 (July 2024).** It criminalizes money-mule activity, social-engineering schemes and account takeover. Relevance: never draft messages that mimic bank notices or verification requests, or that ask for credentials. **[U]** (background: High)
- **Telcos block SMS containing links (2022–2023 onward).** Practical consequence: avoid URLs in Philippine SMS. **[U]** (background: Medium)
- **Other rules on deceptive practices.** The Consumer Act (RA 7394) and the Internet Transactions Act (RA 11967, 2023). **[U]**
- **NPC Advisory 2024-04 on AI systems processing personal data (reported Dec 2024).** **[U]** (background: Medium)

---

## 7. Q6: US texting and calls (TCPA, 47 U.S.C. 227; 47 CFR 64.1200) — ALL UNVERIFIED IN THIS SESSION

> Everything in this section is from background knowledge (to about mid-2026). None of it was checked against a source in this session, and all of it must be verified before use. Where to check: FCC rules at https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L ; FCC orders at https://www.fcc.gov ; the state statutes; the CTIA Messaging Principles.

| Topic | Background understanding | Background conf. |
|---|---|---|
| Texts are "calls" | FCC has treated them so since 2003; *Campbell-Ewald v. Gomez*, 577 U.S. 153 (2016). | High |
| Consent for marketing texts | Marketing calls or texts made with an autodialer (ATDS) or an artificial/prerecorded voice to a wireless number need **prior express written consent** (64.1200(a)(2); definition at (f)(9)). | High |
| Manual 1:1 texts from a personal phone | After *Facebook v. Duguid*, 592 U.S. 395 (1 Apr 2021), an ATDS must be able to store or produce numbers "using a random or sequential number generator". A genuinely manual text is generally **not** an ATDS call, so the (a)(1)/(a)(2) consent rules usually don't bite. **But** the Do-Not-Call (DNC) rules in 64.1200(c)–(d) apply to "telephone solicitations" and telemarketing calls **including texts**, whatever technology is used. The Dec 2023 FCC order codified that DNC protections cover texts (64.1200(e)). | High / Medium on the 2023 codification |
| National DNC Registry | No telephone solicitation to a residential or wireless number on the Registry unless there is (i) an **established business relationship (EBR)**, (ii) prior express invitation or permission evidenced by a signed written agreement, or (iii) the caller is a nonprofit. | High |
| EBR windows | Purchase or transaction within **18 months**; inquiry or application within **3 months**. A seller-specific DNC request **terminates** the EBR (64.1200(f)(5)(i)). | High |
| Company-specific DNC | A written policy is required; requests are recorded; the caller must identify itself (name, business, phone or address); requests are honored within a reasonable time **not exceeding 10 business days** (cut from 30 days by the 2024 order); the rule text says requests are honored for **5 years**. | Medium–High (5-year point: Medium) |
| Quiet hours | No telephone solicitation before **8 a.m.** or after **9 p.m.**, local time at the called party's location (64.1200(c)(1)). There was a wave of 2024–25 class actions over texts sent in quiet hours; there are pending questions about whether consent removes quiet-hours liability (petitions to the FCC). | High (rule) / Medium (litigation status) |
| Revoking consent (FCC 24-24, adopted Feb 2024; **effective 11 Apr 2025**) | Consent can be revoked by **any reasonable means**. Replying "stop, quit, end, revoke, opt out, cancel, unsubscribe" is per se reasonable. Revocation must be honored within a reasonable time **≤10 business days**. One confirmation text is allowed within 5 minutes, with no marketing. The "revoke-all" provision (a revocation covers all robocalls/robotexts, including on unrelated subjects) was **postponed to 11 Apr 2026**, and I believe it was postponed again in 2026 (to about Jan 2027). **Check the current status.** | High (core) / Low–Medium (latest postponement) |
| "One-to-one consent" rule | Adopted by the FCC in Dec 2023 (a single seller per consent; "logically and topically associated" calls), effective 27 Jan 2025. **Vacated** by the 11th Circuit in *Insurance Marketing Coalition v. FCC* (24 Jan 2025); the FCC then removed it. | High (vacatur) / Medium (removal) |
| Deference to the FCC | *McLaughlin Chiropractic v. McKesson* (US Supreme Court, 20 June 2025): district courts are not bound by the FCC's interpretations of the TCPA. This makes FCC safe harbors less reliable. | Medium–High |
| Damages | $500 per violation, trebled to $1,500 if willful or knowing (227(b)(3), (c)(5)). There is a private right of action, which is the main risk. | High |
| Florida FTSA (Fla. Stat. 501.059; amended 2021 and 2023) | Sales calls or texts before 8 a.m. or after **8 p.m.** local time are prohibited, as are more than **3** calls or texts per **24 h** on the same subject. Prior express written consent is required when an "automated system for the selection **and** dialing" is used (narrowed in 2023). For texts, the 2023 amendment added a **15-day cure** period after a "STOP" reply before suit. | Medium–High |
| Oklahoma (Telephone Solicitation Act of 2022, 15 O.S. §775C) | Modeled on the pre-2023 FTSA: 8 a.m.–8 p.m., 3 per 24 h, consent for automated systems, private right of action. | Medium |
| Maryland (Stop the Spam Calls Act of 2023; effective 1 Jan 2024) | Similar: 8 a.m.–8 p.m., 3 per 24 h, consent for automated systems. | Medium |
| Other states | **Texas** SB 140 (2025, effective 1 Sep 2025) extends the telephone-solicitation rules to texts and adds private-action exposure. **Virginia** (2025 amendment, effective 1 Jan 2026) says a "STOP" reply bars further texts for up to 10 years. **Connecticut** (2023): 9 a.m.–8 p.m. **Washington** has its own commercial-text statute (RCW 19.190.060) and telephone-solicitation hours. | Low–Medium |
| CTIA keywords | The CTIA Messaging Principles and Best Practices (2023) expect A2P programs to honor STOP, QUIT, END, CANCEL, UNSUBSCRIBE and similar words (FCC list: plus REVOKE and OPT OUT). They apply to carrier-registered A2P/10DLC traffic, not to manual P2P texts, but they are a useful keyword baseline. | Medium |

**Net for a manual 1:1 sales text (background analysis, UNVERIFIED):**
- The lead inquired within the last 3 months (or bought within 18 months), and has not said stop: a text is generally permissible even if the number is on the National DNC Registry.
- Respect the **8am–9pm** window (8am–8pm in FL/OK/MD) and the 3-per-24-hours limit in those states.
- Honor any "stop"-type reply within 10 business days (the product should say "immediately").
- Identify the sender and business.
- Once the lead says stop, the EBR ends and texting must stop.

---

## 8. Q7: Messaging platform rules (contracts, not law) — ALL UNVERIFIED IN THIS SESSION

> Everything in this section is from background knowledge. **Verify it against:** the WhatsApp Business Messaging Policy and WhatsApp Business Terms; Meta for Developers docs (WhatsApp Cloud API pricing and messaging windows; Messenger Platform policy and message tags; Instagram Messaging API); LinkedIn's User Agreement §8 and Professional Community Policies; Rakuten Viber's business-messaging terms.

| Platform | Rule (background) | Applies to | Background conf. |
|---|---|---|---|
| **WhatsApp Business Platform (Cloud API)** | Customer-service window: **24 h** after the user's last message. Inside it, free-form messages are allowed; outside it, only **pre-approved template** messages (marketing, utility or authentication). | API only | High |
| | **Pricing changed on 1 July 2025**, from conversation-based to **per-message pricing**: each delivered template is charged by category. Service (non-template) replies are free, and **utility templates sent inside an open service window are free**. | API only | Medium–High |
| | Marketing templates are subject to per-user frequency limits. Delivery of marketing templates to **US (+1) numbers** has been paused since about 1 Apr 2025. | API only | Medium |
| **WhatsApp Business Messaging Policy** | You may contact people only if (a) they gave you their number **and** (b) you received **opt-in** permission to message them on WhatsApp, stating your business name. You must "respect all requests (either on or off WhatsApp)" to block, discontinue or opt out. No spam, and no unsolicited bulk messaging. | I believe it covers both the Business **App** and the Platform (Medium). Account quality and bans are driven by user blocks and reports. | Medium |
| **WhatsApp Business App** (small-business phone app) | No 24 h/template mechanics: you can message any contact at any time. But the Business Messaging Policy, the Terms, and anti-spam enforcement (bans after blocks or reports) apply. Broadcast lists reach only contacts who saved your number. Meta was reported (Oct 2025) to be testing caps on messages to people who don't reply, for both users and businesses. | Manual app | Medium / Low (the caps) |
| **Messenger Platform** | Standard messaging window of **24 h** after the user's last interaction, during which any content, including promotions, may be sent. Outside it, only **message tags**: `HUMAN_AGENT` (a human reply within **7 days**), `CONFIRMED_EVENT_UPDATE`, `POST_PURCHASE_UPDATE`, `ACCOUNT_UPDATE`. **Tags may not carry promotional content.** Promotional messages outside the window require the **Marketing Messages** opt-in product (formerly "recurring notifications"). Meta has been consolidating and deprecating some tags; check the current list. | API, **and** Page inboxes (Meta Business Suite enforces the 24 h / 7-day limits on manual Page replies) | Medium–High / Medium (Page inbox, deprecations) |
| **Instagram messaging** (professional accounts via API/inbox) | 24 h standard window; `HUMAN_AGENT` for 7 days; private replies to comments allowed within 7 days. The Community Guidelines' anti-spam rule (my recollection): don't "repeatedly contact people for commercial purposes without their consent". | API/inbox; the guideline applies to all accounts, including manual use | Medium |
| **LinkedIn** | The User Agreement §8.2 "Don'ts" bar spam and the use of bots or automation to send messages. The Professional Community Policies bar "untargeted, irrelevant, obviously unwanted, unauthorized, inappropriately commercial or promotional, or gratuitously repetitive messages". There are limits on InMail and connection requests. | **All** use, including manual | Medium |
| **Viber** | Viber Business Messages go through authorized partners and require the user's **opt-in** for promotional messages; users can block. Consumer-app Terms prohibit spam. | Business Messages (A2P) vs consumer app | Low–Medium |

**Implication (background):**
- The 24-hour windows and template rules are **API / business-inbox** concepts.
- Opt-in, respecting opt-outs, and anti-spam rules apply to **manual use of consumer apps** too.
- In consumer apps the practical risk is being blocked or reported, which leads to restrictions or bans.

---

## 9. Q8: Manipulative tactics (fake urgency, fake scarcity, guilt, fabricated facts)

**Verified**
- **CAN-SPAM, subject lines and headers.** The FTC guide says "The subject line must accurately reflect the content of the message"; header and "From" information "must be accurate and identify the person or business who initiated the message" (§2.4). **[H]**
- **Analysis: fake "Re:" or "Fwd:" on a first email.** A subject line that implies an earlier conversation or forwarded thread that never existed misstates a fact about the message. It is high-risk under 15 U.S.C. 7704(a)(2) and the FTC guide. I found no FTC case specifically on fake "Re:" (**[U]**); **[M–H]** as analysis.
  - The same logic applies to misleading "From" display names (for example, impersonating a mutual contact).

**UNVERIFIED (background knowledge; verify before use)**
- **FTC Act §5** (15 U.S.C. 45(a)): unfair or deceptive acts or practices are unlawful. The FTC staff report *Bringing Dark Patterns to Light* (Sept 2022) catalogs **false scarcity**, **false urgency** (for example, fake countdowns), **confirmshaming** and nagging as deceptive or unfair design practices. The FTC's rule banning **fake reviews and testimonials** (16 CFR Part 465) took effect 21 Oct 2024. (background: High / High / Medium–High)
- **EU Unfair Commercial Practices Directive 2005/29/EC, Annex I** (practices banned in all circumstances):
  - **Point 7:** "Falsely stating that a product will only be available for a very limited time, or that it will only be available on particular terms for a very limited time, in order to elicit an immediate decision and deprive consumers of sufficient opportunity or time to make an informed choice."
  - **Point 26:** "Making persistent and unwanted solicitations by telephone, fax, e-mail or other remote media…". This is the rule most directly relevant to repeated follow-ups (B2C).
  - Arts. 8–9 (aggressive practices: harassment, undue influence, persistence) also apply.
  - (background: High on the text)
- **EU Digital Fairness Act.**
  - The Commission's Digital Fairness Fitness Check was published in Oct 2024, and the public consultation ran from July to Oct 2025.
  - A proposal targeting dark patterns, addictive design and unfair personalization was expected around **Q3–Q4 2026**.
  - **Whether it had been proposed by 24 Sept 2026 could not be verified.** (background: Medium)
- **UK Digital Markets, Competition and Consumers Act 2024.**
  - The unfair commercial practices regime (Part 4, Chapter 1) has applied since **6 April 2025**, and the CMA can directly impose fines of up to 10% of global turnover.
  - **Schedule 20** lists practices banned in all circumstances, including false limited-time claims, persistent and unwanted solicitations, and fake reviews.
  - (background: High on commencement; Medium on Schedule 20 numbering)
- **Other jurisdictions.**
  - Canada: Competition Act ss. 52, 74.01, 74.011 (misleading electronic messages).
  - Australia: Australian Consumer Law ss. 18, 29.
  - Philippines: Consumer Act (RA 7394) and NPC Advisory 2023-01 (deceptive design).
  - (background: High / High / Medium)
- **Breakup emails.** I found no regulator guidance specific to "breakup" emails (absence not verified). A breakup email is fine if it is **true** ("I'll close your file"), is **not** guilt-tripping or confirmshaming, and is **actually followed by silence**. A "last chance" claim that isn't true falls under UCPD Annex I point 7 and the FTC false-urgency concerns.

---

## 10. Q9: Synthesis

### (a) Must an explicit opt-out be permanent suppression? Per channel or across all? What reopens contact?

**Yes, treat it as permanent for commercial or sales outreach.**

| Regime | Rule | Scope | What reopens contact |
|---|---|---|---|
| US email (CAN-SPAM) | No commercial email after 10 business days; no expiry; no transfer. **[H]** | That sender, that address (email only). | Only "affirmative consent by the recipient subsequent to the request" (§7704(a)(4)(B)). **[H]** |
| US text/calls (TCPA) | Company-specific DNC request; honored ≤10 business days; recorded; ends the EBR. **[U]** | Telemarketing calls and texts to that number. | New express consent **[U]** |
| UK / EU GDPR | "shall no longer be processed for such purposes"; absolute; suppression list. **[H]** | Direct marketing in general, all channels, unless limited. **[M]** | A new lead-initiated (solicited) request, or fresh consent. **[H]** Asking permission is itself marketing (Flybe/Honda). **[H]** |
| Canada (CASL) | Stop within 10 business days; implied consent is gone. **[M–H]** | CEMs to that person's electronic addresses (analysis: treat as all). **[M]** | Express consent; or a reply to a new inquiry (ECPR s.3(b)). **[M–H]** |
| Australia | Withdrawal effective after 5 business days; TAB shows channel opt-outs must be honored. **[H]** | At least that channel; all channels is safer. **[M]** | Fresh consent. **[M–H]** |
| Philippines (DPA) | The personal information controller "shall no longer process" for direct marketing. **[H]** | Processing for direct marketing (all channels). | New consent, or a new request from the data subject. **[M]** |
| Platforms | WhatsApp: respect opt-outs "on or off WhatsApp". **[U]** | Platform | The user messages you again (which opens the window). **[U]** |

**Answer for the spec.** A **new inbound interaction initiated by the lead** can reopen contact, but only for what the lead asked about; the old sequence must not restart. A **"legitimate new signal" from the seller's side** (a new feature, new pricing, a website visit or email open, a LinkedIn profile view) **does not** reopen contact after an opt-out in any of these jurisdictions.

### (b) Is "No." or "Not interested" legally an opt-out, or just good practice?

- **UK / EU: legally an objection in most contexts.** The ICO says no specific words are needed; objections can be verbal or written; the right is absolute. **[M–H]**
- **Canada: likely a withdrawal.** The CRTC recognizes opt-outs "by another form of communication". **[M]**
- **Australia: likely a withdrawal** if it is "to the effect" of not wanting further messages. **[M]**
- **Philippines: likely an objection under IRR §34(b).** The formality needed is **[U]**. **[M]**
- **US email: legally unclear.** It is not clearly a request "not to receive future commercial electronic mail messages"; no FTC guidance was found. **[U]** Treat it as an opt-out: the risk of not doing so outweighs the cost of losing the lead.
- **US text: likely a revocation under the FCC's "any reasonable means" standard.** **[U]**
- **Context matters for a bare "No."**
  - "No." in answer to "Would you like me to keep you posted?", or to a proposal or offer, is an objection.
  - "No." in answer to a factual question ("Did the file come through?") is not.
  - If unclear, **stop and do not ask by message** (see §3.4).

### (c) May a seller-initiated "new material reason" message go to…

| Lead state | Answer | Why |
|---|---|---|
| **Opted out** ("stop", "remove me", "do not contact") | **No, in every jurisdiction and channel.** | CAN-SPAM §7704(a)(4); GDPR Art. 21(3); ICO (Flybe/Honda, hotel example); CASL withdrawal; Spam Act Sch. 2 cl. 6; DPA IRR §34(b). **[H]** |
| **Said "not interested" / "no" to the offer** | **No** (treat as an opt-out). | Objection in UK/EU/Philippines; likely withdrawal in Canada/Australia; unclear but high-risk in US email; likely revocation for US texts. **[M–H]** |
| **Never replied to 4+ follow-ups** | **At most one message, and only if a lawful basis still exists for that jurisdiction and channel**, the reason is true and specific, and the message carries an opt-out. Then close. | Silence is not an objection. But: UK: needs soft opt-in or consent, or a corporate subscriber. EU B2C: consent or the Art. 13(2) customer exception; Germany: consent even for B2B. Canada: implied consent lasts only 6 months from the inquiry (2 years after a purchase or contract). US email: allowed if CAN-SPAM compliant. US text: the 3-month EBR if the number is on the DNC Registry **[U]**. Australia: express or inferred consent is needed and inferred consent is weak for one-off inquiries. Also the "persistent and unwanted solicitations" ban (UCPD Annex I point 26; DMCC Sch. 20) **[U]**. Platforms: WhatsApp and Messenger API windows usually mean it can't be free-form **[U]**. |
| **Said "not right now" with no timeframe** | **Stop the chase.** One later check-in is permissible only on the same conditions as the row above. If the lead gave a time ("try me in March"), a follow-up at that time is solicited. | "Not right now" defers; it is not an Art. 21 objection (analysis, **[M]**). A follow-up the lead asked for is solicited (ICO definition, **[H]**). |

### (d) Minimum elements in a drafted 1:1 message, and whether "If you'd rather I not follow up, just let me know" is adequate

**US commercial email (CAN-SPAM)**

- **Required elements:**
  - accurate From and Reply-To (the user's real address)
  - a truthful subject line (never a fake "Re:" or "Fwd:")
  - a clear and conspicuous opt-out notice, with a monitored reply address that works for ≥30 days
  - a **valid physical postal address**, which may be a USPS-registered PO box or a commercial mail receiving agency (CMRA) private mailbox
  - clear identification as an ad or solicitation, **unless** the lead gave prior affirmative consent

  **[H]**
- **The ad disclosure in a 1:1 email (Analysis).** An email that openly says it is a sales follow-up about the user's proposal may meet the "clear and conspicuous identification" requirement through its own content. I found no FTC guidance on 1:1 messages (**[U]**). A short explicit line is safer.
- **Is "If you'd rather I not follow up, just let me know" adequate? Partly.**
  - It does specify a reply-based mechanism, which the statute expressly allows ("a reply electronic mail message").
  - But its scope is narrower than the statute. "Not follow up" can be read as this thread only, whereas the notice must cover "further commercial electronic mail messages **from the sender**".
  - It may also not be "clear and conspicuous" if it is buried.
  - **[M]**
- **Recommended wording:** "If you'd prefer not to hear from me again, just reply 'stop' and I won't email you further." Keep it visible, not in tiny grey text, and put it near the postal address in the signature.

**Other jurisdictions and channels**

| Jurisdiction / channel | Minimum elements | Conf. |
|---|---|---|
| UK | Don't disguise identity; give a valid contact address for opt-outs; include an opt-out in **every** message sent under the soft opt-in. Corporate subscribers: identity and contact address. | H |
| EU | Identity, a valid address, and an opt-out in every message under Art. 13(2); national rules (e.g., Germany: consent) come first. | H / M |
| Canada (any CEM not exempt under s.3(b), including s.6(6) quote messages) | Sender name and the person on whose behalf it is sent; mailing address plus phone, email or web address; an unsubscribe that is "readily performed" and valid 60 days. Replying "stop" to the same email is a plausible mechanism **[U]**. | H / U |
| Australia | The authorising business's legal name or name + ABN, and how to contact it; a functional unsubscribe with no log-in or extra details. | H |
| US SMS | Identify the sender and business; "Reply STOP to opt out" (best practice for P2P; expected for A2P). | U |
| Philippines | Identify the sender and business; honor objections; avoid links in SMS. | U / M |

### (e) Timing constraints the tool should mention

**Honoring opt-outs.** The product rule is **immediately (same day)**. Legal outer limits:

| Regime | Outer limit | Conf. |
|---|---|---|
| Australia | 5 business days | H |
| US email | 10 business days | H |
| Canada | 10 business days | H |
| US texts (TCPA) | 10 business days | U |
| UK withdrawal of consent | "immediately or as soon as possible" | H |
| GDPR rights requests generally | one month | U |

**Quiet hours** (texts, calls, DMs):

| Rule | Hours | Conf. |
|---|---|---|
| US federal (TCPA) | 8am–9pm recipient local time | U |
| Florida, Oklahoma, Maryland | 8am–8pm, plus a 3-per-24-hour limit on the same subject | U |
| Connecticut | 9am–8pm | U |
| Australia, telemarketing calls (not SMS) | restricted calling hours under the industry standard | U |

A safe default across all of these is **8am–8pm recipient local time, weekdays preferred, and at most 1 message per lead per day**.

**Windows for having a lawful basis:**

| Basis | Window | Conf. |
|---|---|---|
| Canada implied consent after an inquiry | 6 months | H |
| Canada implied consent after a purchase or contract | 2 years | H |
| US TCPA EBR (relevant if the number is on the DNC Registry) | 3 months after an inquiry; 18 months after a purchase | U |

**Platform windows:**

| Platform | Window | Conf. |
|---|---|---|
| WhatsApp API | 24 h customer-service window | U |
| Messenger and Instagram | 24 h, plus HUMAN_AGENT for 7 days (no promotions) | U |

**Business days:** count them in the **recipient's** jurisdiction (weekends and public holidays excluded). The drafting tool should warn when a follow-up would land on a weekend or holiday.

### (f) Privacy of pasting leads' personal data into third-party AI chatbots

- **GDPR / UK GDPR** (article-level points are background knowledge, High confidence, **[U]** in this session):
  - The user (business, freelancer, or the VA's client) is the **controller**.
  - Pasting a lead's name, contact details and messages into an AI tool is processing, and a disclosure to the AI provider.
  - Duties that follow:
    - a lawful basis (Art. 6; legitimate interests is arguable for drafting a reply)
    - transparency (Arts. 13–14: the privacy notice should mention AI and service providers)
    - a **processor contract** (Art. 28), which is available on business/API tiers but usually not on consumer tiers, where the provider may act as a separate controller and use the data for training
    - an **international transfer mechanism** (Chapter V: an adequacy decision or the EU-US Data Privacy Framework, or standard contractual clauses)
    - **data minimisation** (Art. 5(1)(c))
    - security (Art. 32)
- **Philippines DPA** (**[U]**, background confidence: High):
  - The user is a **personal information controller (PIC)**. If the user is a VA acting for a client, the VA is a **processor (PIP)** and the client is the PIC.
  - The general principles of transparency, legitimate purpose and proportionality apply (s.11).
  - The PIC remains accountable for data transferred to processors or third parties, in the Philippines or abroad (ss. 14, 21).
  - The NPC's reported AI advisory (2024-04) should be checked.
- **Recommended data-minimisation practice:**
  - Default to placeholders ([LEAD_FIRST_NAME], [COMPANY]).
  - Strip phone numbers, email addresses, street addresses and ID numbers.
  - Never paste sensitive personal information (health, finances, government IDs, minors).
  - Paste a short summary of the thread rather than a full chat export.
  - Use AI accounts with no-training settings and a data processing agreement (DPA).
  - Keep no lead data in the product's own logs unless needed.
  - Tell users to mention AI-assisted drafting in their own privacy notice.

---

## 11. Implications table: what the decision engine must enforce, by jurisdiction and channel

Legend: H/M = confidence; **U** = UNVERIFIED in this session.

| Jurisdiction / channel | Explicit opt-out ("stop", "remove me", "do not contact me") | "No." / "Not interested" (reply to sales content) | Legal deadline to honor (product rule: immediately) | Seller re-contact after an opt-out? | Lawful basis to follow up an inquirer, and its expiry | Mandatory elements in each drafted message | Timing guard |
|---|---|---|---|---|---|---|---|
| **US – email** (CAN-SPAM) | Permanent suppression of that address for all commercial email; no transfer (H) | Legally unclear; **treat as opt-out** (policy) | ≤10 business days; mechanism live ≥30 days (H) | **No**, only after later affirmative consent (H) | No consent needed, but full CAN-SPAM compliance (H) | Accurate From/Reply-To; truthful subject (no fake "Re:"); ad/solicitation ID unless affirmative consent; opt-out notice + reply mechanism; physical postal address (H) | None statutory |
| **US – SMS/calls** (TCPA + states) | Add to company DNC; honor; this ends the EBR (U) | Treat as revocation (U) | ≤10 business days (U) | **No** (U) | Manual text: DNC rules apply; OK if EBR (3 months after inquiry / 18 months after purchase) or not on the Registry; autodialed marketing needs prior express written consent; FL/OK/MD consent rules for automated systems (U) | Identify sender and business; "Reply STOP to opt out" (U) | 8am–9pm local (TCPA); 8am–8pm and ≤3/24 h same subject (FL/OK/MD); 9am–8pm (CT) (U) |
| **UK** (UK GDPR + PECR) | Absolute; suppress (don't delete); all direct-marketing channels (H/M) | Objection; no specific words needed (M–H) | Immediately / ASAP (H); one month outer (U) | **No**, even a "may we contact you?" message (H) | Solicited = OK; unsolicited needs the soft opt-in (quote request qualifies; opt-out at collection **and** each message) or consent; corporate subscribers are outside the consent rule; sole traders count as individuals (H) | Undisguised identity; valid contact address; opt-out line in every message (H) | None statutory for email/SMS (U) |
| **EU** (GDPR + ePrivacy + national law) | As UK (H) | As UK (M–H) | Without undue delay; ≤1 month (U) | **No** (H) | B2C: consent, or the Art. 13(2) customer exception (similar products; opt-out every message; national scope varies). B2B: Germany needs prior express consent (M–H); France allows B2B on legitimate interest if tied to the profession (M); others U | Identity, valid address, opt-out (H/M) | National (U) |
| **Canada** (CASL) | Stop all CEMs to the person; implied consent gone; new express consent needed (M) | Treat as withdrawal ("another form of communication") (M) | ≤10 business days; unsubscribe valid 60 days (H) | **No** (M–H) | Reply to the inquiry is exempt (s.3(b)); the requested quote needs no consent (s.6(6)) but needs ID + unsubscribe; chasers rely on implied consent, **6 months** after an inquiry or **2 years** after a purchase or contract (H) | Name (+ on whose behalf); mailing address + phone/email/web; unsubscribe (H/U) | None statutory (U) |
| **Australia** (Spam Act) | Consent withdrawn; honor per channel at minimum (TAB); all channels safer (H/M) | Likely a withdrawal ("to the effect") (M) | ≤5 business days (H) | **No** (M–H) | Express consent preferred; inferred consent needs an ongoing relationship; conspicuous publication for work addresses (H) | Legal name or ABN of the authorising business; functional unsubscribe with no log-in or extra info (H) | Calls: telemarketing hours (U); SMS: none (U) |
| **Philippines** (DPA) | Objection means the controller "shall no longer process" for direct marketing (H) | Treat as objection (M) | Not specified; immediately (U) | **No** (H) | Consent (a clear assenting act, never implied) or legitimate interest with a documented LIA (NPC 2023-04 / 2023-07) (M–H) | Identify sender and business; transparency; no links in SMS (U) | None verified (U) |
| **WhatsApp** | Respect opt-outs "on or off WhatsApp" (U) | Treat as opt-out | Immediately | **No** | Lead gave their number + opt-in to WhatsApp messages; API: 24 h window, templates outside it (U) | Business name (in the opt-in) (U) | 24 h window (API) (U) |
| **Messenger / Instagram** | User opt-out or block (U) | Treat as opt-out | Immediately | **No** | Within 24 h of the user's last message; HUMAN_AGENT 7 days (no promotions); Marketing Messages opt-in otherwise (U) | Page or brand identity (U) | 24 h / 7 days (U) |
| **LinkedIn** | Stop | Treat as opt-out | Immediately | **No** | Relevant, non-repetitive 1:1 messages only; no automation (U) | — | — |

---

## 12. Recommended product rules (with legal basis)

| # | Rule | Legal basis (confidence) |
|---|---|---|
| **R1** | **Split the decision into two outcomes.** `OPTED_OUT`: permanent, cross-channel suppression for sales and marketing, never draft outreach. `STOP_CHASE`: a non-permanent pause. Explicit opt-out phrases **always** map to `OPTED_OUT`. Also remind the user to record the opt-out (name, channel, date, words used) in their CRM or suppression list the same day. | CAN-SPAM §7704(a)(4) (H); GDPR Art. 21(3) + ICO suppression guidance (H); CRTC (M–H); Spam Act Sch. 2 cl. 6 + ACMA TAB (H); DPA IRR §34(b) (H); TCPA 64.1200(d) (U) |
| **R2** | **Map "No." / "Not interested" / "Not for us" / "Please stop" to `OPTED_OUT`** when they reply to sales content, including Taglish and Filipino equivalents (classifier examples, not legal terms: "Hindi po ako interesado", "Wag na po", "Stop na po", "Pakitanggal na po ako", "Huwag n'yo na akong i-message"). If a bare "No." answers a factual question, don't opt out; if unsure, treat it as `OPTED_OUT` rather than asking. | ICO: "no specific words", verbal or written (H); CRTC "another form of communication" (M); Sch. 2 cl. 6 "to the effect" (M); conservative for CAN-SPAM (U) |
| **R3** | **Reopening:** only (i) a **new inbound request initiated by the lead** or (ii) explicit fresh consent. Reply only on what they asked; don't restart the sequence; keep the suppression flag for everything else. **Never** draft "may I send you info?" re-permission messages to opted-out leads. Website visits, email opens, profile views and the seller's own news are **not** signals. | CAN-SPAM §7704(a)(4)(B) (H); ICO solicited-marketing definition (H); ECPR s.3(b) (M–H); ICO hotel example + Flybe/Honda fines (H) |
| **R4** | **"New material reason" gate** (only for leads **not** opted out). All conditions must hold: (a) a lawful basis still valid for the lead's jurisdiction and channel: CA within 6 months of the inquiry or 2 years of a purchase or contract; UK soft opt-in conditions met or a corporate subscriber; EU consent or the national exception; US email CAN-SPAM-compliant; US SMS DNC/EBR checked; AU consent. (b) The reason is **true, specific and tied to what the lead asked about**. (c) **Only one** such message, then close. (d) It includes the opt-out line. | CASL s.10(10) (H); PECR soft opt-in (H); ePrivacy Art. 13 (H); UCPD Annex I point 26 / DMCC Sch. 20, persistent solicitations (U) |
| **R5** | **"Not right now" without a timeframe → `STOP_CHASE`.** At most one later check-in, and only under R4. **With a timeframe** ("next quarter"), schedule the follow-up for then: it is solicited. | ICO "solicited" definition (H); analysis (M) |
| **R6** | **Jurisdiction and recipient-type intake.** Capture the lead's country (and US state); company vs consumer vs sole trader; how the contact details were obtained; whether an opt-out was offered at collection. Apply stricter defaults when unknown (treat as EU B2C). | ICO B2B guidance (H); UWG §7 (M–H); ePrivacy Art. 13(5) (H) |
| **R7** | **Compliance footer by channel.** US email: name, business, **physical postal address**, opt-out line, and a solicitation disclosure unless the lead gave affirmative consent. Canada: name, whom you act for, mailing address + phone/email/web, and "reply 'stop' to unsubscribe". UK/EU: identity, contact address, opt-out line. AU: legal business name or ABN, and the opt-out line. SMS: "– [Name], [Business]. Reply STOP to opt out." Philippines SMS: no links. | §7704(a)(5) (H); CASL/CRTC (H); PECR reg 23 + ICO (H); ACMA (H); CTIA/TCPA (U) |
| **R8** | **Standard opt-out wording.** Replace "If you'd rather I not follow up, just let me know" with "If you'd prefer not to hear from me again, just reply 'stop' and I won't contact you further." Tell users to keep the reply inbox monitored for at least 30 days (US) or 60 days (Canada), and never make opting out require anything but a reply. | §7704(a)(3), (a)(5) (H); FTC no-extra-steps rule (H); CASL "readily performed", 60 days (H); ACMA no log-in (H) |
| **R9** | **Opt-out handling SLA:** tell users to act the same day. Show the legal outer limits: AU 5 business days; US email and Canada 10 business days; UK "immediately or as soon as possible". | As in §10(e) (H/U) |
| **R10** | **Timing guard for SMS, WhatsApp, DMs and calls:** suggest sending only **8am–8pm recipient local time**, and at most **1 message per lead per day** on a subject. Flag weekends and holidays. | TCPA 64.1200(c)(1); FTSA / OK / MD (U) |
| **R11** | **Truthfulness guard:** block fake "Re:" or "Fwd:", false deadlines or "last spots", invented scarcity, fabricated social proof or mutual contacts, guilt-trips and confirmshaming, and any claim the user hasn't confirmed as true. Breakup emails must be true and followed by silence. | CAN-SPAM §7704(a)(1)–(2) + FTC guide (H); FTC Act §5 and the dark-patterns report (U); UCPD Annex I point 7 (U); DMCC Sch. 20 (U); Competition Act s.74.011 (U); ACL s.18 (U) |
| **R12** | **Platform awareness:** when the channel is the WhatsApp Business Platform or a Messenger/Instagram business inbox, ask when the lead last messaged. Outside 24 hours, warn that free-form or promotional messages aren't allowed (templates or HUMAN_AGENT only, no promotions). For WhatsApp, confirm the lead gave their number and agreed to WhatsApp messages. For LinkedIn and consumer apps, warn that repeated unanswered messages risk spam reports and account restrictions. | Meta, WhatsApp and LinkedIn policies (U) |
| **R13** | **VA / agency mode:** the draft must identify the **client business** on whose behalf it is sent. Remind the VA that both parties are responsible. | FTC (H); ACMA identification (H); CASL identification (H/U) |
| **R14** | **AI data minimisation:** placeholders by default; strip contact details; no sensitive data; summarize threads; recommend business AI tiers with a DPA and no training; the product should store no lead data by default. | GDPR Arts. 5(1)(c), 28, Ch. V (U); DPA ss. 11, 14, 21 (U) |
| **R15** | **Record-keeping:** offer a minimal local "do-not-contact" record (identifier, channel, date, the words used), and never export or share it except to a compliance vendor. | ICO suppression guidance (H); CAN-SPAM no-transfer rule (H) |

---

## 13. Open questions, uncertainties, and a verification checklist

**Verification needed** (these were blocked in this session by the exhausted search budget and fetch restrictions):

1. **TCPA and states (Q6), all rows in §7:**
   - current 47 CFR 64.1200(c), (d), (e), (f)(5) text (10 business days; the 5-year DNC period)
   - the status of the "revoke-all" provision after the April 2026 postponement
   - the current text of the Florida FTSA, Oklahoma, Maryland, Texas SB 140 (2025), Virginia (2026) and Connecticut rules
   - FCC action on quiet hours for consented texts
   - the current CTIA keyword list
2. **Platforms (Q7):**
   - WhatsApp Business Messaging Policy wording, and whether it covers the Business App
   - July 2025 per-message pricing details and current free-message rules
   - the status of the US marketing-template pause
   - the current Messenger message-tag list (possible deprecations) and Marketing Messages rules
   - Instagram API windows
   - LinkedIn User Agreement §8.2 and the Professional Community Policies wording
   - Viber Business Messages opt-in terms
3. **Consumer protection (Q8):**
   - UCPD Annex I points 7 and 26 (verbatim)
   - the status of the EU Digital Fairness Act proposal as of Sept 2026
   - DMCC Act Schedule 20 numbering and the CMA's guidance on persistent solicitations
   - the FTC dark-patterns report quotes
4. **Philippines (Q5):**
   - NTC MC 03-03-2009 and any later SMS circulars (hours, keywords, caps)
   - SIM Registration Act and AFASA provisions
   - DPA penalty amounts and NPC Circular 2022-01 fines
   - 20th Congress anti-spam bills
   - NPC Advisory 2024-04 (AI) and NPC Advisory 2023-01 (deceptive design) content
   - whether the NPC has addressed marketing by Viber or text specifically

**Open legal questions** (no authoritative answer found):

1. **CAN-SPAM:** is "not interested" an opt-out request? Does a 1:1 follow-up need an explicit "solicitation" label when the content is plainly a sales follow-up? Is "just let me know" a sufficiently "clear and conspicuous" opt-out notice? No FTC guidance on 1:1 cases was found.
2. **CASL ECPR s.3(b):** how many follow-ups count as "in response to" the inquiry? No CRTC or ISED statement was found.
3. **Channel scope of opt-outs** under CASL (per electronic address vs per person) and the Spam Act (per account vs per person). The product should suppress per person regardless.
4. **EU Member-State B2B rules** for key markets (NL, ES, IT, IE, etc.), and whether a quote request counts as a "sale" context for Art. 13(2) nationally, including after *Inteligo Media*.
5. **Whether EDPB Guidelines 1/2024 (legitimate interest) were finalised,** and any direct-marketing changes.
6. **Extraterritorial reach** for Philippines-based users: CAN-SPAM, the GDPR (Art. 3(2)), PECR, CASL (s.12), the Spam Act (the "Australian link" in s.7), and the DPA (ss. 4, 6).
7. **Product exposure:** whether a drafting tool could be argued to "procure" or assist violations (e.g., CAN-SPAM "procure"; FTC "means and instrumentalities"). The guardrails above reduce this risk; it is **[U]**.

---

## 14. Source index (URLs cited; all seen only via search extracts)

**US / FTC**
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- https://www.ftc.gov/business-guidance/blog/2015/08/candid-answers-can-spam-questions
- https://www.law.cornell.edu/uscode/text/15/7702 · https://www.law.cornell.edu/uscode/text/15/7704 · https://codes.findlaw.com/us/title-15-commerce-and-trade/15-usc-sect-7704/ · https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7704+edition%3Aprelim%29
- https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-316 · https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-316/section-316.3
- https://www.federalregister.gov/documents/2005/01/19/05-974/definitions-and-implementation-under-the-can-spam-act
- https://www.federalregister.gov/documents/2008/05/21/E8-11394/definitions-and-implementation-under-the-can-spam-act
- https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-publishes-inflation-adjusted-civil-penalty-amounts-2025
- https://www.federalregister.gov/documents/2025/01/17/2025-01361/adjustments-to-civil-penalty-amounts
- https://www.whitehouse.gov/wp-content/uploads/2026/04/M-26-11-Cancellation-of-Penalty-Inflation-Adjustments-for-2026-Regarding-the-Federal-Civil-Penalties-Inflation-Adjustment-Act-Improvements-Act-of-2015.pdf
- https://www.federalregister.gov/documents/2026/09/15/2026-18853/civil-penalty-inflation-adjustments
- https://www.inkl.com/news/ftc-freezes-civil-penalty-amounts-for-2026-after-government-shutdown-disrupted-inflation-data

**UK / EU**
- https://gdpr-info.eu/art-21-gdpr/ · https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-object/
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/respect-peoples-preferences/
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/identify-direct-marketing/
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/key-concepts-for-direct-marketing-using-electronic-mail/
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
- https://www.wired-gov.net/wg/news.nsf/articles/ICO+warns+UK+firms+to+respect+customers+data+wishes+as+it+fines+Flybe+and+Honda+27032017142000
- https://www.hldataprotection.com/2017/03/articles/international-eu-privacy/ico-issues-fine-for-marketing-emails-disguised-as-service-messages/
- https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa/
- https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-duaa-summary-of-the-changes/privacy-and-electronic-communications/
- https://www.legislation.gov.uk/cy/uksi/2026/82/made
- https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/04/charities-given-new-flexibility-to-contact-supporters-under-data-law-change/
- https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32002L0058
- https://curia.europa.eu/juris/liste.jsf?language=en&td=ALL&num=C-654%2F23 · https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62023CJ0654 · https://www.taylorwessing.com/en/insights-and-events/insights/2025/11/european-court-of-justice-backs-the-advocate-general · https://grunecker.de/en/insights/cjeu-expands-possibilities-for-sending-newsletters-without-consent/
- https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202401_legitimateinterest_en.pdf
- https://www.gesetze-im-internet.de/uwg_2004/__7.html
- https://www.cnil.fr/fr/questions-reponses-sur-les-referentiels-relatifs-la-gestion-des-activites-commerciales-et-des
- https://www.europarl.europa.eu/legislative-train/theme-connected-digital-single-market/file-jd-e-privacy-reform · https://www.hunton.com/privacy-and-information-security-law/european-commission-withdraws-eprivacy-regulation-and-ai-liability-directive-proposals

**Canada**
- https://laws-lois.justice.gc.ca/eng/acts/e-1.6/fulltext.html
- https://laws-lois.justice.gc.ca/eng/regulations/SOR-2013-221/FullText.html
- https://crtc.gc.ca/eng/com500/faq500.htm · https://crtc.gc.ca/eng/com500/guide.htm · https://www.crtc.gc.ca/eng/com500/info.htm · https://crtc.gc.ca/eng/internet/pub/20260331.htm

**Australia**
- https://www.acma.gov.au/avoid-sending-spam
- https://www.acma.gov.au/sites/default/files/2024-05/Fact%20sheet%20-%20email%20and%20SMS%20unsubscribe%20rules.pdf
- https://www.acma.gov.au/articles/2024-06/consent-expectations-businesses-using-direct-marketing
- https://classic.austlii.edu.au/au/legis/cth/consol_act/sa200366/s18.html · https://classic.austlii.edu.au/au/legis/cth/consol_act/sa200366/sch2.html · http://classic.austlii.edu.au/au/legis/cth/consol_act/sa200366/s25.html
- https://www.legislation.gov.au/F2026N00424/asmade/2026-06-16/text/original/pdf
- https://www.acma.gov.au/articles/2025-03/telstra-penalised-spam-breaches · https://www.acma.gov.au/articles/2026-03/lululemon-penalised-702k-spam-breaches · https://www.acma.gov.au/articles/2026-04/latitude-finance-pays-396m-more-spam-breaches · https://www.acma.gov.au/articles/2026-07/tab-pays-27m-telemarketing-and-spam-breaches

**Philippines**
- https://privacy.gov.ph/wp-content/uploads/2016/08/10173-IRR-25-Aug-2016.pdf · https://privacy.gov.ph/wp-content/uploads/2023/06/IRR_RA-10173-as-amended.pdf
- https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf · https://www.dataguidance.com/opinion/philippines-npc-releases-guidelines-consent-part-0
- https://insightplus.bakermckenzie.com/bm/data-technology/philippines-national-privacy-commission-issues-guidelines-on-the-processing-of-personal-information-based-on-legitimate-interest
- https://privacy.gov.ph/wp-content/uploads/2020/11/Redacted-Advisory-Opinion-No.-2020-041.pdf
- https://www.privacy.gov.ph/2022/09/statement-of-privacy-commissioner-john-henry-naga-on-unsolicited-text-messages-containing-users-names/
- https://globalfreedomofexpression.columbia.edu/cases/disini-v-the-secretary-of-justice/
- https://legacy.senate.gov.ph/lisdata/3673933113!.pdf · https://issuances-library.senate.gov.ph/subject/anti-spam · https://www.pna.gov.ph/articles/1149528
- https://val.law/npc-advisory-no-2023-01-guidelines-on-deceptive-design-patterns-and-its-relation-to-the-internet-transactions-act/

*End of report. Not legal advice.*
