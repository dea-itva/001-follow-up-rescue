import { describe, expect, it } from "vitest";
import decisionFixturesJson from "./fixtures/decision.json";
import robustnessFixturesJson from "./fixtures/robustness.json";

// No @types/node dependency (per the pinned devDependency list): declare the
// one ambient global this file's coverage-summary printout needs.
declare const console: { log: (...args: unknown[]) => void };
import { decide } from "../src/engine.js";
import { factsFromForm } from "../src/facts.js";
import { precheck } from "../src/precheck.js";
import type {
  CaseInput,
  Decision,
  EngineResult,
  Facts,
  Interaction,
  PrecheckCategory,
  Suppression,
  UnknownField,
} from "../src/types.js";

// ---------------------------------------------------------------------------
// Fixture shape (design TEST_PLAN.md §3)
// ---------------------------------------------------------------------------

interface EngineExpectation {
  decision?: Decision;
  interaction?: Interaction;
  stopActiveFollowUp?: boolean;
  suppression?: Suppression;
  messageAllowed?: boolean;
  waitUntil?: string | null;
  materialUnknowns?: UnknownField[];
}

interface PrecheckExpectation {
  mustFlag: PrecheckCategory[];
  mustNotFlag: PrecheckCategory[];
}

interface Fixture {
  id: string;
  suite: "decision" | "robustness";
  category?: string;
  title: string;
  confidence: "EXACT" | "CONTEXTUAL" | "RECONSTRUCTED" | "NEW" | "CONFLICT";
  specRefs: string[];
  dl: string[];
  raw: string;
  caseInput?: CaseInput;
  facts?: Facts;
  formEquivalent?: boolean;
  base?: string;
  expect: {
    engine: EngineExpectation;
    questionsRange?: [number, number];
    llmAccepted: Decision[];
    invariants: string[];
    precheck: PrecheckExpectation;
  };
  notes: string;
}

const decisionFixtures = decisionFixturesJson as unknown as Fixture[];
const robustnessFixtures = robustnessFixturesJson as unknown as Fixture[];
const allFixtures = [...decisionFixtures, ...robustnessFixtures];

function byId(id: string): Fixture {
  const f = allFixtures.find((x) => x.id === id);
  if (!f) throw new Error(`fixtures.test.ts: base fixture ${id} not found`);
  return f;
}

/** Resolves `facts`/`caseInput` for a fixture that reuses a base fixture's case (design §4.8: D-41...D-45). */
function resolved(f: Fixture): { facts: Facts; caseInput: CaseInput | undefined } {
  if (f.base) {
    const base = byId(f.base);
    return { facts: (f.facts ?? base.facts)!, caseInput: f.caseInput ?? base.caseInput };
  }
  return { facts: f.facts!, caseInput: f.caseInput };
}

function assertEngine(result: EngineResult, expected: EngineExpectation, label: string) {
  if (expected.decision !== undefined) expect(result.decision, label).toBe(expected.decision);
  if (expected.interaction !== undefined) expect(result.interaction, label).toBe(expected.interaction);
  if (expected.stopActiveFollowUp !== undefined) expect(result.stopActiveFollowUp, label).toBe(expected.stopActiveFollowUp);
  if (expected.suppression !== undefined) expect(result.suppression, label).toBe(expected.suppression);
  if (expected.messageAllowed !== undefined) expect(result.messageAllowed, label).toBe(expected.messageAllowed);
  if (expected.waitUntil !== undefined) expect(result.waitUntil, label).toBe(expected.waitUntil);
  if (expected.materialUnknowns !== undefined) {
    expect(new Set(result.materialUnknowns), label).toEqual(new Set(expected.materialUnknowns));
  }
}

// ---------------------------------------------------------------------------
// Coverage summary (design TEST_PLAN.md §11)
// ---------------------------------------------------------------------------

function printCoverageSummary() {
  const lines: string[] = [];
  lines.push("");
  lines.push("Fixture coverage summary");
  lines.push("========================");
  for (const [suiteName, fixtures] of [
    ["decision", decisionFixtures],
    ["robustness", robustnessFixtures],
  ] as const) {
    lines.push(`${suiteName}: ${fixtures.length} fixtures`);
    const byConf = new Map<string, number>();
    for (const f of fixtures) byConf.set(f.confidence, (byConf.get(f.confidence) ?? 0) + 1);
    for (const [conf, count] of [...byConf.entries()].sort()) {
      lines.push(`  ${conf}: ${count}`);
    }
  }
  const specCounts = new Map<string, number>();
  for (const f of allFixtures) for (const s of f.specRefs) specCounts.set(s, (specCounts.get(s) ?? 0) + 1);
  lines.push(`spec sections referenced: ${specCounts.size} distinct`);
  for (const [spec, count] of [...specCounts.entries()].sort()) {
    lines.push(`  ${spec}: ${count}`);
  }
  console.log(lines.join("\n"));
}

printCoverageSummary();

// ---------------------------------------------------------------------------
// Per-fixture assertions
// ---------------------------------------------------------------------------

