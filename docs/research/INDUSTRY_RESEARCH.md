# Industry Research: What "Good" Looks Like for Lead Follow-Up

**Date:** 2026-09-24 · **Audience:** product owner (no email-marketing background assumed)
**Status:** due-diligence synthesis. **Not legal advice.**
**Raw notes:** `docs/research/raw/` (three agent research reports, with every source and confidence label)

> **Limits of this research.** The research agents could not open many primary pages: the network proxy blocked most sites, and the shared web-search budget ran out. Many figures therefore come from search-result extracts of the primary pages, or from GitHub mirrors of statutes and docs. Anything not confirmed is labelled **UNVERIFIED** here and in the raw notes. Before making legal claims in marketing copy, or relying on a platform limit, re-verify it.

---

## The short answer

1. **There is no evidence-based "industry standard" for how often or how many times to follow up with a warm lead.** Almost every published number comes from vendors of cold-email tools, measuring cold outreach. The real de facto standard is **how sales tools behave**. They stop the sequence as soon as the lead replies, books a meeting, unsubscribes or bounces; they count business days; and they allow at least one day between steps.
2. **Your recovered rules are aligned with, or stricter than, industry practice in the right places.** The ladder (1 → follow up, 2 → new angle, 3 → make it easy, 4+ → close the loop) sits in the middle of normal tool behaviour (4–7 steps). The extra strictness (a real reason for every message, deal size never overrides, no disguised "breakup" CTA) is supported by the little evidence there is, and by consumer-protection law.
3. **The law is stricter than the recovered spec in one place: stop requests.** In the US, UK/EU, Canada, Australia and the Philippines, when a lead says "stop", "remove me" or (in most places) "not interested", you must stop *sales* messages to them **for good**. Only a new request the lead starts, or fresh consent, reopens contact. Even an email asking "may I contact you again?" counts as marketing. The design adopts this (DL-02).
4. **1:1 sales emails are covered by US anti-spam law (CAN-SPAM)**, including B2B and low volume. A follow-up email needs an honest subject line (no fake "Re:"), an opt-out line and a postal address. The drafted emails include a footer for this by default (DL-18).
5. **Speed matters most at the very first response.** This is the strongest evidence in the whole field. The Rescue answers a new inquiry with "reply now".
6. **For distribution at zero cost to you:** a single HTML file (the "Rescue Desk") that assembles the prompt and checks the AI's answer, used with *any* AI through copy-paste. The same file published as a Claude artifact adds a one-click **Run with Claude** that uses the *viewer's* Claude account. **Skip Custom GPTs:** OpenAI is retiring them on 2026-12-11, and personal plans can no longer create them.

---

## A. Legal and compliance: what you must do

Confidence: **H** high (primary text seen), **M** medium, **U** UNVERIFIED this session.

### A1. Stop means stop, permanently, for sales outreach

| Where | Rule | Reopens contact | Conf. |
|---|---|---|---|
| US email (CAN-SPAM, 15 U.S.C. §7704(a)(4)) | After an opt-out, no commercial email from 10 business days on; no end date; opted-out addresses may not be transferred | Only "affirmative consent by the recipient subsequent to the request" | H |
| UK/EU (GDPR Art. 21(3); ICO) | Objection to direct marketing is absolute; keep a suppression list rather than deleting the person | A new request the lead starts, or fresh consent. Asking permission to re-contact is itself marketing (ICO fined Flybe £70k and Honda £13k in 2017) | H |
| Canada (CASL; CRTC) | Honor an unsubscribe "through your unsubscribe mechanism or by another form of communication" within 10 business days | Express consent | M–H |
| Australia (Spam Act 2003, ACMA) | Withdrawal takes effect within 5 business days. ACMA fined TAB A$2.7m in July 2026, partly for 217,000+ messages to unsubscribed people | Fresh consent | H |
| Philippines (Data Privacy Act, IRR §34(b)) | After an objection, the controller "shall no longer process" the data for direct marketing | New consent or a new request from the person | H |

**"No" and "not interested":** legally an objection in the UK/EU (the ICO says no specific words are needed). Likely a withdrawal in Canada and Australia. Unclear in US email law, but high-risk. **Treat them as a stop.** A bare "No." that answers a narrow factual question ("Did the file come through?" "No.") is not an opt-out. If unsure, stop, and never message the lead to ask.

