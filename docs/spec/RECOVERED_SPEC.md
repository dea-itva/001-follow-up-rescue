# Lead Follow-Up Rescue
## Codex Build Handoff: Recovered Product Specification

**Status:** Recovered from project conversation  
**Purpose:** Engineering handoff for Codex  
**Product:** Lead Follow-Up Rescue  
**Important:** This document is a recovered specification. The previously referenced “frozen artifacts” are not currently available as standalone source files. Do not assume this document reproduces their original wording verbatim.

---

## 1. Product Definition

**Core job:**

> Given what happened with a lead, determine the most appropriate next step.

Lead Follow-Up Rescue is **not primarily a follow-up message generator**.

The system must decide whether contacting the lead is appropriate **before** generating any message.

### Decision labels

```text
RESPOND_NOW
WAIT
FOLLOW_UP
CHANGE_ANGLE
LOWER_FRICTION
CLOSE_LOOP
STOP_ACTIVE_FOLLOW_UP
NEED_MISSING_INFORMATION
NEED_FOLLOW_UP_REASON
OUT_OF_SCOPE
DO_NOTHING
```

### Operating principle

> Do not ask “What message can I send?” until deciding “Should I contact this person at all?”

---

## 2. Decision Hierarchy

Recovered hierarchy, in order:

1. Scope check
2. Hard stop
3. User owes answer
4. Explicit commitment / agreed next step
5. Concrete deadline
6. Follow-up safety / attempt count
7. Scenario-specific timing
8. Time-based stage adjustment
9. Desired outcome / CTA
10. Message / no-response strategy
11. Output validation

This must **not** be implemented as a simplistic “first condition always wins” switch.

Some conditions are true overrides. Others require joint evaluation.

Example: an expired commitment may make follow-up relevant, but it does not automatically override the four-attempt safety rule.

---

## 3. Hard-Stop Logic

A hard stop includes explicit signals such as:

```text
No.
Not interested.
Do not contact me.
Stop contacting me.
Please remove me.
Don't message me again.
```

When a hard stop exists:

```text
DECISION = STOP_ACTIVE_FOLLOW_UP
MESSAGE = none
STOP_ACTIVE_FOLLOW_UP = true
```

Hard stop overrides:

- unanswered questions
- high intent
- deadlines
- commitments
- desired outcome
- urgency
- attempt count
- potential deal value

No follow-up message should be generated.

### Important distinction

`STOP_ACTIVE_FOLLOW_UP` is not necessarily permanent suppression.

It ends the current active chase. A genuinely new future inbound interaction or legitimate new signal may be evaluated separately.

---

## 4. User-Owes-Answer Logic

If the lead asked the user a legitimate unanswered question, the system should normally return:

```text
RESPOND_NOW
```

Example:

> Lead: “Can you send me your pricing?”

If the user has not responded, that is not a follow-up problem. The user owes the lead an answer.

Hard stop still overrides this.

A tested conflict case was:

```text
Lead asked a question
+
4 previous attempts
=
RESPOND_NOW
```

assuming no hard stop or conflicting context makes contact inappropriate.

---

## 5. Explicit Commitment Logic

Examples:

> “I'll send the documents tomorrow.”

> “Let's reconnect Friday.”

> “I'll speak to my partner and get back to you Monday.”

### Future commitment

If the agreed time has not arrived:

```text
WAIT
```

Do not chase before the agreed time.

### Commitment arrived or passed

The commitment becomes actionable context.

It does **not** automatically mean `FOLLOW_UP`.

Continue evaluating:

- attempt count
- deadline
- scenario
- previous interactions
- new information
- follow-up safety

### Commitment with no usable timeframe

Do not invent one.

If timing materially affects the decision:

```text
NEED_MISSING_INFORMATION
```

---

## 6. Concrete Deadline Logic

A deadline must have specific temporal meaning.

Examples that may qualify:

```text
“We need a decision by Friday.”
“Enrollment closes September 30.”
“The event is on Saturday.”
```

