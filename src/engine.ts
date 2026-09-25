/**
 * The deterministic decision engine (design §6).
 *
 * `decideCore` implements the gates of §6.1 exactly, on fully-known facts.
 * `decide` is the public entry point: it enumerates every unknown per §6.3,
 * runs `decideCore` over the full cross-product, and reports which fields are
 * material.
 *
 * Pure and deterministic: never mutates `facts`, and the same input always
 * produces the same output.
 */

import { compareDates } from "./dates.js";
import {
  DECISIONS,
  type Decision,
  type EngineResult,
  type Facts,
  type Interaction,
  type ReasonType,
  type Scenario,
  type Suppression,
  type TimingRef,
  type TimingResolution,
  type UnknownField,
} from "./types.js";

// ---------------------------------------------------------------------------
// Policy (design §6.1)
// ---------------------------------------------------------------------------

export interface Policy {
  /** DL-02 / DL-06: whether a genuinely new material reason can end an untimed NRN pause. */
  newReasonReopensPause: boolean;
}

export const DEFAULT_POLICY: Policy = { newReasonReopensPause: true };

// ---------------------------------------------------------------------------
// §8.1 Per-decision invariants
// ---------------------------------------------------------------------------

/** Exported for `src/validate.ts`, which checks the invariant table (§8.1) against an AI's own stated decision. */
export function baseMessageAllowed(decision: Decision): boolean {
  switch (decision) {
    case "RESPOND_NOW":
    case "FOLLOW_UP":
    case "CHANGE_ANGLE":
    case "LOWER_FRICTION":
    case "CLOSE_LOOP":
      return true;
    default:
      return false;
  }
}

/** Exported for `src/validate.ts` (§8.1's `stopActiveFollowUp` column, for `E_STOP_FLAG`). */
export function baseStopActiveFollowUp(decision: Decision): boolean {
  switch (decision) {
    case "STOP_ACTIVE_FOLLOW_UP":
    case "CLOSE_LOOP":
    case "DO_NOTHING":
      return true;
    default:
      return false;
  }
}

/**
 * Default `interaction` for a decision. Only RESPOND_NOW (REPLY) and FOLLOW_UP
 * (SEQUENCE, or NEW_REASON/DEADLINE_FINAL via an explicit override from the
 * gate that decided) carry a normatively-defined interaction (design §4.4).
 * Every other decision gets "SEQUENCE" as an unconstrained default: the field
 * is required, but no decision besides RESPOND_NOW/FOLLOW_UP gives it meaning.
 */
function baseInteraction(decision: Decision): Interaction {
  return decision === "RESPOND_NOW" ? "REPLY" : "SEQUENCE";
}

interface ROverrides {
  suppression?: Suppression;
  waitUntil?: string | null;
  interaction?: Interaction;
}

/** Builds a single-decision `EngineResult`, filling the invariants from §8.1. */
function R(decision: Decision, rule: string, overrides: ROverrides = {}): EngineResult {
  const interaction = overrides.interaction ?? baseInteraction(decision);
  const stopActiveFollowUp =
    decision === "FOLLOW_UP" && (interaction === "NEW_REASON" || interaction === "DEADLINE_FINAL")
      ? true
      : baseStopActiveFollowUp(decision);
  return {
    decision,
    possible: [decision],
    interaction,
    messageAllowed: baseMessageAllowed(decision),
    stopActiveFollowUp,
    suppression: overrides.suppression ?? "NONE",
    waitUntil: overrides.waitUntil ?? null,
    rule,
    materialUnknowns: [],
    questions: [],
  };
}

// ---------------------------------------------------------------------------
// §5.11 Legitimate reason
// ---------------------------------------------------------------------------

const INHERENT_REASON: Partial<Record<Scenario, ReasonType>> = {
  PROPOSAL_SENT: "PENDING_PROPOSAL",
  INFO_SENT: "THEIR_REQUEST",
  POST_MEETING: "MEETING_FOLLOWUP",
  POST_EVENT: "EVENT_FOLLOWUP",
  RECONNECT_DUE: "LEAD_REQUESTED_RECONNECT",
};

