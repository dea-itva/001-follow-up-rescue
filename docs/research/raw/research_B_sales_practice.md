> **Raw research notes** produced by a research agent on 2026-09-24 for Lead Follow-Up Rescue. Claims marked UNVERIFIED were not confirmed against primary sources. Not legal advice. The curated synthesis is `../INDUSTRY_RESEARCH.md`.

# Research B: Sales follow-up practice. Evidence, conventions, myths

**Product:** Lead Follow-Up Rescue · **Prepared:** 2026-09-24 · **Scope:** warm-lead follow-up (inbound inquiry, quote/proposal, post-call), 1:1 messages sent manually by the user.

---

## How to read this report (and its limits)

**Plain-language glossary for a non-specialist owner**
- *Touch / attempt*: one outbound message or call to the lead.
- *Sequence / cadence*: a pre-planned series of touches. Sales tools such as HubSpot, Outreach, Apollo, Lemlist and Instantly send these automatically.
- *Reply rate*: replies divided by messages sent. Some vendors divide by messages *opened* instead, which inflates the number.
- *OOO*: an out-of-office auto-reply. A *bounce* is a delivery failure: *hard* means the address does not exist, *soft* means a temporary problem.
- *SPF / DKIM / DMARC*: DNS records that prove an email really comes from your domain.
- *Cold* means the lead never asked to hear from you. *Warm* means the lead started the contact (inquiry, quote request, call).

**Evidence tiers used throughout**
- **EVIDENCE**: a study with a stated method and sample size. For each one I give the dataset size, year, publisher, and whether the publisher sells a related tool (**COI** = conflict of interest).
- **CONVENTION**: a widely used tool default or expert consensus. This is the de facto "industry standard", but it is not proof that the practice works.
- **MYTH/UNSOURCED**: a popular statistic with no traceable primary source. I trace its origin where I could.

**How each fact was checked (labels in brackets)**
- **[archived copy]**: text taken from a verbatim copy of the primary document hosted on GitHub, for example an archive of Google, Yahoo and Microsoft sender pages, a statute mirror, or Meta's official sample repository. The quotes were extracted by a fetch tool and are close to verbatim.
- **[search snippet]**: seen in search-engine results for the publisher's own page. The page itself could not be opened, and snippet wording may be lightly paraphrased.
- **[secondary]**: a third party quoting or summarising the source.
- **UNVERIFIED**: from my background knowledge. Not checked in this session. Treat it as a lead to verify, not as a fact.

**Important limitations.** Direct page fetching was blocked by the network egress proxy for almost every domain, including hbr.org, support.google.com, knowledge.hubspot.com and wikipedia.org. Only GitHub-hosted content was reachable. The session's web-search budget (200 calls, shared with other agents) ran out partway through. I did **not** open the HBR PDF, the MIT/InsideSales PDF, Boomerang's own blog, or any tool's help centre directly. Key numbers were cross-checked across several independent snippets where possible. Everything else is labeled UNVERIFIED. The single biggest structural finding: **almost all public follow-up data comes from vendors analysing their own, mostly cold-outbound, platform data.** There is essentially no rigorous public dataset on warm-lead follow-up counts or spacing.

---

## Executive summary

1. **No evidence-based "industry standard" exists for warm-lead follow-up counts or spacing.** The de facto standard is how sales tools behave: they stop on reply, meeting booked, bounce or unsubscribe; they pause or ignore on OOO; they schedule on business days; and they enforce at least a 1-day gap between steps (HubSpot). Almost every published number is vendor data from cold outbound email.
2. **Speed-to-lead is the best-evidenced finding.** HBR 2011 audited 2,241 US companies and analysed 1.25M leads from 42 firms. Firms that tried to contact a lead within 1 hour were ≈7× as likely to qualify it as firms that waited even an hour longer, and >60× as likely as firms that waited 24h+. MIT/InsideSales 2007 (6 companies, 15k leads, 100k calls) found that calling at 5 minutes rather than 30 gave 100× the odds of contact and 21× the odds of qualifying. That study did not measure closes, and the data came from a vendor. This supports **RESPOND_NOW** for new inquiries.
3. **Diminishing returns are consistent across vendors.** The first follow-up adds the most. Gains shrink after about 3 follow-ups, while spam and unsubscribe risk rises. Belkins, an outbound agency (COI), reports "4+ follow-ups triple spam/unsub risk". Velocify (3.5M inbound leads, 2012) found that sending more than 5 emails before reaching a lead gave **36% lower conversion**, and that **93%** of converted leads were reached by the 6th call. The spec's cap works out to at most 4 chase follow-ups plus 1 close. That is within cold-tool norms (4–7 steps) and slightly above Belkins' cold "≤3 follow-ups" advice.
4. **Famous statistics are myths.** "80% of sales need 5+ follow-ups" comes from a **1942 survey of fewer than 40 people** (per SMEI, the successor to the association that ran it). "44% give up after one follow-up", "2% of sales close on first contact", "60% say no 4 times", "78% buy from the first responder", "single CTA = 371% more clicks" and "breakup emails get 33–76% replies" have no traceable primary data. Do not put them in product copy.
5. **Spacing has no rigorous evidence.** Conventions converge on 2–3 business days before the first follow-up, then widening gaps. Proposify (vendor) says winning proposals are acted on within about 2 days. Q11(b) proposes a **convention-labeled, user-configurable default**.
6. **Message craft (vendor data).** Boomerang (~40M emails, 2016) found that 50–125 words gets ≈50% response, and ~3rd-grade reading level gets ≈36% more responses than college-level writing. Gong (304k emails) found that in **active deals** a *specific day/time* CTA books the most meetings (37%, vs 32% for an open-ended ask and 25% for an "interest" ask). Gong also found that writing "I never heard back" **cuts meetings booked by 14%**. This supports one clear CTA and offering two concrete time slots.
7. **Breakup emails.** The widely quoted 33%/70%/76% response rates trace to HubSpot marketing content with no stated method. Popular templates work by guilt, presumption or flippancy ("close your file", "alligator"). The spec's no-CTA **CLOSE_LOOP** is stricter than common practice. That is ethically defensible, but expect fewer "revival" replies than the folklore promises.
8. **Tools handle cases the spec does not yet cover:**
   - OOO auto-replies (HubSpot keeps the contact enrolled; Apollo `mark_paused_if_ooo`; Instantly `stop_on_auto_reply`)
   - bounces
   - company-level stops (Apollo same-account reply policy, Instantly `stop_for_company`, Woodpecker `secondary_replied`)
   - resetting the counter when the lead replies

   Q11(d) maps each gap to an existing decision label.
9. **Deliverability.**
   - Gmail and Yahoo (from Feb 2024): all senders need SPF or DKIM, valid PTR records and TLS, and must keep spam rate below 0.3% (target below 0.1%). Bulk senders (≈5,000+ messages/day to personal Gmail; the status is permanent once reached) also need DMARC, alignment and one-click unsubscribe.
   - Microsoft (from 5 May 2025): senders of >5,000/day to Outlook.com consumer addresses must pass SPF, DKIM and DMARC or get **550 5.7.515** rejections.
   - Most 1:1 users never reach bulk thresholds. Gmail's own advice still applies: don't fake "Re:", keep links visible, and note that senders in the recipient's contacts are less likely to be marked as spam. So **reply in the existing thread**.
10. **Channel rules.**
   - US: the TCPA bars telephone solicitations **before 8 a.m. or after 9 p.m. in the recipient's local time**. The rule's definition excludes people who gave prior invitation or have an existing business relationship, but it is still a sensible outer bound.
   - CTIA guidance: natural-language opt-outs such as "please opt me out" should be honoured.
   - WhatsApp policy requires opt-in and honouring opt-outs "on or off WhatsApp".
   - Messenger (Pages): a 24-hour messaging window, plus a 7-day human-agent tag.
   - Canada: CASL implied consent from an *inquiry* lasts **6 months**.
11. **Philippine norms (UNVERIFIED).** Indirect declines are common ("sige, pag-iisipan ko", "titingnan ko po", "next time na lang"), along with politeness markers (po/opo) and read-but-no-reply ("seen-zoning"). Treat these as **ambiguous, not as yes**. Give face-saving exits, for example a LOWER_FRICTION message that says outright that "no" is fine, instead of escalating.
12. **Caveat.** Much of the tool-behaviour and cultural material is labeled UNVERIFIED because of access and budget limits. The Uncertainties section lists what to verify next.

---

## Q1. Speed to lead

### EVIDENCE

**E1.1 HBR 2011, "The Short Life of Online Sales Leads" (Oldroyd, McElheran, Elkington)**
- *Published:* Harvard Business Review 89(3), March 2011.
- *Method:* (a) An audit of **2,241 US companies**. Test web leads were submitted and time to first response was measured. (b) An analysis of **1.25 million sales leads** received by **29 B2C and 13 B2B companies** (42 total).
- *Key results [search snippet, consistent across sources]:*
  - "37% responded to their lead within an hour, and 16% responded within one to 24 hours, 24% took more than 24 hours — and 23% of the companies never responded at all."
  - "The average response time, among companies that responded within 30 days, was 42 hours."
  - Firms that tried to contact a lead within an hour "were nearly seven times as likely to qualify the lead (which was defined as having a meaningful conversation with a key decision maker) as those that tried to contact the customer even an hour later — and more than 60 times as likely as companies that waited 24 hours or longer."
- *COI:* HBR is a management magazine, not a peer-reviewed journal. Co-author David Elkington was (UNVERIFIED this session, high confidence) the founder/CEO of InsideSales.com, the vendor whose data underlies the leads analysis.
- *Caveats:* The data is correlational; fast responders may differ in other ways. The outcome is *qualification* (a conversation with a decision maker), not revenue. The work is phone-centric.
- *Sources:* https://hbr.org/2011/03/the-short-life-of-online-sales-leads (not opened; blocked) · https://www.researchgate.net/publication/298137032_The_short_life_of_online_sales_leads · https://www.hbs.edu/faculty/Pages/item.aspx?num=39955

