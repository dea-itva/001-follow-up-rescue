# Changelog

All notable changes to Lead Follow-Up Rescue are recorded here. Versions
follow `docs/design/TECHNICAL_DESIGN.md` §14: `ENGINE_VERSION`,
`PROMPT_VERSION` (semver) and the output schema (`lfr/1.0`) move together
with this file, the design doc, the prompt, and the affected fixtures.

## v1.0.0 — 2026-09-24

Initial release: engine v1.0.0, prompt v1.0.0, schema `lfr/1.0`.

### Research and design

- Recovered and reconciled the product spec (`docs/spec/RECOVERED_SPEC.md`)
  against a gap/conflict audit (`docs/audit/REPOSITORY_AUDIT.md`).
- Industry and legal due-diligence research across compliance (stop/opt-out
  law in the US, UK/EU, Canada, Australia and the Philippines), sales
  follow-up practice, and distribution options (`docs/research/
  INDUSTRY_RESEARCH.md`).
- Authored the technical design (`docs/design/TECHNICAL_DESIGN.md`) and
  companion test plan (`docs/design/TEST_PLAN.md`), including a decisions
  log (§15) of 26 explicit design choices, five left `OPEN` for the product
  owner.

### Core engine (`src/`)

- The 11-decision deterministic engine (`decide`/`decideCore`), evaluating
  the gates G0–G7 in order, with full unknown-handling: every materially
  uncertain fact is enumerated, the decision's sensitivity to it is tested
  by cross-product, and at most 3 targeted questions are asked back.
- Domain types, date arithmetic, the bilingual (English/Taglish/Filipino)
  signal lexicon, form-to-facts mapping, quote grounding and similarity, and
  optional redaction/pseudonymization of contact details and names.
- Zero runtime dependencies; the core never touches the DOM and runs
  identically in Node (tests, the eval harness) and in the browser (the
  Rescue Desk).

### Validator and prompt (`src/validate.ts`, `src/prompt.ts`, `src/parse.ts`, `src/repair.ts`)

- A tolerant answer parser (sentinel-delimited JSON, fenced blocks, a
  balanced-brace fallback, smart-quote/trailing-comma repair) and a
  deterministic validator covering the full per-decision invariant table,
  quote grounding, CTA detection, message anti-patterns (fake urgency,
  guilt, invented facts, disguised restarts, …), and cross-checks between
  the form's own answers and the AI's stated facts.
- The engine prompt (FULL and COMPACT builds) and the case-block assembler,
  with prompt-injection defenses (sanitization, JSON-string segregation,
  explicit "data, not instructions" policy, deterministic injection
  flagging) per OWASP LLM01:2025.
- A one-round repair-prompt builder, mirroring the Rescue Desk's automatic
  repair flow.
- Three reconstructed fixture suites (decision, output-integrity,
  robustness) covering the recovered spec's 45+45+30 tests plus new
  design-decision cases, all running deterministically in CI.

### Wrapper (Rescue Desk UI)

- The single-page Rescue Desk (in progress by another contributor at the
  time of this entry): a two-pane case/decision UI with a live provisional
  decision slip, a chase-ladder visualization, copy-to-any-AI and
  Claude-artifact "Run with Claude" flows, a result card with automatic
  repair, and the privacy controls (redaction, pseudonymization, opt-out
  footer) described in the design's §10.

### Eval harness

- An optional, zero-CI cross-model evaluation harness (`eval/run.ts`):
  fetch-only calls to Anthropic, OpenAI and Google, graded against the same
  deterministic `decide()`/`validate()` core the fixture tests use, with a
  one-round automatic repair, Wilson 95%-interval reporting, a decision
  confusion matrix, and a hard cost guard (`--yes` required to spend
  anything). Ships with its own unit tests (mocked network, canned
  fixtures) and a manual cross-app checklist (`eval/manual/TEMPLATE.md`)
  for the four consumer chat apps.