Vague urgency does not automatically qualify:

```text
ASAP
soon
urgent
when you can
as soon as possible
```

unless surrounding context establishes an actual temporal boundary.

A deadline can justify action, but does **not** automatically override follow-up safety.

At four or more attempts, the deadline must create a materially legitimate reason for another interaction.

Hard stops and `NOT_RIGHT_NOW` override internal urgency/deadline pressure.

---

## 7. NOT_RIGHT_NOW Logic

This is separate from ordinary silence.

Examples:

> “Not right now.”

> “Maybe later.”

> “Let's revisit this in January.”

### Specific future timeframe

Example:

> “Contact me in January.”

The system should wait/re-engage according to that timeframe.

### No timeframe

Example:

> “I'm interested, but not right now.”

The current active chase stops:

```text
STOP_ACTIVE_FOLLOW_UP
```

The system must **not invent**:

```text
follow up in 7 days
follow up in 14 days
follow up next month
follow up in 30 days
```

Attempt count cannot resurrect the chase.

Positive interest cannot override `NOT_RIGHT_NOW`.

---

## 8. Follow-Up Attempt Safety Matrix

| Previous follow-up attempts | Default strategy |
|---:|---|
| 0 | Normal response/follow-up based on context |
| 1 | `FOLLOW_UP` |
| 2 | `CHANGE_ANGLE` |
| 3 | `LOWER_FRICTION` / move toward closure |
| 4+ | `CLOSE_LOOP` |

These are not blind rules. Higher-priority signals can change the result.

Examples:

```text
4 attempts + unanswered lead question
→ RESPOND_NOW
```

```text
4 attempts + “this lead seemed really interested”
→ CLOSE_LOOP
```

High intent does **not** justify unlimited chasing.

Potential deal value also does not override safety rules.

---

## 9. CHANGE_ANGLE Logic

At approximately two previous follow-ups, the system should not simply rewrite:

> “Just checking in.”

The next interaction should materially change the approach.

That may mean changing:

- reason for contacting
- framing
- question
- information offered
- direction of conversation

The output-integrity tests require the system to **actually change the angle**, not merely label an ordinary follow-up `CHANGE_ANGLE`.

---

## 10. LOWER_FRICTION Logic

Around the third unsuccessful follow-up, reduce the amount of effort required from the lead.

A lower-friction message might:

- require a simpler response
- eliminate unnecessary questions
- reduce decision pressure
- make the next step easier
- move toward closure

The output must genuinely reduce friction.

Changing the label while asking the same demanding question is a failure.

---

## 11. CLOSE_LOOP Logic

Normally applies at four or more attempts when no stronger legitimate reason overrides it.

The objective is to **end the chase cleanly**.

A close-loop message must not secretly restart the follow-up sequence.

Therefore `CLOSE_LOOP` must not contain another follow-up CTA disguised as closure.

The output-integrity tests specifically check:

```text
CLOSE_LOOP cannot restart chase
```

---

## 12. New Material Reason After 4+ Attempts

Four attempts do not mean the person can never be contacted again.

A **genuinely new, materially relevant reason** can create a separate interaction opportunity.

Example:

The lead previously said:

> “We need integration with X before we can move forward.”

Four follow-ups happened and the sequence ended.

Later, integration with X becomes available.

That may justify a new interaction.

### Requirements

The reason must be:

- specific
- genuine
- new
- directly relevant to the lead
- connected to a stated need/problem/objection/context

It does **not** reset the attempt count.

It does **not** reopen the old chase sequence.

It is evaluated as a **new interaction opportunity**.

If relevance is unclear:

```text
NEED_MISSING_INFORMATION
```

Fake “new reasons” must not bypass safety logic.

---

## 13. OTHER_WARM_FOLLOWUP Logic

A generic warm follow-up requires a legitimate reason.

Examples of legitimate reasons:

- promised resource
- requested document
- meaningful update
- requested status update
- event follow-up
- material change
- genuinely new relevant information