**E1.2 MIT/InsideSales.com "Lead Response Management Study" (Oldroyd, 2007)**
- *Method:* Three years of data from **six companies**, **15,000+ leads** and **100,000+ call attempts**, taken from the InsideSales.com system [search snippet].
- *Key results [search snippet]:*
  - "The odds of contacting a lead if called in 5 minutes versus 30 minutes drop 100 times."
  - "The odds of qualifying a lead if called in 5 minutes versus 30 minutes drop 21 times."
  - Wednesday and Thursday were the best days to contact and qualify.
- *Limitations stated by the study itself [search snippet]:* it "did not address close ratios".
- *COI:* The data is vendor platform data (InsideSales sells calling and lead-management software) with academic analysis. It is **not an MIT publication** in the peer-reviewed sense.
- *Sources:* https://www.leadresponsemanagement.org/lrm_study/ · mirror PDF https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf (not opened) · https://content.marketingsherpa.com/heap/DG07SFSlides/LeadResponseManagementReport.pdf (not opened)

**E1.3 Velocify (then Leads360), "The Ultimate Contact Strategy" (Dec 2012)**
- *Method:* **3.5 million leads across 400 companies** [search snippet; MediaPost 11 Dec 2012].
- *Results:*
  - Calling within one minute of a lead arriving "can increase likelihood of conversion by nearly 400%" (the often-quoted 391%).
  - "93% of all converted leads are reached by the 6th call."
  - "The conversion rate for leads that were sent more than five email messages, prior to reaching the prospect, was 36% lower than the conversion rate for leads that were reached after having received one to five email messages."
  - Prospects who received emails had a 16% higher chance of being reached by phone. 59% received no email.
- *COI:* The publisher sells lead-management and dialer software.
- *Sources:* https://www.mediapost.com/publications/article/188824/quick-phone-response-plus-emails-improves-lead-con.html · https://www.slideshare.net/Velocify/the-ultimate-contact-strategy

**E1.4 Newer response-time audits (all vendor, all COI)**

| Study | Sample | Findings [search snippet] | COI |
|---|---|---|---|
| Drift Lead Response Report 2018 | 433 B2B companies tested | Only 7% responded within 5 minutes; 55% did not respond within 5 business days; average 47 hours | Sells live chat |
| Workato lead response study (year UNVERIFIED) | 114 B2B demo requests | Average 14h29m by phone, 11h54m by personalised email; none called within 5 minutes; only 1 of 114 emailed within 5 minutes | Sells automation |
| Chili Piper 2025 form benchmark | 4M form submissions (own customers) | Instant self-scheduling lifts form-to-meeting from ~30% to 66.7%. Its vendor-response-time page's other figures conflict across snippets (for example "average response time 2 days", "16% did not respond"), so treat them as UNVERIFIED | Sells scheduling and routing |

Sources: https://blog.drift.com/lead-response-report-2018/ · https://www.workato.com/the-connector/lead-response-time-study/ · https://www.chilipiper.com/post/form-conversion-rate-benchmark-report · https://www.chilipiper.com/article/chili-insights-vendor-response-time

### CONVENTION
- The "5-minute rule" and "respond within the hour" are near-universal sales advice, derived from E1.1–E1.3.
- For a solo freelancer or small business, the practical form (UNVERIFIED consensus) is: acknowledge within business hours as fast as possible, and if you can't answer fully, give a specific time when you will.

### MYTH/UNSOURCED
- **"78% of customers buy from the first company to respond."** Attributed to a "Lead Connect survey". No report or methodology can be traced; citations lead to aggregator blogs citing each other [search snippet, Expertise AI analysis; note that Expertise AI sells lead-capture AI]. The claim also appears on Chili Piper pages. Source: https://www.expertise.ai/stats/speed-to-lead-statistics
- **"Leads contacted within 5 minutes are 100× more likely to convert."** This misstates E1.2, where 100× is the odds of *contact* and 21× the odds of *qualification*; close rates were not measured.
- **"HBR analysed 2.24 million leads"** (seen on at least one vendor page). This conflates 2,241 *companies* with 1.25M leads.

**Implication for the spec:** RESPOND_NOW for new inquiries and unanswered questions is **aligned with the best-available evidence**. The evidence comes mainly from phone contact, so the exact minute thresholds should not be imported as rules.

---

## Q2. How many follow-ups? Diminishing returns, warm vs cold, myths

### EVIDENCE (all vendor platform data, almost all cold outbound email; every source has COI)

**Belkins** (outbound lead-generation agency; COI: sells outbound services)
- *2026 report (2025 data):* 7,530,489 emails across 12 months of Belkins' managed outreach.
  - The first email had the highest per-step reply rate (0.59%), but "follow-up emails collectively account for 58.6% of all replies".
  - Roughly 94% of responses came from, or within, three-step sequences. The snippet's wording is ambiguous.
  - Belkins changed the reply-rate denominator to *sent* instead of *opened*, because pixel open-tracking "had become unreliable". This means its 2023 figures are not comparable.
- *2024-data analysis:* 16.5M cold emails from 93 business domains; average reply rate 5.8% (6.8% in 2023). "Sending just one follow-up increases the average response rate by nearly 50%." "Three follow-ups is the sweet spot." "Sending the fourth follow-up may result in a 1.6% spam rate and a 2% unsubscribe rate… don't exceed three follow-ups per sequence." "After 4+ follow-ups, you triple your spam and unsubscribe risk." [search snippets]
- *2023 study:* 11M emails, with reply rates measured on *opens*.
  - Per-step reply rates of about 8.4% → 7.8% → 6.8% → 5.8% → 3.8%. Retellings disagree on whether 8.4% belongs to the first email or the first follow-up.
  - Timing: "Waiting 3 days before following up brings a 31% increase in the reply rate"; "within 1 day" −11%; "longer than 5 days" −24%.
  - Marginal effect: first follow-up +49%, second +9%, third −20%. [search snippets]
- *Caveats:* A 1.6% spam-complaint rate would be more than 5× Gmail's 0.3% ceiling, which suggests a different measurement basis. Retellings mix up figures across report years.
- Sources: https://belkins.io/blog/sales-follow-up-statistics · https://belkins.io/blog/cold-email-response-rates · https://belkins.io/blog/cold-email-outreach-statistics

**Instantly** Cold Email Benchmark Report 2026 (COI: sells cold-email software)
- "Billions" of interactions, Jan–Dec 2025. Platform average reply rate 3.43%; top quartile 5.5%+; top 10% 10.7%+.
- "58% of replies arrive on Step 1… Steps 2-4 contributing another 42%." Advises "at least 4 emails". Elite senders write under 80 words with a single CTA. [search snippet]
- Note that Belkins says follow-ups produce 58.6% of replies while Instantly says Step 1 produces 58%. The two vendors report opposite shares.
- Source: https://instantly.ai/cold-email-benchmark-report-2026

**Woodpecker** (COI: sells cold-email software)
- Platform stats vary by page and year: sequences of 4–7 emails reached a 27% reply rate vs 9% for 1–3 emails; adding one follow-up raised the average from about 9% to about 13%; "42% of all replies come from follow-ups". [search snippets]
- Methodology and dates are unclear. Treat as directional only.
- Sources: https://woodpecker.co/blog/cold-email-statistics/ · https://woodpecker.co/blog/follow-up-statistics/

**Backlinko × Pitchbox (2019)** (COI: Pitchbox sells outreach software)
- 12M outreach emails, mostly SEO/PR link-building outreach, **not sales**.
- 8.5% average reply rate; "sending just one additional follow-up can boost replies by 65.8%"; multiple follow-ups roughly doubled the response rate; emailing several contacts at one organisation gave +93%. [search snippet]
- Sources: https://backlinko.com/email-outreach-study · https://www.prnewswire.com/news-releases/only-1-of-8-outreach-emails-receive-a-reply-new-study-by-pitchbox-and-backlinko-finds-300833306.html

**Velocify 2012 (inbound, so warm, leads; phone plus email)**
- More than 5 emails before contact was associated with 36% lower conversion.
- 93% of converted leads were reached by the 6th call. See E1.3. This is the closest large dataset to *warm* leads.

**Outreach** (COI: sells sales-engagement software)
- Analysed 6.5M sequences and found that "optimizing for positive replies has 33% higher correlation with booked meetings than response rate on its own" [search snippet].
- Their support guidance: if the reply rate on a prospecting sequence's *last* step is still above 3%, the sequence may be too short.
- Sources: https://www.outreach.io/resources/blog/optimize-for-sentiment-over-response-rate · https://support.outreach.io/support/solutions/articles/159000426250-best-practices-for-reviewing-your-outreach-sequences

**Gong** (COI: sells revenue intelligence)
- "Winning deals involve ~8 email touchpoints vs 3 for losing deals". This appears only in aggregators (UNVERIFIED), and it is **correlational**: won deals naturally involve more back-and-forth. It is not evidence that sending more messages causes wins.

**Proposify** (post-proposal, so warm; COI: sells proposal software)
- 2026 State of Proposals: **742,137 proposals**; average close rate 34%; "winning sales proposals are acted on within two days of being sent, on average" [search snippet].
- An earlier analysis of 1.3M proposals: "42.5% of all closed-won proposals are won within 24 hours of the first open."
- Reminder claims are inconsistent across Proposify pages ("35% higher close rate", "10% more likely", "5%").
- Sources: https://www.proposify.com/state-of-proposals-2026 · https://www.proposify.com/blog/proposal-best-practices

**Yesware** (COI: sells sales engagement)
- "You have a 21% chance of getting a reply to your second email if the first goes unanswered… 25% chance… eventually." No methodology is visible [search snippet]. A "six touches in ~3 weeks" claim is UNVERIFIED.
- Sources: https://www.yesware.com/blog/18-proven-email-templates/ · https://www.yesware.com/blog/sales-follow-up-statistics/

**Lemlist** (COI)
- Around 4.5% reply rate for a single email, rising to about 22% (their "22.37%") across up to 10 touches. Also: "breakup emails often generate 20-30% of total replies". Methodology unclear [search snippet].
- Source: https://www.lemlist.com/blog/how-many-cold-email-follow-ups