**"Not right now" (no timeframe)** is a deferral, not an objection. The chase stops. At most one later message is reasonable if it is true, specific, tied to what the lead asked for, carries an opt-out, and a lawful basis still exists (for example, in Canada implied consent from an inquiry lasts only 6 months). **"Not right now, try me in January"** makes a January follow-up *requested* (solicited).

### A2. What a commercial follow-up email must contain (US CAN-SPAM; similar elsewhere)

- Accurate From and Reply-To.
- A **truthful subject line**. Never a fake "Re:" or "Fwd:" on a new thread. Gmail's own sender guidelines say the same.
- A **clear opt-out** that works by reply for at least 30 days (Canada: 60 days). Recommended wording: *"If you'd prefer not to hear from me again, just reply 'stop' and I won't contact you further."* The softer "If you'd rather I not follow up, just let me know" is only partly adequate: it reads as this thread only.
- A **valid postal address** (a PO box is fine).
- Identification as a solicitation, unless the lead gave prior affirmative consent. An email that openly says it follows up on your proposal likely meets this; a short explicit line is safer (M).
- The FTC says CAN-SPAM "doesn't apply just to bulk email… makes no exception for business-to-business email." A follow-up on a quote the lead requested but has not accepted is **commercial**. **Penalty:** up to **$53,088 per email** (unchanged in 2026). Both a virtual assistant and their client can be liable.
- **Canada:** name, whom you act for, mailing address plus phone/email/web, unsubscribe. **UK/EU:** identity, contact address, opt-out in every message under the "soft opt-in". **Australia:** legal business name or ABN, working unsubscribe.

### A3. Timing and channels

- **Quiet hours** for texts, calls and DMs: US federal 8am–9pm recipient local time; some states 8am–8pm (U). Safe default: **8am–8pm recipient local time, at most one message per lead per day.**
- **Consent windows:** Canada: implied consent 6 months after an inquiry, 2 years after a purchase or contract (H).
- **Platforms (contracts, not law; U):** WhatsApp requires opt-in and says to honor opt-outs made "on or off WhatsApp"; its Business API has a 24-hour window. Messenger's business API has a 24-hour window (7 days for human replies, no promotions). LinkedIn prohibits unwanted or repetitive messages.

### A4. Manipulation is a legal risk too (U)

False limited-time offers, fake scarcity and persistent unwanted solicitation are listed unfair practices: EU UCPD Annex I points 7 and 26; UK DMCC Act 2024 (in force April 2025); FTC Act §5 and the FTC's 2022 dark-patterns report. The spec's "no fake urgency, no guilt" rules are therefore both product quality and legal hygiene.

### A5. Privacy when users paste leads' messages into an AI

The user (or their client) is the data controller (GDPR) or personal information controller (Philippine DPA). Minimise: use placeholders and first names, strip phone numbers and emails, never paste sensitive data, prefer private or temporary chats, and turn off training on chats. For client work, prefer business AI plans with a data-processing agreement. The Rescue Desk redacts contact details by default and can pseudonymise names locally (DL-25).

---

## B. Sales follow-up practice: what actually works

Tiers: **EVIDENCE** (a study with a method; nearly all publishers sell a related tool), **CONVENTION** (tool defaults, expert consensus), **MYTH** (no traceable source).

### B1. Evidence

| Finding | Source | Notes |
|---|---|---|
| Firms that tried to contact a web lead **within 1 hour** were about **7×** likelier to qualify it than firms that tried an hour later, and **>60×** likelier than firms that waited 24h+. An audit of 2,241 US firms: 37% replied within an hour, 23% never did, the average was 42 hours. | HBR, Oldroyd, McElheran & Elkington, 2011 | Correlational; measures qualification, not sales |
| Calling at 5 rather than 30 minutes: **100×** the odds of *contact*, **21×** the odds of qualifying | MIT / InsideSales LRM study, 2007 | Often misquoted as "100× conversion" |
| One follow-up adds about 50% more replies; "3 follow-ups is the sweet spot"; the 4th raises spam and unsubscribe risk | Belkins, 16.5M cold emails | Directional only; the figures changed method between years |
| Step 1 of a sequence gets 58% of all replies; steps 2–4 get 42% | Instantly benchmark 2026 | Cold email |
| Winning proposals are acted on within about 2 days; 42.5% of wins close within 24h of first open | Proposify, 742k proposals, 2026 | Long silence after a proposal mostly predicts a loss |
| 50–125-word emails get about 50% reply rates; 3rd-grade reading level about 36% more replies than college level | Boomerang, about 40M emails, 2016 | Secondary sources |
| In active deals, asking for a **specific day and time** booked meetings 37% of the time vs 32% (open ask) vs 25% ("are you interested?"). Writing "never heard back" cut meetings booked by 14% | Gong, 304k emails | Supports "no guilt" and concrete CTAs |