This is insufficient:

> “I haven't heard from them and want to check in.”

If the reason is missing:

```text
NEED_FOLLOW_UP_REASON
MESSAGE = none
```

The legitimate reason must remain intact when the system transitions into `CHANGE_ANGLE` or `LOWER_FRICTION`.

---

## 14. Ambiguous Timing Logic

The system must not manufacture dates from vague language.

Examples:

```text
soon
later
after the holidays
sometime next week
I'll get back to you
```

If precise timing materially affects the decision and cannot be determined:

```text
NEED_MISSING_INFORMATION
```

Ask only for missing information that could materially alter the decision.

---

## 15. Missing-Information Policy

Avoid two opposite failures.

### Failure A: Guessing

Do not infer:

> “They're probably busy.”

> “They're obviously interested.”

> “They must have forgotten.”

> “Price is probably the objection.”

### Failure B: Interrogating

Do not respond with a giant questionnaire whenever context is incomplete.

### Rule

> Ask only for information that could materially change the decision.

---

## 16. Time-Since-Interaction Logic

Elapsed time is **contextual**, not a universal formula.

There is no recovered rule such as:

```text
3 days = follow up
7 days = change angle
14 days = close loop
```

Timing must be interpreted with:

- scenario
- previous interaction
- commitments
- deadlines
- attempt count
- what was promised
- whether a response is owed

Do **not** invent a universal day-count table unless explicitly designed later.

---

## 17. Urgency Logic

Urgency is contextual.

Vague user urgency such as:

> “I really need this deal.”

> “My manager wants an answer.”

> “This is a huge account.”

does not automatically justify contacting the lead.

Internal pressure is not equivalent to permission or a legitimate external reason to contact someone.

---

## 18. Relationship and Deal-Value Logic

Labels such as:

```text
hot lead
VIP
huge account
dream client
high intent
qualified
big opportunity
```

do not independently change the decision.

They may provide context but cannot override safety rules.

---

## 19. Desired-Outcome Logic

The user's desired outcome primarily affects the **CTA**, not whether contact is appropriate.

Examples:

```text
book a call
get a decision
receive documents
confirm attendance
answer a question
move proposal forward
```

Desired outcome cannot override:

- hard stop
- `NOT_RIGHT_NOW`
- attempt safety
- commitment timing
- missing critical information

---

## 20. Anti-Invention Constraints

The system must never invent:

- dates
- deadlines
- commitments
- lead intent
- reasons for silence
- objections
- urgency
- prior statements
- facts
- promised actions
- interest level

Silence does not equal:

```text
rejection
interest
busy
forgotten
objection
```

unless supported by actual context.

---

## 21. Message-Generation Constraints

When a message is appropriate, it should contain:

- **one legitimate reason for contact**
- **one primary CTA**

The message should use friction appropriate to the decision stage.

It must avoid:

- guilt
- manipulation
- fake urgency
- fake scarcity
- fabricated facts
- manufactured deadlines
- invented objections
- assumptions presented as facts
- repeated “just checking in” behavior

The message should be generated **after** the decision, not before.

---

## 22. No-Response Strategy

Every actionable follow-up output should include what happens if the lead does not respond.

The no-response plan must obey the same safety logic.

Invalid example:

```text
DECISION = CLOSE_LOOP
NO-RESPONSE PLAN = Follow up again in three days.
```

Similarly:

```text
DECISION = WAIT
```

cannot include instructions to chase before the agreed time.

---

## 23. Output Contract

Recovered output structure:

```text
DECISION

TIMING

REASON

ACTION

MESSAGE

NO-RESPONSE PLAN

DO NOT DO

STOP ACTIVE FOLLOW-UP

MISSING INFORMATION
```

Codex should ideally implement this as a typed structured object internally even if the UI renders readable text.

Suggested TypeScript enum:

```ts
type Decision =
  | "RESPOND_NOW"
  | "WAIT"
  | "FOLLOW_UP"
  | "CHANGE_ANGLE"
  | "LOWER_FRICTION"
  | "CLOSE_LOOP"
  | "STOP_ACTIVE_FOLLOW_UP"
  | "NEED_MISSING_INFORMATION"
  | "NEED_FOLLOW_UP_REASON"
  | "OUT_OF_SCOPE"
  | "DO_NOTHING";
```

Suggested result fields:

```text
decision
timing
reason
action
message
noResponsePlan
doNotDo
stopActiveFollowUp
missingInformation
```

The exact implementation schema was **not frozen**, so Codex can design it cleanly.

---

## 24. Output Consistency Constraints

Treat these combinations as invalid:

```text
WAIT + immediate outreach message

STOP_ACTIVE_FOLLOW_UP + follow-up message

CLOSE_LOOP + plan to chase again

NEED_MISSING_INFORMATION + fabricated answer

NEED_FOLLOW_UP_REASON + generated follow-up anyway

hard stop + CTA

DO_NOTHING + outreach message
```

Decision, timing, reason, action, message, and no-response plan must agree.

---

## 25. Validation Checklist

Before returning an answer, validate at least:

- Scope
- Hard stop
- Unanswered lead question
- Commitment state
- Deadline
- Attempt count
- `NOT_RIGHT_NOW`
- Legitimate follow-up reason
- Invented information
- Unsupported assumptions
- Timing
- Desired outcome
- 4+ attempt safety
- New material reason
- One legitimate reason
- One primary CTA
- Decision/message consistency
- Stop flag consistency
- `DO_NOTHING` consistency
- Missing-information handling

This can become an internal validator rather than relying entirely on the LLM.

---

# TESTING

## 26. Decision Test Suite v1.0

We established **45 decision tests**.

The original exact test artifact is unavailable, but the recovered matrix is below.

### Tests 1-8: Basic scenarios

| Test | Scenario | Expected |
|---|---|---|
| 01 | New inquiry | `RESPOND_NOW` |
| 02 | Requested information not yet sent | `RESPOND_NOW` |
| 03 | Proposal + 1 follow-up | `FOLLOW_UP` |
| 04 | Proposal + 2 follow-ups | `CHANGE_ANGLE` |
| 05 | Proposal + 3 follow-ups | `LOWER_FRICTION` |
| 06 | 4+ attempts | `CLOSE_LOOP` |
| 07 | “I'll get back to you” without usable date | `NEED_MISSING_INFORMATION` |
| 08 | “Not right now” without timeframe | `STOP_ACTIVE_FOLLOW_UP` |

### Tests 9-13: Hard-stop / safety

Hard-stop variations must return:

```text
STOP_ACTIVE_FOLLOW_UP
```

including combinations involving:

- unanswered question
- deadline
- high intent
- previous commitment
- user urgency

### Tests 14-19: Commitments / deadlines

| Test | Scenario | Expected |
|---|---|---|
| 14 | Future commitment | `WAIT` |
| 15 | Expired commitment | Evaluate context; follow-up may be appropriate |
| 16 | Commitment without usable date | Do not invent timing |
| 17 | Concrete deadline | Action may be appropriate |
| 18 | “ASAP” | Not automatically a concrete deadline |
| 19 | `NOT_RIGHT_NOW` + internal deadline | `STOP_ACTIVE_FOLLOW_UP` |

### Tests 20-25: Attempt count

| Test | Scenario | Expected |
|---|---|---|
| 20 | Zero attempts | Normal response/follow-up based on context |
| 21 | One attempt | `FOLLOW_UP` |
| 22 | Two attempts | `CHANGE_ANGLE` |
| 23 | Three attempts | `LOWER_FRICTION` |
| 24 | Four attempts + high intent | `CLOSE_LOOP` |
| 25 | Seven attempts | `CLOSE_LOOP` |

### Tests 26-30: Ambiguous inputs

Expected outcomes centered on:

```text
NEED_MISSING_INFORMATION
```