**Where do returns flatten, and where do complaints spike?**
- *Cold email, vendor data:* the biggest marginal gain is the 1st follow-up. Gains shrink by the 3rd, and replies flatten around touch 4–5. Belkins places the complaint and unsubscribe spike at the **4th follow-up**. Instantly reports only through step 4.
- *Warm leads:* there is **no public dataset** on post-proposal or post-meeting follow-up counts. The nearest are Velocify (inbound) and Proposify (post-proposal timing). Both point the same way: **early, relevant contact matters most, and long silences mostly predict loss.**

### CONVENTION
- Cold-outbound tools and vendors: 4–7 steps is the most common "sweet spot" (Instantly, Woodpecker, Outreach). Lemlist suggests 7–8 touches. Belkins says ≤3 follow-ups.
- Warm 1:1 follow-up among practitioners (UNVERIFIED consensus): about 3–5 follow-ups over 2–6 weeks, each adding something, then a courteous close.

### MYTH/UNSOURCED: traced
| Claim | Origin trace | Verdict |
|---|---|---|
| "80% of sales require 5 follow-ups" / "80% of sales are made on the 5th–12th contact" | SMEI (successor of the National Sales Executives Association) found in its own archives that "in 1942, the Long Island, NY chapter of NSEA (now SMEI) surveyed their members to determine the ratio of calls made to sales made… The sample size was less than 40" [search snippet, smei.org]. Door-to-door and phone selling in wartime; no published method. | MYTH. A 1942 member poll of fewer than 40 people. |
| "2% of sales on 1st contact, 3% 2nd, 5% 3rd, 10% 4th, 80% 5th–12th" | Same lineage; usually an image credited to the "National Sales Executive Association". No retrievable data. Debunked by VentureBeat (15 Aug 2014) and Ask The Manager (June 2014). | MYTH |
| "44% of salespeople give up after one follow-up (22% after 2, 14% after 3, 12% after 4)" | Usually credited to "Scripted" (a content-writing marketplace) or Marketing Donut; no study found. Marketing Donut's page asserts that "different studies… all reveal that 80% of non-routine sales occur only after at least five follow-ups" without citing any study [search snippet]. | UNSOURCED |
| "48% of salespeople never follow up" | Same infographic family. | UNSOURCED |
| "60% of customers say no four times before saying yes" / "92% of reps give up after four no's" | Stat compilations (for example Invesp); no primary source found. | UNSOURCED |
| "It takes 8 touches or attempts to reach a prospect" (3.68 in 2007 → 8 now) | Attributed to TeleNet and Ovation Sales Group; no retrievable method (UNVERIFIED). | UNSOURCED |

Sources: https://smei.org/sales-statistics/ · https://venturebeat.com/marketing/these-incredible-sales-stats-everyone-cites-are-actually-completely-false · https://askthemanager.com/2014/06/92-percent-of-linkedin-users-believe-made-up-statistics/ · https://www.marketingdonut.co.uk/sales/sales-strategy/why-you-must-follow-up-leads · https://www.invespcro.com/blog/sale-follow-ups/ · https://conciergr.com/blog/80-percent-sales-follow-up-myth

---

## Q3. Spacing and cadence

### EVIDENCE
- **None rigorous.** The only quantitative timing claims are the Belkins 2023 cold-email figures (3-day wait +31%; within 1 day −11%; over 5 days −24%; opens-based, vendor) and Proposify's post-proposal velocity data (winners act within about 2 days; 42.5% of wins close within 24h of first open). Both are correlational vendor data.

### CONVENTION
- **HubSpot Sequences** [search snippet, knowledge.hubspot.com]:
  - The minimum delay between steps after the first is one day.
  - With the "business days only" setting, delays count business days only. A step can be delayed up to 90 business days.
  - A send window can be set, and HubSpot picks a send time within it.
  - A time zone can be chosen at enrolment.
  - Source: https://knowledge.hubspot.com/sequences/create-and-edit-sequences
- **Instantly:** campaign schedules have a time window, weekday/weekend day selection and a time zone, plus an `email_gap` setting (minutes between sends) [secondary: open-source integrations of the Instantly API, for example activepieces and NangoHQ on GitHub].
- **Vendor spacing guidance (not defaults):**
  - Lemlist: 2–3 days, then 3–4, then 5–7, then weekly.
  - Instantly blog: 3–4 days, then 5–7, then 7–10.
  - Belkins: 2–3 days, widening to 7–14.
  - Proposify: a reminder after 1 day if the proposal is unopened, and after 2 days if there is no reply. [search snippets]
- **Exact default step delays** in Lemlist, Instantly, Apollo, Outreach, Salesloft and Mailshake: **UNVERIFIED** (help centres could not be opened).
- Business days only, recipient's time zone, and business-hours send windows are near-universal conventions.

**Conclusion:** "2–3 business days, then widening gaps" is **convention**, not evidence.

---

## Q4. Warm-lead scenarios. Best-practice handling

Unless a row cites something else, the handling below is **CONVENTION (UNVERIFIED practitioner consensus)**, adapted to the spec's labels. Q11(d) turns the gaps into spec rules.