/**
 * The reason in effect before the NRN/commitment/attempt-safety gates run:
 * an explicit `facts.reason` always wins; otherwise the scenario's inherent
 * reason (§5.11), including NEW_INQUIRY/REQUESTED_INFO once nothing is owed.
 */
export function effectiveReason(f: Facts): Facts["reason"] {
  if (f.reason) return f.reason;
  if ((f.scenario === "NEW_INQUIRY" || f.scenario === "REQUESTED_INFO") && f.owedResponse === null) {
    return { type: "THEIR_REQUEST", text: "" };
  }
  const inherent = f.scenario ? INHERENT_REASON[f.scenario] : undefined;
  return inherent ? { type: inherent, text: "" } : null;
}

// ---------------------------------------------------------------------------
// §6.1 resolve()
// ---------------------------------------------------------------------------

/**
 * Resolves a `TimingRef` to a concrete status (design §6.1's `resolve` note).
 * `kind` distinguishes the NRN and commitment readings of an untimed (`NONE`)
 * reference: NRN's NONE always means UNTIMED; a commitment's NONE is UNTIMED
 * only when the ref's own resolution says so (the user confirmed no timeframe
 * was given — DL-07), otherwise AMBIGUOUS.
 */
export function resolve(t: TimingRef, today: string, kind: "NRN" | "COMMITMENT"): TimingResolution {
  if (t.type === "SPECIFIC") {
    if (!t.date) return "AMBIGUOUS";
    const cmp = compareDates(t.date, today);
    return cmp > 0 ? "FUTURE" : cmp === 0 ? "ARRIVED" : "PASSED";
  }
  if (t.type === "VAGUE") {
    return t.resolution === "FUTURE" || t.resolution === "PASSED" ? t.resolution : "AMBIGUOUS";
  }
  // t.type === "NONE"
  if (kind === "NRN") return "UNTIMED";
  return t.resolution === "UNTIMED" ? "UNTIMED" : "AMBIGUOUS";
}

/** Rewrites a `TimingRef` so `resolve()` reports exactly `res` (used only to explore §6.3 unknowns). */
function forceResolution(ref: TimingRef, res: "FUTURE" | "PASSED"): TimingRef {
  return { type: "VAGUE", words: ref.words, date: null, resolution: res };
}

// ---------------------------------------------------------------------------
// §5.13 Deadline materiality
// ---------------------------------------------------------------------------

