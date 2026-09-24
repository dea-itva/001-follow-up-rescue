import { describe, expect, it } from "vitest";
import { decide, decideCore, effectiveReason, isMaterialDeadline, resolve } from "../../src/engine.js";
import { baseFacts } from "../testUtil.js";
import type { TimingRef } from "../../src/types.js";

const ref = (overrides: Partial<TimingRef>): TimingRef => ({
  type: "NONE",
  words: null,
  date: null,
  resolution: null,
  ...overrides,
});

describe("resolve() truth table", () => {
  const today = "2026-09-24";

  it("SPECIFIC with a date compares against today", () => {
    expect(resolve(ref({ type: "SPECIFIC", date: "2026-09-25" }), today, "COMMITMENT")).toBe("FUTURE");
    expect(resolve(ref({ type: "SPECIFIC", date: "2026-09-24" }), today, "COMMITMENT")).toBe("ARRIVED");
    expect(resolve(ref({ type: "SPECIFIC", date: "2026-09-23" }), today, "COMMITMENT")).toBe("PASSED");
  });

  it("SPECIFIC without a date is AMBIGUOUS", () => {
    expect(resolve(ref({ type: "SPECIFIC", date: null }), today, "COMMITMENT")).toBe("AMBIGUOUS");
  });

  it("VAGUE takes the supplied resolution when FUTURE or PASSED, else AMBIGUOUS", () => {
    expect(resolve(ref({ type: "VAGUE", resolution: "FUTURE" }), today, "COMMITMENT")).toBe("FUTURE");
    expect(resolve(ref({ type: "VAGUE", resolution: "PASSED" }), today, "COMMITMENT")).toBe("PASSED");
    expect(resolve(ref({ type: "VAGUE", resolution: "AMBIGUOUS" }), today, "COMMITMENT")).toBe("AMBIGUOUS");
    expect(resolve(ref({ type: "VAGUE", resolution: null }), today, "COMMITMENT")).toBe("AMBIGUOUS");
  });

  it("NONE for NRN is always UNTIMED", () => {
    expect(resolve(ref({ type: "NONE", resolution: null }), today, "NRN")).toBe("UNTIMED");
    expect(resolve(ref({ type: "NONE", resolution: "AMBIGUOUS" }), today, "NRN")).toBe("UNTIMED");
  });

  it("NONE for a commitment is UNTIMED only when the ref says UNTIMED, else AMBIGUOUS", () => {
    expect(resolve(ref({ type: "NONE", resolution: "UNTIMED" }), today, "COMMITMENT")).toBe("UNTIMED");
    expect(resolve(ref({ type: "NONE", resolution: null }), today, "COMMITMENT")).toBe("AMBIGUOUS");
    expect(resolve(ref({ type: "NONE", resolution: "AMBIGUOUS" }), today, "COMMITMENT")).toBe("AMBIGUOUS");
  });
});

describe("effectiveReason", () => {
  it("an explicit reason always wins", () => {
    const f = baseFacts({ scenario: "PROPOSAL_SENT", reason: { type: "NEW_RELEVANT_INFO", text: "x" } });
    expect(effectiveReason(f)?.type).toBe("NEW_RELEVANT_INFO");
  });

  it("inherent reasons by scenario", () => {
    expect(effectiveReason(baseFacts({ scenario: "PROPOSAL_SENT" }))?.type).toBe("PENDING_PROPOSAL");
    expect(effectiveReason(baseFacts({ scenario: "INFO_SENT" }))?.type).toBe("THEIR_REQUEST");
    expect(effectiveReason(baseFacts({ scenario: "POST_MEETING" }))?.type).toBe("MEETING_FOLLOWUP");
    expect(effectiveReason(baseFacts({ scenario: "POST_EVENT" }))?.type).toBe("EVENT_FOLLOWUP");
    expect(effectiveReason(baseFacts({ scenario: "RECONNECT_DUE" }))?.type).toBe("LEAD_REQUESTED_RECONNECT");
  });

  it("NEW_INQUIRY / REQUESTED_INFO once answered -> THEIR_REQUEST", () => {
    expect(effectiveReason(baseFacts({ scenario: "NEW_INQUIRY", owedResponse: null }))?.type).toBe("THEIR_REQUEST");
    expect(effectiveReason(baseFacts({ scenario: "REQUESTED_INFO", owedResponse: null }))?.type).toBe(
      "THEIR_REQUEST",
    );
  });

  it("OTHER_WARM_FOLLOWUP and NOTHING_PENDING have no inherent reason", () => {
    expect(effectiveReason(baseFacts({ scenario: "OTHER_WARM_FOLLOWUP" }))).toBeNull();
    expect(effectiveReason(baseFacts({ scenario: "NOTHING_PENDING" }))).toBeNull();
    expect(effectiveReason(baseFacts({ scenario: "NOT_RIGHT_NOW" }))).toBeNull();
  });
});

