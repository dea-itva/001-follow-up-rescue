/**
 * Cross-model evaluation harness (design §3.3, TEST_PLAN §8.1-§8.3).
 *
 * Runs the decision and robustness fixtures' `raw` text through real LLM
 * providers (Anthropic, OpenAI, Google), grades each answer with the same
 * deterministic `validate()`/`decide()` core the fixture tests use, and
 * writes a dated report. This never runs in CI (no keys there) and never
 * describes its results as "validated" (TEST_PLAN §8.3, design §17).
 *
 * Bundled to `dist/eval.mjs` by `scripts/build.mjs` (owned by another
 * worker) and invoked as `npm run eval` -> `node dist/eval.mjs`. This file
 * imports the deterministic core from `../src/index.js` (source, not the
 * built bundle) so it type-checks and runs directly under `tsx`/`ts-node`,
 * or as plain compiled-to-ESM JS once esbuild bundles it.
 *
 * Zero non-dev dependencies: Node's built-in `fetch`, `fs`, `path`, `url`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

declare const console: { log: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

import {
  buildCaseBlock,
  buildFullPrompt,
  buildRepairPrompt,
  decide,
  ENGINE_PROMPT,
  factsFromForm,
  normalize,
  parseAnswer,
  precheck,
  PROMPT_VERSION,
  validate,
  type CaseInput,
  type Decision,
  type ParsedAnswer,
  type ValidationReport,
  type Violation,
  type ViolationCode,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Paths (works whether this runs as eval/run.ts under tsx, or bundled to
// dist/eval.mjs by scripts/build.mjs: both live one directory below the repo
// root, so fixtures/reports are always found relative to *this file*, never
// to process.cwd()).
// ---------------------------------------------------------------------------

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const FIXTURES_DIR = path.join(REPO_ROOT, "tests", "fixtures");

// ---------------------------------------------------------------------------
// Fixture shape (design §4.2/§4.5, TEST_PLAN §3.1). Loosely typed: the
// harness only reads the fields it needs and never trusts the rest.
// ---------------------------------------------------------------------------

export interface FixtureExpect {
  engine: { decision: Decision; [key: string]: unknown };
  llmAccepted?: Decision[];
  invariants?: string[];
  precheck?: { mustFlag?: string[]; mustNotFlag?: string[] };
}

export interface Fixture {
  id: string;
  suite: "decision" | "robustness";
  category?: string;
  title: string;
  confidence: string;
  raw?: string;
  caseInput: CaseInput;
  expect: FixtureExpect;
}

const SKIPPED_FIXTURE_IDS = new Set(["D-41", "D-42", "D-43", "D-44", "D-45"]);

export function loadFixtures(suites: ReadonlySet<"decision" | "robustness">): Fixture[] {
  const files: [string, "decision" | "robustness"][] = [
    ["decision.json", "decision"],
    ["robustness.json", "robustness"],
  ];
  const out: Fixture[] = [];
  for (const [file, suite] of files) {
    if (!suites.has(suite)) continue;
    const full = path.join(FIXTURES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(full, "utf8")) as Fixture[];
    for (const fx of raw) {
      // TEST_PLAN §8.1: skip D-41...D-45 (engine-level only, no `raw` text)
      // and, more generally, any fixture without raw text at all.
      if (SKIPPED_FIXTURE_IDS.has(fx.id)) continue;
      if (typeof fx.raw !== "string" || fx.raw.trim() === "") continue;
      out.push(fx);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// CLI argument parsing (TEST_PLAN §8.1)
// ---------------------------------------------------------------------------

export type Mode = "raw" | "desk";
export type ProviderName = "anthropic" | "openai" | "google";

export interface CliOptions {
  providers: ProviderName[]; // repeatable --provider
  models: string[]; // one --model per --provider, same order
  samples: number;
  mode: "raw" | "desk" | "both";
  suites: Set<"decision" | "robustness">;
  only: Set<string> | null;
  limit: number | null;
  out: string;
  yes: boolean;
}

const PROVIDER_NAMES: ProviderName[] = ["anthropic", "openai", "google"];

export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    providers: [],
    models: [],
    samples: 3,
    mode: "both",
    suites: new Set(["decision", "robustness"]),
    only: null,
    limit: null,
    out: "eval/reports",
    yes: false,
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case "--provider": {
        const value = argv[++i];
        if (!value || !(PROVIDER_NAMES as string[]).includes(value)) {
          throw new Error(`--provider must be one of anthropic|openai|google (got "${value ?? ""}")`);
        }
        opts.providers.push(value as ProviderName);
        break;
      }
      case "--model":
        opts.models.push(argv[++i] ?? "");
        break;
      case "--samples":
        opts.samples = Number(argv[++i] ?? "3") || 3;
        break;
      case "--mode": {
        const value = argv[++i];
        if (value !== "raw" && value !== "desk" && value !== "both") {
          throw new Error(`--mode must be raw|desk|both (got "${value ?? ""}")`);
        }
        opts.mode = value;
        break;
      }
      case "--suites": {
        const value = argv[++i] ?? "";
        const parts = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "");
        const set = new Set<"decision" | "robustness">();
        for (const p of parts) {
          if (p === "decision" || p === "robustness") set.add(p);
          else throw new Error(`--suites entries must be decision|robustness (got "${p}")`);
        }
        opts.suites = set.size > 0 ? set : opts.suites;
        break;
      }
      case "--only": {
        const value = argv[++i] ?? "";
        const ids = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "");
        opts.only = new Set(ids);
        break;
      }
      case "--limit":
        opts.limit = Number(argv[++i]);
        break;
      case "--out":
        opts.out = argv[++i] ?? opts.out;
        break;
      case "--yes":
        opts.yes = true;
        break;
      default:
        throw new Error(`Unrecognized argument: ${arg}`);
    }
    i++;
  }

  return opts;
}

function selectedModes(mode: CliOptions["mode"]): Mode[] {
  if (mode === "both") return ["raw", "desk"];
  return [mode];
}

// ---------------------------------------------------------------------------
// Prompt assembly (TEST_PLAN §8.1)
// ---------------------------------------------------------------------------

/** One user message per mode: raw = FULL prompt + "\n\n" + raw text; desk = FULL prompt + the case block. */
export function buildInitialMessage(fixture: Fixture, mode: Mode): string {
  if (mode === "raw") {
    return `${ENGINE_PROMPT.trimEnd()}\n\n${fixture.raw ?? ""}`;
  }
  const pre = precheck(fixture.caseInput);
  const provisional = decide(factsFromForm(fixture.caseInput));
  const caseBlock = buildCaseBlock(fixture.caseInput, pre, provisional, { output: "card-and-json" });
  return buildFullPrompt(ENGINE_PROMPT, caseBlock);
}

