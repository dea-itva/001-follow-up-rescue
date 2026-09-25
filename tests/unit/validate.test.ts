import { describe, expect, it } from "vitest";
import { checkAnswer, validate } from "../../src/validate.js";
import type { ParsedAnswer } from "../../src/parse.js";
import type { ValidationContext } from "../../src/types.js";
import { baseCaseInput } from "../testUtil.js";

// ---------------------------------------------------------------------------
// A minimal, valid FOLLOW_UP RescueResult (D-03-like), for overriding per test.
// ---------------------------------------------------------------------------

function goodJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lfr: "1.0",
    decision: "FOLLOW_UP",
    interaction: "SEQUENCE",
    timing: { mode: "NOW", date: null, note: "typical practice" },
    reason: "Proposal sent, one follow-up, no reply.",
    contactReason: "The proposal is still waiting on a decision.",
    action: "Reply in the same thread with the message below.",
    message: {
      channel: "EMAIL",
      subject: null,
      body:
        'Hi Ana,\n\nWould Tuesday or Wednesday work for a quick call?\n\nBest,\n[Your name] · [Business name]\n[Business postal address]\nIf you\'d prefer not to hear from me again, just reply "stop" and I won\'t contact you further.',
    },
    cta: { text: "Would Tuesday or Wednesday work for a quick call?", type: "CHOOSE_ONE" },
    angle: null,
    noResponsePlan: "If there's no reply, the next step is a different angle after a few business days.",
    doNotDo: ["Don't send 'just checking in'."],
    stopActiveFollowUp: false,
    suppression: "NONE",
    missingInformation: [],
    facts: {
      scope: "IN_SCOPE",
      scenario: "PROPOSAL_SENT",
      channel: "EMAIL",
      attempts: 1,
      attemptsRange: null,
      closeLoopSent: false,
      hardStop: null,
      notRightNow: null,
      owedResponse: null,
      commitment: null,
      deadline: null,
      reason: { type: "PENDING_PROPOSAL", text: "Proposal sent" },
      newInfo: null,
      tooSoon: false,
    },
    evidence: [],
    rejectedAssumptions: [],
    ...overrides,
  };
}

function parsed(json: Record<string, unknown> | null): ParsedAnswer {
  return { json, card: null, status: json ? "OK" : "NOT_FOUND", problems: [] };
}

const CASE_TEXT = "Hi, thanks for the proposal. I'll review it with my partner and get back to you.";

function baseCtx(overrides: Partial<Parameters<typeof baseCaseInput>[0]> = {}): ValidationContext {
  return {
    caseInput: baseCaseInput({
      scenario: "PROPOSAL_SENT",
      channel: "EMAIL",
      leadMessages: CASE_TEXT,
      attempts: 1,
      today: "2026-09-24",
      ...overrides,
    }),
  };
}

function codesOf(report: { errors: { code: string }[]; warnings: { code: string }[] }): string[] {
  return [...report.errors, ...report.warnings].map((v) => v.code);
}

// ---------------------------------------------------------------------------

describe("status mapping (design §9.7)", () => {
  it("UNPARSEABLE when nothing parsed", () => {
    expect(validate(parsed(null), baseCtx()).status).toBe("UNPARSEABLE");
  });

  it("READY for a clean answer", () => {
    const report = validate(parsed(goodJson()), baseCtx());
    expect(report.errors).toEqual([]);
    expect(report.status).toBe("READY");
  });

  it("READY_WITH_WARNINGS when only warnings are present", () => {
    const report = validate(parsed(goodJson({ lfr: "0.9" })), baseCtx());
    expect(report.errors).toEqual([]);
    expect(report.warnings.some((w) => w.code === "W_VERSION_MISMATCH")).toBe(true);
    expect(report.status).toBe("READY_WITH_WARNINGS");
  });

  it("NO_MESSAGE_NEEDED for a valid no-message decision", () => {
    const json = goodJson({
      decision: "WAIT",
      interaction: "SEQUENCE",
      timing: { mode: "WAIT_UNTIL", date: "2026-09-28", note: null },
      contactReason: null,
      message: null,
      cta: null,
      stopActiveFollowUp: false,
      noResponsePlan: "Re-evaluate once the wait ends.",
      action: "Wait.",
      facts: {
        scope: "IN_SCOPE",
        scenario: "OTHER_WARM_FOLLOWUP",
        channel: "EMAIL",
        attempts: 0,
        attemptsRange: null,
        closeLoopSent: false,
        hardStop: null,
        notRightNow: null,
        owedResponse: null,
        commitment: { by: "LEAD", quote: "I'll send the documents on Monday", timing: { type: "SPECIFIC", words: "Monday", date: "2026-09-28", resolution: null } },
        deadline: null,
        reason: null,
        newInfo: null,
        tooSoon: false,
      },
    });
    const report = validate(parsed(json), baseCtx({ leadMessages: "I'll send the documents on Monday." }));
    expect(report.errors, JSON.stringify(report.errors)).toEqual([]);
    expect(report.status).toBe("NO_MESSAGE_NEEDED");
  });

  it("FIX_REQUIRED when there is any error", () => {
    const report = validate(parsed(goodJson({ contactReason: null })), baseCtx());
    expect(report.errors.some((e) => e.code === "E_REASON_MISSING")).toBe(true);
    expect(report.status).toBe("FIX_REQUIRED");
  });
});