describe("isMaterialDeadline", () => {
  it("material: CONCRETE, not passed, not internal, materialToLead true", () => {
    const f = baseFacts({
      today: "2026-09-24",
      deadline: { quote: "closes Sept 30", kind: "CONCRETE", date: "2026-09-30", owner: "EXTERNAL", materialToLead: true },
    });
    expect(isMaterialDeadline(f)).toBe(true);
  });

  it("not material: VAGUE", () => {
    const f = baseFacts({
      deadline: { quote: "ASAP", kind: "VAGUE", date: null, owner: "LEAD", materialToLead: true },
    });
    expect(isMaterialDeadline(f)).toBe(false);
  });

  it("not material: USER_INTERNAL", () => {
    const f = baseFacts({
      today: "2026-09-24",
      deadline: { quote: "quota", kind: "CONCRETE", date: "2026-09-30", owner: "USER_INTERNAL", materialToLead: true },
    });
    expect(isMaterialDeadline(f)).toBe(false);
  });

  it("not material: materialToLead not true", () => {
    const f = baseFacts({
      today: "2026-09-24",
      deadline: { quote: "closes Sept 30", kind: "CONCRETE", date: "2026-09-30", owner: "EXTERNAL", materialToLead: false },
    });
    expect(isMaterialDeadline(f)).toBe(false);
    const g = baseFacts({
      deadline: { quote: "closes Sept 30", kind: "CONCRETE", date: "2026-09-30", owner: "EXTERNAL", materialToLead: null },
    });
    expect(isMaterialDeadline(g)).toBe(false);
  });

  it("not material: passed", () => {
    const f = baseFacts({
      today: "2026-09-24",
      deadline: { quote: "closed Sept 1", kind: "CONCRETE", date: "2026-09-01", owner: "EXTERNAL", materialToLead: true },
    });
    expect(isMaterialDeadline(f)).toBe(false);
  });

  it("no deadline is never material", () => {
    expect(isMaterialDeadline(baseFacts({}))).toBe(false);
  });
});