or:

```text
NEED_FOLLOW_UP_REASON
```

rather than guessing.

### Tests 31-36: Adversarial conflicts

| Test | Scenario | Expected |
|---|---|---|
| 31 | Unanswered question + four attempts | `RESPOND_NOW` |
| 32 | `NOT_RIGHT_NOW` + four attempts | `STOP_ACTIVE_FOLLOW_UP` |
| 33 | Future commitment + three attempts | `WAIT` |
| 34 | Expired commitment + four attempts | `CLOSE_LOOP` |
| 35 | Concrete deadline + four attempts | Contextual; potentially `FOLLOW_UP` |
| 36 | Hard stop + conflicting positive signals | `STOP_ACTIVE_FOLLOW_UP` |

### Tests 37-40: New material reason

| Test | Scenario | Expected |
|---|---|---|
| 37 | New relevant integration after four attempts | Evaluate as new material reason |
| 38 | Fake “new reason” | `CLOSE_LOOP` / do not reopen chase |
| 39 | Irrelevant new information | `CLOSE_LOOP` / do not reopen chase |
| 40 | New information directly addressing prior objection | Evaluate as legitimate new interaction |

### Tests 41-45: Output/message validation

Check consistency between:

- decision
- message
- reason
- CTA
- timing
- no-response strategy

---

## 27. Decision Benchmark

Recovered benchmark:

```text
45 / 45 PASS
```

### Qualification

This was a **self-evaluation using the model during development**.

It was **not**:

- independently audited
- cross-model validated
- tested against production traffic
- tested with real giveaway users

Special contextual cases noted during benchmarking:

```text
015
017
035
```

because they required contextual rather than purely mechanical evaluation.

Do not display “100% validated” based on this benchmark.

---

## 28. Output Integrity Test Suite v1.0

A separate **45-test output-integrity suite** was created.

Decision tests ask:

> Did the system choose the right action?

Output-integrity tests ask:

> Did the system execute that action correctly?

### Recovered matrix

| ID | Requirement |
|---|---|
| OI-001 | Follow-up has legitimate reason + CTA |
| OI-002 | `CHANGE_ANGLE` materially changes angle |
| OI-003 | `LOWER_FRICTION` actually reduces effort |
| OI-004 | `CLOSE_LOOP` actually ends chase; no follow-up CTA |
| OI-005 | Reason grounded in actual interaction |
| OI-006 | No manufactured reason |
| OI-007 | New material reason preserved |
| OI-008 | One primary CTA |
| OI-009 | CTA matches desired outcome |
| OI-010 | No CTA when stopping |
| OI-011 | No message when waiting |
| OI-012 | No invented deadline |
| OI-013 | No invented interest |
| OI-014 | No invented objection |
| OI-015 | No invented previous conversation |
| OI-016 | No fake urgency |
| OI-017 | No guilt |
| OI-018 | No artificial scarcity |
| OI-019 | Future commitment → wait |
| OI-020 | Expired commitment represented accurately |
| OI-021 | Vague timing remains vague |
| OI-022 | Future `NOT_RIGHT_NOW` → wait |
| OI-023 | Untimed `NOT_RIGHT_NOW` → stop |
| OI-024 | High intent does not override safety |
| OI-025 | Hard-stop integrity |
| OI-026 | Hard-stop integrity |
| OI-027 | Hard-stop integrity |
| OI-028 | Answer lead's unanswered question |
| OI-029 | Four attempts + unanswered question |
| OI-030 | High intent + five attempts |
| OI-031 | No disguised restart |
| OI-032 | New material reason drives new message |
| OI-033 | Relevant new information handled correctly |
| OI-034 | Irrelevant new information does not reopen chase |
| OI-035 | Manufactured reason rejected |
| OI-036 | Insufficient context handled safely |
| OI-037 | No excessive questionnaire |
| OI-038 | Critical missing fact requested |
| OI-039 | No-response plan follows safety rules |
| OI-040 | `CLOSE_LOOP` cannot restart sequence |
| OI-041 | `WAIT` cannot produce earlier chase |
| OI-042 | Decision/message consistency |
| OI-043 | Reason/action consistency |
| OI-044 | Timing/message consistency |
| OI-045 | Stop-flag consistency |

