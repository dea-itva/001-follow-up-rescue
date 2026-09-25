import { describe, expect, it } from "vitest";
import { parseAnswer, parseCard } from "../../src/parse.js";

const GOOD_JSON = {
  lfr: "1.0",
  decision: "CHANGE_ANGLE",
  interaction: "SEQUENCE",
  timing: { mode: "NOW", date: null, note: null },
  reason: "test reason",
  contactReason: "test contact reason",
  action: "test action",
  message: { channel: "EMAIL", subject: null, body: "Hi there." },
  cta: { text: "Hi there.", type: "YES_NO" },
  angle: "a new angle",
  noResponsePlan: "plan",
  doNotDo: ["thing"],
  stopActiveFollowUp: false,
  suppression: "NONE",
  missingInformation: [],
  facts: {
    scope: "IN_SCOPE",
    scenario: "PROPOSAL_SENT",
    channel: "EMAIL",
    attempts: 2,
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
  evidence: [],
  rejectedAssumptions: [],
};

function cardBlock(decision = "CHANGE_ANGLE (Change the angle)"): string {
  return [
    `DECISION: ${decision}`,
    "TIMING: Now",
    "REASON: test reason",
    "ACTION: test action",
    "MESSAGE:",
    "```text",
    "Hi there.",
    "```",
    "NO-RESPONSE PLAN: plan",
    "DO NOT DO:",
    "- thing",
    "STOP ACTIVE FOLLOW-UP: No",
    "MISSING INFORMATION: None",
  ].join("\n");
}

function sentinelBlock(json: unknown): string {
  return ["LFR_JSON_START", "```json", JSON.stringify(json), "```", "LFR_JSON_END"].join("\n");
}

describe("parseAnswer (TEST_PLAN §7.5)", () => {
  it("P-01: card + sentinel + fenced JSON -> json + card", () => {
    const answer = `${cardBlock()}\n\n${sentinelBlock(GOOD_JSON)}`;
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CHANGE_ANGLE");
    expect(result.card?.decision).toBe("CHANGE_ANGLE");
    expect(result.card?.message).toBe("Hi there.");
  });

  it("P-02: fenced JSON, no sentinel -> json", () => {
    const answer = ["Here is the answer:", "```json", JSON.stringify(GOOD_JSON), "```"].join("\n");
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CHANGE_ANGLE");
  });

  it("P-03: smart quotes in the JSON -> json (repaired)", () => {
    const raw = JSON.stringify(GOOD_JSON).replace(/"reason":"test reason"/, "\u201creason\u201d:\u201ctest reason\u201d");
    const answer = ["```json", raw, "```"].join("\n");
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.reason).toBe("test reason");
  });

  it("P-04: trailing commas and // comment -> json (repaired)", () => {
    const raw = `{
      // a comment
      "lfr": "1.0",
      "decision": "CHANGE_ANGLE",
      "interaction": "SEQUENCE",
      "timing": {"mode":"NOW","date":null,"note":null},
      "reason": "r", "contactReason": "c", "action": "a",
      "message": {"channel":"EMAIL","subject":null,"body":"Hi."},
      "cta": {"text":"Hi.","type":"YES_NO"},
      "angle": "x", "noResponsePlan": "p", "doNotDo": ["d",],
      "stopActiveFollowUp": false, "suppression": "NONE",
      "missingInformation": [],
      "facts": {"scope":"IN_SCOPE","scenario":"PROPOSAL_SENT","channel":"EMAIL","attempts":1,"attemptsRange":null,"closeLoopSent":false,"hardStop":null,"notRightNow":null,"owedResponse":null,"commitment":null,"deadline":null,"reason":null,"newInfo":null,"tooSoon":false},
      "evidence": [],
      "rejectedAssumptions": [],
    }`;
    const answer = ["```json", raw, "```"].join("\n");
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CHANGE_ANGLE");
  });

  it("P-05: two JSON blocks, the first invalid -> the last valid one", () => {
    const invalid = "```json\n{ this is not valid json at all \n```";
    const valid = ["```json", JSON.stringify(GOOD_JSON), "```"].join("\n");
    const answer = `${invalid}\n\n${valid}`;
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CHANGE_ANGLE");
  });

  it("P-06: JSON cut off mid-object -> TRUNCATED", () => {
    const answer = ["LFR_JSON_START", "```json", '{"lfr":"1.0","decision":"FOLLOW'].join("\n");
    const result = parseAnswer(answer);
    expect(result.status).toBe("TRUNCATED");
    expect(result.json).toBeNull();
  });

  it("P-07: markdown-decorated labels -> card fields parsed", () => {
    const answer = ["**DECISION:** CHANGE_ANGLE (Change the angle)", "### MESSAGE", "```text", "Hi there.", "```"].join("\n");
    const result = parseAnswer(answer);
    expect(result.card?.decision).toBe("CHANGE_ANGLE");
    expect(result.card?.message).toBe("Hi there.");
  });

  it("P-08: card only -> card, no json", () => {
    const result = parseAnswer(cardBlock());
    expect(result.json).toBeNull();
    expect(result.card).not.toBeNull();
    expect(result.card?.decision).toBe("CHANGE_ANGLE");
  });

  it("P-09: JSON_ONLY raw object -> json", () => {
    const result = parseAnswer(JSON.stringify(GOOD_JSON));
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CHANGE_ANGLE");
  });

  it("P-10: zero-width, NBSP and tag characters around the JSON -> json; stripped", () => {
    const zw = "\u200B";
    const nbsp = "\u00A0";
    const tagChar = "\u{E0041}";
    const answer = `${zw}${tagChar}\`\`\`json${nbsp}\n${JSON.stringify(GOOD_JSON)}\n\`\`\`${zw}`;
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CHANGE_ANGLE");
  });

  it('P-11: lenient coercion ("close loop", "4+", "true")', () => {
    const raw = {
      ...GOOD_JSON,
      decision: "close loop",
      stopActiveFollowUp: "true",
      facts: { ...GOOD_JSON.facts, attempts: "4+" },
    };
    const answer = ["```json", JSON.stringify(raw), "```"].join("\n");
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    expect(result.json?.decision).toBe("CLOSE_LOOP");
    expect(result.json?.stopActiveFollowUp).toBe(true);
    expect((result.json?.facts as { attempts: unknown })?.attempts).toBe(4);
  });

  it("P-12: random prose -> NOT_FOUND", () => {
    const result = parseAnswer("Sure, happy to help! Let me think about this lead for a moment.");
    expect(result.status).toBe("NOT_FOUND");
    expect(result.json).toBeNull();
    expect(result.card).toBeNull();
  });

  it("P-13: raw newline inside a JSON string -> json (repaired)", () => {
    const raw = `{"lfr":"1.0","decision":"FOLLOW_UP","interaction":"SEQUENCE","timing":{"mode":"NOW","date":null,"note":null},"reason":"r","contactReason":"c","action":"a","message":{"channel":"EMAIL","subject":null,"body":"Hi Ana,\nfollowing up on this."},"cta":{"text":"Hi Ana, following up on this.","type":"YES_NO"},"angle":null,"noResponsePlan":"p","doNotDo":[],"stopActiveFollowUp":false,"suppression":"NONE","missingInformation":[],"facts":{"scope":"IN_SCOPE","scenario":"PROPOSAL_SENT","channel":"EMAIL","attempts":1,"attemptsRange":null,"closeLoopSent":false,"hardStop":null,"notRightNow":null,"owedResponse":null,"commitment":null,"deadline":null,"reason":null,"newInfo":null,"tooSoon":false},"evidence":[],"rejectedAssumptions":[]}`;
    const answer = ["```json", raw, "```"].join("\n");
    const result = parseAnswer(answer);
    expect(result.status).toBe("OK");
    const message = result.json?.message as { body: string } | null;
    expect(message?.body).toContain("\n");
  });
});