// ---------------------------------------------------------------------------
// Grading (TEST_PLAN §8.1-§8.2)
// ---------------------------------------------------------------------------

export type InvariantOutcome = "pass" | "fail" | "not_checked";

export interface SampleGrade {
  parsed: ParsedAnswer;
  report: ValidationReport;
  decision: string | null;
  decisionAccepted: boolean;
  safetyCodes: ViolationCode[];
  invariantResults: Record<string, InvariantOutcome>;
}

function violationCode(v: Violation): ViolationCode {
  return v.code;
}

function extractDecision(parsed: ParsedAnswer): string | null {
  const fromJson = parsed.json && typeof parsed.json.decision === "string" ? (parsed.json.decision as string) : null;
  return fromJson ?? parsed.card?.decision ?? null;
}

function acceptedSet(fixture: Fixture): Set<string> {
  const list = fixture.expect.llmAccepted && fixture.expect.llmAccepted.length > 0 ? fixture.expect.llmAccepted : [fixture.expect.engine.decision];
  return new Set(list);
}

/** design §8.2 / TEST_PLAN §8.2: safety-critical codes, zero target after repair. */
const SAFETY_CODES: ReadonlySet<ViolationCode> = new Set<ViolationCode>([
  "E_HARD_STOP_OVERRIDDEN",
  "E_STOP_PHRASE_UNADDRESSED",
  "E_MESSAGE_NOT_ALLOWED",
  "E_CLOSE_LOOP_CTA",
  "E_CLOSE_LOOP_RESTART",
  "E_PLAN_CHASES",
  "E_WAIT_EARLY_CONTACT",
  "E_INVENTED_RECONTACT_INTERVAL",
  "E_INVENTED_DEADLINE",
  "E_FAKE_URGENCY",
  "E_FAKE_SCARCITY",
  "E_INVENTED_NUMBER",
  "E_INVENTED_LINK",
]);

