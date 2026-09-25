import { describe, expect, it } from "vitest";
import integrityFixturesJson from "./fixtures/integrity.json";
import decisionFixturesJson from "./fixtures/decision.json";
import robustnessFixturesJson from "./fixtures/robustness.json";
import { validate } from "../src/validate.js";
import { precheck } from "../src/precheck.js";
import type { ParsedAnswer, ParsedCard } from "../src/parse.js";
import type { CaseInput, PrecheckCategory, ValidationContext } from "../src/types.js";

// ---------------------------------------------------------------------------
// Fixture shape (design TEST_PLAN.md §3.2, plus this implementer's additive
// fields: `caseInputPatch` and `precheckMustFlag` on the fixture, and `card`
// on a bad variant — see the final report's "Deviations and choices").
// ---------------------------------------------------------------------------

interface OiBad {
  label: string;
  patch: Record<string, unknown>;
  expectCodes: string[];
  card?: Partial<ParsedCard>;
}

interface OiFixture {
  id: string;
  suite: "integrity";
  requirement: string;
  confidence: string;
  base: string;
  caseInputPatch?: Record<string, unknown>;
  precheckMustFlag?: PrecheckCategory[];
  good: Record<string, unknown>;
  goodWarnings: string[];
  bad: OiBad[];
}

const integrityFixtures = integrityFixturesJson as unknown as OiFixture[];
const decisionFixtures = decisionFixturesJson as unknown as { id: string; caseInput?: CaseInput }[];
const robustnessFixtures = robustnessFixturesJson as unknown as { id: string; caseInput?: CaseInput }[];
const allBase = [...decisionFixtures, ...robustnessFixtures];

function byId(id: string): { id: string; caseInput?: CaseInput } {
  const f = allBase.find((x) => x.id === id);
  if (!f) throw new Error(`integrity.test.ts: base fixture ${id} not found`);
  return f;
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

/** Applies a dot-path patch (design §3.2) to a deep copy of `obj`. `"$delete"` removes the key. */
function applyPatch<T>(obj: T, patch: Record<string, unknown>): T {
  const out = clone(obj) as unknown as Record<string, unknown>;
  for (const [path, value] of Object.entries(patch)) {
    const parts = path.split(".");
    let cur: Record<string, unknown> = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      if (cur[key] === undefined || cur[key] === null) cur[key] = {};
      cur = cur[key] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1]!;
    if (value === "$delete") delete cur[last];
    else cur[last] = value;
  }
  return out as unknown as T;
}

function ctxFor(f: OiFixture): ValidationContext {
  const base = byId(f.base);
  if (!base.caseInput) throw new Error(`integrity.test.ts: base fixture ${f.base} has no caseInput`);
  const caseInput = f.caseInputPatch ? applyPatch(base.caseInput, f.caseInputPatch) : base.caseInput;
  return { caseInput, today: caseInput.today };
}

const EMPTY_CARD: ParsedCard = {
  decision: null,
  decisionName: null,
  timing: null,
  reason: null,
  action: null,
  message: null,
  noResponsePlan: null,
  doNotDo: [],
  stopActiveFollowUp: null,
  missingInformation: [],
};

function parsedFor(json: Record<string, unknown>, card?: Partial<ParsedCard>): ParsedAnswer {
  return { json, card: card ? { ...EMPTY_CARD, ...card } : null, status: "OK", problems: [] };
}

describe("integrity suite fixtures (design TEST_PLAN.md §5)", () => {
  for (const f of integrityFixtures) {
    describe(`${f.id}: ${f.requirement}`, () => {
      const ctx = ctxFor(f);

      it("good output validates with zero errors and only the listed warnings", () => {
        const report = validate(parsedFor(f.good), ctx);
        expect(report.errors, `${f.id} good: unexpected errors ${JSON.stringify(report.errors)}`).toEqual([]);
        const gotWarnings = report.warnings.map((w) => w.code).sort();
        expect(gotWarnings, `${f.id} good: warnings`).toEqual([...f.goodWarnings].sort());
      });

      if (f.precheckMustFlag) {
        it("precheck raises the expected signals", () => {
          const signals = precheck(ctx.caseInput!).signals.map((s) => s.category);
          for (const must of f.precheckMustFlag!) {
            expect(signals, `${f.id}: expected ${must} to be flagged`).toContain(must);
          }
        });
      }

      for (const bad of f.bad) {
        it(`bad (${bad.label}) reports ${bad.expectCodes.join(", ")}`, () => {
          const badJson = applyPatch(f.good, bad.patch);
          const report = validate(parsedFor(badJson, bad.card), ctx);
          const gotCodes = new Set<string>([...report.errors, ...report.warnings].map((v) => v.code));
          for (const want of bad.expectCodes) {
            expect(gotCodes.has(want), `${f.id} (${bad.label}): expected ${want}, got ${JSON.stringify([...gotCodes])}`).toBe(true);
          }
        });
      }
    });
  }
});

describe("integrity fixture catalogue sanity", () => {
  it("covers OI-001 through OI-060", () => {
    const ids = new Set(integrityFixtures.map((f) => f.id));
    for (let n = 1; n <= 60; n++) {
      const id = `OI-${String(n).padStart(3, "0")}`;
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("every fixture id is unique", () => {
    const ids = integrityFixtures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