describe("decideCore: every gate is reachable", () => {
  it("G0 scope", () => {
    const r = decideCore(baseFacts({ scope: "OUT_OF_SCOPE" }));
    expect(r.decision).toBe("OUT_OF_SCOPE");
    expect(r.rule).toBe("G0");
    expect(r.messageAllowed).toBe(false);
  });

  it("G1 hard stop overrides everything", () => {
    const r = decideCore(
      baseFacts({
        hardStop: { kind: "OPT_OUT", quote: "stop", sure: true },
        owedResponse: { kind: "QUESTION", quote: "price?", sure: true },
        attempts: 4,
      }),
    );
    expect(r.decision).toBe("STOP_ACTIVE_FOLLOW_UP");
    expect(r.rule).toBe("G1");
    expect(r.suppression).toBe("OPT_OUT");
    expect(r.stopActiveFollowUp).toBe(true);
    expect(r.messageAllowed).toBe(false);
  });

  it("G1 with DECLINE suppression", () => {
    const r = decideCore(baseFacts({ hardStop: { kind: "DECLINE", quote: "not interested", sure: true } }));
    expect(r.suppression).toBe("DECLINE");
  });

  it("G2 owed response beats attempt safety and NRN", () => {
    const r = decideCore(
      baseFacts({
        owedResponse: { kind: "QUESTION", quote: "what's included?", sure: true },
        attempts: 4,
      }),
    );
    expect(r.decision).toBe("RESPOND_NOW");
    expect(r.rule).toBe("G2");
    expect(r.interaction).toBe("REPLY");
  });

  it("G3a.untimed -> STOP (PAUSED)", () => {
    const r = decideCore(
      baseFacts({ scenario: "NOT_RIGHT_NOW", notRightNow: { quote: "not now", timing: ref({ type: "NONE", resolution: "UNTIMED" }) } }),
    );
    expect(r.decision).toBe("STOP_ACTIVE_FOLLOW_UP");
    expect(r.rule).toBe("G3a.untimed");
    expect(r.suppression).toBe("PAUSED");
  });

  it("G3a.newReason -> FOLLOW_UP (NEW_REASON) when policy allows", () => {
    const r = decideCore(
      baseFacts({
        scenario: "NOT_RIGHT_NOW",
        notRightNow: { quote: "not now, need Shopify support", timing: ref({ type: "NONE", resolution: "UNTIMED" }) },
        newInfo: { text: "Shopify support shipped", linkedNeedQuote: "need Shopify support", material: "YES" },
      }),
    );
    expect(r.decision).toBe("FOLLOW_UP");
    expect(r.rule).toBe("G3a.newReason");
    expect(r.interaction).toBe("NEW_REASON");
    expect(r.stopActiveFollowUp).toBe(true);
  });

  it("G3a.future -> WAIT until the given date", () => {
    const r = decideCore(
      baseFacts({
        scenario: "NOT_RIGHT_NOW",
        notRightNow: { quote: "in January", timing: ref({ type: "SPECIFIC", date: "2027-01-01" }) },
      }),
    );
    expect(r.decision).toBe("WAIT");
    expect(r.rule).toBe("G3a.future");
    expect(r.waitUntil).toBe("2027-01-01");
    expect(r.messageAllowed).toBe(false);
  });

  it("G3a ARRIVED/PASSED falls through with reason LEAD_REQUESTED_RECONNECT", () => {
    const r = decideCore(
      baseFacts({
        scenario: "NOT_RIGHT_NOW",
        attempts: 0,
        notRightNow: { quote: "after the holidays", timing: ref({ type: "VAGUE", resolution: "PASSED" }) },
      }),
    );
    expect(r.decision).toBe("FOLLOW_UP");
    expect(r.rule).toBe("G7.0");
  });

  it("G3b.future -> WAIT until the commitment date", () => {
    const r = decideCore(
      baseFacts({
        scenario: "OTHER_WARM_FOLLOWUP",
        commitment: { by: "LEAD", quote: "I'll have an answer Oct 5", timing: ref({ type: "SPECIFIC", date: "2026-10-05" }) },
      }),
    );
    expect(r.decision).toBe("WAIT");
    expect(r.rule).toBe("G3b.future");
    expect(r.waitUntil).toBe("2026-10-05");
  });

  it("G3b expired commitment falls through with reason EXPIRED_COMMITMENT", () => {
    const r = decideCore(
      baseFacts({
        scenario: "OTHER_WARM_FOLLOWUP",
        attempts: 0,
        commitment: { by: "LEAD", quote: "by Friday", timing: ref({ type: "SPECIFIC", date: "2026-09-18" }) },
      }),
    );
    expect(r.decision).toBe("FOLLOW_UP");
    expect(r.rule).toBe("G7.0");
  });

  it("G3b untimed commitment falls through with reason UNTIMED_COMMITMENT", () => {
    const r = decideCore(
      baseFacts({
        scenario: "OTHER_WARM_FOLLOWUP",
        attempts: 0,
        commitment: { by: "LEAD", quote: "I'll get back to you", timing: ref({ type: "NONE", resolution: "UNTIMED" }) },
      }),
    );
    expect(r.decision).toBe("FOLLOW_UP");
    expect(r.rule).toBe("G7.0");
  });

  it("G4 too soon -> WAIT, no message", () => {
    const r = decideCore(baseFacts({ scenario: "PROPOSAL_SENT", attempts: 0, tooSoon: true }));
    expect(r.decision).toBe("WAIT");
    expect(r.rule).toBe("G4");
    expect(r.waitUntil).toBeNull();
    expect(r.messageAllowed).toBe(false);
  });

  it("G5.newReason at 4+ attempts", () => {
    const r = decideCore(
      baseFacts({
        scenario: "PROPOSAL_SENT",
        attempts: 4,
        newInfo: { text: "Xero integration is live", linkedNeedQuote: "we need Xero integration", material: "YES" },
      }),
    );
    expect(r.decision).toBe("FOLLOW_UP");
    expect(r.rule).toBe("G5.newReason");
    expect(r.interaction).toBe("NEW_REASON");
    expect(r.stopActiveFollowUp).toBe(true);
  });

  it("G5.deadline at 4+ attempts", () => {
    const r = decideCore(
      baseFacts({
        scenario: "PROPOSAL_SENT",
        attempts: 4,
        today: "2026-09-24",
        deadline: { quote: "submit by Sept 30", kind: "CONCRETE", date: "2026-09-30", owner: "LEAD", materialToLead: true },
      }),
    );
    expect(r.decision).toBe("FOLLOW_UP");
    expect(r.rule).toBe("G5.deadline");
    expect(r.interaction).toBe("DEADLINE_FINAL");
    expect(r.stopActiveFollowUp).toBe(true);
  });

  it("G5.alreadyClosed -> DO_NOTHING", () => {
    const r = decideCore(baseFacts({ scenario: "PROPOSAL_SENT", attempts: 5, closeLoopSent: true }));
    expect(r.decision).toBe("DO_NOTHING");
    expect(r.rule).toBe("G5.alreadyClosed");
    expect(r.stopActiveFollowUp).toBe(true);
  });

  it("G5.close -> CLOSE_LOOP, no reason needed (DL-22)", () => {
    const r = decideCore(baseFacts({ scenario: "OTHER_WARM_FOLLOWUP", attempts: 4 }));
    expect(r.decision).toBe("CLOSE_LOOP");
    expect(r.rule).toBe("G5.close");
    expect(r.stopActiveFollowUp).toBe(true);
  });

  it("G6.nothingPending -> DO_NOTHING", () => {
    const r = decideCore(baseFacts({ scenario: "NOTHING_PENDING", attempts: 0 }));
    expect(r.decision).toBe("DO_NOTHING");
    expect(r.rule).toBe("G6.nothingPending");
    expect(r.stopActiveFollowUp).toBe(true);
  });

  it("G6.noReason -> NEED_FOLLOW_UP_REASON", () => {
    const r = decideCore(baseFacts({ scenario: "OTHER_WARM_FOLLOWUP", attempts: 1 }));
    expect(r.decision).toBe("NEED_FOLLOW_UP_REASON");
    expect(r.rule).toBe("G6.noReason");
    expect(r.messageAllowed).toBe(false);
  });

  it("G7.0 / G7.1 / G7.2 / G7.3 attempt matrix", () => {
    const at = (n: number) => decideCore(baseFacts({ scenario: "PROPOSAL_SENT", attempts: n }));
    expect(at(0).decision).toBe("FOLLOW_UP");
    expect(at(0).rule).toBe("G7.0");
    expect(at(1).decision).toBe("FOLLOW_UP");
    expect(at(1).rule).toBe("G7.1");
    expect(at(2).decision).toBe("CHANGE_ANGLE");
    expect(at(2).rule).toBe("G7.2");
    expect(at(3).decision).toBe("LOWER_FRICTION");
    expect(at(3).rule).toBe("G7.3");
  });
});