function safetyCriticalCodes(report: ValidationReport, decision: string | null): ViolationCode[] {
  return report.errors
    .map(violationCode)
    .filter((code) => SAFETY_CODES.has(code))
    // E_MESSAGE_NOT_ALLOWED is safety-critical specifically "on STOP or WAIT" (TEST_PLAN §8.2);
    // on the other no-message decisions (NMI, NFR, OUT_OF_SCOPE, DO_NOTHING) it's a schema slip,
    // not a safety failure, so it's excluded from this list there.
    .filter((code) => code !== "E_MESSAGE_NOT_ALLOWED" || decision === "STOP_ACTIVE_FOLLOW_UP" || decision === "WAIT");
}

/**
 * Deterministic proxies for the fixtures' free-text `invariants` (TEST_PLAN
 * §3.1, §4). Every one implemented here is derived from `validate()`'s own
 * violation codes (or, for REJECTS_ASSUMPTION, from `precheck()` plus the
 * answer's own `rejectedAssumptions`) - never from a fresh, unreviewed
 * heuristic. An invariant this harness cannot check honestly (MATCHES_LANGUAGE
 * would need real language identification, which is out of scope for a
 * zero-dependency deterministic checker) is reported as "not_checked", never
 * as "pass" (per the phase brief: never silently pass what wasn't checked).
 */
function checkInvariant(name: string, fixture: Fixture, parsed: ParsedAnswer, report: ValidationReport): InvariantOutcome {
  const hasErr = (code: ViolationCode) => report.errors.some((v) => v.code === code);
  const hasAny = (code: ViolationCode) => hasErr(code) || report.warnings.some((v) => v.code === code);
  const decision = extractDecision(parsed);

  switch (name) {
    case "ONE_CTA":
      return !hasErr("E_MULTIPLE_CTAS") && !hasErr("E_CTA_MISSING") ? "pass" : "fail";
    case "NO_CTA":
      return !hasErr("E_CTA_NOT_ALLOWED") && !hasErr("E_CLOSE_LOOP_CTA") ? "pass" : "fail";
    case "REASON_GROUNDED":
      return !hasErr("E_EVIDENCE_MISSING") && !hasErr("E_UNGROUNDED_QUOTE") && !hasErr("E_REASON_MISSING") ? "pass" : "fail";
    case "NO_MESSAGE": {
      const messageIsNull = parsed.json ? parsed.json.message === null || parsed.json.message === undefined : parsed.card?.message === null;
      return messageIsNull && !hasErr("E_MESSAGE_NOT_ALLOWED") ? "pass" : "fail";
    }
    case "HARD_STOP_WINS":
      return decision === "STOP_ACTIVE_FOLLOW_UP" && !hasErr("E_HARD_STOP_OVERRIDDEN") ? "pass" : "fail";
    case "NO_CONTACT_BEFORE_WAIT":
      return !hasErr("E_WAIT_EARLY_CONTACT") ? "pass" : "fail";
    case "NO_DISGUISED_RESTART":
      return !hasErr("E_CLOSE_LOOP_RESTART") ? "pass" : "fail";
    case "NO_INVENTED_DATE":
      return !hasErr("E_TIMING_DATE_UNGROUNDED") && !hasErr("E_INVENTED_RECONTACT_INTERVAL") ? "pass" : "fail";
    case "NO_INVENTED_DEADLINE":
    case "DEADLINE_ONLY_AS_STATED":
      return !hasErr("E_INVENTED_DEADLINE") ? "pass" : "fail";
    case "AT_MOST_3_QUESTIONS":
      return !hasErr("E_TOO_MANY_QUESTIONS") ? "pass" : "fail";
    case "NEW_REASON_LEADS":
      return !hasErr("E_NEW_REASON_NOT_IN_MESSAGE") && !hasAny("W_NEW_REASON_NOT_LEADING") ? "pass" : "fail";
    case "NO_BLAME":
      return !hasErr("E_UNSUPPORTED_ATTRIBUTION") && !hasErr("E_GUILT") ? "pass" : "fail";
    case "NO_INVENTED_INTEREST":
      return !hasErr("E_ASSUMED_LEAD_STATE") ? "pass" : "fail";
    case "REJECTS_ASSUMPTION": {
      const pre = precheck(fixture.caseInput);
      const flagged = pre.signals.filter((s) => s.category === "USER_ASSUMPTION").map((s) => s.matchedText);
      if (flagged.length === 0) return "not_checked";
      const rejected = Array.isArray(parsed.json?.rejectedAssumptions) ? (parsed.json!.rejectedAssumptions as unknown[]) : [];
      const rejectedStrings = rejected.filter((r): r is string => typeof r === "string").map(normalize);
      const ok = flagged.some((f) => rejectedStrings.some((r) => r.includes(normalize(f))));
      return ok ? "pass" : "fail";
    }
    case "NO_DISGUISE": {
      // Best-effort composite for the "message-first trap" fixtures (R-20, R-29, R-30, D-...):
      // no message allowed -> no message; CLOSE_LOOP -> a real close, not a disguised restart.
      if (
        decision === "STOP_ACTIVE_FOLLOW_UP" ||
        decision === "WAIT" ||
        decision === "NEED_MISSING_INFORMATION" ||
        decision === "NEED_FOLLOW_UP_REASON" ||
        decision === "DO_NOTHING"
      ) {
        return !hasErr("E_MESSAGE_NOT_ALLOWED") ? "pass" : "fail";
      }
      if (decision === "CLOSE_LOOP") {
        return !hasErr("E_CLOSE_LOOP_CTA") && !hasErr("E_CLOSE_LOOP_RESTART") ? "pass" : "fail";
      }
      return "not_checked";
    }
    case "MATCHES_LANGUAGE":
      // TODO(design): no real language identification in a zero-dependency deterministic
      // checker; report honestly as not checked rather than approximate with a fragile
      // keyword heuristic that could silently misreport "pass".
      return "not_checked";
    default:
      return "not_checked";
  }
}

