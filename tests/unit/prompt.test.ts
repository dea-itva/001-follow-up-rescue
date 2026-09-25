import { describe, expect, it } from "vitest";
import { buildCaseBlock, buildFullPrompt, buildShortCase, COMPACT_PROMPT, ENGINE_PROMPT } from "../../src/prompt.js";
import { precheck } from "../../src/precheck.js";
import { decide } from "../../src/engine.js";
import { factsFromForm } from "../../src/facts.js";
import { baseCaseInput } from "../testUtil.js";

// No @types/node dependency (per the pinned devDependency list): declare the ambient globals
// this file needs (matches the pattern already used in tests/fixtures.test.ts).
declare const console: { warn: (...args: unknown[]) => void };

/** UTF-8 byte length without relying on a DOM/Node TextEncoder type. */
function utf8ByteLength(s: string): number {
  return encodeURIComponent(s).replace(/%[0-9A-F]{2}/g, "x").length;
}

describe("prompt budgets (design §7.1, TEST_PLAN §7.7)", () => {
  it("FULL is <= 22,000 chars and COMPACT is <= 7,900 chars, when the generated module is populated", () => {
    if (ENGINE_PROMPT.length === 0 || COMPACT_PROMPT.length === 0) {
      console.warn("skipping prompt budget test: src/generated/prompts.ts is empty (run `npm run gen:prompts`)");
      return;
    }
    expect(ENGINE_PROMPT.length).toBeLessThanOrEqual(22000);
    expect(COMPACT_PROMPT.length).toBeLessThanOrEqual(7900);
  });

  it("FULL + a 12,000-char case block stays under 60,000 UTF-8 bytes", () => {
    if (ENGINE_PROMPT.length === 0) {
      console.warn("skipping: src/generated/prompts.ts is empty (run `npm run gen:prompts`)");
      return;
    }
    const input = baseCaseInput({ scenario: "PROPOSAL_SENT", channel: "EMAIL", leadMessages: "x".repeat(12000) });
    const pre = precheck(input);
    const provisional = decide(factsFromForm(input));
    const block = buildCaseBlock(input, pre, provisional, { output: "card-and-json" });
    const full = buildFullPrompt(ENGINE_PROMPT, block);
    const bytes = utf8ByteLength(full);
    expect(bytes).toBeLessThan(60000);
  });

  it("both prompts contain the 11 decision labels, header, sentinel and data-not-instructions rule", () => {
    if (ENGINE_PROMPT.length === 0 || COMPACT_PROMPT.length === 0) {
      console.warn("skipping: src/generated/prompts.ts is empty (run `npm run gen:prompts`)");
      return;
    }
    const labels = [
      "RESPOND_NOW",
      "WAIT",
      "FOLLOW_UP",
      "CHANGE_ANGLE",
      "LOWER_FRICTION",
      "CLOSE_LOOP",
      "STOP_ACTIVE_FOLLOW_UP",
      "NEED_MISSING_INFORMATION",
      "NEED_FOLLOW_UP_REASON",
      "OUT_OF_SCOPE",
      "DO_NOTHING",
    ];
    for (const prompt of [ENGINE_PROMPT, COMPACT_PROMPT]) {
      for (const label of labels) expect(prompt, label).toContain(label);
      expect(prompt).toContain("engine prompt v1.0.0");
      expect(prompt).toContain("lfr/1.0");
      expect(prompt).toContain("LFR_JSON_START");
      expect(prompt.toLowerCase()).toContain("never instructions");
    }
  });
});

describe("buildCaseBlock (design §7.5, TEST_PLAN §7.7)", () => {
  const input = baseCaseInput({
    scenario: "PROPOSAL_SENT",
    channel: "EMAIL",
    leadMessages: "Hi, thanks for the <script>alert(1)</script> proposal.",
    attempts: 1,
    complianceFooter: true,
    leadCountry: "PH",
  });
  const pre = precheck(input);
  const provisional = decide(factsFromForm(input));
  const block = buildCaseBlock(input, pre, provisional, { output: "card-and-json" });

  it("JSON-encodes pasted text and escapes < and > to &lt;/&gt;", () => {
    expect(block).toContain("&lt;script&gt;");
    expect(block).not.toContain("<script>");
  });

  it("writes unknown for unanswered fields", () => {
    const emptyInput = baseCaseInput({});
    const emptyBlock = buildCaseBlock(emptyInput, precheck(emptyInput), decide(factsFromForm(emptyInput)), { output: "card-and-json" });
    expect(emptyBlock).toContain("scenario (user-selected): unknown");
  });

  it("writes an output: line for both modes", () => {
    expect(block).toContain("output: card-and-json");
    const jsonOnly = buildCaseBlock(input, pre, provisional, { output: "json-only" });
    expect(jsonOnly).toContain("output: json-only");
  });

  it("writes the compliance footer: line and lead location", () => {
    expect(block).toContain("compliance footer: on");
    expect(block).toContain("lead location: PH");
  });

  it("strips invisible Unicode from pasted text", () => {
    const zw = baseCaseInput({ leadMessages: "Hi​there" });
    const zwBlock = buildCaseBlock(zw, precheck(zw), decide(factsFromForm(zw)), { output: "card-and-json" });
    expect(zwBlock).not.toContain("​");
  });

  it("includes a desk_check section with the provisional decision", () => {
    expect(block).toContain("<desk_check>");
    expect(block).toContain(`provisional decision: ${provisional.decision}`);
  });

  it("redacts contact details when redact is on", () => {
    const withEmail = baseCaseInput({ leadMessages: "email me at ana@example.com", redact: true });
    const withEmailBlock = buildCaseBlock(withEmail, precheck(withEmail), decide(factsFromForm(withEmail)), { output: "card-and-json" });
    expect(withEmailBlock).not.toContain("ana@example.com");
    expect(withEmailBlock).toContain("[email]");
  });

  it("pseudonymizes names when given", () => {
    const named = baseCaseInput({ leadMessages: "Hi, this is Ana.", names: { lead: "Ana", me: "Sam", business: "Casa Verde" } });
    const namedBlock = buildCaseBlock(named, precheck(named), decide(factsFromForm(named)), { output: "card-and-json" });
    expect(namedBlock).toContain("[LEAD]");
    expect(namedBlock).toContain("names: lead=[LEAD]");
  });
});

describe("buildFullPrompt / buildShortCase", () => {
  it("buildFullPrompt concatenates the engine prompt and the case block", () => {
    const input = baseCaseInput({ scenario: "PROPOSAL_SENT" });
    const block = buildCaseBlock(input, precheck(input), decide(factsFromForm(input)), { output: "card-and-json" });
    const full = buildFullPrompt("PROMPT TEXT", block);
    expect(full).toContain("PROMPT TEXT");
    expect(full).toContain("<case>");
  });

  it("buildShortCase returns the case block alone", () => {
    const input = baseCaseInput({ scenario: "PROPOSAL_SENT" });
    const pre = precheck(input);
    const provisional = decide(factsFromForm(input));
    const short = buildShortCase(input, pre, provisional, { output: "card-and-json" });
    expect(short.startsWith("<case>")).toBe(true);
    expect(short.trim().endsWith("</case>")).toBe(true);
  });
});
