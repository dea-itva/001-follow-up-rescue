/**
 * Maps Rescue Desk form answers to `Facts`, and compares two `Facts` for
 * form-vs-AI mismatches (design §10.3, §9.2 `W_FACT_MISMATCH`).
 */

import type { CaseInput, Facts, FactMismatch, TimingRef } from "./types.js";

function orNull(text: string): string | null {
  const t = text.trim();
  return t === "" ? null : t;
}

/**
 * Builds a `TimingRef` from the form's `timeframe` answer. Returns `null` when
 * the field was never meaningfully answered ("doesn't apply" or unanswered) —
 * callers decide what that means for the field it would attach to.
 *
 * The same mapping is used whether the timeframe will attach to `notRightNow`
 * or to `commitment` (design §10.3's attach rule only decides *which* field it
 * goes on, not how the words are read): `resolve()` in the engine already
 * branches on NRN vs. commitment for the NONE case, and here NONE_GIVEN always
 * means UNTIMED and an explicit "not sure whether a timeframe exists" always
 * means AMBIGUOUS in both branches, so a single mapping is sufficient.
 *
 * TODO(design): the form's timeframe control has no state for "not sure whether
 * any timeframe was given at all" distinct from "vague, and not sure if it has
 * passed". We model that case (`timeframe.answer === "UNSURE"`) as a VAGUE
 * timing with AMBIGUOUS resolution, since that is the one TimingRef shape that
 * `resolve()` reads as an unknown in both the NRN and commitment branches.
 */
function timingRefFromTimeframe(tf: CaseInput["timeframe"]): TimingRef | null {
  switch (tf.answer) {
    case "EXACT":
      return { type: "SPECIFIC", words: orNull(tf.words), date: tf.date, resolution: null };
    case "VAGUE": {
      const resolution = tf.vagueStatus === "PASSED" ? "PASSED" : tf.vagueStatus === "FUTURE" ? "FUTURE" : "AMBIGUOUS";
      return { type: "VAGUE", words: orNull(tf.words), date: null, resolution };
    }
    case "NONE_GIVEN":
      return { type: "NONE", words: null, date: null, resolution: "UNTIMED" };
    case "UNSURE":
      return { type: "VAGUE", words: orNull(tf.words), date: null, resolution: "AMBIGUOUS" };
    case "NA":
    case null:
      return null;
  }
}

/**
 * Maps the Rescue Desk's form answers (`CaseInput`) to `Facts` (design §10.3).
 *
 * Fields the form never asked about (because progressive disclosure never
 * showed them, or the user left them unanswered) keep safe defaults rather
 * than becoming "unknowns" that would force extra questions the Desk never
 * asked: `closeLoopSent` false, `newInfo` null, `deadline` null, `scope`
 * `IN_SCOPE`. Scope screening and judgment fields (`tooSoon` beyond DL-23,
 * `newInfo.material`, vague-timing resolution beyond what the form's own
 * "has that passed?" question captures) are LLM-only and are left at their
 * defaults here.
 */
export function factsFromForm(input: CaseInput): Facts {
  const attempts = input.attempts === "UNSURE" || input.attempts === null ? null : input.attempts;

  const hardStop: Facts["hardStop"] =
    input.stop.answer === "OPT_OUT"
      ? { kind: "OPT_OUT", quote: input.stop.words, sure: true }
      : input.stop.answer === "DECLINE"
        ? { kind: "DECLINE", quote: input.stop.words, sure: true }
        : null;

  const owedResponse: Facts["owedResponse"] =
    input.owed.answer === "YES"
      ? { kind: "QUESTION", quote: input.owed.text, sure: true }
      : input.owed.answer === "UNSURE"
        ? { kind: "QUESTION", quote: input.owed.text, sure: false }
        : null;

  let notRightNow: Facts["notRightNow"] = null;
  let commitment: Facts["commitment"] = null;
  if (input.scenario === "NOT_RIGHT_NOW") {
    const ref = timingRefFromTimeframe(input.timeframe) ?? {
      type: "NONE" as const,
      words: null,
      date: null,
      resolution: "UNTIMED" as const,
    };
    notRightNow = { quote: input.timeframe.words, timing: ref };
  } else {
    const ref = timingRefFromTimeframe(input.timeframe);
    if (ref) {
      commitment = { by: "LEAD", quote: input.timeframe.words, timing: ref };
    }
  }

  const deadline: Facts["deadline"] =
    input.deadline.answer === "YES"
      ? {
          quote: input.deadline.what,
          kind: input.deadline.date ? "CONCRETE" : "VAGUE",
          date: input.deadline.date,
          owner: input.deadline.whose === "LEAD" ? "LEAD" : input.deadline.whose === "MINE" ? "USER_INTERNAL" : "EXTERNAL",
          // The lead's own deadline bears on their own goal by definition (design §5.13), so the
          // Desk doesn't ask "does this matter to them?". An external deadline stays an unknown,
          // and "only mine" is never material.
          materialToLead: input.deadline.whose === "LEAD" ? true : input.deadline.whose === "MINE" ? false : null,
        }
      : null;

  const newInfoText = input.newInfo.text.trim();
  const newInfo: Facts["newInfo"] =
    newInfoText === ""
      ? null
      : {
          text: newInfoText,
          linkedNeedQuote: input.newInfo.linked === "YES" ? orNull(input.newInfo.linkedWords) : null,
          material: input.newInfo.linked === "YES" ? "YES" : input.newInfo.linked === "NO" ? "NO" : "UNCLEAR",
        };

  const tooSoon = input.lastUserMessageDate !== null && input.lastUserMessageDate === input.today; // DL-23

  return {
    today: input.today,
    scope: "IN_SCOPE",
    scenario: input.scenario,
    channel: input.channel,
    attempts,
    attemptsRange: null,
    closeLoopSent: input.closeLoopSent ?? false,
    hardStop,
    notRightNow,
    owedResponse,
    commitment,
    deadline,
    reason: null,
    newInfo,
    tooSoon,
    intentEvidence: [],
    userAssumptions: [],
    pressure: [],
    desiredOutcome: input.desiredOutcome,
  };
}

