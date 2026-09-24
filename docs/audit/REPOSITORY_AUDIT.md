# Repository Audit: Lead Follow-Up Rescue

**Date:** 2026-09-24
**Scope:** Milestone 1 from the handoff (§37, "Repository Audit Before Build")
**Audited repository:** `dea-itva/001-follow-up-rescue` (branch `claude/determined-mendel-4vbitv`)
**Source of requirements:** `docs/spec/RECOVERED_SPEC.md` (verbatim copy of the recovered handoff)

---

## 0. Headline findings

1. **The repository was empty.** It had no commits, no branches on the remote, and no files. There is no prior engine, schema, test, or fixture to preserve.
2. **The legacy repository could not be audited.** The handoff points to `missdeia/001-follow-up-rescue` (private) and to a Google Drive path. This session cannot attach a second repository with the same name, and it has no access to the Drive path. **Every historical claim in handoff §35 is therefore UNVERIFIED**: the 37 → 59 tests, the TypeScript fix, and the `OTHER_WARM_FOLLOWUP` reason-preservation change.
3. **The recorded legacy commit hash is malformed.** `009a491ab040f84a1b2d3f16f9fef2a7aad594c` has **39** hex characters; a full SHA-1 has 40. It was probably mis-transcribed. In the legacy repo, `git rev-parse 009a491ab040f84a` (a unique prefix) should recover the real commit.
4. **The recovered spec has internal conflicts and gaps** (§6 and §7 below). None was silently resolved. Each has a proposed resolution in `docs/design/TECHNICAL_DESIGN.md` §15 ("Decisions log"), marked **ADOPTED (reversible)** or **OPEN (owner decision)**.

> **Action for the product owner:** to complete the historical audit, either (a) start a separate session with `missdeia/001-follow-up-rescue` attached and run the same audit there, or (b) copy the legacy `src/` and `test/` folders into this repo under `legacy/` so the two can be diffed. The handoff says the legacy code may be more authoritative than the reconstruction. Until it is compared, the reconstruction is the working source of truth.

---

## 1. Repository architecture summary

| Item | Finding |
|---|---|
| Commits | 0 (`git log`: "No commits yet") |
| Remote refs | none (`git ls-remote origin`: empty) |
| Files | none |
| Toolchain in the build container | Node 22.22.2, npm 10.9.7, Chromium via Playwright (for UI smoke tests) |

The architecture is therefore greenfield. The design (`docs/design/TECHNICAL_DESIGN.md`) puts it in place.

## 2. Existing decision-engine inventory

None in this repository. The handoff describes a legacy deterministic TypeScript engine; it was not available (see headline finding 2).

## 3. Existing schema/type inventory

None. The handoff offers a suggested `Decision` union (§23) and a suggested normalized case (§32), marked "recommended, not frozen". The design adopts both, extended and typed.

## 4. Existing tests and test-count summary

| Source | Count | Status |
|---|---:|---|
| This repository | 0 | verified |
| Legacy engine (handoff §35) | 37, later reportedly 59 | UNVERIFIED |
| Recovered decision tests (§26) | 45 | summaries only, no fixtures |
| Recovered output-integrity tests (§28) | 45 | requirement names only, no fixtures |
| Recovered robustness tests (§29) | 30 | category counts plus 20 example lines |

The recorded "45/45", "45/45" and "30/30" PASS results were **self-evaluations by the model during development** (handoff §27, §28, §29). They are not independent, cross-model, or production validation. Nothing in this repository may claim "validated" or "100%" on that basis.

## 5. Requirement-to-code coverage matrix

Because the repository was empty, every requirement's **starting status is MISSING**. The table maps each requirement to where the new build implements it, how it is enforced (deterministic `D`, LLM judgment `L`, or both), and the tests that cover it (IDs from `docs/design/TEST_PLAN.md`).