Recovered result:

```text
45 / 45 PASS
```

Again, this was internal model self-evaluation rather than external empirical validation.

---

## 29. Real-World Robustness Test v1.0

We tested **30 deliberately messy inputs**.

### Results

| Category | Result |
|---|---:|
| Conversational shorthand | 5/5 |
| Incomplete information | 5/5 |
| Contradictory signals | 5/5 |
| User bias | 3/3 |
| Mixed Taglish | 4/4 |
| Messy timing | 3/3 |
| CRM-style context | 1/1 |
| Excessive context | 1/1 |
| Message-first traps | 3/3 |
| **Total** | **30/30** |

### Recovered examples

```text
Proposal Monday + nudge Wednesday + silence
→ FOLLOW_UP

Two follow-ups + “ghosting”
→ CHANGE_ANGLE
Do not accept “ghosting” as proof of intent.

High intent + five messages
→ CLOSE_LOOP

Not now + no timeframe
→ STOP_ACTIVE_FOLLOW_UP

“Get back soon” + ten days
→ NEED_MISSING_INFORMATION

“No reply. What do I say?”
→ NEED_MISSING_INFORMATION

Proposal two weeks ago with insufficient context
→ NEED_MISSING_INFORMATION

“Maybe later” + user desperately needs deal
→ STOP_ACTIVE_FOLLOW_UP

“Do not contact” + unanswered question
→ STOP_ACTIVE_FOLLOW_UP

“Not until January” + manager pressure
→ STOP_ACTIVE_FOLLOW_UP

Documents promised tomorrow
→ WAIT

Documents promised yesterday + four attempts
→ CLOSE_LOOP

User says lead is “obviously interested”
→ do not accept unsupported assumption

User says lead is “just busy”
→ do not accept unsupported assumption

Mixed Taglish + two follow-ups
→ CHANGE_ANGLE

Mixed Taglish + interested but “not now”
→ STOP_ACTIVE_FOLLOW_UP

Four follow-ups + newly available requested integration
→ evaluate new material reason

“After the holidays”
→ NEED_MISSING_INFORMATION when timing matters

“ASAP”
→ not automatically concrete deadline

Six messages + user asks to disguise another follow-up
→ CLOSE_LOOP
```

Recovered result:

```text
30 / 30 PASS
```

Same qualification: internal self-test.

---

## 30. Total Recovered Test Coverage

At minimum, the project has documented:

```text
45 decision tests
45 output-integrity tests
30 messy-input robustness tests
-------------------------------
120 test cases
```

All were recorded as passing during internal model evaluation.

This is meaningful design validation, but **not production validation**.

---

# IMPLEMENTATION GUIDANCE

## 31. What Codex Should Make Deterministic

Implement deterministic checks wherever practical for:

- attempt-count bands
- hard-stop flags
- explicit `NOT_RIGHT_NOW`
- whether user owes an answer
- future commitment state
- stop-flag consistency
- decision/message compatibility
- missing-message enforcement
- maximum one primary CTA where detectable
- `CLOSE_LOOP` / no-response compatibility

Use the LLM for semantic judgment such as:

- interpreting messy natural language
- identifying whether a statement constitutes a commitment
- determining whether new information is materially relevant
- evaluating ambiguous context
- identifying unsupported assumptions
- generating an appropriate message
- explaining the decision

### Architecture principle

> **LLM for interpretation. Deterministic engine for enforcement.**

---

## 32. Suggested Processing Pipeline