export function gradeOnce(fixture: Fixture, answerText: string, ctx: Parameters<typeof validate>[1]): SampleGrade {
  const parsed = parseAnswer(answerText);
  const report = validate(parsed, ctx);
  const decision = extractDecision(parsed);
  const decisionAccepted = decision !== null && acceptedSet(fixture).has(decision);
  const safetyCodes = safetyCriticalCodes(report, decision);
  const invariantResults: Record<string, InvariantOutcome> = {};
  for (const name of fixture.expect.invariants ?? []) {
    invariantResults[name] = checkInvariant(name, fixture, parsed, report);
  }
  return { parsed, report, decision, decisionAccepted, safetyCodes, invariantResults };
}

export function contextFor(fixture: Fixture, mode: Mode): Parameters<typeof validate>[1] {
  return mode === "raw" ? { raw: fixture.raw ?? "", today: fixture.caseInput.today } : { caseInput: fixture.caseInput };
}

// ---------------------------------------------------------------------------
// Wilson 95% confidence interval (TEST_PLAN §8.1)
// ---------------------------------------------------------------------------

export interface WilsonInterval {
  p: number;
  lo: number;
  hi: number;
}

/** Wilson score interval for a binomial proportion, z = 1.96 (95%). n = 0 reports p = lo = hi = 0. */
export function wilson95(successes: number, n: number): WilsonInterval {
  if (n <= 0) return { p: 0, lo: 0, hi: 0 };
  const z = 1.96;
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return {
    p,
    lo: Math.max(0, (centre - margin) / denom),
    hi: Math.min(1, (centre + margin) / denom),
  };
}

// ---------------------------------------------------------------------------
// Provider calls (TEST_PLAN §8.1: fetch only, keys from env, refuse without one)
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export const PROVIDER_ENV_VAR: Record<ProviderName, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
};

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function isRetryableError(err: unknown): boolean {
  return err instanceof HttpError && (err.status === 429 || err.status >= 500);
}

/** Max 2 retries, exponential backoff with jitter (TEST_PLAN §8.1). */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxRetries || !isRetryableError(err)) throw err;
      const backoffMs = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt++;
    }
  }
}

async function fetchJson(url: string, init: RequestInit): Promise<{ json: unknown; text: string }> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Not a JSON body (e.g. an HTML error page from a gateway) - leave json null.
  }
  if (!res.ok) throw new HttpError(`HTTP ${res.status} from ${url}`, res.status, text);
  return { json, text };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Anthropic Messages API (per the `claude-api` skill: `POST /v1/messages`,
 * `x-api-key` + `anthropic-version` headers, `content: [{type:"text",...}]}`
 * response blocks).
 */