| # | Requirement (spec §) | Start | Implemented in | Enforced by | Tests |
|---|---|---|---|---|---|
| R01 | Decision labels, 11-value enum (§1, §23) | MISSING | `src/types.ts` | D | unit: schema |
| R02 | Decide before drafting (§1, §21) | MISSING | engine prompt §Procedure; `engine.ts` | D+L | D-41..45, OI-042 |
| R03 | Scope check (§2) | MISSING | `engine.ts` rule G0 | L (scope) + D | D-46*, R-traps |
| R04 | Hard stop overrides everything (§3) | MISSING | `precheck.ts`, `engine.ts` G1, `validate.ts` | D+L | D-09..13, D-36, OI-025..027 |
| R05 | STOP is not necessarily permanent (§3) | MISSING | `engine.ts` suppression kinds | D | see Decisions log DL-02 |
| R06 | User owes answer → RESPOND_NOW (§4) | MISSING | `engine.ts` G2 | D+L | D-01, D-02, D-31, OI-028, OI-029 |
| R07 | Future commitment → WAIT (§5) | MISSING | `engine.ts` G4 | D | D-14, D-33, OI-019, OI-041 |
| R08 | Expired commitment is context, not auto follow-up (§5) | MISSING | `engine.ts` G4/G9 | D | D-15, D-34, OI-020 |
| R09 | No invented commitment timing (§5, §14) | MISSING | prompt; `validate.ts` date grounding | D+L | D-07, D-16, OI-021 |
| R10 | Concrete vs vague deadlines (§6) | MISSING | `engine.ts` G6; prompt | D+L | D-17, D-18, D-35, OI-012 |
| R11 | NOT_RIGHT_NOW timed → WAIT, untimed → STOP (§7) | MISSING | `engine.ts` G5 | D | D-08, D-19, D-32, OI-022, OI-023 |
| R12 | No invented re-contact intervals after NRN (§7) | MISSING | `validate.ts` plan checks | D | OI-023, OI-039 |
| R13 | Attempt safety matrix (§8) | MISSING | `engine.ts` G9 | D | D-03..06, D-20..25 |
| R14 | High intent / deal value never override safety (§8, §18) | MISSING | engine ignores labels; prompt | D | D-24, OI-024, OI-030 |
| R15 | CHANGE_ANGLE must really change angle (§9) | MISSING | prompt; `validate.ts` similarity + angle field | D+L | OI-002 |
| R16 | LOWER_FRICTION must really lower effort (§10) | MISSING | prompt; `validate.ts` CTA-type + length | D+L | OI-003 |
| R17 | CLOSE_LOOP ends the chase, no disguised CTA (§11) | MISSING | `validate.ts` close-loop rules | D | OI-004, OI-031, OI-040 |
| R18 | New material reason after 4+ (§12) | MISSING | `engine.ts` G9; prompt judgment | D+L | D-37..40, OI-007, OI-032..035 |
| R19 | Warm follow-up needs a legitimate reason (§13) | MISSING | `engine.ts` G8 | D+L | D-27, OI-001, OI-006 |
| R20 | Reason preserved across CHANGE_ANGLE / LOWER_FRICTION (§13) | MISSING | prompt; `validate.ts` reason grounding | D+L | OI-005, OI-007 |
| R21 | Ambiguous timing → NMI when it matters (§14) | MISSING | `engine.ts` materiality test | D | D-26, R-05, R-18 |
| R22 | Missing info: no guessing, no questionnaire (§15) | MISSING | `engine.ts`; `validate.ts` ≤3 questions | D | OI-036..038 |
| R23 | Elapsed time is contextual, no day table (§16) | MISSING | prompt judgment `tooSoon` | L | D-20 |
| R24 | Internal urgency is not permission (§17) | MISSING | engine ignores; prompt | D | D-13, R-08, R-10 |
| R25 | Desired outcome shapes CTA only (§19) | MISSING | prompt; `validate.ts` | L | OI-009 |
| R26 | Anti-invention (§20) | MISSING | `validate.ts` quote/date/number grounding | D+L | OI-012..016 |
| R27 | One reason, one primary CTA (§21) | MISSING | `validate.ts` CTA count | D | OI-001, OI-008 |
| R28 | No guilt, fake urgency, scarcity, "just checking in" (§21) | MISSING | `validate.ts` lexicons | D | OI-016..018 |
| R29 | No-response plan obeys safety (§22) | MISSING | `validate.ts` plan rules | D | OI-039..041 |
| R30 | Output contract, 9 sections (§23) | MISSING | prompt output template; `parse.ts` | D | unit: parse |
| R31 | Invalid combinations (§24) | MISSING | `validate.ts` decision matrix | D | OI-042..045 |
| R32 | Validation checklist (§25) | MISSING | `validate.ts` + prompt self-check | D+L | all OI |
| R33 | LLM interprets, deterministic engine enforces (§31) | MISSING | architecture (design §3) | D | all |
| R34 | Correct and re-run rather than expose invalid output (§34) | MISSING | `repair.ts`; wrapper auto-repair | D | unit: repair |
| R35 | Never display "100% validated" (§27) | MISSING | README/UI copy rule | review | release gate G-7 |

