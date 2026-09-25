# Installing Lead Follow-Up Rescue

Lead Follow-Up Rescue decides the next right step for one warm lead — then, only if that's the right move, drafts the one message to send. It runs entirely on **your own AI account** (Claude, ChatGPT, Gemini, Copilot, or any other chat AI). There's no sign-up with us, no server, and nothing you type is sent anywhere except to the AI you choose, when you choose to send it.

Below are seven ways to use it, in the order we'd recommend trying them. Pick whichever fits how you already work — you don't need to set up more than one. Each one includes three example messages ("conversation starters") you can try right away.

> **Platform facts in this guide were checked on 2026-09-24.** AI products change their menus, limits and policies often. If a step below doesn't match what you see on screen, look for the nearest equivalent (e.g. "Custom Instructions" instead of "Project Instructions") — the underlying idea is always the same: give the AI the rules once, then describe your lead. A few figures are marked **unverified**: they come from third-party reports we could not independently confirm at launch, so treat them as "approximately," not exact.

**Three starters you can use in any of the setups below** (the rules are identical everywhere — only how you deliver them changes):

1. *"Sent Ana the bookkeeping proposal on Monday, followed up once on Thursday. Nothing back. What now?"*
2. *"A lead asked 'Do you do bookkeeping for restaurants? What do you charge?' on our Facebook page yesterday and I haven't answered yet."*
3. *"They said 'not right now, maybe later' — no date given. What should I do?"*

---

## Before you start: a word on privacy

You're about to paste someone else's words into an AI you don't control. A little care goes a long way:

- **Share the minimum.** Paste only what the decision needs — you rarely need the lead's full email signature, phone number, or company letterhead.
- **Avoid sensitive data.** Don't paste health information, financial account numbers, government IDs, or anything similarly sensitive, even if the lead volunteered it.
- **Prefer a temporary or incognito chat**, and turn off "improve the model with my conversations" (or the equivalent) in your AI's settings. Claude's Incognito chat works on every plan, but **not** inside Claude Projects.
- **Working for a client?** Use a business AI plan with a data-processing agreement rather than a free personal account.
- **If your lead is in the Philippines:** under the Data Privacy Act, you remain responsible for the lead's personal data you paste into a third party's AI, even briefly. Keep it proportionate to what the decision actually needs.

The Rescue Desk (options 1–2 below) can also hide emails, phone numbers and links, and swap real names for placeholders, automatically, before anything is copied or sent — look for the "Privacy and sign-off" section of the form.

---

## 1. The Rescue Desk file (recommended for most people)

A single web page that runs the whole flow for you: fill in a short form, watch a live provisional decision appear as you type, then copy a ready-made prompt to your AI of choice — or, if you're signed in to Claude, run it with one click (see option 2).

**Setup:**
1. Open `dist/lead-follow-up-rescue.html` in any browser — double-click the file, or open the hosted link if your business has published one. Nothing to install, nothing to sign up for.
2. Answer the short form about your lead: what happened, how many times you've followed up, what they said, and so on. You'll see a provisional decision appear on the right as you go.
3. Click **Copy prompt for any AI**. Open ChatGPT, Claude, Gemini or Copilot in a new (ideally temporary/incognito) chat, paste, and send.
4. Copy the AI's whole reply and paste it back into **Check an answer** on the Desk. It will show you a clean result card and flag anything that broke a rule.

*If you're hosting this yourself:* GitHub Pages is fine for a free tool, but its terms of service exclude commercial SaaS use — if you start charging for access, move to a different static host.

**Try it with:** any of the three starters above, typed into the "Their words" or "Your notes" field.

---

## 2. The Rescue Desk inside Claude (one click, fully automatic)

The same tool, published as a Claude artifact, with one added feature: click a button and Claude drafts and checks the answer for you automatically — no copy-pasting required.