describe("decision suite fixtures (design TEST_PLAN.md §4)", () => {
  for (const f of decisionFixtures) {
    describe(`${f.id}: ${f.title}`, () => {
      const { facts, caseInput } = resolved(f);

      it("decide(facts) matches expect.engine", () => {
        const result = decide(facts);
        assertEngine(result, f.expect.engine, f.id);
        if (f.expect.questionsRange) {
          const [min, max] = f.expect.questionsRange;
          expect(result.questions.length, f.id).toBeGreaterThanOrEqual(min);
          expect(result.questions.length, f.id).toBeLessThanOrEqual(max);
        }
      });

      if (f.formEquivalent) {
        it("decide(factsFromForm(caseInput)) reaches the same decision", () => {
          if (!caseInput) throw new Error(`${f.id}: formEquivalent is true but no caseInput is present`);
          const viaForm = decide(factsFromForm(caseInput));
          expect(viaForm.decision, f.id).toBe(f.expect.engine.decision ?? decide(facts).decision);
        });
      }

      if (caseInput) {
        it("precheck(caseInput) raises the expected signals", () => {
          const signals = precheck(caseInput).signals;
          const categories = new Set(signals.map((s) => s.category));
          for (const must of f.expect.precheck.mustFlag) {
            expect(categories.has(must), `${f.id}: expected ${must} to be flagged`).toBe(true);
          }
          for (const mustNot of f.expect.precheck.mustNotFlag) {
            expect(categories.has(mustNot), `${f.id}: expected ${mustNot} NOT to be flagged`).toBe(false);
          }
        });
      }
    });
  }
});

describe("robustness suite fixtures (design TEST_PLAN.md §6)", () => {
  for (const f of robustnessFixtures) {
    describe(`${f.id} [${f.category}]: ${f.title}`, () => {
      const { facts, caseInput } = resolved(f);

      it("decide(facts) matches expect.engine", () => {
        const result = decide(facts);
        assertEngine(result, f.expect.engine, f.id);
      });

      if (caseInput) {
        it("precheck(caseInput) raises the expected signals on the raw text's lead/user split", () => {
          const signals = precheck(caseInput).signals;
          const categories = new Set(signals.map((s) => s.category));
          for (const must of f.expect.precheck.mustFlag) {
            expect(categories.has(must), `${f.id}: expected ${must} to be flagged`).toBe(true);
          }
          for (const mustNot of f.expect.precheck.mustNotFlag) {
            expect(categories.has(mustNot), `${f.id}: expected ${mustNot} NOT to be flagged`).toBe(false);
          }
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Cross-suite sanity
// ---------------------------------------------------------------------------

describe("fixture catalogue sanity", () => {
  it("every fixture id is unique", () => {
    const ids = allFixtures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("decision suite covers D-01 through D-63 plus D-16b, D-35a, D-35b", () => {
    const ids = new Set(decisionFixtures.map((f) => f.id));
    for (let n = 1; n <= 45; n++) {
      const id = `D-${String(n).padStart(2, "0")}`;
      if (id === "D-35") continue; // split into D-35a / D-35b
      expect(ids.has(id), id).toBe(true);
    }
    for (const id of ["D-16b", "D-35a", "D-35b"]) expect(ids.has(id), id).toBe(true);
    for (let n = 46; n <= 63; n++) expect(ids.has(`D-${n}`), `D-${n}`).toBe(true);
  });

  it("robustness suite covers R-01 through R-30", () => {
    const ids = new Set(robustnessFixtures.map((f) => f.id));
    for (let n = 1; n <= 30; n++) expect(ids.has(`R-${String(n).padStart(2, "0")}`), `R-${n}`).toBe(true);
  });

  it("robustness category counts match the recovered table (design TEST_PLAN.md §6)", () => {
    const counts = new Map<string, number>();
    for (const f of robustnessFixtures) counts.set(f.category!, (counts.get(f.category!) ?? 0) + 1);
    expect(counts.get("shorthand")).toBe(5);
    expect(counts.get("incomplete")).toBe(5);
    expect(counts.get("contradictory")).toBe(5);
    expect(counts.get("bias")).toBe(3);
    expect(counts.get("taglish")).toBe(4);
    expect(counts.get("timing")).toBe(3);
    expect(counts.get("crm")).toBe(1);
    expect(counts.get("excessive")).toBe(1);
    expect(counts.get("trap")).toBe(3);
  });

  it("every NEED_FOLLOW_UP_REASON fixture has reason first in materialUnknowns", () => {
    for (const f of allFixtures) {
      if (f.expect.engine.decision === "NEED_FOLLOW_UP_REASON") {
        expect(f.expect.engine.materialUnknowns?.[0], f.id).toBe("reason");
      }
    }
  });

  it("R-28's raw text is a realistic long thread (excessive category)", () => {
    const r28 = byId("R-28");
    expect(r28.raw.split(/\s+/).length).toBeGreaterThan(400);
  });
});