describe("CTA detector table (TEST_PLAN §7.6)", () => {
  function ctaCount(body: string): number {
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body }, cta: null });
    const report = validate(parsed(json), baseCtx());
    const hasMultiple = report.errors.some((e) => e.code === "E_MULTIPLE_CTAS");
    const hasMissing = report.errors.some((e) => e.code === "E_CTA_MISSING");
    if (hasMultiple) return 2; // "more than one" is all the table distinguishes above 1
    if (hasMissing) return 0;
    return 1;
  }

  it('"Would Tuesday or Wednesday work?" -> 1', () => {
    expect(ctaCount("Hi Ana,\n\nWould Tuesday or Wednesday work?\n\nBest,\n[Your name]")).toBe(1);
  });

  it('"Let me know if you have any questions." -> 0 (courtesy closer, needs its own CTA)', () => {
    const json = goodJson({
      message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nWould Tuesday work? Let me know if you have any questions.\n\nBest,\n[Your name]" },
    });
    const report = validate(parsed(json), baseCtx());
    expect(report.errors.some((e) => e.code === "E_MULTIPLE_CTAS")).toBe(false);
  });

  it('the opt-out line is not counted as a request', () => {
    const body =
      'Hi Ana,\n\nWould Tuesday work?\n\n[Your name] · [Business name]\n[Business postal address]\nIf you\'d prefer not to hear from me again, just reply "stop" and I won\'t contact you further.';
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body } });
    const report = validate(parsed(json), baseCtx());
    expect(report.errors.some((e) => e.code === "E_MULTIPLE_CTAS")).toBe(false);
  });

  it('"Can you confirm? And could you send the logo?" -> 2 (multiple)', () => {
    expect(ctaCount("Hi Ana,\n\nCan you confirm? And could you send the logo?\n\nBest,\n[Your name]")).toBe(2);
  });

  it('"Book a time here: https://..." -> 1', () => {
    expect(ctaCount("Hi Ana,\n\nBook a time here: https://calendly.com/me/10min\n\nBest,\n[Your name]")).toBe(1);
  });
});

describe("negation (design §9.4, TEST_PLAN §7.6)", () => {
  it('"No further follow-up." does not trigger E_PLAN_CHASES', () => {
    const json = goodJson({
      decision: "CLOSE_LOOP",
      interaction: "SEQUENCE",
      timing: { mode: "NOW", date: null, note: null },
      stopActiveFollowUp: true,
      cta: null,
      message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nI'll close this out and stop following up. All the best.\n\nBest,\n[Your name]" },
      noResponsePlan: "No further follow-up.",
      facts: {
        scope: "IN_SCOPE",
        scenario: "PROPOSAL_SENT",
        channel: "EMAIL",
        attempts: 4,
        attemptsRange: null,
        closeLoopSent: false,
        hardStop: null,
        notRightNow: null,
        owedResponse: null,
        commitment: null,
        deadline: null,
        reason: null,
        newInfo: null,
        tooSoon: false,
      },
    });
    const report = validate(parsed(json), baseCtx({ attempts: 4 }));
    expect(report.errors.some((e) => e.code === "E_PLAN_CHASES")).toBe(false);
  });

  it('"Don\'t reach out before Monday." does not trigger E_WAIT_EARLY_CONTACT', () => {
    const json = goodJson({
      decision: "WAIT",
      contactReason: null,
      message: null,
      cta: null,
      timing: { mode: "WAIT_UNTIL", date: "2026-09-28", note: null },
      action: "Wait.",
      noResponsePlan: "Don't reach out before Monday.",
      facts: {
        scope: "IN_SCOPE",
        scenario: "OTHER_WARM_FOLLOWUP",
        channel: "EMAIL",
        attempts: 0,
        attemptsRange: null,
        closeLoopSent: false,
        hardStop: null,
        notRightNow: null,
        owedResponse: null,
        commitment: { by: "LEAD", quote: "I'll send the documents on Monday", timing: { type: "SPECIFIC", words: "Monday", date: "2026-09-28", resolution: null } },
        deadline: null,
        reason: null,
        newInfo: null,
        tooSoon: false,
      },
    });
    const report = validate(parsed(json), baseCtx());
    expect(report.errors.some((e) => e.code === "E_WAIT_EARLY_CONTACT")).toBe(false);
  });
});