```text
RAW USER INPUT
      ↓
CONTEXT EXTRACTION
      ↓
NORMALIZED CASE
      ↓
HARD-SAFETY CHECKS
      ↓
DECISION ENGINE
      ↓
LLM SEMANTIC JUDGMENT where required
      ↓
DECISION
      ↓
MESSAGE GENERATION if permitted
      ↓
OUTPUT VALIDATOR
      ↓
FINAL RESULT
```

### Suggested normalized case

```text
scenarioType
lastMeaningfulInteraction
lastInteractionDate
attemptCount
hardStop
notRightNow
notRightNowTiming
userOwesAnswer
commitment
commitmentTiming
commitmentStatus
deadline
deadlineType
followUpReason
newMaterialReason
desiredOutcome
leadIntentEvidence
userAssumptions
channel
missingCriticalInformation
```

This schema is a **recommended implementation**, not one of the frozen recovered artifacts.

---

## 33. Decision-Engine Pseudocode

This is a reconstruction suitable for Codex, not the verbatim original:

```text
evaluate(case):

    if out_of_scope(case):
        return OUT_OF_SCOPE

    if explicit_hard_stop(case):
        return STOP_ACTIVE_FOLLOW_UP

    if user_owes_answer(case):
        return RESPOND_NOW

    evaluate commitment

    if commitment_is_future:
        return WAIT

    evaluate NOT_RIGHT_NOW

    if not_right_now_with_future_time:
        return WAIT

    if not_right_now_without_time:
        return STOP_ACTIVE_FOLLOW_UP

    evaluate deadline
    evaluate follow_up_reason
    evaluate new_material_reason
    evaluate missing_critical_information

    if critical_information_missing:
        return NEED_MISSING_INFORMATION

    if warm_followup_requires_reason
       and legitimate_reason_missing:
        return NEED_FOLLOW_UP_REASON

    if attempts >= 4:
        if legitimate_new_material_reason:
            evaluate as new interaction opportunity
        else:
            return CLOSE_LOOP

    if attempts == 3:
        return LOWER_FRICTION

    if attempts == 2:
        return CHANGE_ANGLE

    if attempts == 1:
        return FOLLOW_UP

    evaluate scenario-specific action

    if outreach_is_not_appropriate:
        return DO_NOTHING

    return appropriate contextual decision
```

Do not treat this pseudocode as complete. Commitments, deadlines, attempt safety, and new material reasons sometimes require joint evaluation.

---

## 34. Validator Concept

After the LLM generates a result, run a validation layer.

```text
validate(result, case):

    assert decision is valid enum

    if hardStop:
        assert decision == STOP_ACTIVE_FOLLOW_UP
        assert message == null
        assert stopActiveFollowUp == true

    if decision == WAIT:
        assert message == null
        assert noResponsePlan does not instruct earlier outreach

    if decision == STOP_ACTIVE_FOLLOW_UP:
        assert message == null
        assert primaryCTA == null

    if decision == CLOSE_LOOP:
        assert noResponsePlan does not schedule another chase

    if decision == NEED_MISSING_INFORMATION:
        assert no invented missing fact

    if decision == NEED_FOLLOW_UP_REASON:
        assert message == null

    assert no unsupported deadline
    assert no unsupported commitment
    assert no unsupported objection
    assert no unsupported lead intent
    assert no fake urgency

    if message exists:
        assert legitimateReasonCount <= 1
        assert primaryCTACount <= 1

    assert timing agrees with decision
    assert action agrees with decision
    assert reason agrees with decision
```

If validation fails, correct/re-run the output rather than exposing the invalid result.

---

# EXISTING CODEBASE

## 35. Previous TypeScript Implementation

Before switching to prompt-first development, a deterministic TypeScript engine was being built.

### Known local project path

```text
/Users/deapanganiban/Library/CloudStorage/GoogleDrive-alpha@deapsolutions.com/Shared drives/CODEX/001 - Follow-Up Rescue
```

### Private GitHub repository

```text
git@github.com:missdeia/001-follow-up-rescue.git
```

### Known earlier state