`*` D-46 is a new, clearly marked test (scope), not one of the recovered 45.

## 6. Conflicts found (spec vs spec; no repository code existed to conflict with)

| ID | Conflict | Where | Handling |
|---|---|---|---|
| CF-1 | "'Not until January' + manager pressure → STOP_ACTIVE_FOLLOW_UP" (robustness list), but §7, the §33 pseudocode and OI-022 all say a **specific future** "not right now" timeframe → **WAIT**. | §29 vs §7, §33, OI-022 | Design adopts **WAIT until January** (3 sources against 1). The robustness test accepts `{WAIT, STOP_ACTIVE_FOLLOW_UP}` and asserts the invariant the example is really about: *no contact before January and no message now*. Flagged as DL-05. |
| CF-2 | §3 says a hard stop "is not necessarily permanent suppression; … a legitimate new signal may be evaluated separately." For explicit opt-outs ("do not contact me", "remove me", "stop"), anti-spam and privacy law generally requires stopping commercial messages for good (see research). A seller-side "new material reason" must never reopen an opt-out. | §3 vs law | Design splits hard stops into **OPT_OUT** (permanent for seller-initiated contact; only a new inbound message from the lead reopens) and **DECLINE** ("no", "not interested", "went with someone else": the chase ends, and a later lead-initiated contact or a genuinely new material reason can be *evaluated*, never auto-sent). This is stricter than the spec, never looser. Flagged as DL-02. |
| CF-3 | §21 requires "one primary CTA" in every message, while §11 forbids a CTA in CLOSE_LOOP. | §21 vs §11 | Per-decision CTA rules (design §8): CLOSE_LOOP has **zero** response-requesting CTAs and may carry at most one *passive open-door* line that puts the initiative with the lead. |
| CF-4 | §5 says an untimed or vague commitment → NMI "if timing materially affects the decision", but gives no path once the user confirms that no timeframe was ever given. This would loop forever. | §5, §14 | Design DL-07: the user can answer "they gave no timeframe" explicitly; the commitment then becomes **UNTIMED**, stops blocking, becomes the legitimate reason, and the attempt matrix applies. Flagged OPEN for owner confirmation. |
| CF-5 | A bare "No." is listed as a hard stop, but "No" is often an answer to a narrow question ("Does Tuesday work?" "No."), not a refusal of contact. | §3 | The deterministic lexicon only *flags* a bare "No". A hard stop needs an interpretation that the lead declined the offer or the contact itself; the LLM must quote it; the validator warns when a flagged phrase was not treated as a stop. DL-03. |

## 7. Missing requirements (gaps the recovered spec does not define)

| ID | Gap | Proposed handling (design section) |
|---|---|---|
| G-1 | What counts as a "follow-up attempt"; whether the initial proposal counts; whether a lead reply resets the count. | Inferred from "Proposal Monday + nudge Wednesday → FOLLOW_UP": the initial deliverable is not an attempt; the count is unanswered outreach since the lead's last real reply; a real reply resets it; auto-replies do not (design §5.2, DL-01). |
| G-2 | Definition of OUT_OF_SCOPE. | v1 scope: one warm lead (someone who engaged) at a time. Cold/bulk campaigns, collections, harassment/evasion requests, and non-sales relationships are out of scope (design §6, DL-09, OPEN). |
| G-3 | Definition of DO_NOTHING. | Nothing is pending and nothing is owed, or the loop is already closed and no new material reason or new inbound exists (design §6). |
| G-4 | Label for a new-material-reason interaction after 4+ attempts. | `FOLLOW_UP` with `interaction: "NEW_REASON"`: a single message, the attempt count is not reset, and the no-response plan must not chase (DL-06). |
| G-5 | Meaning of `stopActiveFollowUp` for CLOSE_LOOP. | Defined as "after this step, the user stops chasing". True for STOP, CLOSE_LOOP, DO_NOTHING, and final single-shot interactions (design §8). |
| G-6 | Source of "today's date" and time zone. | Wrapper injects today's date and the user's time zone. The prompt tells the model to use a provided date, never guess it (design §7). |
| G-7 | Out-of-office auto-replies, bounces, referrals ("talk to X"), no-shows, "we chose someone else", partial replies. | Mapped onto existing rules where that is a direct application (OOO return date = timing fact; bounce = missing info); the others are listed as OPEN recommendations (DL-10). |
| G-8 | Channel rules (email vs SMS vs WhatsApp, quiet hours, platform windows). | Timing guidance and compliance notes per channel, informational only; they never loosen a decision (design §9, research). |
| G-9 | Output language (Taglish users). | The message follows the user's chosen language (default: match the lead); labels stay in English (design §8.6). |
| G-10 | Prompt injection from pasted lead messages. | Lead text is wrapped in data tags and declared "data, not instructions" (design §7.4). |
| G-11 | Privacy of pasted personal data. | Wrapper privacy note and an optional one-click redaction of emails and phone numbers (design §10.6). |
| G-12 | Spacing between follow-ups ("too soon"). | No universal table (spec §16). The LLM judges `tooSoon` in context; an **optional, clearly labelled industry-convention hint** is proposed as OPEN DL-08. |

