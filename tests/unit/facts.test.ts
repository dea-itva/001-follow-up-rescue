import { describe, expect, it } from "vitest";
import { compareFacts, factsFromForm } from "../../src/facts.js";
import { baseCaseInput, baseFacts } from "../testUtil.js";

describe("factsFromForm", () => {
  it('"Not sure" attempts becomes null', () => {
    const facts = factsFromForm(baseCaseInput({ attempts: "UNSURE" }));
    expect(facts.attempts).toBeNull();
  });

  it("5+ maps straight through as 5", () => {
    const facts = factsFromForm(baseCaseInput({ attempts: 5 }));
    expect(facts.attempts).toBe(5);
  });

  it("timeframe EXACT + date maps to SPECIFIC with that date (commitment)", () => {
    const facts = factsFromForm(
      baseCaseInput({
        scenario: "OTHER_WARM_FOLLOWUP",
        timeframe: { answer: "EXACT", words: "next Monday", date: "2026-09-28", vagueStatus: null },
      }),
    );
    expect(facts.commitment?.timing).toEqual({
      type: "SPECIFIC",
      words: "next Monday",
      date: "2026-09-28",
      resolution: null,
    });
  });

  it('timeframe VAGUE + "Has it passed?" = Yes maps to PASSED', () => {
    const facts = factsFromForm(
      baseCaseInput({
        scenario: "OTHER_WARM_FOLLOWUP",
        timeframe: { answer: "VAGUE", words: "after the holidays", date: null, vagueStatus: "PASSED" },
      }),
    );
    expect(facts.commitment?.timing.type).toBe("VAGUE");
    expect(facts.commitment?.timing.resolution).toBe("PASSED");
  });

  it("NONE_GIVEN + commitment scenario becomes UNTIMED (DL-07)", () => {
    const facts = factsFromForm(
      baseCaseInput({
        scenario: "OTHER_WARM_FOLLOWUP",
        timeframe: { answer: "NONE_GIVEN", words: "", date: null, vagueStatus: null },
      }),
    );
    expect(facts.commitment?.timing).toEqual({ type: "NONE", words: null, date: null, resolution: "UNTIMED" });
    expect(facts.notRightNow).toBeNull();
  });

  it("NONE_GIVEN + NOT_RIGHT_NOW becomes NONE/UNTIMED", () => {
    const facts = factsFromForm(
      baseCaseInput({
        scenario: "NOT_RIGHT_NOW",
        timeframe: { answer: "NONE_GIVEN", words: "", date: null, vagueStatus: null },
      }),
    );
    expect(facts.notRightNow?.timing).toEqual({ type: "NONE", words: null, date: null, resolution: "UNTIMED" });
    expect(facts.commitment).toBeNull();
  });

  it('stop.answer OPT_OUT maps to hardStop {OPT_OUT, sure: true}', () => {
    const facts = factsFromForm(baseCaseInput({ stop: { answer: "OPT_OUT", words: "please stop" } }));
    expect(facts.hardStop).toEqual({ kind: "OPT_OUT", quote: "please stop", sure: true });
  });

  it('stop.answer DECLINE maps to hardStop {DECLINE, sure: true}', () => {
    const facts = factsFromForm(baseCaseInput({ stop: { answer: "DECLINE", words: "not interested" } }));
    expect(facts.hardStop).toEqual({ kind: "DECLINE", quote: "not interested", sure: true });
  });

  it("lastUserMessageDate === today sets tooSoon true (DL-23)", () => {
    const facts = factsFromForm(baseCaseInput({ today: "2026-09-24", lastUserMessageDate: "2026-09-24" }));
    expect(facts.tooSoon).toBe(true);
  });

  it("lastUserMessageDate before today leaves tooSoon false", () => {
    const facts = factsFromForm(baseCaseInput({ today: "2026-09-24", lastUserMessageDate: "2026-09-18" }));
    expect(facts.tooSoon).toBe(false);
  });

  it("the timeframe attaches to notRightNow only when the scenario is NOT_RIGHT_NOW", () => {
    const nrn = factsFromForm(
      baseCaseInput({
        scenario: "NOT_RIGHT_NOW",
        timeframe: { answer: "EXACT", words: "January", date: "2027-01-01", vagueStatus: null },
      }),
    );
    expect(nrn.notRightNow).not.toBeNull();
    expect(nrn.commitment).toBeNull();

    const other = factsFromForm(
      baseCaseInput({
        scenario: "RECONNECT_DUE",
        timeframe: { answer: "EXACT", words: "January", date: "2027-01-01", vagueStatus: null },
      }),
    );
    expect(other.commitment).not.toBeNull();
    expect(other.notRightNow).toBeNull();
  });

  it("fields the form never asked about keep safe defaults", () => {
    const facts = factsFromForm(baseCaseInput({ scenario: "PROPOSAL_SENT" }));
    expect(facts.closeLoopSent).toBe(false);
    expect(facts.newInfo).toBeNull();
    expect(facts.deadline).toBeNull();
    expect(facts.scope).toBe("IN_SCOPE");
  });

  it("owed UNSURE produces an owedResponse with sure: false", () => {
    const facts = factsFromForm(baseCaseInput({ owed: { answer: "UNSURE", text: "" } }));
    expect(facts.owedResponse).toEqual({ kind: "QUESTION", quote: "", sure: false });
  });

  it("newInfo with linked YES carries the linked quote", () => {
    const facts = factsFromForm(
      baseCaseInput({ newInfo: { text: "Xero integration launched", linked: "YES", linkedWords: "we need Xero" } }),
    );
    expect(facts.newInfo).toEqual({ text: "Xero integration launched", linkedNeedQuote: "we need Xero", material: "YES" });
  });

  it("deadline YES with a date is CONCRETE", () => {
    const facts = factsFromForm(
      baseCaseInput({ deadline: { answer: "YES", what: "Enrollment closes", date: "2026-09-30", whose: "EXTERNAL" } }),
    );
    expect(facts.deadline).toEqual({
      quote: "Enrollment closes",
      kind: "CONCRETE",
      date: "2026-09-30",
      owner: "EXTERNAL",
      materialToLead: null,
    });
  });
});

describe("compareFacts", () => {
  it("flags an attempts mismatch", () => {
    const mismatches = compareFacts(baseFacts({ attempts: 2 }), baseFacts({ attempts: 4 }));
    expect(mismatches.map((m) => m.field)).toContain("attempts");
  });

  it("no mismatch when attempts agree", () => {
    const mismatches = compareFacts(baseFacts({ attempts: 2 }), baseFacts({ attempts: 2 }));
    expect(mismatches.map((m) => m.field)).not.toContain("attempts");
  });

  it("flags an owed-response presence mismatch", () => {
    const mismatches = compareFacts(
      baseFacts({}),
      baseFacts({ owedResponse: { kind: "QUESTION", quote: "price?", sure: true } }),
    );
    expect(mismatches.map((m) => m.field)).toContain("owedResponse");
  });

  it("flags a hard-stop mismatch", () => {
    const mismatches = compareFacts(
      baseFacts({}),
      baseFacts({ hardStop: { kind: "OPT_OUT", quote: "stop", sure: true } }),
    );
    expect(mismatches.map((m) => m.field)).toContain("hardStop");
  });
});