### B2. Conventions (the practical "standard")

- **Sequence tools:**
  - They stop on reply, meeting booked, unsubscribe and bounce (HubSpot).
  - They handle out-of-office replies by pausing (Apollo) or ignoring (HubSpot).
  - They count business days; HubSpot enforces at least 1 day between steps.
- **Sequence length:** typically 4–7 steps, spaced 2–3 days and then wider (vendor advice, not evidence).
- **Deliverability:**
  - Reply in the same thread. Gmail says messages from addresses in the recipient's contacts are less likely to be marked spam.
  - Don't fake "Re:".
  - Keep spam complaints below 0.3% (target below 0.1%).
  - Bulk senders (about 5,000+/day to Gmail or Outlook) also need DMARC and one-click unsubscribe. This does not apply to 1:1 follow-ups.

### B3. Myths to keep out of your marketing copy

- "80% of sales need 5 follow-ups" / "2% close on first contact": traced by SMEI to a **1942** chapter survey with **fewer than 40** respondents.
- "44% of salespeople give up after one follow-up": no study found.
- "One CTA = 371% more clicks": a 2015 stats listicle.
- "Breakup emails get 33% / 70% / 76% replies": marketing content with no method.

### B4. Recommended default spacing: convention, user-configurable, never a rule

Your spec deliberately has no day-count table. The design uses this only as a labelled "typical practice" hint for suggested send dates. It never changes the decision, and anything the lead said about timing wins.

| Context | Respond / first step | 1st follow-up | New angle | Make it easy | Close the loop |
|---|---|---|---|---|---|
| New inquiry | Same business day, ideally within an hour | +1–2 business days | +2–3 | +3–5 | +5–7 |
| After a proposal/quote | If they gave a decision date, wait for it | +2–3 bd | +4–5 | +5–7 | +7–10 |
| After a meeting | Recap the same day (not an attempt) | +2–3 bd | +4–5 | +5–7 | +7–10 |
| Generic warm (needs a real reason) | — | ≥5–7 bd | +7–10 | +10 | +10–15 |

Guardrails:
- Business days in the lead's time zone.
- Business hours only.
- Chat/SMS gaps 1–2 days wider.
- **Never two unanswered messages to the same person on the same day.** This one is enforced (DL-23).

### B5. How the recovered rules compare with industry practice

| Area | Industry | Your spec | Verdict |
|---|---|---|---|
| Number of follow-ups | 4–7 steps (tools); ≤3 (Belkins, cold) | 4 chase + 1 close | **Aligned** |
| Content | "Bumps" are common | A real reason every time | **Stricter** (Gong supports it) |
| Big deal or high intent | Teams add touches | Never overrides | **Stricter**, no evidence against |
| "Stop" / "remove me" | Tools stop on unsubscribe links; natural-language replies need a human | Immediate, overrides all | **Stricter**, and legally required |
| Close message | "Breakup" emails built to provoke a reply | No disguised CTA | **Stricter**, ethically sound |
| Reply resets the count | Universal | Not stated | **Gap**, now defined (DL-01) |
| Minimum spacing | 1 day minimum, business days | None | **Gap**, "never twice in one day" added (DL-23) |
| Out-of-office, bounces, referrals, channel mixing | Handled by tools | Not covered | **Gaps**, mapped to existing labels (DL-10) |

### B6. Phrases the validator flags (starter list; Taglish variants need native-speaker review)