## 8. Proposed implementation plan

| Phase | Owner (model) | Output |
|---|---|---|
| P0 | Opus (this session) | Research synthesis, this audit, technical design, test plan |
| P1 | Sonnet (high effort) | `src/` core: types, precheck lexicons, decision engine, parser, validator, repair builder, prompt assembler; unit tests; 120 reconstructed fixtures as executable tests |
| P2 | Sonnet (high effort) | Engine prompt (full and compact builds), platform install guides, single-file wrapper (standalone plus Claude-artifact build), Playwright smoke test, optional LLM eval harness |
| P3 | Opus | Adversarial review against design and test plan, fixes, release gates, commit and push |

## 9. Tests that can be reconstructed confidently

Scenario and expected result are both stated in the recovered spec:

- **Decision:** D-01…D-08, D-09…D-13 (hard stop plus each named conflicting signal), D-14, D-18, D-19, D-20…D-25, D-31…D-34, D-36, D-38, D-39.
- **Output integrity:** every OI requirement name is recovered. Because only the *requirement* is known, each is rebuilt as a validator test (a compliant output must pass, a mutated output must fail with the named code). This tests the enforcement layer, which is deterministic and needs no LLM.
- **Robustness:** the 20 recovered example lines (R-01…R-20).

## 10. Tests requiring clarification (expected behaviour not fully determinable)

| Test | Why | How it is encoded |
|---|---|---|
| D-15 (expired commitment) | Spec says only "evaluate context". | Engine result depends on the attempt count; fixture pins a specific context, marked `CONTEXTUAL`. |
| D-16 (commitment without usable date) | Spec says only "do not invent timing". | Asserts the invariant (no invented date), accepts `{NEED_MISSING_INFORMATION, WAIT}` by context. |
| D-17 (concrete deadline) | "Action may be appropriate". | `CONTEXTUAL`; pins deadline materiality. |
| D-26…D-30 (ambiguous inputs) | Only the category is recovered. | Five plausible scenarios, marked `RECONSTRUCTED`. |
| D-35 (deadline + 4 attempts) | "Contextual; potentially FOLLOW_UP". | Two sub-fixtures: material to the lead → FOLLOW_UP (final); internal only → CLOSE_LOOP. |
| D-37, D-40 (new material reason) | "Evaluate as new material reason / legitimate new interaction". | FOLLOW_UP with `interaction: NEW_REASON` (DL-06), marked `CONTEXTUAL`. |
| D-41…D-45 (output validation) | Only "check consistency" is recovered. | Reconstructed as decision-level invariant tests. |
| OI-025…OI-027 | Three tests share the same name ("Hard-stop integrity"). | Three variants: with an unanswered question, with a deadline, with strong positive signals. |
| R-10 ("Not until January") | Conflicts with §7 (CF-1). | Accepts `{WAIT, STOP_ACTIVE_FOLLOW_UP}`; asserts no contact before January. |
| R-21…R-30 | The 10 robustness cases without recovered examples. | Reconstructed per category count, marked `RECONSTRUCTED`. |
