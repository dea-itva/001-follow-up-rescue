# Cross-model evaluation (L3) and manual cross-app check (L5)

This is the **optional** part of Lead Follow-Up Rescue: it measures how well
real chat models follow the engine prompt, using API keys **you** provide and
pay for. Nothing here runs in CI, nothing here is required for the tool to
work, and nothing here is a certification. See "The one rule" below before
you read any report this produces.

Companion docs: `docs/design/TECHNICAL_DESIGN.md` §7 (the prompt) and
`docs/design/TEST_PLAN.md` §8 (the full spec for this harness).

## What it measures

For a sample of the fixture catalogue (`tests/fixtures/decision.json` and
`tests/fixtures/robustness.json`), the harness:

1. Sends each fixture's `raw` text (and, in `desk` mode, the same case block
   the Rescue Desk itself would build) to a real model.
2. Parses the model's answer with the same tolerant parser
   (`src/parse.ts`) the Desk uses.
3. Grades it with the same deterministic validator (`src/validate.ts`) and
   decision engine (`src/engine.ts`) the fixture tests use — the identical
   code, not a re-implementation, so a model's mistake and a validator bug
   can never be confused with each other.
4. If the answer had any error, sends one repair round (mirroring the Desk's
   Claude-mode automatic repair) and grades the repaired answer too.
5. Reports rates with a 95% confidence interval, a decision confusion
   matrix, and the model's most common violation codes, before and after
   repair.

It measures the **prompt against a model**, not the model in general — a low
score can mean the prompt needs to be clearer for that model, not that the
model is bad at the underlying task.

## The one rule

**Never call these results "validated," "100% accurate," or any other
certification word.** Report them exactly the way TEST_PLAN §8.3 requires:

> "Measured on N fixtures × S samples with MODEL on DATE (prompt vX.Y.Z): …"

That sentence, or one just like it, is printed at the top of every
`.md` report this harness writes, and repeated here on purpose. If you quote
a number from a report anywhere else (a README, a pitch, a support answer),
carry the same qualifier with it.

## How to run it

Nothing runs without your own API key for the provider you name, and nothing
runs at all until you've seen the cost estimate and passed `--yes`.

```bash
# Build the harness once (from the repo root):
npm run build   # bundles eval/run.ts -> dist/eval.mjs

# Set the key(s) for whichever provider(s) you're running:
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=...

# See the cost estimate without spending anything:
npm run eval -- --provider anthropic --model claude-sonnet-5

# Run it for real:
npm run eval -- --provider anthropic --model claude-sonnet-5 --yes

# Run two providers side by side, fewer samples, only the decision suite:
npm run eval -- \
  --provider anthropic --model claude-sonnet-5 \
  --provider openai --model gpt-5 \
  --samples 2 --suites decision --yes

# A quick smoke run on a couple of fixtures:
npm run eval -- --provider anthropic --model claude-sonnet-5 --only D-03,D-06,R-16 --yes
```

### Flags