describe("grounding (TEST_PLAN §7.6)", () => {
  function withQuote(quote: string) {
    return goodJson({
      facts: {
        scope: "IN_SCOPE",
        scenario: "PROPOSAL_SENT",
        channel: "EMAIL",
        attempts: 1,
        attemptsRange: null,
        closeLoopSent: false,
        hardStop: null,
        notRightNow: null,
        owedResponse: { kind: "QUESTION", quote, sure: true },
        commitment: null,
        deadline: null,
        reason: null,
        newInfo: null,
        tooSoon: false,
      },
    });
  }

  it("exact quote is grounded", () => {
    const report = validate(parsed(withQuote("I'll review it with my partner")), baseCtx());
    expect(codesOf(report)).not.toContain("E_UNGROUNDED_QUOTE");
  });

  it("ellipsis quote is grounded", () => {
    const report = validate(parsed(withQuote("thanks for the proposal ... get back to you")), baseCtx());
    expect(codesOf(report)).not.toContain("E_UNGROUNDED_QUOTE");
  });

  it("case and whitespace differences are grounded", () => {
    const report = validate(parsed(withQuote("I'LL   REVIEW it with my partner")), baseCtx());
    expect(codesOf(report)).not.toContain("E_UNGROUNDED_QUOTE");
  });

  it("smart quotes are grounded", () => {
    const report = validate(parsed(withQuote("I’ll review it with my partner")), baseCtx());
    expect(codesOf(report)).not.toContain("E_UNGROUNDED_QUOTE");
  });

  it("a close paraphrase is a warning, not an error", () => {
    const report = validate(parsed(withQuote("Ill review it with my partner")), baseCtx());
    expect(codesOf(report)).toContain("W_QUOTE_PARAPHRASED");
    expect(codesOf(report)).not.toContain("E_UNGROUNDED_QUOTE");
  });

  it("an unrelated quote is ungrounded", () => {
    const report = validate(parsed(withQuote("we need a bigger team before we can decide")), baseCtx());
    expect(codesOf(report)).toContain("E_UNGROUNDED_QUOTE");
  });
});

describe("numbers (TEST_PLAN §7.6)", () => {
  it("[price] is fine", () => {
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nOur plan is [price]/month. Would that work?\n\nBest,\n[Your name]" } });
    const report = validate(parsed(json), baseCtx());
    expect(codesOf(report)).not.toContain("E_INVENTED_NUMBER");
  });

  it("an invented currency amount not in the case is an error", () => {
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nOur plan is ₱5,000/month. Would that work?\n\nBest,\n[Your name]" } });
    const report = validate(parsed(json), baseCtx());
    expect(codesOf(report)).toContain("E_INVENTED_NUMBER");
  });

  it("a currency amount present in the case is fine", () => {
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nAs quoted, ₱5,000/month. Would that work?\n\nBest,\n[Your name]" } });
    const report = validate(parsed(json), baseCtx({ leadMessages: `${CASE_TEXT} They quoted ₱5,000/month.` }));
    expect(codesOf(report)).not.toContain("E_INVENTED_NUMBER");
  });
});

describe("links (TEST_PLAN §7.6)", () => {
  it("[link] is fine", () => {
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nBook here: [link]\n\nBest,\n[Your name]" } });
    const report = validate(parsed(json), baseCtx());
    expect(codesOf(report)).not.toContain("E_INVENTED_LINK");
  });

  it("a URL present in the case is fine", () => {
    const url = "https://example.com/proposal";
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body: `Hi Ana,\n\nHere it is again: ${url}\n\nBest,\n[Your name]` } });
    const report = validate(parsed(json), baseCtx({ leadMessages: `${CASE_TEXT} See ${url}`, redact: false }));
    expect(codesOf(report)).not.toContain("E_INVENTED_LINK");
  });

  it("a new URL not in the case is an error", () => {
    const json = goodJson({ message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nBook here: https://calendly.com/me/10min\n\nBest,\n[Your name]" } });
    const report = validate(parsed(json), baseCtx());
    expect(codesOf(report)).toContain("E_INVENTED_LINK");
  });
});

