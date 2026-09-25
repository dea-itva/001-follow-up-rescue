# Manual cross-app check — TEMPLATE

Copy this file to `eval/manual/<YYYY-MM-DD>.md` and fill it in per
`docs/design/TEST_PLAN.md` §8.4 / `eval/README.md`'s "Manual cross-app
protocol" section. One copy per session is enough; re-run it whenever an app
changes its limits or menus, or the prompt changes version.

**Date:** _______  **Prompt version:** _______  **Tester:** _______

**The one rule:** this checklist produces observations, not a validation
claim. Write down what happened, not a verdict like "ChatGPT passed."

---

## Setup

- [ ] Rescue Desk build used: `dist/lead-follow-up-rescue.html` version / commit: _______
- [ ] For each app below, used a fresh, temporary, or incognito chat where the app offers one.

## The golden 10 fixtures

`D-03, D-06, D-08, D-14, D-31, D-36, D-37, R-05, R-16, R-20`

For each app × fixture, record:

1. Did the app accept the pasted prompt's length? (Copilot is the known risk case.)
2. The app's answer, parsed and checked via the Desk's **Check an answer** — status (`READY` / `READY_WITH_WARNINGS` / `FIX_REQUIRED` / `NO_MESSAGE_NEEDED` / `UNPARSEABLE`) and any violation codes.
3. Copy/paste behaviour: did the answer come back as plain text, or did the app open a canvas/artifact/file that had to be worked around?

### ChatGPT

| Fixture | Prompt accepted? | Check-an-answer status | Codes found | Notes |
|---|---|---|---|---|
| D-03 | | | | |
| D-06 | | | | |
| D-08 | | | | |
| D-14 | | | | |
| D-31 | | | | |
| D-36 | | | | |
| D-37 | | | | |
| R-05 | | | | |
| R-16 | | | | |
| R-20 | | | | |

### Claude

| Fixture | Prompt accepted? | Check-an-answer status | Codes found | Notes |
|---|---|---|---|---|
| D-03 | | | | |
| D-06 | | | | |
| D-08 | | | | |
| D-14 | | | | |
| D-31 | | | | |
| D-36 | | | | |
| D-37 | | | | |
| R-05 | | | | |
| R-16 | | | | |
| R-20 | | | | |

### Gemini

| Fixture | Prompt accepted? | Check-an-answer status | Codes found | Notes |
|---|---|---|---|---|
| D-03 | | | | |
| D-06 | | | | |
| D-08 | | | | |
| D-14 | | | | |
| D-31 | | | | |
| D-36 | | | | |
| D-37 | | | | |
| R-05 | | | | |
| R-16 | | | | |
| R-20 | | | | |

### Copilot

| Fixture | Prompt accepted? | Check-an-answer status | Codes found | Notes |
|---|---|---|---|---|
| D-03 | | | | |
| D-06 | | | | |
| D-08 | | | | |
| D-14 | | | | |
| D-31 | | | | |
| D-36 | | | | |
| D-37 | | | | |
| R-05 | | | | |
| R-16 | | | | |
| R-20 | | | | |

## Copy behaviour

| App | Desktop copy worked as expected? | Phone copy worked as expected? | Notes |
|---|---|---|---|
| ChatGPT | | | |
| Claude | | | |
| Gemini | | | |
| Copilot | | | |

## Open questions this resolves (research §C)

- [ ] Input length caps observed per app (esp. Copilot).
- [ ] Whether each app answered inline in the chat, or opened a canvas/artifact/file that needed a workaround.
- [ ] Any format drift (missing sentinels, reformatted JSON, added preamble) that the tolerant parser had to absorb.

## Summary (facts only, no verdicts)

_______________________________________________________
