/**
 * Unit tests for the eval harness (design §3.3, TEST_PLAN §8.1): grading,
 * the Wilson interval, report rendering, provider request/retry plumbing and
 * CLI parsing. No network — every `fetch` call is mocked. Canned "good" and
 * "bad" answers come from `tests/fixtures/integrity.json` (OI-004), the same
 * fixture catalogue `tests/integrity.test.ts` uses, wrapped as if they were a
 * real model's LFR_JSON_START/END answer.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import decisionFixturesJson from "../fixtures/decision.json";
import integrityFixturesJson from "../fixtures/integrity.json";
import type { CaseInput, Decision } from "../../src/types.js";
import {
  aggregate,
  contextFor,
  createLimiter,
  estimateInputChars,
  gradeOnce,
  buildInitialMessage,
  measuredOnLine,
  parseArgs,
  PROVIDER_ENV_VAR,
  renderJsonReport,
  renderMarkdownReport,
  wilson95,
  withRetry,
  HttpError,
  type Fixture,
  type SampleRecord,
} from "../../eval/run.js";

// Reused by `callProvider`'s three branches, imported indirectly via a small
// local re-export shim since `run.ts` only exports the dispatcher, not the
// per-provider functions directly — the dispatcher is what a real run calls,
// so exercising it end to end (mocked fetch) is the more faithful test.
import { callProvider } from "../../eval/run.js";

// ---------------------------------------------------------------------------
// Canned fixtures (integrity.json OI-004, base D-06)
// ---------------------------------------------------------------------------

interface OiBad {
  label: string;
  patch: Record<string, unknown>;
  expectCodes: string[];
}
interface OiFixture {
  id: string;
  base: string;
  good: Record<string, unknown>;
  goodWarnings: string[];
  bad: OiBad[];
}

const integrityFixtures = integrityFixturesJson as unknown as OiFixture[];
const decisionFixtures = decisionFixturesJson as unknown as {
  id: string;
  suite: "decision";
  confidence: string;
  title: string;
  raw: string;
  caseInput: CaseInput;
  expect: Fixture["expect"];
}[];

const oi004 = integrityFixtures.find((f) => f.id === "OI-004");
if (!oi004) throw new Error("eval.test.ts: OI-004 not found in tests/fixtures/integrity.json");
const d06 = decisionFixtures.find((f) => f.id === "D-06");
if (!d06) throw new Error("eval.test.ts: D-06 not found in tests/fixtures/decision.json");

const fixture: Fixture = {
  id: d06.id,
  suite: "decision",
  title: d06.title,
  confidence: d06.confidence,
  raw: d06.raw,
  caseInput: d06.caseInput,
  expect: d06.expect,
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

/** Same dot-path patcher `tests/integrity.test.ts` uses (design TEST_PLAN §3.2). */
function applyPatch<T>(obj: T, patch: Record<string, unknown>): T {
  const out = clone(obj) as unknown as Record<string, unknown>;
  for (const [p, value] of Object.entries(patch)) {
    const parts = p.split(".");
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

/** Wraps a RescueResult object as a model would answer it (design §7.3's sentinel format). */
function asAnswerText(json: Record<string, unknown>): string {
  return `DECISION: ${json.decision as string}\n\nLFR_JSON_START\n\`\`\`json\n${JSON.stringify(json)}\n\`\`\`\nLFR_JSON_END\n`;
}

const goodAnswer = asAnswerText(oi004.good);
const badCtaAnswer = asAnswerText(applyPatch(oi004.good, oi004.bad[0]!.patch));
const badRestartAnswer = asAnswerText(applyPatch(oi004.good, oi004.bad[1]!.patch));

const deskCtx = contextFor(fixture, "desk");

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

describe("gradeOnce (canned integrity fixture OI-004 / base D-06)", () => {
  it("a good CLOSE_LOOP answer has no errors, an accepted decision, and passing invariants", () => {
    const grade = gradeOnce(fixture, goodAnswer, deskCtx);
    expect(grade.report.errors).toEqual([]);
    expect(grade.decision).toBe("CLOSE_LOOP");
    expect(grade.decisionAccepted).toBe(true);
    expect(grade.safetyCodes).toEqual([]);
    expect(grade.invariantResults.NO_CTA).toBe("pass");
    expect(grade.invariantResults.NO_DISGUISED_RESTART).toBe("pass");
  });

  it("bad (question disguised as closure) reports E_CLOSE_LOOP_CTA as safety-critical and fails NO_CTA", () => {
    const grade = gradeOnce(fixture, badCtaAnswer, deskCtx);
    const codes = grade.report.errors.map((v) => v.code);
    expect(codes).toContain("E_CLOSE_LOOP_CTA");
    expect(grade.safetyCodes).toContain("E_CLOSE_LOOP_CTA");
    expect(grade.invariantResults.NO_CTA).toBe("fail");
    // The decision label itself is still CLOSE_LOOP — only the message broke a rule.
    expect(grade.decision).toBe("CLOSE_LOOP");
    expect(grade.decisionAccepted).toBe(true);
  });

  it("bad (promises future contact) reports E_CLOSE_LOOP_RESTART and fails NO_DISGUISED_RESTART only", () => {
    const grade = gradeOnce(fixture, badRestartAnswer, deskCtx);
    const codes = grade.report.errors.map((v) => v.code);
    expect(codes).toContain("E_CLOSE_LOOP_RESTART");
    expect(grade.safetyCodes).toContain("E_CLOSE_LOOP_RESTART");
    expect(grade.invariantResults.NO_DISGUISED_RESTART).toBe("fail");
    expect(grade.invariantResults.NO_CTA).toBe("pass");
  });

  it("an unparseable answer never reports a passing decision", () => {
    const grade = gradeOnce(fixture, "the model refused to answer in the required format", deskCtx);
    expect(grade.decision).toBeNull();
    expect(grade.decisionAccepted).toBe(false);
  });

  it("never reports MATCHES_LANGUAGE as pass/fail — it is always not_checked (no language identifier in scope)", () => {
    const withLangInvariant: Fixture = { ...fixture, expect: { ...fixture.expect, invariants: ["MATCHES_LANGUAGE"] } };
    const grade = gradeOnce(withLangInvariant, goodAnswer, deskCtx);
    expect(grade.invariantResults.MATCHES_LANGUAGE).toBe("not_checked");
  });
});

// ---------------------------------------------------------------------------
// Wilson 95% interval
// ---------------------------------------------------------------------------

describe("wilson95", () => {
  it("n = 0 reports p = lo = hi = 0 rather than dividing by zero", () => {
    expect(wilson95(0, 0)).toEqual({ p: 0, lo: 0, hi: 0 });
  });

  it("matches the known closed-form value for 1/1 (z = 1.96)", () => {
    const { p, lo, hi } = wilson95(1, 1);
    expect(p).toBe(1);
    expect(lo).toBeCloseTo(0.2065, 3);
    expect(hi).toBeCloseTo(1, 6);
  });

  it("matches the known closed-form value for 0/1", () => {
    const { p, lo, hi } = wilson95(0, 1);
    expect(p).toBe(0);
    expect(lo).toBeCloseTo(0, 6);
    expect(hi).toBeCloseTo(0.7935, 3);
  });

  it("is always lo <= p <= hi, and narrows as n grows", () => {
    const small = wilson95(7, 10);
    const large = wilson95(70, 100);
    expect(small.lo).toBeLessThanOrEqual(small.p);
    expect(small.p).toBeLessThanOrEqual(small.hi);
    expect(large.hi - large.lo).toBeLessThan(small.hi - small.lo);
  });
});

// ---------------------------------------------------------------------------
// Aggregation + report rendering
// ---------------------------------------------------------------------------

function record(answerText: string, sampleIndex: number, expectedDecision: Decision = "CLOSE_LOOP"): SampleRecord {
  const before = gradeOnce(fixture, answerText, deskCtx);
  return {
    fixtureId: fixture.id,
    suite: fixture.suite,
    confidence: fixture.confidence,
    mode: "desk",
    sampleIndex,
    expectedDecision,
    before,
    after: null,
  };
}

describe("aggregate + report rendering", () => {
  const records: SampleRecord[] = [record(goodAnswer, 0), record(goodAnswer, 1), record(badCtaAnswer, 2)];
  const report = aggregate("anthropic", "claude-sonnet-5", ["desk"], "2026-09-25", records);

  it("computes overall rates from the sample set", () => {
    expect(report.sampleCount).toBe(3);
    expect(report.fixtureCount).toBe(1);
    // 3/3 answers parsed and named a decision in the accepted set.
    expect(report.parseSuccess.p).toBeCloseTo(1, 6);
    expect(report.decisionAcceptedOverall.p).toBeCloseTo(1, 6);
    // 2/3 samples had zero errors before any repair.
    expect(report.errorFreeBeforeRepair.p).toBeCloseTo(2 / 3, 6);
  });

  it("builds a confusion matrix keyed by expected -> actual decision", () => {
    expect(report.confusionMatrix.CLOSE_LOOP?.CLOSE_LOOP).toBe(3);
  });

  it("tallies the violation codes it saw", () => {
    const codes = report.topCodesBefore.map(([code]) => code);
    expect(codes).toContain("E_CLOSE_LOOP_CTA");
  });

  it("tallies invariant outcomes per name", () => {
    expect(report.invariantTallies.NO_CTA).toEqual({ pass: 2, fail: 1, notChecked: 0 });
    expect(report.invariantTallies.NO_DISGUISED_RESTART).toEqual({ pass: 3, fail: 0, notChecked: 0 });
  });

  it("lists a per-fixture summary", () => {
    expect(report.perFixture).toHaveLength(1);
    expect(report.perFixture[0]!.fixtureId).toBe(fixture.id);
    expect(report.perFixture[0]!.samples).toBe(3);
  });

  it("renders valid JSON that round-trips the same shape", () => {
    const json = renderJsonReport(report);
    const parsed = JSON.parse(json) as { provider: string; sampleCount: number };
    expect(parsed.provider).toBe("anthropic");
    expect(parsed.sampleCount).toBe(3);
  });

  it("the markdown report follows the TEST_PLAN §8.3 wording rule: measured, never validated", () => {
    const md = renderMarkdownReport(report);
    expect(md).toContain("Measured on");
    expect(md.toLowerCase()).not.toContain("100% accurate");
    expect(md.toLowerCase()).not.toContain("fully validated");
    expect(md.toLowerCase()).not.toContain("guaranteed compliant");
  });

  it("measuredOnLine names the model, the date and the prompt version", () => {
    const line = measuredOnLine(report);
    expect(line).toContain("anthropic/claude-sonnet-5");
    expect(line).toContain("2026-09-25");
    expect(line).toContain("prompt v");
  });
});

// ---------------------------------------------------------------------------
// Prompt assembly + cost guard
// ---------------------------------------------------------------------------

describe("buildInitialMessage / estimateInputChars", () => {
  it("raw mode is the FULL prompt, a blank line, then the raw text", () => {
    const msg = buildInitialMessage(fixture, "raw");
    expect(msg.endsWith(fixture.raw!)).toBe(true);
    expect(msg).toContain("\n\n");
  });

  it("desk mode embeds the case block's <case> tag", () => {
    const msg = buildInitialMessage(fixture, "desk");
    expect(msg).toContain("<case>");
    expect(msg).toContain("output: card-and-json");
  });

  it("scales linearly with sample count and provider count", () => {
    const one = estimateInputChars([fixture], ["raw"], 1, 1);
    const three = estimateInputChars([fixture], ["raw"], 3, 1);
    const twoProviders = estimateInputChars([fixture], ["raw"], 1, 2);
    expect(three).toBe(one * 3);
    expect(twoProviders).toBe(one * 2);
  });
});

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
  it("applies the documented defaults", () => {
    const opts = parseArgs([]);
    expect(opts.samples).toBe(3);
    expect(opts.mode).toBe("both");
    expect(opts.suites).toEqual(new Set(["decision", "robustness"]));
    expect(opts.only).toBeNull();
    expect(opts.limit).toBeNull();
    expect(opts.out).toBe("eval/reports");
    expect(opts.yes).toBe(false);
  });

  it("parses repeatable --provider paired positionally with --model", () => {
    const opts = parseArgs(["--provider", "anthropic", "--model", "claude-sonnet-5", "--provider", "openai", "--model", "gpt-x", "--yes"]);
    expect(opts.providers).toEqual(["anthropic", "openai"]);
    expect(opts.models).toEqual(["claude-sonnet-5", "gpt-x"]);
    expect(opts.yes).toBe(true);
  });

  it("parses --suites, --only and --limit", () => {
    const opts = parseArgs(["--suites", "decision", "--only", "D-03,D-06", "--limit", "5"]);
    expect(opts.suites).toEqual(new Set(["decision"]));
    expect(opts.only).toEqual(new Set(["D-03", "D-06"]));
    expect(opts.limit).toBe(5);
  });

  it("rejects an unknown --provider value", () => {
    expect(() => parseArgs(["--provider", "made-up"])).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Provider calls (mocked fetch — no network) and retry
// ---------------------------------------------------------------------------

type FakeResponse = { ok: boolean; status: number; text: () => Promise<string> };

function fakeFetch(...responses: FakeResponse[]): (url: string, init?: unknown) => Promise<FakeResponse> {
  let i = 0;
  return vi.fn(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    return r;
  }) as unknown as (url: string, init?: unknown) => Promise<FakeResponse>;
}

function ok(body: unknown): FakeResponse {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}
function fail(status: number, body = "error"): FakeResponse {
  return { ok: false, status, text: async () => body };
}

describe("callProvider (mocked fetch, no network)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("anthropic: posts to /v1/messages with x-api-key + anthropic-version, extracts text blocks", async () => {
    const mock = fakeFetch(ok({ content: [{ type: "text", text: "hello " }, { type: "text", text: "world" }] }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mock as unknown as typeof fetch;

    const text = await callProvider("anthropic", "claude-sonnet-5", [{ role: "user", content: "hi" }], "sk-test");

    expect(text).toBe("hello world");
    const call = (mock as unknown as { mock: { calls: [string, { headers: Record<string, string> }][] } }).mock.calls[0]!;
    expect(call[0]).toBe("https://api.anthropic.com/v1/messages");
    expect(call[1].headers["x-api-key"]).toBe("sk-test");
    expect(call[1].headers["anthropic-version"]).toBe("2023-06-01");
  });

  it("openai: posts to /v1/chat/completions with a bearer token, reads choices[0].message.content", async () => {
    const mock = fakeFetch(ok({ choices: [{ message: { content: "hi there" } }] }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mock as unknown as typeof fetch;

    const text = await callProvider("openai", "gpt-x", [{ role: "user", content: "hi" }], "sk-oai");

    expect(text).toBe("hi there");
    const call = (mock as unknown as { mock: { calls: [string, { headers: Record<string, string> }][] } }).mock.calls[0]!;
    expect(call[0]).toBe("https://api.openai.com/v1/chat/completions");
    expect(call[1].headers.authorization).toBe("Bearer sk-oai");
  });

  it("google: posts to generateContent with the key as a query param, reads candidates[0].content.parts", async () => {
    const mock = fakeFetch(ok({ candidates: [{ content: { parts: [{ text: "sige" }] } }] }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mock as unknown as typeof fetch;

    const text = await callProvider("google", "gemini-x", [{ role: "user", content: "hi" }], "gm-key");

    expect(text).toBe("sige");
    const call = (mock as unknown as { mock: { calls: [string, unknown][] } }).mock.calls[0]!;
    expect(call[0]).toContain("generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent");
    expect(call[0]).toContain("key=gm-key");
  });

  it("retries once on 429 then succeeds, waiting a backoff between attempts", async () => {
    vi.useFakeTimers();
    const mock = fakeFetch(fail(429), ok({ content: [{ type: "text", text: "second try" }] }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mock as unknown as typeof fetch;

    const promise = callProvider("anthropic", "claude-sonnet-5", [{ role: "user", content: "hi" }], "sk-test");
    await vi.advanceTimersByTimeAsync(2000);
    const text = await promise;

    expect(text).toBe("second try");
    expect((mock as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(2);
  });

  it("does not retry a non-retryable 400 and throws HttpError", async () => {
    const mock = fakeFetch(fail(400, "bad request"));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mock as unknown as typeof fetch;

    await expect(callProvider("anthropic", "claude-sonnet-5", [{ role: "user", content: "hi" }], "sk-test")).rejects.toBeInstanceOf(HttpError);
    expect((mock as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(1);
  });
});

describe("withRetry", () => {
  it("gives up after the max retry count on a persistently retryable error", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const promise = withRetry(async () => {
      attempts++;
      throw new HttpError("boom", 503, "");
    }, 2);
    // Swallow the rejection while timers advance, then assert it below.
    const assertion = expect(promise).rejects.toBeInstanceOf(HttpError);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(attempts).toBe(3); // the first attempt + 2 retries
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

describe("createLimiter", () => {
  it("never runs more than `concurrency` jobs at once", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let maxActive = 0;
    const job = () =>
      limit(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active--;
      });
    await Promise.all([job(), job(), job(), job(), job()]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Env var mapping (the "refuse without a key" rule, TEST_PLAN §8.1)
// ---------------------------------------------------------------------------

describe("PROVIDER_ENV_VAR", () => {
  it("names the exact key each provider is refused without", () => {
    expect(PROVIDER_ENV_VAR.anthropic).toBe("ANTHROPIC_API_KEY");
    expect(PROVIDER_ENV_VAR.openai).toBe("OPENAI_API_KEY");
    expect(PROVIDER_ENV_VAR.google).toBe("GEMINI_API_KEY");
  });
});