| Scenario | Recommended label | Best-practice handling | Basis |
|---|---|---|---|
| New inbound inquiry | RESPOND_NOW | Answer the actual question fast, in business hours. If a full answer needs info, answer what you can and ask the **one** missing detail. | EVIDENCE E1.1–E1.3 (speed) |
| Quote/proposal sent, then silence | WAIT (decision date given) or FOLLOW_UP | If the lead named a decision date, wait until it passes. Otherwise make the first follow-up after about 2–3 business days, anchored to something concrete: a specific section, a clarification, or the real validity date. | Proposify velocity data (vendor); convention |
| Post-discovery call | RESPOND_NOW (recap), then FOLLOW_UP | The same-day recap is a promised deliverable, not a chase. List agreed next steps and dates. If a next meeting is booked, WAIT. | Convention |
| Post-demo | RESPOND_NOW (recap and materials) | Send what was promised (recording, pricing, trial). The CTA is the agreed next step. Gong: in active deals, a *specific* day/time ask books the most meetings. | Gong 304k emails (vendor) |
| Post-event | FOLLOW_UP (reason: the meeting at the event) | Reference the specific conversation. Do not act as if they requested a sales sequence. If you only scanned their badge, the lead is closer to cold. | Convention |
| "Send me more info" | RESPOND_NOW | Send the *specific* info, not a brochure dump. If it's unclear what they need, ask one scoping question. Practitioners often read this as a brush-off, but don't *assume* it (the spec's anti-invention rule). | Convention |
| "I need to talk to my partner/boss" | RESPOND_NOW, then WAIT | Offer a short summary they can forward. Ask **once** when they expect to discuss it. If they give a date, wait for it. If they don't, don't invent one. | Convention; spec's vague-timing rule |
| "Price is too high" | RESPOND_NOW | Acknowledge it, clarify budget or scope, and offer only options the user actually has (smaller scope, phasing). Never invent discounts or deadlines. | Convention |
| "We went with someone else" | CLOSE_LOOP, then STOP_ACTIVE_FOLLOW_UP | Thank them gracefully. No rebuttal, no "are you sure". Optional one-line door-opener with no question. | Convention |
| "I'm not the right person, talk to X" | RESPOND_NOW (thank them and confirm) | Stop chasing the original person. Ask permission to mention them if that isn't obvious. Start a *new* interaction with X that names the referral. If no name is given, ask once who handles it. | Tool convention: Apollo same-account reply policy; Woodpecker `secondary_replied` |
| OOO **with** return date | WAIT | Resume after the return date, plus 1–2 business days. Don't count the OOO as a reply or as an attempt. | HubSpot ignores detected OOO; Apollo pauses on OOO. Outreach auto-resume is UNVERIFIED. |
| OOO **without** return date | WAIT (short, configurable) or NEED_MISSING_INFORMATION | Never invent a return date. Don't treat the OOO as engagement. If the lead named an alternate contact, the user decides whether the matter justifies using it. | Spec anti-invention rule; tool convention |
| Meeting no-show | FOLLOW_UP (reason: the missed meeting) | Same day, neutral tone ("looks like today didn't work out"), offer two concrete slots or a reschedule link. One more try, then CLOSE_LOOP. No guilt. | Convention; Gong specific-time CTA |
| Lead replied but ignored the question | RESPOND_NOW | Treat the reply as engagement (reset the counter). Respond to what they said, then re-ask the essential question once in a simpler form. Never "as I asked before". | Convention |
| Hard bounce | NEED_MISSING_INFORMATION (no message) | Stop using that address. It is not a "no". Ask the user for a valid address or channel. Don't count it as an attempt. | HubSpot auto-unenrolls on bounce; Outreach has a "bounced" state |
| Soft bounce | WAIT, then retry once | If it repeats, treat it as a hard bounce. | Convention |

---

## Q5. Message craft

### EVIDENCE
- **Boomerang (2016), ~40M emails** (COI: sells an email productivity add-on). The data is emails sent by Boomerang users, i.e. general business mail rather than sales follow-ups. "Response" means any reply. Figures [secondary, via HubSpot's article and EmailAnalytics, as recorded in third-party research notes on GitHub]:
  - 50–125 words gave about 50–51% response rates.
  - 75–100 words ≈51%. 10 words or fewer ≈36%. Over 200 words ≈44%.
  - Third-grade reading level got about 36% more responses than college level.
  - One to three questions were about 50% more likely to get a reply than no questions [secondary].
  - "3–4-word subject lines perform best" and "slightly positive or negative tone gets 10–15% more replies": UNVERIFIED.
  - Sources: https://blog.hubspot.com/sales/ideal-length-sales-email · https://emailanalytics.com/ideal-email-length/ (not opened)
- **Gong Labs, 304,174 emails** (COI) [search snippets, gong.io]:
  - In cold email, asking about *interest* books more than 2× the meetings of asking for *time*.
  - **In the deal stage**, a specific day-and-time CTA had a 37% success rate (meeting booked within 10 days), vs 32% for open-ended and 25% for an interest CTA.
  - "'Never heard back' increases reply rates, but it decreases meetings booked by 14%." Gong's reading is that it triggers guilt.
  - A personalised "hope all is well" was associated with +24% meetings.
  - "Follow-ups with 4+ sentences book 15× more meetings than 3-sentence 'just checking in' notes" appears only in aggregators: UNVERIFIED at primary.
  - Sources: https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings · https://www.gong.io/blog/7-tips-for-writing-the-perfect-follow-up-sales-email-according-to-science
- **Backlinko × Pitchbox (2019), 12M emails, outreach context:**
  - Personalised subject lines were about 30% more likely to get a response.
  - Long subject lines scored 24.6% higher than short ones. This conflicts with the Boomerang folklore, so there is **no stable subject-line rule**.
- **Belkins (2024):** lists of 50 or fewer recipients averaged 5.8% replies vs about 2.1% for large lists. That is correlational, but consistent with "targeted and personal works better".

### CONVENTION
- **"Just checking in" is an anti-pattern.** No clean A/B data isolates this phrase; the closest evidence is Gong's "never heard back" result. It is near-universally condemned by practitioners.
- **One CTA.** Strong consensus, and Instantly's "elite senders" profile includes a single CTA. The single-CTA *statistic* is a myth (below).
- **Plain text for 1:1.** Consensus says plain text reads as personal and avoids marketing-style rendering and tracking. Instantly and Apollo expose "text only" and tracking toggles. HubSpot's 2014 plain-vs-HTML test is UNVERIFIED.
- **Thread choice.** Reply **in the same thread** for continuity. Start a new thread only for a genuinely new interaction (for example the spec's "new material reason"), and never fake "Re:" (see Q10). HubSpot offers "send as reply" threading, with per-email threading in beta per its community forum.

### MYTH/UNSOURCED
- **"Emails with a single CTA increased clicks 371% and sales 1617%."** HubSpot content cites a 2015 WordStream stats listicle (http://www.wordstream.com/blog/ws/2015/06/10/digital-marketing-stats) [secondary: HubSpot article copy on GitHub]. No underlying study could be traced, and the figure has since drifted into "conversion", "landing page" and "sales" variants. **UNSOURCED.**

---

## Q6. Breakup / close-the-loop messages

### Claimed response rates: MYTH/UNSOURCED
A transcript of HubSpot content hosted on GitHub [secondary] claims:
- "HubSpot's own sales team sees a 33% response rate from their breakup emails"
- "the I feel like a stalker email that gets a 70% response rate"
- "permission to close your file, which our sales experts say nets them a 76% response rate"

No sample, period or denominator is given. Lemlist's "breakup emails generate 20–30% of total replies" is likewise unsourced. **No rigorous evidence exists.** A plausible mechanism (UNVERIFIED) is loss aversion and reactance, meaning the template provokes a reply. That is the very lever the spec forbids.

### Classification of common templates

| Template / phrase | Mechanism | Verdict for the spec |
|---|---|---|
| "Should I close your file?" / "Permission to close your file?" | Presumptive, and quietly pressures a reply | Manipulative-lite. Ban in CLOSE_LOOP (it is a disguised CTA). |
| "Have you been eaten by an alligator / abducted by aliens?" | Flippant; implies the lead is negligent | Ban. Unprofessional in most contexts, especially cross-cultural (PH to US/UK). |
| "I'll assume you're not interested" / "I'll take that as a no" | Presumptive; puts words in the lead's mouth | Ban (it invents intent). |
| "Last chance" / "final offer" (not true) | Fake urgency | Ban unless the user supplies a real, verifiable date. |
| "I feel like a stalker" / "Did I do something wrong?" / "Is it me?" | Guilt, self-deprecation | Ban. |
| "Have you given up on [goal]?" (a Chris Voss-style "no-oriented question"; attribution UNVERIFIED) | Provocation and loss framing | Ban (it is on the spec's list). A neutral alternative belongs in LOWER_FRICTION, not in a close. |
| "Are you still looking to [outcome]?" (Dean Jackson's "9-word email"; attribution UNVERIFIED) | Simple yes/no | Acceptable as a **LOWER_FRICTION** message, not as CLOSE_LOOP. |
| "I'll stop following up on this. If anything changes, I'm happy to help." | Clean close with an open door and no ask | **Recommended** CLOSE_LOOP shape. |

**What a respectful close looks like:**
1. It states the decision ("I'll stop following up / I'll close this out on my side").
2. It thanks them or acknowledges their time.
3. It optionally leaves one factual reference (for example "the quote is valid until [real date]").
4. It leaves the door open as a **statement**.
5. It has **no question mark, no scheduling link, no "let me know", no deadline threat**. Examples are in Q11(e).

---

## Q7. Sequence-tool conventions (the de facto "industry standard")

| Tool | Auto-stop / pause behaviour | Source status |
|---|---|---|
| **HubSpot Sequences** | Automatically unenrolls when the contact replies (if the reply trigger is on), books a meeting through a meetings link, unsubscribes through the sequence link, or bounces. Reply and meeting triggers can be turned off. Detects some OOO replies from server response codes: "Out-of-office replies are excluded… your contacts will remain enrolled in certain cases including Gmail out-of-office replies sent to Gmail inboxes and Outlook out-of-offices sent to Gmail or Outlook inboxes". Gmail OOO replies sent to Outlook inboxes aren't recognised, so the contact is unenrolled. Business-days option; minimum 1-day gap; up to 90 business days of delay; send windows; "send as reply" threading; daily send limits by seat (for example up to 1,000/day on Enterprise seats). | [search snippet] https://knowledge.hubspot.com/sequences/unenroll-from-sequence · https://community.hubspot.com/t5/Releases-and-Updates/Introducing-Out-of-Office-Reply-Detection-for-Sequences/ba-p/417994 · https://knowledge.hubspot.com/connected-email/sales-email-send-limits |
| **Apollo** | Sequence settings include `mark_finished_if_reply`, `mark_finished_if_click`, `mark_finished_if_interested`, `mark_paused_if_ooo` ("whether an out-of-office reply pauses the contact"), `same_account_reply_policy_cd` ("how the sequence handles a reply from someone else at the same account"), and `max_emails_per_day`. Example API objects show reply, interest and OOO pause set to `true`. | [secondary] Apollo API field descriptions in PostHog's Apollo connector and openSDKs example JSON (GitHub) |
| **Instantly** | Campaign settings include `stop_on_reply`, `stop_on_auto_reply`, `stop_for_company`, `text_only`, `open_tracking`, `link_tracking`, `insert_unsubscribe_header`, `daily_limit`, `email_gap`, and schedule windows and days. | [secondary] activepieces, NangoHQ and metorial integrations (GitHub) |
| **Lemlist** | `stopOnEmailReplied`, `stopOnMeetingBooked`, `stopOnLinkClicked`, `leadsPausedByInterest`, and tracking toggles (`disableTrackOpen`/`Click`). | [secondary] API references on GitHub |
| **Outreach** | Sequence states include active, paused, failed, **bounced**, pending, disabled, and finished. OOO detection with auto-resume on the return date is UNVERIFIED. | [secondary] Outreach OpenAPI copy (api-evangelist/outreach) |
| **Woodpecker** | Prospect statuses: active, replied, bounced, **autoreplied**, invalid, blacklist. Events include `prospect_not_interested` and `secondary_replied`. | [secondary] Ruby and TypeScript clients on GitHub |
| **Salesloft, Mailshake** | OOO auto-pause, default step counts and delays: UNVERIFIED. | n/a |

**Convention distilled:**
1. **A reply ends the automated chase.** It is universal, and the next step is always a human.
2. **Auto-replies are not replies.** Tools either ignore them (HubSpot) or pause (Apollo), and resume where possible.
3. **Bounces and unsubscribes are terminal for that address.**
4. **Company-level awareness.** If a colleague replies, stop parallel threads.
5. **Business days, recipient time zone, send windows.**
6. **Daily caps.**

Default step *counts* are not fixed by tools. Vendor guidance is 4–7 steps for cold outreach.

---

## Q8. What CHANGE_ANGLE and LOWER_FRICTION look like in practice

All CONVENTION (UNVERIFIED practitioner consensus) unless noted.

**CHANGE_ANGLE: materially new reason, framing, question or information**

| Technique | Example | Status |
|---|---|---|
| Relevant resource tied to their stated problem | "Here's the checklist we use for [their stated issue]." | OK, if the resource is real |
| A different stakeholder's benefit | "If finance is involved, here's a one-page cost summary." | OK |
| A different, diagnostic question | "What would need to be true for this to move this month: budget, timing, or something else?" | OK |
| A smaller first step or pilot | "Would a one-off [small task] be an easier start?" | OK only if the user actually offers it |
| New format or channel (for example a short voice note in chat) | n/a | Caution: it must not duplicate the same ask across channels |
| Social proof | "A client in [same industry] used this to…" | OK only if true and user-provided. Otherwise it is fabrication. |
| "I noticed you opened / viewed my proposal 5 times" | n/a | **Avoid.** It feels like surveillance, and opens are unreliable (Belkins dropped open-based metrics for that reason). |
| Fake "Re:" subject to simulate an existing thread | n/a | **Ban.** Gmail guidelines say not to do it; it is deceptive. |

**LOWER_FRICTION: less effort, less pressure, move toward closure**

| Technique | Example | Status |
|---|---|---|
| Yes/no question | "Is this still on your list for Q4? A quick yes or no is fine." | OK |
| Numbered reply menu | "Reply 1 (go ahead), 2 (later — tell me when), 3 (not now)." | OK |
| Two concrete time slots | "Tue 10:00 or Wed 15:00 (your time)?" | OK. Gong found this CTA shape works best in the deal stage. |
| Explicitly legitimise "no" | "If it's not a fit, that's completely okay, just tell me and I'll stop following up." | OK. Also culturally important for indirect-no contexts (Q9). |
| Remove questions, pre-fill defaults | "I'll pencil in [date]; reply if that doesn't work." | **Caution.** Presumptive "opt-out" commitments can feel manipulative. Use only for low-stakes logistics the lead already agreed to. |
| "Is this still a priority?" | n/a | OK if neutral. Avoid "have you given up?" framing. |
| Loss-framed or guilt versions ("Did you forget?", "Should I give your slot away?") | n/a | **Ban**, unless the scarcity is real and user-verified, and even then the phrasing should state facts, not pressure. |

---

## Q9. Channel norms, and Philippine communication norms

### EVIDENCE / primary rules
- **US SMS and calls (TCPA), 47 CFR § 64.1200(c)(1)** [archived copy, eCFR mirror]: "No person or entity shall initiate any telephone solicitation to: (1) Any residential telephone subscriber before the hour of 8 a.m. or after 9 p.m. (local time at the called party's location)."
  - § 64.1200(e) extends this to "text messages to wireless telephone numbers".
  - § 64.1200(f)(15) defines *telephone solicitation* to **exclude** a call or message "(i) To any person with that person's prior express invitation or permission; (ii) To any person with whom the caller has an established business relationship".
  - So a lead who inquired may fall outside the rule's letter. Adopt 8am–9pm local time as an **outer bound** anyway.
  - Revocation: the FCC's 2024 rule, per secondary notes effective 11 April 2025, lets consumers revoke "by using any reasonable method", honoured within a reasonable time "not to exceed ten (10) business days" [secondary; the paragraph number differs between eCFR versions].
  - Source: https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200 (read via GitHub mirror)
- **CTIA Messaging Principles (May 2023)** [secondary quote]: standard STOP wording should be used, but "stop/end/unsubscribe/cancel/quit and 'please opt me out' 'should also be read and acted upon'", and senders should send "one final opt-out confirmation message". Source: https://api.ctia.org/wp-content/uploads/2023/05/230523-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf (not opened)
- **US email (CAN-SPAM), 15 U.S.C. § 7704(a)(4)** [archived copy]: after an opt-out request, a sender may not send commercial email "more than 10 business days after the receipt of such request". The spec's immediate hard stop is stricter, which is good.
- **Canada (CASL), S.C. 2010, c. 23, s. 10(10)(e)** [archived copy]: an existing business relationship, and so implied consent, includes "an inquiry or application, within the six-month period immediately before the day on which the message was sent". **Practical effect: commercial follow-ups to a Canadian lead who only inquired become legally risky after 6 months without express consent.** Source: https://laws-lois.justice.gc.ca/eng/acts/E-1.6/ (read via GitHub mirror)
- **WhatsApp Business Messaging Policy** [archived copy, via the Open Terms Archive]:
  - "You may only contact people on WhatsApp if: (a) they have given you their mobile phone number or username; and (b) you have received opt-in permission from the recipient confirming that they wish to receive subsequent messages or calls from you."
  - "You must respect all requests (either on or off WhatsApp) by a person to block, discontinue, or otherwise opt out of communications from you… Do not confuse, deceive, defraud, mislead, spam, or surprise people with your communications."
  - On the **WhatsApp Business Platform (API)**, free-form messages are allowed only within a 24-hour customer-service window after the user's last message; after that, only pre-approved templates can be sent [secondary: PostHog and PortSIP docs].
  - Whether the 24-hour window applies to the manual WhatsApp Business *app*: UNVERIFIED, believed API-only. Policy source: https://business.whatsapp.com/policy
- **Facebook Messenger (Pages)** [archived copy, Meta's official `fbsamples/messenger-platform-samples` and Send API doc copy]:
  - Pages can message a person within the "standard 24 hour messaging window".
  - `HUMAN_AGENT` tag: "allows a human agent to respond to the person's message. Messages can be sent within 7 days of the person's message". It needs an approved app permission.
  - Disallowed uses include "Automated messages" and "Content unrelated to user inquiry".
  - How Meta Business Suite handles *manual* inbox replies after 24h/7d: UNVERIFIED.
- **Philippines:** Data Privacy Act of 2012 (RA 10173) applies to processing leads' personal data. Specifics are UNVERIFIED; no PH anti-spam statute was confirmed this session.

### CONVENTION (UNVERIFIED unless stated)
- **SMS:**
  - Identify yourself (name and business) in the first text and after long gaps.
  - One idea per text. Aim for ≤160 GSM characters (one segment).
  - Business hours in the recipient's local time.
  - No links from an unknown number early on.
  - Never send multiple unanswered texts on the same day.
- **WhatsApp / Viber / Messenger:**
  - Shorter than email (roughly ≤60 words).
  - Don't send voice notes unless the lead uses them.
  - Don't comment on read receipts ("I saw you've seen it").
  - Don't duplicate the same message across channels.
  - Respect a lead's channel preference.
- **LinkedIn:**
  - Connect-and-pitch is widely disliked.
  - For warm leads, reference the prior interaction.
  - LinkedIn enforces invitation limits (the "~100/week" figure is UNVERIFIED).
- **Platform-mediated leads** (Upwork, Fiverr, OnlineJobs.ph): follow platform messaging rules. Some platforms prohibit moving communication off-platform before a contract (UNVERIFIED specifics). This is a likely **OUT_OF_SCOPE or guardrail** case for the spec.

### Philippine communication norms: UNVERIFIED (background knowledge; flagged for user research)
- **Concepts** from Sikolohiyang Pilipino (Filipino psychology): *hiya* (propriety/shame), *pakikisama* (smooth interpersonal relations), *pakikiramdam* (sensing others' unstated feelings), *kapwa* (shared identity). These lead to **avoidance of a blunt "no"** and a preference for face-saving ambiguity. Academic anchor, not opened this session: Pe-Pua, R. & Protacio-Marcelino, E. (2000), "Sikolohiyang Pilipino (Filipino psychology): A legacy of Virgilio G. Enriquez", *Asian Journal of Social Psychology* 3(1), https://doi.org/10.1111/1467-839X.00054
- **Politeness markers:** *po/opo* signal respect, not agreement. "Opo" can mean "I hear you".
- **Channel preferences:** Messenger is widely reported as the dominant chat app in PH, with Viber popular among some segments (UNVERIFIED; check DataReportal PH reports). "Seen-zoning" (read, no reply) is common and should be read as *no information*, not as rejection or interest.
- **Reading indirect declines.** These are heuristics to validate with PH users before hard-coding them:

| Phrase (Taglish) | Literal meaning | Possible intent | Suggested mapping |
|---|---|---|---|
| "Pass po" / "Hindi na po, salamat" / "Ayoko na po" / "Wag na po kayong mag-message" | "Pass" / "No more, thanks" / "I don't want it anymore" / "Please don't message anymore" | Clear decline or stop | **Hard stop** |
| "Pass muna po" / "Hindi pa po ngayon" / "Next time na lang po" | "Pass for now" / "Not now yet" / "Maybe next time" | Soft decline or not now | NOT_RIGHT_NOW. With no timeframe: **STOP_ACTIVE_FOLLOW_UP** |
| "Sige po, pag-iisipan ko" / "Titingnan ko po" / "Balitaan na lang kita" | "OK, I'll think about it" / "I'll look into it" / "I'll update you" | Ambiguous, often a polite deferral or no | Vague timing: WAIT. If timing matters, NEED_MISSING_INFORMATION. When you do write, make "no" easy (LOWER_FRICTION). |
| "Medyo mahal po" | "It's a bit expensive" | Price objection or soft no | RESPOND_NOW (clarify budget and scope; no invented discounts) |
| "Tanong ko muna kay [asawa/boss]" | "I'll ask [spouse/boss] first" | Partner/boss | RESPOND_NOW (shareable summary) + ask when they expect to discuss it |
| "Noted po" / "Sige" / 👍 reaction | "Noted" / "OK" | Acknowledgement, not agreement | Treat as a reply (reset the counter), but don't assume a "yes" |
| Seen, no reply | n/a | Unknown | Unanswered attempt; never mention "seen" |

---

## Q10. Deliverability for 1:1 follow-up email

### EVIDENCE / primary rules
**Gmail, from 1 Feb 2024** [archived copy of support.google.com/a/answer/81126 and answer/14229414]

- **Every sender** to personal Gmail accounts must:
  - "Set up SPF or DKIM email authentication for your sending domains"
  - have valid forward and reverse DNS (PTR) records
  - "Use a TLS connection"
  - "Keep spam rates reported in Postmaster Tools below 0.3%"
  - "Format messages according to… RFC 5322"
  - not impersonate Gmail From: headers.
- **Bulk senders** ("close to 5,000 messages or more to personal Gmail accounts within a 24-hour period") must additionally:
  - have SPF **and** DKIM, plus DMARC
  - pass DMARC alignment: "the domain in the sender's From: header must be aligned with either the SPF domain or the DKIM domain"
  - support one-click unsubscribe: "Marketing messages and subscribed messages must support one-click unsubscribe, and include a clearly visible unsubscribe link".
- Bulk status is sticky: "Senders who meet the above criteria at least once are permanently considered bulk senders."
- One-click unsubscribe "is required only for marketing and promotional messages. Transactional messages are excluded". Gmail recommends fulfilling unsubscribes within 48 hours.
- Spam-rate targets: "Keep spam rates… below 0.10% and avoid ever reaching 0.30% or higher." From June 2024, bulk senders with a spam rate above 0.3% "will be ineligible for mitigation". From November 2025, Gmail "is ramping up its enforcement".
- The guidelines "don't apply to messages sent to Google Workspace accounts". They apply to mail sent **to** personal Gmail accounts, including mail sent by Workspace users.

**Gmail content guidance directly relevant to 1:1** [archived copy]:
- "don't send messages with subject lines starting with Re: or Fwd: unless the messages are actual replies or forwards"
- "Web links in the message body should be visible and easy to understand"
- "Don't use HTML and CSS to hide content"
- "Don't mix different types of content in the same message"
- "Don't send messages to people who didn't sign up to get messages from you"
- "**Messages sent from an address in the recipient's contacts are less likely to be marked as spam.**"
- URL shorteners: no statement found in the archived text. The advice to avoid public shorteners is CONVENTION.

**Yahoo, from Feb 2024** [archived copy of the Yahoo Sender Hub]:
- **All senders:** authenticate with "SPF or DKIM at a minimum", keep complaints low, have valid forward and reverse DNS, and comply with RFCs 5321 and 5322.
- **Bulk senders:** additionally need SPF + DKIM + DMARC, and must "Keep your spam rate below 0.3%".
- **Unsubscribe:** "Implement a functioning list-unsubscribe header, which supports one-click unsubscribe", with "Post (RFC 8058) method… highly recommended". "Honor unsubscribes within 2 days."

**Microsoft Outlook.com, announced 2 Apr 2025, effective 5 May 2025** [archived copy of Microsoft Tech Community post]:
- Applies to domains sending **over 5,000 emails/day** to Outlook.com consumer addresses (hotmail.com, live.com, outlook.com).
- SPF must pass. DKIM must pass. DMARC must be "at least p=none and align with either SPF or DKIM (preferably both)".
- An update on 29 Apr 2025 changed the enforcement from junk-foldering to rejection: "550; 5.7.515 Access denied, sending domain [SendingDomain] does not meet the required authentication level."
- Recommended practices: functional unsubscribe links, list hygiene, "accurate subject lines, avoid deceptive headers".
- Source: https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730

Archive used for all three: https://github.com/azumakuniyuki/feb-2024-no-auth-no-entry (copies of the Google, Yahoo and Microsoft pages).

### CONVENTION: practical 1:1 tips
- **Who is affected:** a manual 1:1 user almost never reaches 5,000 messages/day, so the bulk rules rarely apply. The all-sender rules do.
- **Setup:** users on @gmail.com or @outlook.com are covered by their provider. Custom-domain users (Workspace or M365) must set up SPF and DKIM, and DMARC is recommended (UNVERIFIED that every provider's default setup complies).
- **Thread:** follow up **in the same thread** from the address the lead already corresponded with. It keeps context, and Gmail notes that contacts are trusted.
- **Format:** plain text. No images or tracking pixels, and preferably no link tracking, which rewrites links through tracking domains (UNVERIFIED data; strong consensus).
- **Links:** one visible link at most, no shorteners, no attachments in unsolicited early messages. Requested documents are fine.
- **Honesty:** no fake "Re:", no deceptive subject lines.
- **Complaints:** for a solo sender, every "report spam" matters. Stopping at a clean close is also a deliverability protection.

---

## Q11. SYNTHESIS

### (a) Validating the attempt matrix against industry practice

**Spec matrix (recovered spec §8):**

| Previous follow-up attempts | Next step |
|---|---|
| 0 | Normal (context-based) |
| 1 | FOLLOW_UP |
| 2 | CHANGE_ANGLE |
| 3 | LOWER_FRICTION |
| 4+ | CLOSE_LOOP |

At most this is an anchor message plus **4 chase follow-ups plus 1 close** (6 messages including the anchor).

| Dimension | Industry practice | Spec | Verdict |
|---|---|---|---|
| Total follow-ups | Cold tools: 4–7 steps (Instantly, Woodpecker, Outreach), Lemlist 7–8+. Belkins (cold): ≤3 follow-ups; 4th follow-up raises spam and unsub risk. Velocify (inbound): more than 5 emails before contact gives lower conversion. | 4 chase + 1 close | **Aligned.** Mid-range for tools, and at or just above Belkins' cold advice. For warm 1:1 leads it is reasonable. For chat channels it is on the heavy side (see recommendation 3). |
| Content per touch | Common practice includes "bumps" | A legitimate reason is required; no "just checking in" | **Stricter.** Supported by Gong ("never heard back" −14% meetings) and general consensus. |
| Deal value or high intent | Enterprise teams often add touches or multi-thread for big deals | Never overrides | **Stricter and safer.** No evidence that more touches cause wins; Gong's 8-vs-3 figure is correlational. |
| Stop on "no" or "remove me" | Tools stop on unsubscribe link or bounce. Natural-language "remove me" needs human triage. CAN-SPAM allows up to 10 business days; the TCPA revocation rule allows up to 10 business days. | Immediate, overrides everything | **Stricter.** Matches CTIA's "please opt me out… should be acted upon". |
| Close message | Breakup emails designed to provoke a reply ("close your file", "alligator") | No disguised CTA | **Stricter.** Ethically sound. Expect fewer revival replies than the folklore claims. |
| "Not right now" with no timeframe | Tools move the lead to long-term nurture drips (UNVERIFIED) | Stop the active chase; no invented date | **Stricter.** It matches the anti-invention rule. Consider letting the *user* set an explicit reminder, labeled as the user's choice. |
| Counter reset on reply | A reply ends the sequence (universal) | Not explicit in the matrix | **Gap.** Define it. |
| Minimum time between touches | HubSpot minimum 1 day; business days; send windows | None (by design) | **Looser.** Nothing prevents 4 attempts in 4 days. See (b). |
| Auto-replies | HubSpot ignores detected OOO; Apollo pauses; Instantly can stop on auto-reply | Not covered | **Gap** |
| Bounces | Terminal for that address | Not covered | **Gap** |
| Company-level or referral | Same-account reply policies, stop-for-company, "secondary replied" | Not covered | **Gap** |
| Channel mixing | Multichannel tools count touches per step | Not covered | **Gap.** Count all channels together. |
| Legal consent windows | Rarely modelled by tools | Not covered | **Gap.** CASL's 6-month inquiry window, WhatsApp opt-in, TCPA hours. |

**Recommendations for the matrix itself:**
1. **Define `attemptCount` precisely:** the number of outbound follow-ups, across **all channels**, sent after the user's last substantive message (the *anchor*) with **no substantive lead reply** since.
   - Reset to 0 when the lead sends a substantive reply.
   - Do **not** increment for OOO or other auto-replies, bounces, or calls that didn't connect. For calls, decide explicitly whether a voicemail counts (suggested: yes).
   - Reactions such as 👍 or "noted po" reset the chase but supply no information.
2. **Keep "high intent never overrides".** No evidence contradicts it.
3. **Consider, but do not assume, a compressed path for chat/SMS** (0 → FOLLOW_UP, 1 → LOWER_FRICTION, 2+ → CLOSE_LOOP). Chat is more intrusive. This is a judgment call with no evidence (UNVERIFIED); treat it as a product decision.
4. **Clarify that an expired commitment can supply a legitimate reason for one follow-up**, framed helpfully ("Do you need anything from me to finish the documents?"), never as blame ("You said you'd…"). This matches the spec's "context, not automatic follow-up" rule.

### (b) DEFAULT spacing guideline: **CONVENTION, user-configurable, not a hard rule**

> **Status:** Proposal only. The recovered spec (§16) deliberately has no day-count table. This section offers **defaults the user can edit**, synthesized from tool minimums (HubSpot ≥1 day, business days), vendor guidance (Belkins, Lemlist, Instantly, Proposify) and speed-to-lead evidence (HBR/MIT/Velocify). **None of the specific day counts below is backed by rigorous evidence.** Commitments, deadlines, "not right now" timeframes and the lead's own stated timing always take precedence.

**Global guardrails, applying to all contexts:**
- Count days as **business days in the lead's time zone**. Skip weekends and public holidays in the lead's country. PH has long holiday periods such as Holy Week and late December; the dates are UNVERIFIED and should be configured per year.
- **At least 1 business day** between any two unanswered outbound messages on any channel. **Never two unanswered messages on the same day.**
- Send inside the lead's business hours. Suggested defaults: B2B 9:00–18:00 on weekdays; B2C/SMB 9:00–20:00. Never outside 8:00–21:00 local time, which is the TCPA outer bound for US telephone solicitations.
- For chat/SMS, widen every gap below by about 1–2 business days.

| Context | First contact / response | FOLLOW_UP | CHANGE_ANGLE | LOWER_FRICTION | CLOSE_LOOP | Rationale |
|---|---|---|---|---|---|---|
| **Inbound inquiry** (lead asked; the user must answer) | **RESPOND_NOW**: as fast as possible, target ≤1 business hour, at latest the same business day | +1–2 bd after the user's answer | +2–3 bd | +3–5 bd | +5–7 bd (≈3–4 weeks total) | The strongest evidence is for speed at first contact (intent decays within hours). The lead initiated, so early follow-ups are expected, but returns diminish. |
| **Post-proposal / quote** | Lead gave a decision date: **WAIT** until then (+1 bd) | Otherwise +2–3 bd after sending | +4–5 bd | +5–7 bd | +7–10 bd (≈5–6 weeks total) | Proposify: winners are acted on within about 2 days, and 42.5% of wins close within 24h of first open. Longer silence mostly predicts loss. Proposals need review time, so gaps are wider. A real expiry date may be *mentioned once*, never as pressure. |
| **Post-meeting** (discovery/demo) | Recap and promised materials: **same day, ≤24h** (a deliverable, not an attempt). Next step already booked: **WAIT** | +2–3 bd after the recap | +4–5 bd | +5–7 bd | +7–10 bd | Momentum is highest right after the meeting. Gong: specific day/time CTAs work best in the deal stage. |
| **Generic warm follow-up** (older warm lead, "I'll get back to you" with no date; legitimate reason required) | n/a | ≥5–7 bd after last contact | +7–10 bd | +10 bd | +10–15 bd (≈6–8 weeks total) | There is no signal of urgency, so the risk of annoyance dominates. Every touch needs a reason (spec §13). |
| **"Not right now" + timeframe** ("January") | **WAIT** until the start of the timeframe (for example the first business week of January) | One message referencing their stated timing | Then follow the post-proposal gaps if needed | n/a | n/a | Anchors on the lead's own words; nothing invented. |
| **Meeting no-show** | Reschedule message the **same day** (FOLLOW_UP; reason: missed meeting; two slots) | n/a | n/a | +2 bd (a yes/no or two-slot option) | +5–7 bd | The missed meeting is a legitimate reason. Keep it short. |
| **OOO with return date** | **WAIT** until return +1–2 bd | Then resume the context's cadence, and don't count the OOO as an attempt | n/a | n/a | n/a | Mirrors HubSpot and Apollo behaviour. |
| **OOO without return date** | **WAIT** ≥5 bd (configurable). If the matter is time-critical: NEED_MISSING_INFORMATION | n/a | n/a | n/a | n/a | Don't invent a return date. |

### (c) Anti-pattern phrase list for the output validator

Implement as case-insensitive phrase and regex checks with **context flags**. Some phrases are allowed only when a user-supplied fact backs them. The Taglish variants are UNVERIFIED and should be reviewed by native speakers.

**1. Vague check-in / empty bump** (flag in all types; block when it is the message's *only* reason)
- "just checking in", "just check in", "checking in to see", "just following up", "just wanted to follow up", "following up on my (last|previous) (email|message)", "touching base", "touch base", "circling back", "circle back"
- "bumping this (up|to the top)", "bump", "floating this (up|to the top)", "resurfacing this", "any update(s)?", "any news?"
- "did you get a chance to", "did you see my (last )?(email|message)", "not sure if you saw", "wanted to make sure this didn't get (lost|buried)"
- "per my last email", "as per my previous email", "as I mentioned (before|earlier)"
- "friendly reminder" and "gentle reminder" (the latter is common in PH/South-Asian business English). Allowed only when tied to a real, user-supplied date or deliverable.
- Taglish: "follow up ko lang po", "pa-follow up po", "update po?", "any update po", "bump po", "baka lang po nakalimutan ninyo"

**2. Guilt / blame / passive-aggressive**
- "I haven't heard back", "I never heard back", "haven't heard from you", "you haven't (replied|responded)", "you never replied", "since you haven't (responded|replied)"
- "I've (reached out|tried to reach you|emailed you) (several|multiple|many) times"
- "I'm sure you're busy", "I know you're (busy|swamped) but", "sorry to bother you (again)?", "I hate to bother you", "I don't want to be a pest", "I feel like a stalker", "did I do something wrong", "is it (me|something I said)", "you must have been (busy|swamped)"
- "ghosted", "ghosting", "seen-zoned", "seenzone", "left me on read", "I saw you (read|saw|viewed|opened)"
- "I was counting on you", "wasted (my|our) time", "I'm disappointed"
- Taglish: "nag-seen ka lang", "na-seen mo naman", "hindi ka na nagreply", "sayang naman", "pinaasa"

**3. Fake urgency / scarcity** (block unless a user-supplied, verifiable fact backs the claim)
- "last chance", "final chance", "final offer", "act now", "don't miss out", "before it's too late", "hurry", "today only", "ends (today|tonight|soon)", "limited time", "time-sensitive", "urgent"
- "only \d+ (spots|slots|seats|units) left", "almost (full|sold out)", "prices (go|going) up", "my calendar is filling up", "others are interested in this slot", "exclusive (offer|deal) (just )?for you"
- Taglish: "last na po ito", "sayang ang promo", "ubos na po ang slots"

**4. Presumptive assumption / invented intent**
- "I'll (take|assume) (that|this) as a no", "I'll assume you're (not interested|busy|no longer)", "since I haven't heard back, I'll assume"
- "should I close your file", "permission to close your file", "should I (stop|give up)", "is this the end of the road"
- "have you given up (on)?", "are you still alive", "(eaten|attacked) by an alligator", "abducted by aliens", "stuck under something heavy", "fell off the face of the earth"
- "you (probably|must) (forgot|forgotten)", "I know you're interested", "obviously (interested|busy)". These also violate spec §20's anti-invention rules.
- Tracking-based surveillance: "I (noticed|saw) you (opened|viewed|clicked)"

**5. Disguised restart** (applies to **CLOSE_LOOP** only; a hard block)
- Any "?" question mark. Any scheduling or booking link (calendly, "book a time", "grab a slot").
- "let me know if", "just reply", "reply (yes|1|2|3)", "if I don't hear back (by|within)", "before I go", "one last (thing|question)", "unless you want me to", "should I follow up (next|in)", "want me to check back", "P.S." followed by a CTA
- Taglish: "reply lang po", "sabihan niyo lang po ako kung", "pwede ko po ba kayong i-follow up ulit"

**6. Fabrication and deception risks** (block unless backed by case data)
- "as promised", "as we discussed", "per our (call|conversation)", "like you mentioned" when no such event is recorded in the case
- Unverified numbers ("clients see 3× ROI"), unverified social proof ("[Company] uses us")
- A subject line starting with "Re:" or "Fwd:" when the message is not an actual reply or forward (Gmail guideline)
- Hidden text or obfuscated links (Gmail guideline)

**7. Structure checks** (heuristics, configurable)
- Word count: email ≤125, chat ≤60, SMS ≤160 characters. More than one question mark, or more than one link, suggests multiple CTAs (RESPOND_NOW may need a second clarifying question; review it). More than one distinct "reason" clause should be flagged.

### (d) Gaps in the spec that tools handle, with recommended handling (no invented facts)

| # | Gap | Recommended handling within existing labels |
|---|---|---|
| 1 | **OOO with return date** | WAIT until return +1–2 bd. Not a reply, not an attempt. No-response plan: resume the context cadence. |
| 2 | **OOO without date** | WAIT (configurable, ≥5 bd). If timing is critical: NEED_MISSING_INFORMATION. Never invent the return date. If an alternate contact is named, surface it to the user without auto-contacting. |
| 3 | **"Left the company" / "inbox not monitored" auto-reply** | NEED_MISSING_INFORMATION (a new contact is needed). Stop messages to that address. |
| 4 | **Hard bounce** | NEED_MISSING_INFORMATION (valid address or other channel); no message. Not an attempt, not a "no". |
| 5 | **Soft bounce** | WAIT, retry once. If it repeats, treat as #4. |
| 6 | **Referral: "talk to X"** | RESPOND_NOW to the referrer (thank them, confirm permission). Stop the original chase. Evaluate X as a **new interaction** (the reason is the referral, which is legitimate), with its own attempt counter. |
| 7 | **"Not the right person" with no name** | RESPOND_NOW with one question ("Who would be best to speak with?"). If there is no answer, CLOSE_LOOP. |
| 8 | **Competitor chosen** | CLOSE_LOOP (gracious, no CTA). Then STOP_ACTIVE_FOLLOW_UP. A future contact needs a new material reason, such as a renewal date the lead volunteered. |
| 9 | **Meeting no-show** | FOLLOW_UP with reason "missed meeting". One reschedule offer (two slots). Next: LOWER_FRICTION, then CLOSE_LOOP. |
| 10 | **Partial reply** (answered, ignored your question) | RESPOND_NOW. Reset the counter. Re-ask the essential question once, simplified. |
| 11 | **Reaction-only or acknowledgement reply** (👍, "noted po", "sige") | Reset the chase. If it answers a yes/no question, act on it. Otherwise WAIT or NEED_MISSING_INFORMATION. Never read it as agreement to buy. |
| 12 | **Indirect decline** (PH patterns, Q9 table) | Map as in the Q9 table. When unsure, choose the **more conservative** of the possible readings, and make "no" easy in the next message. |
| 13 | **Channel opt-out words** (STOP, END, CANCEL, UNSUBSCRIBE, QUIT, "please opt me out", "wag na po") | Hard stop for that channel, and by default for all channels. CTIA and WhatsApp policy both say to honour requests made anywhere. |
| 14 | **Colleague at the same company replied** | Stop parallel chases at that account (tool convention). Continue only with the person who replied. |
| 15 | **Same message sent on multiple channels** | Count every channel toward one attempt counter. The validator blocks sending the same ask on two channels within the minimum gap. |
| 16 | **Lead-requested channel or time** ("text me after 5") | Treat as a commitment or constraint and obey it. |
| 17 | **Stale leads and consent windows** | Canada: an inquiry-only lead more than 6 months old → NEED_MISSING_INFORMATION (is there express consent or a newer interaction?). WhatsApp: no known opt-in → NEED_MISSING_INFORMATION. US SMS: outside 8–21 local → WAIT. |
| 18 | **Platform-mediated leads** (Upwork, Fiverr) | OUT_OF_SCOPE for off-platform contact if the platform forbids it (UNVERIFIED specifics). Otherwise follow platform norms. |
| 19 | **"Send me more info" with no detail** | RESPOND_NOW with the most relevant item and **one** scoping question. Don't dump everything. |
| 20 | **Partner/boss** | RESPOND_NOW with a forwardable summary and one question about when. Then WAIT (with date) or NEED_MISSING_INFORMATION (if timing matters and none is given). |
| 21 | **Price objection** | RESPOND_NOW. Clarify budget and scope. Offer only user-confirmed options. No invented discounts or deadlines. |
| 22 | **Tracking signals** (opens, views) | Never a legitimate reason on their own, and never mentioned in the message. Open tracking is unreliable (Belkins' denominator change). |

### (e) Example messages by decision type

All examples below: under 125 words, one legitimate reason, one primary CTA, no anti-pattern phrases. **[Brackets] = facts the user must supply.** Never auto-fill them.

#### RESPOND_NOW
1. **New inquiry (email)**
   > Subject: Your question about [service]
   >
   > Hi [Name], thanks for reaching out. To answer your question: [direct answer, e.g., "yes, we handle monthly bookkeeping for Shopify stores"]. For a business your size, pricing usually falls between [range the user provides]. To give you an exact quote, I only need one detail: roughly how many [transactions/items/hours] you have per month?
   >
   > Best, [User]
2. **Question arrives after four unanswered follow-ups**
   > Hi [Name], good question. Yes, [answer, e.g., "the package includes two revision rounds"]. [One sentence of relevant detail.] Would you like me to update the quote to reflect that?
3. **Referral**
   > Hi [Name], thank you for pointing me to [Colleague]. I'll reach out to them about [topic] and won't keep following up with you on this. Is it okay if I mention you suggested I contact them?
4. **Price objection** (only if the user confirms this option exists)
   > Hi [Name], thanks for being upfront about budget. The quote includes [A, B and C]. If we leave out [C], the total comes to [user-confirmed amount]. Would that version work better for you?
5. **Taglish (Messenger)**
   > Hi Ms. [Name], salamat po sa message! Yes po, available kami sa [date]. Ang rate po ng [package] ay [rate]. Para ma-finalize ko po ang quote, ilang [pax/oras/items] po ang kailangan ninyo?

#### FOLLOW_UP (each has one legitimate reason)
1. **Promised resource**
   > Hi [Name], as promised on our call, here's the [checklist/case study] on [topic]: [link]. Page 2 covers [the question they raised]. Would Thursday or Friday afternoon work for a 15-minute walkthrough?
2. **Post-meeting recap**
   > Hi [Name], thanks for your time today. My notes: your priorities are [1] and [2], and the next step is [agreed step] by [agreed date]. I've attached [promised item]. Could you confirm I've captured your priorities correctly?
3. **Requested document**
   > Hi [Name], attached is the [insurance certificate/sample contract] your team asked for. Is there anything else they need to complete the review?
4. **Meaningful proposal update**
   > Hi [Name], one update on the proposal from [date]: [real change, e.g., "the supplier confirmed stock, so the [date] start is still possible"]. If you'd like to keep that start date, reply "go" and I'll send the agreement.
5. **Taglish, promised sample**
   > Hi Sir [Name], ito na po yung sample layout na nabanggit ko kahapon: [link]. Nilagay ko na rin po yung [detail na hiningi ninyo]. Kung okay na po ito sa inyo, pwede na po ba akong magsimula sa [date]?

#### CHANGE_ANGLE (materially new reason, framing or question)
1. **Different stakeholder**
   > Hi [Name], one thing I didn't cover earlier: [aspect] also reduces [finance/admin] work, [user-supplied fact]. If someone from finance is part of the decision, would a one-page summary for them help?
2. **Diagnostic question**
   > Hi [Name], rather than send more details, a different question: what would need to be true for [project] to move forward this month: budget, timing, or something else?
3. **Relevant resource**
   > Hi [Name], you mentioned [stated problem]. Here's a short guide we put together on exactly that: [link]. The section on [X] may be the most useful. Is [problem] still something you're working on this quarter?
4. **Smaller first step** (only if offered by the user)
   > Hi [Name], if the full [package] feels like a big step right now, we could start with [smaller paid pilot] so you can see how we work first. Would a smaller start like that be useful?
5. **Taglish, phased option**
   > Hi Ma'am [Name], naisip ko lang po, kung mas convenient, pwede po nating hatiin sa dalawang phase ang project para mas magaan sa budget: [Phase 1] muna ngayong [month]. Gusto ninyo po bang makita ang breakdown?

#### LOWER_FRICTION
1. **Yes/no**
   > Hi [Name], is [project] still on your list for [timeframe]? A one-word yes or no is perfectly fine. Either answer helps me plan.
2. **Numbered reply**
   > Hi [Name], to make this easy, just reply with a number: 1 = let's go ahead, 2 = interested but later (tell me when), 3 = not a fit right now. Any answer is completely fine.
3. **Two slots**
   > Hi [Name], would [Tue date] at 10:00 or [Wed date] at 15:00 ([their time zone]) work for a 15-minute call to finalise the quote? If neither suits, send me a time that does.
4. **SMS**
   > Hi [Name], it's [User] from [Business]. Are you still interested in the [service] quote? A quick yes or no is fine.
5. **Taglish**
   > Hi po [Name]! Para hindi na po kayo maabala: reply lang po ng 1 kung tuloy pa, 2 kung sa ibang araw na lang (sabihin lang po kung kailan), o 3 kung hindi na po muna. Okay lang po kahit ano ang sagot. Salamat po!

#### CLOSE_LOOP (no question, no link, no deadline; nothing that restarts the chase)
1. **Silent after proposal**
   > Hi [Name], I'll close this out on my side and stop following up about the [project] proposal. If your plans change, you're always welcome to reach out. Wishing you all the best with [their goal].
2. **Quote with a real validity date**
   > Hi [Name], since the timing doesn't seem right, I'll stop following up on the proposal from [date]. For reference, the quote stays valid until [user-supplied date]. Thank you again for considering us.
3. **Competitor chosen**
   > Hi [Name], thanks for letting me know. I appreciate the heads-up. Congratulations on getting [project] moving, and I hope it goes really well.
4. **Not right now, no timeframe**
   > Thanks for the update, [Name]. I'll stop following up for now so this isn't cluttering your inbox. If anything changes later on, I'd be glad to hear from you.
5. **Taglish**
   > Hi [Name], salamat po ulit sa oras ninyo. Hindi ko na po kayo ifa-follow up tungkol sa quote para hindi po kayo maabala. Kung kailanganin ninyo po ulit ang [service], nandito lang po kami. Ingat po!

Note: "you're always welcome to reach out" and "I'd be glad to hear from you" are **statements**, not requests. They pass the CLOSE_LOOP rule. If the team wants zero ambiguity, allow only "open-door" sentences from an approved list.

---

## Uncertainties and what to verify next

1. **Access limits.** The primary documents for HBR 2011, MIT/InsideSales 2007, Boomerang 2016, Gong, Belkins, Instantly, Woodpecker, Lemlist and Proposify were **not opened**. The numbers come from search snippets or secondary copies. To verify: raise `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` and allowlist hbr.org, researchgate.net, gong.io, belkins.io, instantly.ai, proposify.com, blog.boomerangapp.com, knowledge.hubspot.com, support.google.com, and help centres (Outreach, Salesloft, Apollo, Lemlist, Instantly, Mailshake).
2. **Tool defaults.** The default number of steps and delays in Lemlist, Instantly, Apollo, Outreach, Salesloft and Mailshake, and Outreach/Salesloft OOO auto-resume behaviour: UNVERIFIED.
3. **Belkins figures** are internally inconsistent across years: the denominator changed from opens to sends, and "1.6% spam rate" is implausibly high on a per-send basis. Use them only as directional evidence of diminishing returns.
4. **Warm-lead cadence data** effectively doesn't exist publicly. Every warm-specific day count in Q11(b) is convention.
5. **Philippine cultural mappings** (Q9) are UNVERIFIED heuristics. Validate them with PH users: interviews, or labelled real conversations.
6. **WhatsApp:** whether the 24-hour window applies to the manual Business *app* is UNVERIFIED. So are Meta Business Suite's manual-reply limits and Viber business norms.
7. **Legal items:**
   - TCPA revocation paragraph numbering and effective date, plus the status of the FCC quiet-hours petition (UNVERIFIED).
   - UK PECR/EU ePrivacy treatment of "solicited" 1:1 follow-ups; Australia's Spam Act.
   - PH Data Privacy Act specifics.

   All need a legal review before the product makes channel-consent claims.
8. **Attributions** of "9-word email" (Dean Jackson), "have you given up?" (Chris Voss), and the origin of the "alligator" email: UNVERIFIED.
9. **Unverified single figures:** Gong's "15× meetings for 4+ sentence follow-ups", Gong's "8 vs 3 touchpoints", Yesware's "six touches in three weeks", and HubSpot's plain-text-vs-HTML 2014 test. Don't cite them without checking the primary source.

---

## Appendix: Source list (by question)

- **Q1:**
  - https://hbr.org/2011/03/the-short-life-of-online-sales-leads
  - https://www.researchgate.net/publication/298137032_The_short_life_of_online_sales_leads
  - https://www.hbs.edu/faculty/Pages/item.aspx?num=39955
  - https://www.leadresponsemanagement.org/lrm_study/
  - https://www.mediapost.com/publications/article/188824/quick-phone-response-plus-emails-improves-lead-con.html
  - https://blog.drift.com/lead-response-report-2018/
  - https://www.workato.com/the-connector/lead-response-time-study/
  - https://www.chilipiper.com/post/form-conversion-rate-benchmark-report
  - https://www.expertise.ai/stats/speed-to-lead-statistics
- **Q2:**
  - https://belkins.io/blog/sales-follow-up-statistics
  - https://belkins.io/blog/cold-email-response-rates
  - https://belkins.io/blog/cold-email-outreach-statistics
  - https://instantly.ai/cold-email-benchmark-report-2026
  - https://woodpecker.co/blog/cold-email-statistics/
  - https://backlinko.com/email-outreach-study
  - https://www.outreach.io/resources/blog/optimize-for-sentiment-over-response-rate
  - https://www.lemlist.com/blog/how-many-cold-email-follow-ups
  - https://www.yesware.com/blog/18-proven-email-templates/
  - https://www.proposify.com/state-of-proposals-2026
  - https://www.proposify.com/blog/proposal-best-practices
  - https://smei.org/sales-statistics/
  - https://venturebeat.com/marketing/these-incredible-sales-stats-everyone-cites-are-actually-completely-false
  - https://askthemanager.com/2014/06/92-percent-of-linkedin-users-believe-made-up-statistics/
  - https://www.marketingdonut.co.uk/sales/sales-strategy/why-you-must-follow-up-leads
  - https://www.invespcro.com/blog/sale-follow-ups/
- **Q3 and Q7:**
  - https://knowledge.hubspot.com/sequences/create-and-edit-sequences
  - https://knowledge.hubspot.com/sequences/unenroll-from-sequence
  - https://community.hubspot.com/t5/Releases-and-Updates/Introducing-Out-of-Office-Reply-Detection-for-Sequences/ba-p/417994
  - https://knowledge.hubspot.com/sequences/create-an-email-thread-with-your-sequence
  - https://knowledge.hubspot.com/connected-email/sales-email-send-limits
  - API field evidence (GitHub): PostHog/posthog Apollo canonical descriptions; openintegrations/openSDKs `sdk-apollo` example; activepieces Instantly piece; NangoHQ Instantly sync; mindcloud-inc/universal-api-reference (Lemlist); api-evangelist/outreach OpenAPI; Quintasan/woodpecker
- **Q5:**
  - https://blog.hubspot.com/sales/ideal-length-sales-email
  - https://emailanalytics.com/ideal-email-length/
  - https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings
  - https://www.gong.io/blog/7-tips-for-writing-the-perfect-follow-up-sales-email-according-to-science
  - WordStream (origin of "371%"): http://www.wordstream.com/blog/ws/2015/06/10/digital-marketing-stats
- **Q6:** HubSpot breakup-email claims (transcript copy on GitHub: blicktz/knowledge_base_repo, `hubspot_marketing/close_dollar100k_deals_with_these_expert_sales_email_templates.txt`)
- **Q9:**
  - eCFR 47 CFR 64.1200: https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200 (GitHub mirror AlextheYounga/ecfr)
  - CTIA: https://api.ctia.org/wp-content/uploads/2023/05/230523-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf
  - CAN-SPAM: https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section7704
  - CASL: https://laws-lois.justice.gc.ca/eng/acts/E-1.6/ (GitHub mirror JasonMWhite/gitlawca)
  - WhatsApp policy: https://business.whatsapp.com/policy (Open Terms Archive copy)
  - Messenger: fbsamples/messenger-platform-samples (GitHub)
  - Filipino psychology: https://doi.org/10.1111/1467-839X.00054
- **Q10:**
  - https://support.google.com/a/answer/81126
  - https://support.google.com/a/answer/14229414
  - Microsoft: https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730
  - Archive of all three: https://github.com/azumakuniyuki/feb-2024-no-auth-no-entry