async function callAnthropic(model: string, messages: ChatMessage[], apiKey: string): Promise<string> {
  const body = { model, max_tokens: 4096, messages: messages.map((m) => ({ role: m.role, content: m.content })) };
  const { json } = await withRetry(() =>
    fetchJson("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const content = isRecord(json) && Array.isArray(json.content) ? json.content : [];
  return content
    .filter((b): b is { type: string; text: string } => isRecord(b) && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
}

/**
 * OpenAI Chat Completions (`POST https://api.openai.com/v1/chat/completions`).
 * TODO(design): verify this request/response shape against current OpenAI API
 * docs before relying on it - it was not checked against a live spec this session.
 */
async function callOpenAI(model: string, messages: ChatMessage[], apiKey: string): Promise<string> {
  const body = { model, messages: messages.map((m) => ({ role: m.role, content: m.content })), max_tokens: 4096 };
  const { json } = await withRetry(() =>
    fetchJson("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const choices = isRecord(json) && Array.isArray(json.choices) ? json.choices : [];
  const first = choices[0];
  const message = isRecord(first) ? first.message : null;
  const text = isRecord(message) && typeof message.content === "string" ? message.content : "";
  return text;
}

/**
 * Google Gemini `generateContent`
 * (`POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`).
 * TODO(design): verify this request/response shape against current Google
 * Gemini API docs before relying on it - it was not checked against a live
 * spec this session.
 */
async function callGoogle(model: string, messages: ChatMessage[], apiKey: string): Promise<string> {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const { json } = await withRetry(() =>
    fetchJson(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents }),
    }),
  );
  const candidates = isRecord(json) && Array.isArray(json.candidates) ? json.candidates : [];
  const first = candidates[0];
  const content = isRecord(first) ? first.content : null;
  const parts = isRecord(content) && Array.isArray(content.parts) ? content.parts : [];
  return parts
    .filter((p): p is { text: string } => isRecord(p) && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

export async function callProvider(provider: ProviderName, model: string, messages: ChatMessage[], apiKey: string): Promise<string> {
  switch (provider) {
    case "anthropic":
      return callAnthropic(model, messages, apiKey);
    case "openai":
      return callOpenAI(model, messages, apiKey);
    case "google":
      return callGoogle(model, messages, apiKey);
  }
}

// ---------------------------------------------------------------------------
// Concurrency limiter (TEST_PLAN §8.1: concurrency 2 per provider)
// ---------------------------------------------------------------------------

export function createLimiter(concurrency: number): <T>(fn: () => Promise<T>) => Promise<T> {
  let active = 0;
  const queue: (() => void)[] = [];

  const runNext = (): void => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job();
  };

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            runNext();
          });
      });
      runNext();
    });
  };
}

// ---------------------------------------------------------------------------
// Per-sample run record and aggregation
// ---------------------------------------------------------------------------

export interface SampleRecord {
  fixtureId: string;
  suite: string;
  confidence: string;
  mode: Mode;
  sampleIndex: number;
  expectedDecision: Decision;
  before: SampleGrade;
  after: SampleGrade | null; // set only when a repair round ran
}

export interface FixtureSummary {
  fixtureId: string;
  title: string;
  suite: string;
  confidence: string;
  samples: number;
  decisionAcceptedRate: number; // final (post-repair when repaired) decision-acceptance rate
  errorFreeRate: number; // final error-free rate
  codes: string[]; // distinct violation codes seen (final)
}

export interface EvalReport {
  provider: ProviderName;
  model: string;
  promptVersion: string;
  date: string; // YYYY-MM-DD
  fixtureCount: number;
  sampleCount: number;
  modes: Mode[];
  parseSuccess: WilsonInterval;
  decisionAcceptedOverall: WilsonInterval;
  decisionAcceptedExact: WilsonInterval;
  safetyCriticalAfterRepair: WilsonInterval;
  errorFreeBeforeRepair: WilsonInterval;
  confusionMatrix: Record<string, Record<string, number>>; // expected -> actual -> count
  topCodesBefore: [string, number][];
  topCodesAfter: [string, number][];
  invariantTallies: Record<string, { pass: number; fail: number; notChecked: number }>;
  perFixture: FixtureSummary[];
}

function finalGrade(rec: SampleRecord): SampleGrade {
  return rec.after ?? rec.before;
}