| Flag | Meaning | Default |
|---|---|---|
| `--provider anthropic\|openai\|google` | Repeatable. Each one needs its own `--model` in the same position. | (none — required) |
| `--model <id>` | One model id per `--provider`, in the order given. | (none — required per provider) |
| `--samples N` | Completions per fixture per mode. | `3` |
| `--mode raw\|desk\|both` | `raw` = plain-chat style (FULL prompt + the fixture's raw text); `desk` = the Rescue Desk's own case block. | `both` |
| `--suites decision,robustness` | Which fixture files to draw from. | both |
| `--only <ids>` | Comma-separated fixture ids, e.g. `D-03,R-16`. | (all) |
| `--limit N` | Cap the fixture count after other filters. | (none) |
| `--out <dir>` | Where to write the dated report. | `eval/reports` |
| `--yes` | Actually spend the estimated budget. Without it, the harness only prints the estimate and stops. | off |

Fixtures `D-41`…`D-45` are skipped (they're engine-level-only checks with no
`raw` text to send a model). Every other fixture with `raw` text is eligible.

### Cost estimate

Before it calls anything, the harness prints its estimated input-token count
(`characters / 4`, the same rough conversion used elsewhere in this repo) for
the whole run and asks for `--yes`. As a planning figure: a full run across
both suites (~120 eligible fixtures) × 3 samples × both modes × one provider
is roughly **7,000 tokens per fixture-mode-sample**, so about
**≈120 × 3 × 2 × 7,000 ≈ 5,000,000 input tokens** for one model's full run —
plus output tokens for each answer, plus more again for any repair rounds.
At current per-provider pricing that is roughly **US$10–20 for one model's
full run** (TEST_PLAN §2); scale down with `--samples`, `--suites`,
`--only` or `--limit` for a cheaper spot-check.

## Reading a report

Each run writes two files per provider/model to `eval/reports/`:
`<YYYY-MM-DD>-<provider>-<model>.json` (machine-readable) and the matching
`.md` (for a human). The Markdown report has:

- **Overall rates**, each with a Wilson 95% interval: parse success, decision
  acceptance (all fixtures, and separately for `EXACT`-confidence fixtures),
  safety-critical violations after repair (target: 0 — see TEST_PLAN §8.2 for
  the list of codes that count as safety-critical), and the error-free rate
  before any repair (this one tunes the prompt; it has no pass/fail target).
- **A decision confusion matrix**: for each fixture's expected decision, what
  the model actually answered (after repair, when a repair round ran).
- **Top violation codes**, before and after repair, so you can see which
  rules a model most often gets wrong and whether the repair round fixes it.
- **Invariants**: the fixtures' free-text `invariants` field (`ONE_CTA`,
  `NO_BLAME`, …), graded wherever this harness can check them
  deterministically from `validate()`'s own output. Anything the harness
  cannot check safely — right now, only `MATCHES_LANGUAGE`, which would need
  real language identification — is reported as `not_checked`, on purpose,
  rather than silently counted as a pass. `not_checked` is not a claim of
  correctness.
- **Per-fixture rows**: sample count, decision-acceptance rate, error-free
  rate, and which violation codes appeared, one row per fixture.

## Manual cross-app protocol (L5)

TEST_PLAN §8.4 also calls for a **manual** check across the consumer chat
apps people actually paste this prompt into (free tiers, no API). This isn't
automatable — it's about how each app's UI behaves — so it's a checklist,
not a script.

**The golden 10** (TEST_PLAN §8.4): `D-03, D-06, D-08, D-14, D-31, D-36,
D-37, R-05, R-16, R-20`.

**Apps:** ChatGPT, Claude, Gemini, Copilot. Use a fresh or temporary/incognito
chat in each, where the app offers one.

For each app × case, in the Rescue Desk:

1. Load the fixture's case (or paste its `raw` text into a fresh chat) and
   click **Copy prompt**.
2. Paste the prompt into the app and send it.
3. Record whether the app accepted the prompt's length at all (this is the
   known risk case for Copilot — TEST_PLAN §8.4, design §12).
4. Paste the app's whole answer into the Desk's **Check an answer** and
   record the status and any violation codes.
5. Record how copy/paste behaved, once on desktop and once on a phone.

Write your results to `eval/manual/<YYYY-MM-DD>.md`, starting from
[`eval/manual/TEMPLATE.md`](./manual/TEMPLATE.md). This also answers the
research doc's open questions on input caps, format adherence and copy
behaviour (`docs/research/INDUSTRY_RESEARCH.md` §C).

## What this harness does *not* do

- It does not run in CI (`.github/workflows/ci.yml` never sets an API key).
- It does not claim to cover every model, every prompt phrasing, or every
  real lead conversation — only the fixture catalogue, which is itself a
  reconstruction (see `docs/design/TEST_PLAN.md` §1.3's confidence labels).
- It does not replace the deterministic test suites (`npm test`), which are
  the actual release gate (`docs/design/TEST_PLAN.md` §10). This harness is
  additional evidence about how a *model*, not the *engine*, behaves.
