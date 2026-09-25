import { describe, expect, it } from "vitest";
import { buildFinishPrompt, buildRepairPrompt } from "../../src/repair.js";
import type { ValidationReport } from "../../src/types.js";

function report(overrides: Partial<ValidationReport>): ValidationReport {
  return {
    status: "FIX_REQUIRED",
    errors: [],
    warnings: [],
    infos: [],
    engine: null,
    factMismatches: [],
    placeholders: [],
    ...overrides,
  };
}

describe("buildRepairPrompt (design §9.8, TEST_PLAN §7.9)", () => {
  it("returns null for a warnings-only report", () => {
    const r = report({ status: "READY_WITH_WARNINGS", warnings: [{ code: "W_TOO_LONG", severity: "warning", message: "too long", rule: "x" }] });
    expect(buildRepairPrompt(r)).toBeNull();
  });

  it("lists each error with its code and found text", () => {
    const r = report({
      errors: [
        { code: "E_CLOSE_LOOP_CTA", severity: "error", message: 'A CLOSE_LOOP message must not ask for a reply. Found: "Should I close your file?"', rule: "x", found: "Should I close your file?" },
      ],
    });
    const prompt = buildRepairPrompt(r);
    expect(prompt).not.toBeNull();
    expect(prompt).toContain("[E_CLOSE_LOOP_CTA]");
    expect(prompt).toContain("Should I close your file?");
  });

  it("asks for the full answer in the same format and includes the rejectedAssumptions clause", () => {
    const r = report({ errors: [{ code: "E_GUILT", severity: "error", message: "guilt", rule: "x" }] });
    const prompt = buildRepairPrompt(r)!;
    expect(prompt).toContain("Rewrite the complete answer in the same format");
    expect(prompt).toContain("rejectedAssumptions");
  });

  it("numbers multiple errors in order", () => {
    const r = report({
      errors: [
        { code: "E_GUILT", severity: "error", message: "one", rule: "x" },
        { code: "E_FAKE_URGENCY", severity: "error", message: "two", rule: "x" },
      ],
    });
    const prompt = buildRepairPrompt(r)!;
    expect(prompt).toContain("1. [E_GUILT]");
    expect(prompt).toContain("2. [E_FAKE_URGENCY]");
  });
});

describe("buildFinishPrompt (design §9.1 TRUNCATED)", () => {
  it("asks the model to continue and complete the answer without adding new facts", () => {
    const prompt = buildFinishPrompt();
    expect(prompt.toLowerCase()).toContain("cut off");
    expect(prompt.toLowerCase()).toContain("complete");
    expect(prompt.toLowerCase()).toContain("new facts");
    expect(prompt).toContain("LFR_JSON_START");
  });
});