function tallyCodes(records: SampleRecord[], pick: (r: SampleRecord) => SampleGrade): [string, number][] {
  const counts = new Map<string, number>();
  for (const rec of records) {
    const grade = pick(rec);
    for (const v of [...grade.report.errors, ...grade.report.warnings]) {
      counts.set(v.code, (counts.get(v.code) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
}

export function aggregate(provider: ProviderName, model: string, modes: Mode[], date: string, records: SampleRecord[]): EvalReport {
  const n = records.length;
  const parseOk = records.filter((r) => finalGrade(r).parsed.json !== null).length;
  const decisionOk = records.filter((r) => finalGrade(r).decisionAccepted).length;
  const exactRecords = records.filter((r) => r.confidence === "EXACT");
  const decisionOkExact = exactRecords.filter((r) => finalGrade(r).decisionAccepted).length;
  const safetyAfter = records.filter((r) => finalGrade(r).safetyCodes.length > 0).length;
  const errorFreeBefore = records.filter((r) => r.before.report.errors.length === 0).length;

  const confusionMatrix: Record<string, Record<string, number>> = {};
  for (const rec of records) {
    const expected = rec.expectedDecision;
    const actual = finalGrade(rec).decision ?? "UNPARSEABLE";
    confusionMatrix[expected] ??= {};
    confusionMatrix[expected]![actual] = (confusionMatrix[expected]![actual] ?? 0) + 1;
  }

  const invariantTallies: Record<string, { pass: number; fail: number; notChecked: number }> = {};
  for (const rec of records) {
    const grade = finalGrade(rec);
    for (const [name, outcome] of Object.entries(grade.invariantResults)) {
      invariantTallies[name] ??= { pass: 0, fail: 0, notChecked: 0 };
      if (outcome === "pass") invariantTallies[name]!.pass++;
      else if (outcome === "fail") invariantTallies[name]!.fail++;
      else invariantTallies[name]!.notChecked++;
    }
  }

  const byFixture = new Map<string, SampleRecord[]>();
  for (const rec of records) {
    const list = byFixture.get(rec.fixtureId) ?? [];
    list.push(rec);
    byFixture.set(rec.fixtureId, list);
  }
  const perFixture: FixtureSummary[] = [...byFixture.entries()].map(([fixtureId, recs]) => {
    const total = recs.length;
    const okCount = recs.filter((r) => finalGrade(r).decisionAccepted).length;
    const errFreeCount = recs.filter((r) => finalGrade(r).report.errors.length === 0).length;
    const codes = new Set<string>();
    for (const r of recs) for (const v of [...finalGrade(r).report.errors, ...finalGrade(r).report.warnings]) codes.add(v.code);
    return {
      fixtureId,
      title: fixtureId,
      suite: recs[0]!.suite,
      confidence: recs[0]!.confidence,
      samples: total,
      decisionAcceptedRate: total === 0 ? 0 : okCount / total,
      errorFreeRate: total === 0 ? 0 : errFreeCount / total,
      codes: [...codes].sort(),
    };
  });
  perFixture.sort((a, b) => a.fixtureId.localeCompare(b.fixtureId));

  return {
    provider,
    model,
    promptVersion: PROMPT_VERSION,
    date,
    fixtureCount: byFixture.size,
    sampleCount: n,
    modes,
    parseSuccess: wilson95(parseOk, n),
    decisionAcceptedOverall: wilson95(decisionOk, n),
    decisionAcceptedExact: wilson95(decisionOkExact, exactRecords.length),
    safetyCriticalAfterRepair: wilson95(safetyAfter, n),
    errorFreeBeforeRepair: wilson95(errorFreeBefore, n),
    confusionMatrix,
    topCodesBefore: tallyCodes(records, (r) => r.before),
    topCodesAfter: tallyCodes(records, finalGrade),
    invariantTallies,
    perFixture,
  };
}

// ---------------------------------------------------------------------------
// Report rendering (TEST_PLAN §8.1, §8.3)
// ---------------------------------------------------------------------------

function pct(interval: WilsonInterval): string {
  return `${(interval.p * 100).toFixed(1)}% [${(interval.lo * 100).toFixed(1)}-${(interval.hi * 100).toFixed(1)}%]`;
}

/** The TEST_PLAN §8.3 wording rule: report measurements, never "validated" or "100% accurate". */
export function measuredOnLine(report: EvalReport): string {
  return `Measured on ${report.fixtureCount} fixtures x ${report.sampleCount / Math.max(1, report.fixtureCount)} samples with ${report.provider}/${report.model} on ${report.date} (prompt v${report.promptVersion}). These are measurements, not a validation claim: see the "no validated claims" rule below.`;
}

export function renderMarkdownReport(report: EvalReport): string {
  const lines: string[] = [];
  lines.push(`# Lead Follow-Up Rescue: LLM evaluation - ${report.provider}/${report.model}`);
  lines.push("");
  lines.push(measuredOnLine(report));
  lines.push("");
  lines.push("This is a measurement, not a certification: report every number here as reported, never as proof of accuracy or compliance (design §17, TEST_PLAN §8.3).");
  lines.push("");
  lines.push("## Overall rates (Wilson 95% interval)");
  lines.push("");
  lines.push("| Metric | Rate | Target |");
  lines.push("|---|---|---|");
  lines.push(`| Parse success | ${pct(report.parseSuccess)} | >= 98% |`);
  lines.push(`| Decision accepted, all fixtures | ${pct(report.decisionAcceptedOverall)} | reported, no target |`);
  lines.push(`| Decision accepted, EXACT fixtures | ${pct(report.decisionAcceptedExact)} | >= 90% |`);
  lines.push(`| Safety-critical violations after repair | ${pct(report.safetyCriticalAfterRepair)} | 0 |`);
  lines.push(`| Error-free before repair | ${pct(report.errorFreeBeforeRepair)} | reported; tunes the prompt |`);
  lines.push("");
  lines.push("## Decision confusion matrix (expected -> actual, final answer)");
  lines.push("");
  lines.push("| Expected | Actual decisions (count) |");
  lines.push("|---|---|");
  for (const [expected, actuals] of Object.entries(report.confusionMatrix).sort(([a], [b]) => a.localeCompare(b))) {
    const cell = Object.entries(actuals)
      .sort(([, a], [, b]) => b - a)
      .map(([d, c]) => `${d}: ${c}`)
      .join(", ");
    lines.push(`| ${expected} | ${cell} |`);
  }
  lines.push("");
  lines.push("## Top violation codes");
  lines.push("");
  lines.push("| Before repair | Count | After repair | Count |");
  lines.push("|---|---|---|---|");
  const rows = Math.max(report.topCodesBefore.length, report.topCodesAfter.length);
  for (let i = 0; i < rows; i++) {
    const before = report.topCodesBefore[i];
    const after = report.topCodesAfter[i];
    lines.push(`| ${before?.[0] ?? ""} | ${before?.[1] ?? ""} | ${after?.[0] ?? ""} | ${after?.[1] ?? ""} |`);
  }
  lines.push("");
  lines.push("## Invariants (design-decision checks the harness can grade deterministically)");
  lines.push("");
  lines.push("Any invariant not listed here, or marked `not_checked` below, is not graded by this harness - it is not a pass.");
  lines.push("");
  lines.push("| Invariant | Pass | Fail | Not checked |");
  lines.push("|---|---|---|---|");
  for (const [name, t] of Object.entries(report.invariantTallies).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`| ${name} | ${t.pass} | ${t.fail} | ${t.notChecked} |`);
  }
  lines.push("");
  lines.push("## Per-fixture");
  lines.push("");
  lines.push("| Fixture | Suite | Confidence | Samples | Decision accepted | Error-free | Codes seen |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const f of report.perFixture) {
    lines.push(
      `| ${f.fixtureId} | ${f.suite} | ${f.confidence} | ${f.samples} | ${(f.decisionAcceptedRate * 100).toFixed(0)}% | ${(f.errorFreeRate * 100).toFixed(0)}% | ${f.codes.join(", ")} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

export function renderJsonReport(report: EvalReport): string {
  return JSON.stringify(report, null, 2);
}

// ---------------------------------------------------------------------------
// Cost guard (TEST_PLAN §8.1)
// ---------------------------------------------------------------------------

export function estimateInputChars(fixtures: Fixture[], modes: Mode[], samples: number, providerCount: number): number {
  let total = 0;
  for (const fixture of fixtures) {
    for (const mode of modes) {
      total += buildInitialMessage(fixture, mode).length * samples;
    }
  }
  return total * providerCount;
}

// ---------------------------------------------------------------------------
// Orchestration (main)
// ---------------------------------------------------------------------------

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function runOne(provider: ProviderName, model: string, apiKey: string, fixtures: Fixture[], modes: Mode[], samples: number): Promise<SampleRecord[]> {
  const limit = createLimiter(2);
  const tasks: Promise<SampleRecord>[] = [];

  for (const fixture of fixtures) {
    for (const mode of modes) {
      const initialUser = buildInitialMessage(fixture, mode);
      const ctx = contextFor(fixture, mode);
      for (let sampleIndex = 0; sampleIndex < samples; sampleIndex++) {
        tasks.push(
          limit(async () => {
            const messages: ChatMessage[] = [{ role: "user", content: initialUser }];
            const answerText = await callProvider(provider, model, messages, apiKey);
            const before = gradeOnce(fixture, answerText, ctx);

            let after: SampleGrade | null = null;
            if (before.report.errors.length > 0) {
              const repairPrompt = buildRepairPrompt(before.report);
              if (repairPrompt) {
                const repairMessages: ChatMessage[] = [
                  ...messages,
                  { role: "assistant", content: answerText },
                  { role: "user", content: repairPrompt },
                ];
                try {
                  const repairedText = await callProvider(provider, model, repairMessages, apiKey);
                  after = gradeOnce(fixture, repairedText, ctx);
                } catch (err) {
                  // A failed repair call is reported as "still had errors" (no `after`),
                  // never silently treated as a pass.
                  console.error(`[eval] repair call failed for ${fixture.id}/${mode}#${sampleIndex}:`, err);
                }
              }
            }

            const record: SampleRecord = {
              fixtureId: fixture.id,
              suite: fixture.suite,
              confidence: fixture.confidence,
              mode,
              sampleIndex,
              expectedDecision: fixture.expect.engine.decision,
              before,
              after,
            };
            return record;
          }),
        );
      }
    }
  }

  return Promise.all(tasks);
}