- **Vague check-in:** just checking in · just following up · touching base · circling back · bumping this · any update(s)? · did you get a chance to · did you see my email · per my last email · as I mentioned · friendly/gentle reminder (unless tied to a real date) · *follow up ko lang po · update po? · bump po*
- **Guilt:** I haven't / never heard back · you haven't replied · I've reached out several times · I'm sure you're busy · sorry to bother you again · I don't want to be a pest · ghosted · left me on read · I saw you read · *nag-seen ka lang · hindi ka na nagreply · pinaasa*
- **Fake urgency or scarcity** (unless a real, user-supplied fact): last chance · final offer · act now · don't miss out · before it's too late · hurry · today only · limited time · only N spots left · almost full · prices going up · my calendar is filling up · *last na po ito · ubos na po ang slots*
- **Presumption:** I'll take that as a no · I'll assume · should I close your file · have you given up · eaten by an alligator · fell off the face of the earth · you must have forgotten · I know you're interested · I noticed you opened
- **Disguised restart (CLOSE_LOOP only):** any "?" · booking links · let me know if · just reply · reply 1/2/3 · before I go · one last thing · want me to check back · *reply lang po · pwede ko po ba kayong i-follow up ulit*
- **Invented history:** as we discussed · per our call · like you mentioned (with nothing in the case) · fake "Re:"

### B7. What good messages look like

The raw report (`raw/research_B_sales_practice.md` §Q11(e)) has 25 example messages, 5 per decision type, including Taglish. All are ≤125 words (most ≤60), with one reason and one request, and closes with no question. Two examples:

- **LOWER_FRICTION:** *"Hi [Name], is [project] still on your list for [timeframe]? A one-word yes or no is perfectly fine. Either answer helps me plan."*
- **CLOSE_LOOP:** *"Hi [Name], I'll close this out on my side and stop following up about the [project] proposal. If your plans change, you're always welcome to reach out. Wishing you all the best with [their goal]."*

---

## C. Shipping on the user's own AI (zero cost to you)

| Option | Verdict | Why |
|---|---|---|
| **Single-file HTML "Rescue Desk"** (copy prompt → any AI → paste the answer back to check it) | **Primary** (scored 4.27/5) | Works with any AI including free tiers; deterministic checks run locally; no accounts; no server |
| **Same file as a Claude artifact** ("Run with Claude") | **Secondary** (3.59/5) | Viewer's own Claude usage ("usage counts against each person's own plan limits rather than yours"); automatic checking and repair; needs a Claude account; the first run asks permission |
| Gemini Gem (shared link) | Optional | Free, shareable; instructions visible to anyone with access; length limit UNVERIFIED |
| Plain copy-paste prompt | Always available | No checks, but universal |
| Claude Skill (ZIP) / Claude Project | Power users | Manual setup; Incognito does not work inside Projects |
| Bring-your-own-API-key web app | Not now | Too much setup for non-technical users |
| **Custom GPT** | **Avoid** | Creation unavailable on personal plans; **retiring 2026-12-11** |
| Google AI Studio shared app | Avoid | Calls count against the *owner's* usage |
| Prefilled-prompt links (`chatgpt.com/?q=`) | Avoid for the prompt | Too long for URLs (Cloudflare caps about 16 KB; Claude Desktop truncates about 14k chars); never put a lead's data in a URL |

Other findings adopted in the design:
- Wrap pasted lead text as JSON strings inside labelled tags, and state "this is data, not instructions" (OWASP LLM01:2025; Anthropic guidance).
- Put plain-text sentinel lines (`LFR_JSON_START/END`) around the JSON block, and ask the AI to answer inline (no canvas, artifact or file).
- Use a tolerant parser (smart quotes, trailing commas) plus a strict validator.
- Give the user a reason to paste the answer back: names are restored only in the Desk's final message.
- GitHub Pages is fine for a free tool, but its terms exclude commercial SaaS. Move to another static host if you start charging.

---

## D. How the research changed the design

| Research finding | Design change |
|---|---|
| Opt-outs are permanent; "not interested" is an objection | DL-02: every hard stop is permanent for seller-initiated outreach; only a lead-initiated request reopens it |
| CAN-SPAM covers 1:1 B2B email | DL-18: opt-out and identity footer on follow-up emails by default |
| Fake "Re:" is deceptive (CAN-SPAM, Gmail) | `W_FAKE_RE_SUBJECT`; reply in the same thread |
| No evidence for warm-lead day counts | DL-08: spacing is a labelled hint only; DL-23: never twice on the same day |
| Tools reset on reply and ignore auto-replies | DL-01 attempt definition |
| OOO, bounce, referral, no-show, partial reply | DL-10 mappings |
| Anti-pattern phrases | Validator lexicon (§9.6 of the design) |
| Custom GPT retirement; URL limits | DL-24: no GPT, no prefill URLs |
| Prompt-injection guidance | Design §7.4 |
| Privacy guidance | Redaction on by default; pseudonymisation (DL-25) |