/** A deadline is material when CONCRETE, not passed, not USER_INTERNAL, and materialToLead is true. */
export function isMaterialDeadline(f: Facts): boolean {
  const d = f.deadline;
  if (!d) return false;
  if (d.kind !== "CONCRETE") return false;
  if (d.owner === "USER_INTERNAL") return false;
  if (d.materialToLead !== true) return false;
  if (d.date && compareDates(d.date, f.today) < 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
// §6.1 decideCore(): all critical facts known
// ---------------------------------------------------------------------------

/**
 * The gates of design §6.1, evaluated in order; the first gate that returns
 * decides. `f` must have every fact the gates read already resolved to a
 * concrete value (no AMBIGUOUS timing, no `sure: false`) — `decide()` is the
 * entry point that guarantees this via the §6.3 unknown-handling.
 */
export function decideCore(f: Facts, policy: Policy = DEFAULT_POLICY): EngineResult {
  // G0 Scope
  if (f.scope === "OUT_OF_SCOPE") return R("OUT_OF_SCOPE", "G0");

  // G1 Hard stop: overrides everything else (spec §3)
  if (f.hardStop) return R("STOP_ACTIVE_FOLLOW_UP", "G1", { suppression: f.hardStop.kind });

  // G2 They are waiting on you (spec §4); beats attempt safety and NRN (DL-04)
  if (f.owedResponse) return R("RESPOND_NOW", "G2", { interaction: "REPLY" });

  let reason = effectiveReason(f);

  // G3a Not right now: the lead's latest stance (spec §7)
  if (f.notRightNow) {
    const r = resolve(f.notRightNow.timing, f.today, "NRN");
    if (r === "UNTIMED") {
      if (policy.newReasonReopensPause && f.newInfo?.material === "YES") {
        return R("FOLLOW_UP", "G3a.newReason", { interaction: "NEW_REASON" }); // DL-02
      }
      return R("STOP_ACTIVE_FOLLOW_UP", "G3a.untimed", { suppression: "PAUSED" });
    }
    if (r === "FUTURE") return R("WAIT", "G3a.future", { waitUntil: f.notRightNow.timing.date });
    reason ??= { type: "LEAD_REQUESTED_RECONNECT", text: "" }; // ARRIVED or PASSED: they invited contact now
  }

  // G3b Commitment / agreed next step (spec §5)
  if (f.commitment) {
    const r = resolve(f.commitment.timing, f.today, "COMMITMENT");
    if (r === "FUTURE") return R("WAIT", "G3b.future", { waitUntil: f.commitment.timing.date });
    reason ??= { type: r === "UNTIMED" ? "UNTIMED_COMMITMENT" : "EXPIRED_COMMITMENT", text: "" };
  }

  // G4 Too soon (spec §16, contextual; DL-23 is the one deterministic case)
  if (f.tooSoon) return R("WAIT", "G4", { waitUntil: null });

  // G5 Attempt safety at 4+ (spec §8, §11, §12, §6)
  if ((f.attempts ?? 0) >= 4 || f.closeLoopSent) {
    if (f.newInfo?.material === "YES") return R("FOLLOW_UP", "G5.newReason", { interaction: "NEW_REASON" });
    if (isMaterialDeadline(f)) return R("FOLLOW_UP", "G5.deadline", { interaction: "DEADLINE_FINAL" });
    if (f.closeLoopSent) return R("DO_NOTHING", "G5.alreadyClosed");
    return R("CLOSE_LOOP", "G5.close"); // no reason needed to close (DL-22)
  }

  // G6 Legitimate reason (spec §13)
  if (f.newInfo?.material === "YES") reason ??= { type: "NEW_RELEVANT_INFO", text: "" };
  if (isMaterialDeadline(f)) reason ??= { type: "CONCRETE_DEADLINE", text: "" };
  if (!reason) {
    if (f.scenario === "NOTHING_PENDING") return R("DO_NOTHING", "G6.nothingPending");
    return R("NEED_FOLLOW_UP_REASON", "G6.noReason");
  }

  // G7 Attempt matrix 0-3 (spec §8)
  if (f.attempts === 3) return R("LOWER_FRICTION", "G7.3");
  if (f.attempts === 2) return R("CHANGE_ANGLE", "G7.2");
  return R("FOLLOW_UP", f.attempts === 1 ? "G7.1" : "G7.0", { interaction: "SEQUENCE" });
}

// ---------------------------------------------------------------------------
// §6.3 decide(): unknowns and the materiality test
// ---------------------------------------------------------------------------

const DEFAULT_QUESTIONS: Record<UnknownField, string> = {
  scenario: "What happened most recently with this lead?",
  attempts: "How many times have you followed up since their last reply?",
  hardStop: "What exactly did they say? (Their words, if you have them.)",
  owedResponse: "Did they ask you anything, or request anything, that you haven't answered yet?",
  commitmentTiming: "Did they give any timeframe, even a rough one? If not, just say 'no timeframe'.",
  notRightNowTiming: "Has the time they mentioned ('…') clearly passed?",
  newInfoMateriality: "Is this new thing connected to something they asked for or worried about? What did they say?",
  deadlineMateriality: "Does this deadline matter to them, or only to you?",
  reason: "What's the specific reason for contacting them now, something they'd recognize as relevant?",
};

function questionFor(field: UnknownField, facts: Facts): string {
  if (field === "notRightNowTiming") {
    const words = facts.notRightNow?.timing.words ?? facts.notRightNow?.quote ?? "";
    return `Has the time they mentioned ('${words}') clearly passed?`;
  }
  return DEFAULT_QUESTIONS[field];
}

/** Priority order for `materialUnknowns` (design §6.3 step 5). */
const UNKNOWN_PRIORITY: UnknownField[] = [
  "hardStop",
  "owedResponse",
  "attempts",
  "commitmentTiming",
  "notRightNowTiming",
  "newInfoMateriality",
  "deadlineMateriality",
];

const MAX_QUESTIONS = 3;

function clamp04(n: number): number {
  return Math.max(0, Math.min(4, n));
}

type Resolver = (f: Facts) => Facts;
interface Dimension {
  field: UnknownField;
  resolvers: Resolver[]; // length >= 2
}

function buildDimensions(facts: Facts): Dimension[] {
  const dims: Dimension[] = [];

  if (facts.attempts === null) {
    let lo = 0;
    let hi = 4;
    if (facts.attemptsRange) {
      lo = clamp04(facts.attemptsRange[0]);
      hi = clamp04(facts.attemptsRange[1]);
    }
    const values: number[] = [];
    for (let v = lo; v <= hi; v++) values.push(v);
    dims.push({
      field: "attempts",
      resolvers: values.map((v) => (f: Facts): Facts => ({ ...f, attempts: v })),
    });
  }

  if (facts.hardStop && facts.hardStop.sure === false) {
    dims.push({
      field: "hardStop",
      resolvers: [(f) => f, (f) => ({ ...f, hardStop: null })],
    });
  }

  if (facts.owedResponse && facts.owedResponse.sure === false) {
    dims.push({
      field: "owedResponse",
      resolvers: [(f) => f, (f) => ({ ...f, owedResponse: null })],
    });
  }

  if (facts.commitment && resolve(facts.commitment.timing, facts.today, "COMMITMENT") === "AMBIGUOUS") {
    dims.push({
      field: "commitmentTiming",
      resolvers: [
        (f) => ({ ...f, commitment: { ...f.commitment!, timing: forceResolution(f.commitment!.timing, "FUTURE") } }),
        (f) => ({ ...f, commitment: { ...f.commitment!, timing: forceResolution(f.commitment!.timing, "PASSED") } }),
      ],
    });
  }

  if (facts.notRightNow && resolve(facts.notRightNow.timing, facts.today, "NRN") === "AMBIGUOUS") {
    dims.push({
      field: "notRightNowTiming",
      resolvers: [
        (f) => ({ ...f, notRightNow: { ...f.notRightNow!, timing: forceResolution(f.notRightNow!.timing, "FUTURE") } }),
        (f) => ({ ...f, notRightNow: { ...f.notRightNow!, timing: forceResolution(f.notRightNow!.timing, "PASSED") } }),
      ],
    });
  }

  if (
    facts.deadline &&
    facts.deadline.kind === "CONCRETE" &&
    facts.deadline.owner !== "USER_INTERNAL" &&
    !(facts.deadline.date !== null && compareDates(facts.deadline.date, facts.today) < 0) &&
    facts.deadline.materialToLead === null
  ) {
    dims.push({
      field: "deadlineMateriality",
      resolvers: [
        (f) => ({ ...f, deadline: { ...f.deadline!, materialToLead: true } }),
        (f) => ({ ...f, deadline: { ...f.deadline!, materialToLead: false } }),
      ],
    });
  }

  if (facts.newInfo && facts.newInfo.material === "UNCLEAR") {
    dims.push({
      field: "newInfoMateriality",
      resolvers: [
        (f) => ({ ...f, newInfo: { ...f.newInfo!, material: "YES" } }),
        (f) => ({ ...f, newInfo: { ...f.newInfo!, material: "NO" } }),
      ],
    });
  }

  return dims;
}

/** Ensures every NEED_FOLLOW_UP_REASON result has "reason" first in `materialUnknowns` (design §6.3 step 5). */
function finalizeNFR(result: EngineResult, facts: Facts): EngineResult {
  if (result.decision !== "NEED_FOLLOW_UP_REASON") return result;
  if (result.materialUnknowns[0] === "reason") return result;
  const withReason: UnknownField[] = ["reason", ...result.materialUnknowns.filter((f) => f !== "reason")];
  const materialUnknowns = withReason.slice(0, MAX_QUESTIONS);
  const questions = materialUnknowns.map((f) => questionFor(f, facts));
  return { ...result, materialUnknowns, questions };
}

/**
 * The public decision entry point (design §6.3). Enumerates every unknown,
 * runs `decideCore` over the full cross-product, and reports the decision,
 * every reachable decision (`possible`), which unknowns actually mattered,
 * and up to 3 default questions for them.
 */
export function decide(facts: Facts, policy: Policy = DEFAULT_POLICY): EngineResult {
  // G0 Scope runs before anything else, including the scenario-unknown check below:
  // out-of-scope never needs the scenario taxonomy resolved (design §6.1 G0, §6.3 step 1).
  if (facts.scope === "OUT_OF_SCOPE") {
    return R("OUT_OF_SCOPE", "G0");
  }
  if (facts.scenario === null) {
    return {
      decision: "NEED_MISSING_INFORMATION",
      possible: ["NEED_MISSING_INFORMATION"],
      interaction: "SEQUENCE",
      messageAllowed: false,
      stopActiveFollowUp: false,
      suppression: "NONE",
      waitUntil: null,
      rule: "unknowns.scenario",
      materialUnknowns: ["scenario"],
      questions: [DEFAULT_QUESTIONS.scenario],
    };
  }

  const dims = buildDimensions(facts);
  const counts = dims.map((d) => d.resolvers.length);
  const total = counts.reduce((a, b) => a * b, 1);

  const results: { assignment: number[]; result: EngineResult }[] = [];
  for (let idx = 0; idx < total; idx++) {
    let rem = idx;
    const assignment: number[] = [];
    let variant = facts;
    for (let di = 0; di < dims.length; di++) {
      const count = counts[di] ?? 1;
      const choice = rem % count;
      rem = Math.floor(rem / count);
      assignment.push(choice);
      variant = dims[di]!.resolvers[choice]!(variant);
    }
    results.push({ assignment, result: decideCore(variant, policy) });
  }

  const decisionSet = new Set<Decision>(results.map((r) => r.result.decision));

  if (decisionSet.size <= 1) {
    const rep = results[0]?.result ?? decideCore(facts, policy);
    return finalizeNFR({ ...rep, possible: [rep.decision], materialUnknowns: [], questions: [] }, facts);
  }

  // A dimension is material if, holding every other dimension fixed, varying
  // it alone changes the decision for at least one combination of the others.
  const materialFields: UnknownField[] = [];
  for (let di = 0; di < dims.length; di++) {
    const groups = new Map<string, Set<Decision>>();
    for (const { assignment, result } of results) {
      const key = assignment.filter((_, i) => i !== di).join(",");
      const set = groups.get(key) ?? new Set<Decision>();
      set.add(result.decision);
      groups.set(key, set);
    }
    const isMaterial = [...groups.values()].some((s) => s.size > 1);
    if (isMaterial) materialFields.push(dims[di]!.field);
  }
  const orderedMaterial = UNKNOWN_PRIORITY.filter((f) => materialFields.includes(f));

  const decision: Decision = decisionSet.has("NEED_FOLLOW_UP_REASON")
    ? "NEED_FOLLOW_UP_REASON"
    : "NEED_MISSING_INFORMATION";

  const materialUnknownsFull: UnknownField[] =
    decision === "NEED_FOLLOW_UP_REASON" ? ["reason", ...orderedMaterial] : orderedMaterial;
  const materialUnknowns = materialUnknownsFull.slice(0, MAX_QUESTIONS);
  const questions = materialUnknowns.map((f) => questionFor(f, facts));
  const possible = DECISIONS.filter((d) => decisionSet.has(d));

  return {
    decision,
    possible,
    interaction: baseInteraction(decision),
    messageAllowed: baseMessageAllowed(decision),
    stopActiveFollowUp: baseStopActiveFollowUp(decision),
    suppression: "NONE",
    waitUntil: null,
    rule: decision === "NEED_FOLLOW_UP_REASON" ? "unknowns.nfr" : "unknowns.nmi",
    materialUnknowns,
    questions,
  };
}
