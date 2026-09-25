/**
 * The engine prompts each contain a complete example answer. That example must
 * pass the same validator users' answers are checked with, otherwise the prompt
 * would teach models to produce answers the Rescue Desk rejects.
 */
import { describe, expect, it } from "vitest";
import decisionFixturesJson from "../fixtures/decision.json";
import { COMPACT_PROMPT, ENGINE_PROMPT } from "../../src/generated/prompts";
import { checkAnswer } from "../../src/validate";

const decisionFixtures = decisionFixturesJson as unknown as Array<{ id: string; caseInput: unknown }>;
const d03 = decisionFixtures.find((f) => f.id === "D-03");

const OPEN = "````\nDECISION: FOLLOW_UP";

function exampleAnswer(prompt: string): string | null {
  const start = prompt.indexOf(OPEN);
  if (start < 0) return null;
  const end = prompt.indexOf("LFR_JSON_END", start);
  if (end < 0) return null;
  return prompt.slice(start + "````\n".length, end + "LFR_JSON_END".length);
}

describe("prompt example answers pass the validator", () => {
  it("FULL prompt has a complete example that validates against D-03", () => {
    const answer = exampleAnswer(ENGINE_PROMPT);
    expect(answer, "FULL prompt must contain a complete example answer").not.toBeNull();
    const report = checkAnswer(answer as string, { caseInput: d03?.caseInput as never });
    expect(report.errors.map((e) => `${e.code}: ${e.message}`)).toEqual([]);
    expect(report.status === "READY" || report.status === "READY_WITH_WARNINGS").toBe(true);
  });

  it("COMPACT prompt example (if present) validates against D-03", () => {
    const answer = exampleAnswer(COMPACT_PROMPT);
    if (answer === null) return; // COMPACT may omit the full example to fit its budget
    const report = checkAnswer(answer, { caseInput: d03?.caseInput as never });
    expect(report.errors.map((e) => `${e.code}: ${e.message}`)).toEqual([]);
  });
});