- initial engine reached **37 passing tests**
- Milestone 1 fixed a TypeScript issue
- commit recorded as `009a491ab040f84a1b2d3f16f9fef2a7aad594c`
- later hardening reportedly reached **59 tests**
- a subsequent focused change was made to preserve `OTHER_WARM_FOLLOWUP` reason across the 2-3 attempt strategies
- Codex usage limits interrupted verification of that last change
- app development was intentionally paused afterward

The existing repository may contain the actual earlier deterministic implementation and test cases. Treat repository source/tests as potentially more authoritative historical evidence than reconstructed details in this handoff.

---

## 36. What Is NOT Safely Recovered

Do not assume we possess:

- verbatim Core Specification v1.1 document
- verbatim Core Prompt v1.1
- original exact 45 decision-test fixtures
- original exact 45 integrity-test fixtures
- exact robustness-test fixture files
- complete original decision matrix
- production analytics
- cross-model validation
- external-user validation

We have strong recovered descriptions, but not all original source artifacts.

Distinguish:

```text
RECOVERED SPECIFICATION
```

from:

```text
ORIGINAL SOURCE CODE / TESTS FOUND IN REPOSITORY
```

If they conflict, **do not silently choose one**. Flag the conflict.

---

# CODEX MISSION

## 37. First Milestone: Repository Audit Before Build

Use the following as the initial Codex instruction:

> Audit the existing `001-follow-up-rescue` repository before writing new code. Treat the recovered Lead Follow-Up Rescue specification supplied with this task as the current product requirements, but do not assume it exactly reproduces every historical implementation detail. Identify the existing decision engine, schemas, tests, fixtures, and documentation first. Map each recovered requirement to existing code/tests and classify it as **IMPLEMENTED**, **PARTIAL**, **MISSING**, or **CONFLICTING**. Preserve working behavior unless it conflicts with the current recovered specification. Do not modify product logic merely to make tests pass. Reconstruct the 45 decision tests, 45 output-integrity tests, and 30 robustness cases into executable test coverage where the supplied requirements provide enough information. Flag cases whose exact expected behavior cannot be determined rather than inventing requirements. Build the system so semantic interpretation can use an LLM while safety-critical rules and output consistency are deterministically enforced. The product is called **Lead Follow-Up Rescue**.

### Required first output from Codex

Before substantial implementation, produce:

1. Repository architecture summary
2. Existing decision-engine inventory
3. Existing schema/type inventory
4. Existing tests and test-count summary
5. Requirement-to-code coverage matrix
6. Conflicts between repository behavior and this recovered specification
7. Missing requirements
8. Proposed implementation plan
9. Tests that can be reconstructed confidently
10. Tests requiring clarification

Do **not** silently redesign ambiguous product rules.

---

## 38. Product Status at Handoff

| Area | Status |
|---|---|
| Product name | **Lead Follow-Up Rescue** |
| Product purpose | Defined |
| Decision hierarchy | Recovered |
| Decision labels | Recovered |
| Hard-stop logic | Recovered |
| Commitment logic | Recovered |
| Deadline logic | Recovered |
| `NOT_RIGHT_NOW` logic | Recovered |
| Attempt-count matrix | Recovered |
| New-material-reason logic | Recovered |
| Message constraints | Recovered |
| Output contract | Recovered |
| Validation rules | Recovered |
| Decision tests | 45 summarized |
| Output-integrity tests | 45 summarized |
| Robustness tests | 30 summarized |
| Internal benchmark | 120/120 recorded PASS across three suites |
| Cross-model validation | Not performed |
| External usability validation | Not performed |
| Production validation | Not performed |
| Existing TypeScript repository | Yes |
| Exact frozen Core Prompt v1.1 | Not currently recovered |
| Exact standalone frozen artifacts | Not currently recovered |

---

## 39. Engineering Principle

The goal is not to maximize how often the system sends another follow-up.

The goal is:

> **Given what actually happened, determine the most appropriate next step without inventing context or encouraging unnecessary chasing.**

Decision first. Message second.