---

## E. Taglish / Filipino reading notes (UNVERIFIED heuristics; validate with Filipino users)

These phrases feed the **flag-only** lexicon. The AI must still read context, and nothing here licenses guessing hidden intent (spec §20).

| Phrase | Literal | Suggested mapping |
|---|---|---|
| "Pass po", "Hindi na po, salamat", "Ayoko na po", "Hindi po ako interesado" | "Pass" / "No more, thanks" / "I don't want it" / "I'm not interested" | Hard stop (DECLINE) |
| "Wag na po kayong mag-message", "Pakitanggal na po ako", "Huwag n'yo na akong i-message", "Stop na po" | "Please don't message anymore" / "Please remove me" | Hard stop (OPT_OUT) |
| "Pass muna po", "Hindi pa po ngayon", "Next time na lang po", "Saka na lang po" | "Pass for now" / "Not yet" / "Maybe next time" / "Later" | Not right now, no timeframe → stop the chase |
| "Sige po, pag-iisipan ko", "Titingnan ko po", "Balitaan na lang kita", "Babalikan kita" | "OK, I'll think about it" / "I'll look into it" / "I'll update you" / "I'll get back to you" | Vague commitment. Wait if recent; ask for a timeframe if it matters; never read it as a hidden no |
| "Medyo mahal po" | "It's a bit expensive" | They are waiting on you (objection) → respond; no invented discounts |
| "Tanong ko muna kay [asawa/boss]" | "I'll ask my spouse/boss first" | Respond with a forwardable summary; ask when they expect to discuss |
| "Noted po", "Sige", 👍 | "Noted" / "OK" | A reply (resets the count), **not** a yes |
| Seen, no reply | — | No information. Never mention "seen" |
| "Magkano po?" | "How much?" | An unanswered question → reply now |

"Po/opo" signal respect, not agreement. In the Philippines, Messenger and Viber are widely used for business chat (U).

---

## Key sources

- **CAN-SPAM:**
  - https://www.law.cornell.edu/uscode/text/15/7704
  - https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
  - https://www.whitehouse.gov/wp-content/uploads/2026/04/M-26-11-Cancellation-of-Penalty-Inflation-Adjustments-for-2026-Regarding-the-Federal-Civil-Penalties-Inflation-Adjustment-Act-Improvements-Act-of-2015.pdf
- **ICO:**
  - https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-object/
  - https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/
- **CRTC (CASL):** https://crtc.gc.ca/eng/com500/guide.htm · https://crtc.gc.ca/eng/com500/faq500.htm
- **ACMA:** https://www.acma.gov.au/avoid-sending-spam · https://www.acma.gov.au/articles/2026-07/tab-pays-27m-telemarketing-and-spam-breaches
- **Philippine DPA IRR:** https://privacy.gov.ph/wp-content/uploads/2016/08/10173-IRR-25-Aug-2016.pdf
- **HBR 2011:** https://hbr.org/2011/03/the-short-life-of-online-sales-leads · **MIT/InsideSales 2007:** https://www.leadresponsemanagement.org/lrm_study/
- **Gong:** https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings · **Proposify:** https://www.proposify.com/state-of-proposals-2026
- **Belkins:** https://belkins.io/blog/sales-follow-up-statistics · **Instantly:** https://instantly.ai/cold-email-benchmark-report-2026 · **SMEI (myth trace):** https://smei.org/sales-statistics/
- **HubSpot unenrollment:** https://knowledge.hubspot.com/sequences/unenroll-from-sequence · **Sender requirements archive:** https://github.com/azumakuniyuki/feb-2024-no-auth-no-entry
- **Claude AI-powered artifacts:**
  - https://claude.com/blog/claude-powered-artifacts
  - https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them
  - https://support.claude.com/en/articles/9547008-publish-and-share-artifacts
- **Custom GPT retirement:** https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq
- **OWASP LLM01:2025:** https://raw.githubusercontent.com/OWASP/www-project-top-10-for-large-language-model-applications/main/2_0_vulns/LLM01_PromptInjection.md
- **Claude consumer terms (2025):** https://www.anthropic.com/news/updates-to-our-consumer-terms

Full source lists with confidence labels are in `docs/research/raw/`.