**Setup:**
1. Open the published artifact link (ask whoever shared this guide with you for it, or find it in the project's README).
2. Sign in to Claude if you aren't already — a free plan works.
3. Fill in the same short form as option 1.
4. Click **Run with Claude**. The first time, Claude will ask your permission to use the tool — allow it once. Usage counts against **your own** Claude plan, not ours.
5. The result card appears automatically, already checked. If anything needs fixing, the Desk offers one automatic repair round.

**Try it with:** the three starters above.

---

## 3. A Claude Project (for people who follow up often)

Good if you do this every week and want the rules saved permanently in your own Claude account.

**Setup:**
1. In Claude, go to **Projects** → **Create project**.
2. Open `prompt/lead-follow-up-rescue.md` (the FULL rules) and copy its entire contents.
3. Paste it into the project's **Instructions** field, and save.
4. Start a new chat inside that project whenever you have a lead to check.

*Free Claude plans allow up to 5 projects.* **Note:** Incognito chat does not work inside Projects, so avoid pasting anything sensitive, or use the Desk's redaction toggle first and paste the redacted version.

**Try it with:** the three starters above, typed straight into a new chat in the project.

---

## 4. A Claude Skill (power users, works on every plan)

A Skill is a reusable capability Claude can call on automatically when it recognizes a matching request — no project setup required, and it works even on plans that don't offer Projects.

**Setup:**
1. Zip the folder `skill/lead-follow-up-rescue/` (it contains `SKILL.md`).
2. In Claude's settings, find where Skills are uploaded (this may be under **Capabilities** or **Skills**, depending on your plan) and upload the zip.
3. Make sure **code execution** is enabled for your account — Skills need it to run.
4. In any chat, just describe your lead's situation; Claude will recognize when the Skill applies.

**Try it with:** the three starters above, typed into any ordinary chat once the Skill is installed.

---

## 5. A ChatGPT Project

**Setup:**
1. In ChatGPT, create a new **Project**.
2. Open `prompt/lead-follow-up-rescue.compact.md` (the COMPACT rules) and paste its contents into the project's **Custom Instructions**. ChatGPT Project instructions have a limit of roughly 8,000 characters (an unverified, third-party figure — if it's rejected, trim slightly).
3. Also upload `prompt/lead-follow-up-rescue.md` (the FULL rules) as a **project file**. The compact instructions explicitly tell the model to defer to this file when it's present.
4. Start any chat inside the project and describe your lead.

*No Project available on your plan?* Just paste the FULL prompt at the very start of any regular chat, then describe your lead in the same message or the next one.

**Try it with:** the three starters above.

---

## 6. A Gemini Gem

**Setup:**
1. In Gemini, go to **Gems** → **New Gem**.
2. Paste the FULL prompt (`prompt/lead-follow-up-rescue.md`) into the Gem's instructions.
3. Save and name the Gem (e.g. "Lead Follow-Up Rescue").
4. Chat with the Gem whenever you have a lead to check.

**A privacy note specific to Gems:** anyone you share the Gem with can read its full instructions, not just chat with it. Only share it with people who should see the rules themselves.

*Gemini's instruction-length limit is unverified as of this writing.* If your Gem rejects the FULL prompt as too long, use the COMPACT version (`prompt/lead-follow-up-rescue.compact.md`) instead.

**Try it with:** the three starters above.

---

## 7. Any other chat AI (Copilot, and anything else)

The rules are a plain prompt, so they work anywhere you can paste text.

**Setup:**
1. Start a new chat.
2. Paste the FULL prompt (`prompt/lead-follow-up-rescue.md`).
3. In the same message, or the next one, describe what happened with your lead.

*If the AI rejects the FULL prompt as too long* (Copilot's input limit, in particular, may be smaller — this is untested), use `prompt/lead-follow-up-rescue.compact.md` instead.

**Try it with:** the three starters above.

---

## A note on what we don't offer

**We don't offer this as a Custom GPT**, and don't plan to. Two reasons: creating a new Custom GPT is unavailable on personal ChatGPT plans (Free, Go, Plus and Pro; only business workspace plans can create them), and OpenAI has scheduled Custom GPTs to retire on 2026-12-11 — building a distribution path around a feature that's already being phased out wouldn't serve you well. Options 5 and 7 above give you the same result in ChatGPT without relying on that feature.

We also don't offer a prefilled-prompt link (something like `chatgpt.com/?q=...`). The full rules are too long to fit in a URL — Cloudflare caps URLs at roughly 16 KB, and Claude Desktop truncates the `q` parameter at around 14,000 characters — and a URL is also the wrong place to carry a lead's personal data, since URLs get logged in browser history, proxies and analytics tools far more readily than a pasted chat message does.

---

*Questions, or something on this page doesn't match what you see? The rules themselves live in `prompt/lead-follow-up-rescue.md` (full) and `prompt/lead-follow-up-rescue.compact.md` (compact) — the deciding logic is identical everywhere; only where you paste it differs.*