describe("parseCard", () => {
  it("returns null when no label is found at all", () => {
    expect(parseCard("just some random text")).toBeNull();
  });

  it("parses DO NOT DO as a bullet list", () => {
    const card = parseCard(cardBlock());
    expect(card?.doNotDo).toEqual(["thing"]);
  });

  it("parses MISSING INFORMATION as None -> []", () => {
    const card = parseCard(cardBlock());
    expect(card?.missingInformation).toEqual([]);
  });

  it("parses numbered MISSING INFORMATION questions", () => {
    const text = ["DECISION: NEED_MISSING_INFORMATION", "MISSING INFORMATION:", "1. How many follow-ups?", "2. What did they say?"].join(
      "\n",
    );
    const card = parseCard(text);
    expect(card?.missingInformation).toEqual(["How many follow-ups?", "What did they say?"]);
  });

  it("MESSAGE: None -> message null", () => {
    const text = ["DECISION: WAIT", "MESSAGE:", "None"].join("\n");
    const card = parseCard(text);
    expect(card?.message).toBeNull();
  });

  it("STOP ACTIVE FOLLOW-UP: Yes/No -> boolean", () => {
    expect(parseCard("STOP ACTIVE FOLLOW-UP: Yes")?.stopActiveFollowUp).toBe(true);
    expect(parseCard("STOP ACTIVE FOLLOW-UP: No")?.stopActiveFollowUp).toBe(false);
  });
});