function timingSummary(f: Facts): { type: string; resolution: string | null; date: string | null } | null {
  const ref = f.notRightNow?.timing ?? f.commitment?.timing ?? null;
  if (!ref) return null;
  return { type: ref.type, resolution: ref.resolution, date: ref.date };
}

/**
 * Compares two `Facts` (typically the form's and the AI's) and reports
 * mismatches in the fields the Desk warns about (design §9.2 `W_FACT_MISMATCH`):
 * attempts, an owed response, timeframe (NRN/commitment timing), a deadline,
 * and a hard stop.
 */
export function compareFacts(form: Facts, ai: Facts): FactMismatch[] {
  const mismatches: FactMismatch[] = [];

  if (form.attempts !== null && ai.attempts !== null && form.attempts !== ai.attempts) {
    mismatches.push({
      field: "attempts",
      formValue: form.attempts,
      aiValue: ai.attempts,
      message: `The form says ${form.attempts} follow-up(s); the AI's facts say ${ai.attempts}.`,
    });
  }

  const formOwed = form.owedResponse !== null;
  const aiOwed = ai.owedResponse !== null;
  if (formOwed !== aiOwed) {
    mismatches.push({
      field: "owedResponse",
      formValue: form.owedResponse,
      aiValue: ai.owedResponse,
      message: formOwed
        ? "The form says there's something of theirs you haven't answered; the AI's facts don't."
        : "The AI's facts say there's something of theirs you haven't answered; the form says no.",
    });
  }

  const formHardStop = form.hardStop?.kind ?? null;
  const aiHardStop = ai.hardStop?.kind ?? null;
  if (formHardStop !== aiHardStop) {
    mismatches.push({
      field: "hardStop",
      formValue: formHardStop,
      aiValue: aiHardStop,
      message: `The form says stop/decline is ${formHardStop ?? "not present"}; the AI's facts say ${aiHardStop ?? "not present"}.`,
    });
  }

  const formTiming = timingSummary(form);
  const aiTiming = timingSummary(ai);
  const timingDiffers =
    (formTiming === null) !== (aiTiming === null) ||
    (formTiming !== null &&
      aiTiming !== null &&
      (formTiming.type !== aiTiming.type || formTiming.resolution !== aiTiming.resolution || formTiming.date !== aiTiming.date));
  if (timingDiffers) {
    mismatches.push({
      field: "timeframe",
      formValue: formTiming,
      aiValue: aiTiming,
      message: "The form's timeframe and the AI's read of the lead's timing differ.",
    });
  }

  const formDeadline = form.deadline ? { kind: form.deadline.kind, date: form.deadline.date, owner: form.deadline.owner } : null;
  const aiDeadline = ai.deadline ? { kind: ai.deadline.kind, date: ai.deadline.date, owner: ai.deadline.owner } : null;
  const deadlineDiffers =
    (formDeadline === null) !== (aiDeadline === null) ||
    (formDeadline !== null &&
      aiDeadline !== null &&
      (formDeadline.kind !== aiDeadline.kind || formDeadline.date !== aiDeadline.date || formDeadline.owner !== aiDeadline.owner));
  if (deadlineDiffers) {
    mismatches.push({
      field: "deadline",
      formValue: formDeadline,
      aiValue: aiDeadline,
      message: "The form's deadline and the AI's facts differ.",
    });
  }

  return mismatches;
}