describe("decide(): unknowns and materiality (§6.3)", () => {
  it("unknown scenario -> NMI[scenario], nothing else enumerated", () => {
    const r = decide(baseFacts({ scenario: null }));
    expect(r.decision).toBe("NEED_MISSING_INFORMATION");
    expect(r.materialUnknowns).toEqual(["scenario"]);
    expect(r.questions).toHaveLength(1);
  });

  it("attempts null -> NMI with materialUnknowns [attempts]", () => {
    const r = decide(baseFacts({ scenario: "PROPOSAL_SENT", attempts: null }));
    expect(r.decision).toBe("NEED_MISSING_INFORMATION");
    expect(r.materialUnknowns).toEqual(["attempts"]);
    expect(r.possible.length).toBeGreaterThan(1);
  });

  it("owed present -> RESPOND_NOW regardless of other unknowns", () => {
    const r = decide(
      baseFacts({
        scenario: "OTHER_WARM_FOLLOWUP",
        attempts: null,
        owedResponse: { kind: "QUESTION", quote: "what's included?", sure: true },
      }),
    );
    expect(r.decision).toBe("RESPOND_NOW");
    expect(r.materialUnknowns).toEqual([]);
  });

  it("hard stop present -> STOP regardless of other unknowns", () => {
    const r = decide(
      baseFacts({
        scenario: "OTHER_WARM_FOLLOWUP",
        attempts: null,
        hardStop: { kind: "OPT_OUT", quote: "stop", sure: true },
      }),
    );
    expect(r.decision).toBe("STOP_ACTIVE_FOLLOW_UP");
    expect(r.materialUnknowns).toEqual([]);
  });

  it("NFR tie-break (DL-21): NFR wins over NMI, reason first", () => {
    const r = decide(baseFacts({ scenario: "OTHER_WARM_FOLLOWUP", attempts: null, reason: null }));
    expect(r.decision).toBe("NEED_FOLLOW_UP_REASON");
    expect(r.materialUnknowns[0]).toBe("reason");
    expect(r.materialUnknowns).toContain("attempts");
  });

  it("a deterministic NFR from decideCore directly still carries reason in materialUnknowns", () => {
    const r = decide(baseFacts({ scenario: "OTHER_WARM_FOLLOWUP", attempts: 1, reason: null }));
    expect(r.decision).toBe("NEED_FOLLOW_UP_REASON");
    expect(r.materialUnknowns).toEqual(["reason"]);
  });

  it("caps material unknowns and questions at 3, respecting priority order", () => {
    const facts = baseFacts({
      scenario: "PROPOSAL_SENT",
      attempts: null,
      hardStop: { kind: "DECLINE", quote: "No.", sure: false },
      owedResponse: { kind: "QUESTION", quote: "price?", sure: false },
      commitment: {
        by: "LEAD",
        quote: "I'll think about it",
        timing: ref({ type: "VAGUE", words: "soon", resolution: "AMBIGUOUS" }),
      },
    });
    const r = decide(facts);
    expect(r.materialUnknowns.length).toBeLessThanOrEqual(3);
    expect(r.questions.length).toBeLessThanOrEqual(3);
    const priority = [
      "hardStop",
      "owedResponse",
      "attempts",
      "commitmentTiming",
      "notRightNowTiming",
      "newInfoMateriality",
      "deadlineMateriality",
    ];
    const idxs = r.materialUnknowns.map((f) => priority.indexOf(f));
    expect(idxs).toEqual([...idxs].sort((a, b) => a - b));
  });

  it("policy.newReasonReopensPause = false turns a new-reason reopen into a pause", () => {
    const facts = baseFacts({
      scenario: "NOT_RIGHT_NOW",
      notRightNow: { quote: "not now, need Shopify support", timing: ref({ type: "NONE", resolution: "UNTIMED" }) },
      newInfo: { text: "Shopify support shipped", linkedNeedQuote: "need Shopify support", material: "YES" },
    });
    const on = decideCore(facts, { newReasonReopensPause: true });
    expect(on.decision).toBe("FOLLOW_UP");
    expect(on.interaction).toBe("NEW_REASON");

    const off = decideCore(facts, { newReasonReopensPause: false });
    expect(off.decision).toBe("STOP_ACTIVE_FOLLOW_UP");
    expect(off.suppression).toBe("PAUSED");
  });

  it("is deterministic and never mutates its input", () => {
    const facts = baseFacts({
      scenario: "PROPOSAL_SENT",
      attempts: null,
      attemptsRange: [1, 3],
      hardStop: { kind: "DECLINE", quote: "No.", sure: false },
    });
    const snapshot = JSON.parse(JSON.stringify(facts));
    const first = decide(facts);
    for (let i = 0; i < 100; i++) {
      expect(decide(facts)).toEqual(first);
    }
    expect(facts).toEqual(snapshot);
  });
});