describe("checkAnswer (design §9.2a)", () => {
  it("parses and validates in one call", () => {
    const answer = ["```json", JSON.stringify(goodJson()), "```"].join("\n");
    const report = checkAnswer(answer, baseCtx());
    expect(report.status).toBe("READY");
  });

  it("returns UNPARSEABLE for unusable text", () => {
    const report = checkAnswer("no structured answer here", baseCtx());
    expect(report.status).toBe("UNPARSEABLE");
  });
});

// ---------------------------------------------------------------------------
// False-positive guards found in lead review. Each one would have wrongly failed
// a good AI answer.
// ---------------------------------------------------------------------------

describe("false-positive guards (lead review)", () => {
  it("a grounded 'you mentioned …' is fine; an invented one is still an error", () => {
    const ctx = baseCtx({ leadMessages: "We need Xero integration before we can move forward." });
    const grounded = goodJson({
      message: {
        channel: "EMAIL",
        subject: null,
        body:
          "Hi Ana,\n\nYou mentioned you need Xero integration before you can move forward. Would a quick demo on Tuesday or Wednesday help?\n\nBest,\n[Your name]",
      },
      cta: { text: "Would a quick demo on Tuesday or Wednesday help?", type: "CHOOSE_ONE" },
    });
    expect(codesOf(validate(parsed(grounded), ctx))).not.toContain("E_UNSUPPORTED_ATTRIBUTION");

    const invented = goodJson({
      message: {
        channel: "EMAIL",
        subject: null,
        body: "Hi Ana,\n\nYou mentioned your board meets next Thursday. Would Tuesday or Wednesday work for a call?\n\nBest,\n[Your name]",
      },
    });
    expect(codesOf(validate(parsed(invented), ctx))).toContain("E_UNSUPPORTED_ATTRIBUTION");
  });

  it("'you promised' is always flagged (blame framing), even when grounded", () => {
    const ctx = baseCtx({ leadMessages: "I'll send the documents by Friday." });
    const json = goodJson({
      message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nYou promised the documents by Friday. Could you send them?\n\nBest,\n[Your name]" },
      cta: { text: "Could you send them?", type: "SEND_ITEM" },
    });
    expect(codesOf(validate(parsed(json), ctx))).toContain("E_UNSUPPORTED_ATTRIBUTION");
  });

  it("scarcity the user actually supplied is fine; invented scarcity is an error", () => {
    const supplied = baseCtx({ notes: "True fact: only 2 spots left in the October batch." });
    const json = goodJson({
      message: {
        channel: "EMAIL",
        subject: null,
        body: "Hi Ana,\n\nFor planning: there are only 2 spots left in the October batch. Would you like me to hold one?\n\nBest,\n[Your name]",
      },
      cta: { text: "Would you like me to hold one?", type: "YES_NO" },
    });
    expect(codesOf(validate(parsed(json), supplied))).not.toContain("E_FAKE_SCARCITY");
    expect(codesOf(validate(parsed(json), baseCtx()))).toContain("E_FAKE_SCARCITY");
  });

  it("a SCHEDULED send date after a passed vague commitment is not E_TIMING_DATE_UNGROUNDED", () => {
    const ctx = baseCtx({ leadMessages: "I'll get back to you after the holidays." });
    const json = goodJson({
      timing: { mode: "SCHEDULED", date: "2026-09-29", note: "Typical practice: a few business days after your last message." },
      facts: {
        ...(goodJson().facts as Record<string, unknown>),
        attempts: 0,
        reason: null,
        commitment: {
          by: "LEAD",
          quote: "I'll get back to you after the holidays.",
          timing: { type: "VAGUE", words: "after the holidays", date: null, resolution: "PASSED" },
        },
      },
    });
    expect(codesOf(validate(parsed(json), ctx))).not.toContain("E_TIMING_DATE_UNGROUNDED");
  });
});

describe("courtesy phrases are not fake urgency (lead review)", () => {
  it('"No hurry" is fine; "Hurry" is fake urgency', () => {
    const calm = goodJson({
      message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nNo hurry at all. Would Tuesday or Wednesday work for a quick call?\n\nBest,\n[Your name]" },
    });
    expect(codesOf(validate(parsed(calm), baseCtx()))).not.toContain("E_FAKE_URGENCY");
    const pushy = goodJson({
      message: { channel: "EMAIL", subject: null, body: "Hi Ana,\n\nHurry, would Tuesday or Wednesday work for a quick call?\n\nBest,\n[Your name]" },
    });
    expect(codesOf(validate(parsed(pushy), baseCtx()))).toContain("E_FAKE_URGENCY");
  });
});