async function main(): Promise<void> {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(String(err instanceof Error ? err.message : err));
    process.exitCode = 1;
    return;
  }

  if (opts.providers.length === 0) {
    console.error("Pass at least one --provider anthropic|openai|google.");
    process.exitCode = 1;
    return;
  }

  const modes = selectedModes(opts.mode);
  let fixtures = loadFixtures(opts.suites);
  if (opts.only) {
    const only = opts.only;
    fixtures = fixtures.filter((f) => only.has(f.id));
  }
  if (opts.limit !== null) fixtures = fixtures.slice(0, opts.limit);

  if (fixtures.length === 0) {
    console.error("No fixtures matched the given --suites/--only/--limit filters.");
    process.exitCode = 1;
    return;
  }

  const runnable: { provider: ProviderName; model: string; apiKey: string }[] = [];
  for (let i = 0; i < opts.providers.length; i++) {
    const provider = opts.providers[i]!;
    const model = opts.models[i];
    const apiKey = process.env[PROVIDER_ENV_VAR[provider]];
    if (!model) {
      console.error(`No --model given for --provider ${provider} (pass one --model per --provider, in the same order). Skipping.`);
      continue;
    }
    if (!apiKey) {
      console.error(`${PROVIDER_ENV_VAR[provider]} is not set: refusing to run ${provider}. Skipping.`);
      continue;
    }
    runnable.push({ provider, model, apiKey });
  }

  if (runnable.length === 0) {
    console.error("No provider has both --model and its API key set. Nothing to run.");
    process.exitCode = 1;
    return;
  }

  const estimatedChars = estimateInputChars(fixtures, modes, opts.samples, runnable.length);
  const estimatedTokens = Math.ceil(estimatedChars / 4);
  console.log(
    `[eval] ${fixtures.length} fixtures x ${modes.length} mode(s) x ${opts.samples} sample(s) x ${runnable.length} provider(s) ` +
      `~= ${estimatedTokens.toLocaleString()} estimated input tokens for the initial pass (repair rounds, if triggered, add more).`,
  );
  if (!opts.yes) {
    console.log("[eval] Pass --yes to actually run this eval and spend that budget. Nothing was called.");
    return;
  }

  const outDir = path.isAbsolute(opts.out) ? opts.out : path.resolve(process.cwd(), opts.out);
  fs.mkdirSync(outDir, { recursive: true });
  const date = todayIso();

  for (const { provider, model, apiKey } of runnable) {
    console.log(`[eval] running ${provider}/${model} ...`);
    const records = await runOne(provider, model, apiKey, fixtures, modes, opts.samples);
    const report = aggregate(provider, model, modes, date, records);
    const base = path.join(outDir, `${date}-${provider}-${model}`);
    fs.writeFileSync(`${base}.json`, renderJsonReport(report));
    fs.writeFileSync(`${base}.md`, renderMarkdownReport(report));
    console.log(`[eval] wrote ${base}.json and ${base}.md`);
    console.log(`[eval] ${measuredOnLine(report)}`);
  }
}

const isEntryPoint = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();

if (isEntryPoint) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
