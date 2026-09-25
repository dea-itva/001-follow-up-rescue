/**
 * Tolerant parsing of an AI's Lead Follow-Up Rescue answer (design §9.1).
 *
 * `parseAnswer` extracts the JSON block (trying, in priority order, the
 * `LFR_JSON_START`/`LFR_JSON_END` sentinel, fenced ```json blocks, any fenced
 * block containing `"lfr"`, and a balanced-brace scan — within each method,
 * candidates are tried from the last occurrence to the first) and the
 * human-readable card, independently. Neither extraction depends on the
 * other succeeding: a card-only or JSON-only answer is still partially
 * usable (design §9.1 step 4; `src/validate.ts` decides what that means).
 *
 * Zero runtime dependencies, no I/O.
 */

import { sanitize } from "./sanitize.js";

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

export type ParseStatus = "OK" | "NOT_FOUND" | "TRUNCATED" | "INVALID";

export interface ParsedCard {
  /** The raw decision label as written, e.g. "CHANGE_ANGLE" (upper-cased, spaces/dashes -> underscores). */
  decision: string | null;
  /** The plain-language name in parentheses after the label, if present, e.g. "Change the angle". */
  decisionName: string | null;
  timing: string | null;
  reason: string | null;
  action: string | null;
  /** The message body text (from the fenced block after MESSAGE:), or null when the card says "None" or has no message. */
  message: string | null;
  noResponsePlan: string | null;
  doNotDo: string[];
  stopActiveFollowUp: boolean | null;
  /** Missing-information questions, or [] when the card says "None". */
  missingInformation: string[];
}

export interface ParsedAnswer {
  /** The winning JSON candidate, leniently coerced (design §9.1 step 5), or null if none parsed. */
  json: Record<string, unknown> | null;
  card: ParsedCard | null;
  status: ParseStatus;
  problems: string[];
}

// ---------------------------------------------------------------------------
// Repair pipeline (design §9.1 step 2: "a repaired parse")
// ---------------------------------------------------------------------------

const SMART_DOUBLE_RE = /[\u201C\u201D\u201F\u2033]/g;
const SMART_SINGLE_RE = /[\u2018\u2019\u201B\u2032]/g;

/** Smart quotes -> straight quotes, everywhere (design §9.1 step 2). */
function straightenQuotes(text: string): string {
  return text.replace(SMART_DOUBLE_RE, '"').replace(SMART_SINGLE_RE, "'");
}

/**
 * One string-aware pass that strips `//` and `/* *\/` comments outside JSON
 * strings, and escapes raw (literal) newlines found inside JSON strings, so
 * that a model's copy-pasted multi-line string becomes valid JSON text.
 */
function stripCommentsAndEscapeNewlines(text: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const ch = text[i]!;
    if (inString) {
      if (ch === "\\" && i + 1 < text.length) {
        out += ch + text[i + 1];
        i += 2;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/** Removes a trailing comma directly before `}` or `]` (design §9.1 step 2). */
function removeTrailingCommas(text: string): string {
  return text.replace(/,(\s*[}\]])/g, "$1");
}

function repairJsonText(text: string): string {
  return removeTrailingCommas(stripCommentsAndEscapeNewlines(straightenQuotes(text)));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strict parse, then a repaired parse. Returns the parsed value only if it is an object with a `decision` key. */
function tryParseCandidate(candidate: string): Record<string, unknown> | null {
  for (const text of [candidate, repairJsonText(candidate)]) {
    try {
      const value: unknown = JSON.parse(text);
      if (isPlainObject(value) && "decision" in value) return value;
    } catch {
      // try the next attempt
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Candidate extraction (design §9.1 step 2)
// ---------------------------------------------------------------------------

/** If `inner` (the sentinel's contents) itself wraps a fenced block, unwrap it; otherwise use it as-is. */
function unwrapFence(inner: string): string {
  const m = /```(?:[a-zA-Z0-9_-]*)\s*\n?([\s\S]*?)```/.exec(inner);
  return m ? m[1]!.trim() : inner.trim();
}

function sentinelCandidates(text: string): { candidates: string[]; unterminated: boolean } {
  const candidates: string[] = [];
  const re = /LFR_JSON_START([\s\S]*?)LFR_JSON_END/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    candidates.push(unwrapFence(m[1] ?? ""));
  }
  const hasStart = text.includes("LFR_JSON_START");
  const hasEnd = text.includes("LFR_JSON_END");
  const unterminated = hasStart && (!hasEnd || candidates.length === 0);
  return { candidates, unterminated };
}

interface FenceBlock {
  tag: string;
  body: string;
}

/** Splits `text` into paired ```-delimited blocks. `unterminated` is true iff a final opening fence never closes. */
function findFences(text: string): { blocks: FenceBlock[]; unterminated: boolean } {
  const positions: number[] = [];
  let idx = text.indexOf("```");
  while (idx !== -1) {
    positions.push(idx);
    idx = text.indexOf("```", idx + 3);
  }
  const blocks: FenceBlock[] = [];
  let pairCount = Math.floor(positions.length / 2);
  for (let p = 0; p < pairCount; p++) {
    const open = positions[p * 2]!;
    const close = positions[p * 2 + 1]!;
    const raw = text.slice(open + 3, close);
    const nl = raw.indexOf("\n");
    const firstLine = nl === -1 ? raw : raw.slice(0, nl);
    const isTag = /^[a-zA-Z0-9_-]{0,20}$/.test(firstLine.trim());
    const tag = isTag ? firstLine.trim() : "";
    const body = isTag && nl !== -1 ? raw.slice(nl + 1) : isTag ? "" : raw;
    blocks.push({ tag, body });
  }
  const unterminated = positions.length % 2 === 1;
  return { blocks, unterminated };
}

interface BraceSpan {
  text: string;
  complete: boolean;
}

/** Finds top-level (outermost) `{...}` spans, string-aware. The final entry may be incomplete (unterminated). */
function findBalancedBraceSpans(text: string): BraceSpan[] {
  const spans: BraceSpan[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (ch === "\\") {
        i += 1; // skip the escaped character
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (ch === "}") {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          spans.push({ text: text.slice(start, i + 1), complete: true });
          start = -1;
        }
      }
    }
  }
  if (depth > 0 && start !== -1) {
    spans.push({ text: text.slice(start), complete: false });
  }
  return spans;
}

interface ExtractResult {
  json: Record<string, unknown> | null;
  truncated: boolean;
  anyCandidateFound: boolean;
}

/** Tries `candidates` from last to first, returning the first that parses and has `decision`. */
function tryLastToFirst(candidates: string[]): Record<string, unknown> | null {
  for (let i = candidates.length - 1; i >= 0; i--) {
    const parsed = tryParseCandidate(candidates[i]!);
    if (parsed) return parsed;
  }
  return null;
}

function extractJson(text: string): ExtractResult {
  let anyCandidateFound = false;
  let anyUnterminated = false;

  // 1. The LFR_JSON_START / LFR_JSON_END sentinel.
  const sentinel = sentinelCandidates(text);
  if (sentinel.candidates.length > 0) anyCandidateFound = true;
  if (sentinel.unterminated) anyUnterminated = true;
  const sentinelJson = tryLastToFirst(sentinel.candidates);
  if (sentinelJson) return { json: sentinelJson, truncated: false, anyCandidateFound };

  // 2. Fenced blocks tagged `json`, then 3. any fenced block containing "lfr".
  const fences = findFences(text);
  if (fences.blocks.length > 0 || fences.unterminated) anyCandidateFound = true;
  if (fences.unterminated) anyUnterminated = true;

  const jsonTagged = fences.blocks.filter((b) => b.tag.toLowerCase() === "json").map((b) => b.body);
  const taggedJson = tryLastToFirst(jsonTagged);
  if (taggedJson) return { json: taggedJson, truncated: false, anyCandidateFound };

  const lfrFenced = fences.blocks.filter((b) => b.body.includes('"lfr"')).map((b) => b.body);
  const lfrJson = tryLastToFirst(lfrFenced);
  if (lfrJson) return { json: lfrJson, truncated: false, anyCandidateFound };

  // 4. A balanced {...} scan for objects containing "lfr".
  const spans = findBalancedBraceSpans(text);
  const completeWithLfr = spans.filter((s) => s.complete && s.text.includes('"lfr"')).map((s) => s.text);
  if (completeWithLfr.length > 0) anyCandidateFound = true;
  const braceJson = tryLastToFirst(completeWithLfr);
  if (braceJson) return { json: braceJson, truncated: false, anyCandidateFound };

  const incompleteWithLfr = spans.some((s) => !s.complete && s.text.includes('"lfr"'));
  if (incompleteWithLfr) {
    anyCandidateFound = true;
    anyUnterminated = true;
  }

  return { json: null, truncated: anyUnterminated, anyCandidateFound };
}

// ---------------------------------------------------------------------------
// Lenient coercion (design §9.1 step 5)
// ---------------------------------------------------------------------------

function nullify(value: unknown): unknown {
  if (typeof value === "string") {
    const t = value.trim().toLowerCase();
    if (t === "none" || t === "null" || t === "") return null;
  }
  return value;
}

/** Upper-cases a string and turns internal whitespace/dashes into underscores, e.g. "close loop" -> "CLOSE_LOOP". */
function coerceEnum(value: unknown): unknown {
  const v = nullify(value);
  if (typeof v !== "string") return v;
  return v.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function coerceBoolean(value: unknown): unknown {
  const v = nullify(value);
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true" || t === "yes") return true;
    if (t === "false" || t === "no") return false;
  }
  return v;
}

/** "4+" / "4 " / 4 -> 4; leaves ranges, null, etc. untouched (design §9.1 step 5, "4+" example). */
function coerceCount(value: unknown): unknown {
  const v = nullify(value);
  if (typeof v === "string") {
    const m = /^(\d+)\+?$/.exec(v.trim());
    if (m) return Number(m[1]);
  }
  return v;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isPlainObject(value) ? value : null;
}

/**
 * Leniently coerces the parts of a raw parsed JSON object that the schema
 * treats as enums, booleans or counts, so `validate.ts`'s schema check sees
 * consistently-typed values. Does not itself decide what is unrecoverable
 * (that is `E_SCHEMA`, in `src/validate.ts`); anything this function can't
 * make sense of is passed through unchanged.
 */
export function coerceRescueJson(raw: Record<string, unknown>): Record<string, unknown> {
  // A structural clone: `raw` came from JSON.parse, so every value is JSON-plain.
  const out = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;

  out.decision = coerceEnum(out.decision);
  out.interaction = coerceEnum(out.interaction);
  out.suppression = coerceEnum(out.suppression);
  out.stopActiveFollowUp = coerceBoolean(out.stopActiveFollowUp);
  out.contactReason = nullify(out.contactReason);
  out.angle = nullify(out.angle);

  const timing = asRecord(out.timing);
  if (timing) {
    timing.mode = coerceEnum(timing.mode);
    timing.date = nullify(timing.date);
    timing.note = nullify(timing.note);
  }

  const message = nullify(out.message);
  if (isPlainObject(message)) {
    message.channel = coerceEnum(message.channel);
    message.subject = nullify(message.subject);
  }
  out.message = message;

  const cta = nullify(out.cta);
  if (isPlainObject(cta)) {
    cta.type = coerceEnum(cta.type);
  }
  out.cta = cta;

  const facts = asRecord(out.facts);
  if (facts) {
    facts.scope = coerceEnum(facts.scope);
    facts.scenario = coerceEnum(facts.scenario);
    facts.channel = coerceEnum(facts.channel);
    facts.attempts = coerceCount(facts.attempts);
    facts.closeLoopSent = coerceBoolean(facts.closeLoopSent);
    facts.tooSoon = coerceBoolean(facts.tooSoon);

    const hardStop = asRecord(nullify(facts.hardStop));
    if (hardStop) {
      hardStop.kind = coerceEnum(hardStop.kind);
      hardStop.sure = coerceBoolean(hardStop.sure);
    }
    facts.hardStop = hardStop ?? nullify(facts.hardStop);

    const owedResponse = asRecord(nullify(facts.owedResponse));
    if (owedResponse) {
      owedResponse.kind = coerceEnum(owedResponse.kind);
      owedResponse.sure = coerceBoolean(owedResponse.sure);
    }
    facts.owedResponse = owedResponse ?? nullify(facts.owedResponse);

    const notRightNow = asRecord(nullify(facts.notRightNow));
    if (notRightNow) {
      const timingRef = asRecord(notRightNow.timing);
      if (timingRef) {
        timingRef.type = coerceEnum(timingRef.type);
        timingRef.resolution = coerceEnum(timingRef.resolution);
        timingRef.date = nullify(timingRef.date);
      }
    }
    facts.notRightNow = notRightNow ?? nullify(facts.notRightNow);

    const commitment = asRecord(nullify(facts.commitment));
    if (commitment) {
      commitment.by = coerceEnum(commitment.by);
      const timingRef = asRecord(commitment.timing);
      if (timingRef) {
        timingRef.type = coerceEnum(timingRef.type);
        timingRef.resolution = coerceEnum(timingRef.resolution);
        timingRef.date = nullify(timingRef.date);
      }
    }
    facts.commitment = commitment ?? nullify(facts.commitment);

    const deadline = asRecord(nullify(facts.deadline));
    if (deadline) {
      deadline.kind = coerceEnum(deadline.kind);
      deadline.owner = coerceEnum(deadline.owner);
      deadline.materialToLead = coerceBoolean(deadline.materialToLead);
      deadline.date = nullify(deadline.date);
    }
    facts.deadline = deadline ?? nullify(facts.deadline);

    const reason = asRecord(nullify(facts.reason));
    if (reason) {
      reason.type = coerceEnum(reason.type);
    }
    facts.reason = reason ?? nullify(facts.reason);

    const newInfo = asRecord(nullify(facts.newInfo));
    if (newInfo) {
      newInfo.material = coerceEnum(newInfo.material);
      newInfo.linkedNeedQuote = nullify(newInfo.linkedNeedQuote);
    }
    facts.newInfo = newInfo ?? nullify(facts.newInfo);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Card parsing (design §9.1 step 3)
// ---------------------------------------------------------------------------

const LABELS: { key: keyof ParsedCard; text: string }[] = [
  { key: "decision", text: "DECISION" },
  { key: "timing", text: "TIMING" },
  { key: "reason", text: "REASON" },
  { key: "action", text: "ACTION" },
  { key: "message", text: "MESSAGE" },
  { key: "noResponsePlan", text: "NO-RESPONSE PLAN" },
  { key: "doNotDo", text: "DO NOT DO" },
  { key: "stopActiveFollowUp", text: "STOP ACTIVE FOLLOW-UP" },
  { key: "missingInformation", text: "MISSING INFORMATION" },
];

/** Builds a regex matching `label`, tolerant of markdown decoration ("**LABEL:**", "### LABEL", "LABEL --"). */
function labelLineRegex(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[ \\t]+");
  // Decoration can wrap the label on either side of the colon/dash, e.g. "**DECISION:**" (bold
  // closes after the colon) or "**DECISION**:" (bold closes before it) — tolerate both orders.
  return new RegExp(`^[ \\t]*(?:#{1,6}\\s*)?\\**${escaped}\\**[ \\t]*(?:[:\u2014]|--?)?[ \\t]*\\**[ \\t]*(.*)$`, "i");
}

const LABEL_MATCHERS = LABELS.map((l) => ({ ...l, re: labelLineRegex(l.text) }));

function extractMessageBody(lines: string[]): string | null {
  const joined = lines.join("\n");
  const fenced = /```[a-zA-Z0-9_-]*\s*\n?([\s\S]*?)```/.exec(joined);
  const content = fenced ? fenced[1]! : joined;
  const trimmed = content.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "none") return null;
  return fenced ? content.replace(/\n$/, "") : trimmed;
}

function extractDoNotDo(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const m = /^\s*[-*]\s+(.*)$/.exec(line);
    if (m) items.push(m[1]!.trim());
  }
  return items;
}

function extractMissingInformation(inlineValue: string, lines: string[]): string[] {
  const all = [inlineValue, ...lines].join("\n").trim();
  if (all === "" || /^none\.?$/i.test(all)) return [];
  const items: string[] = [];
  const numberedRe = /^\s*\d+[.)]\s+(.*)$/;
  for (const line of all.split("\n")) {
    const m = numberedRe.exec(line);
    if (m) items.push(m[1]!.trim());
  }
  if (items.length > 0) return items;
  // No numbering found: treat each non-empty line as one question.
  return all
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

function parseBooleanWord(value: string): boolean | null {
  const t = value.trim().toLowerCase();
  if (t.startsWith("yes")) return true;
  if (t.startsWith("no")) return false;
  return null;
}

/**
 * Parses the human-readable card (design §7.3), tolerant of markdown
 * decoration on labels. Returns `null` only when not a single label is found.
 */
export function parseCard(text: string): ParsedCard | null {
  const lines = text.split("\n");
  type Bucket = { inline: string; extra: string[] };
  const buckets = new Map<keyof ParsedCard, Bucket>();
  let current: keyof ParsedCard | null = null;

  for (const line of lines) {
    let matched = false;
    for (const { key, re } of LABEL_MATCHERS) {
      const m = re.exec(line);
      if (m) {
        buckets.set(key, { inline: (m[1] ?? "").trim(), extra: [] });
        current = key;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    if (current) buckets.get(current)!.extra.push(line);
  }

  if (buckets.size === 0) return null;

  const decisionRaw = buckets.get("decision")?.inline ?? "";
  const decisionMatch = /^([A-Za-z_][A-Za-z0-9_ -]*?)\s*(?:\(([^)]*)\))?\s*$/.exec(decisionRaw);
  const decision = decisionMatch ? decisionMatch[1]!.trim().toUpperCase().replace(/[\s-]+/g, "_") : decisionRaw || null;
  const decisionName = decisionMatch?.[2]?.trim() ?? null;

  const messageBucket = buckets.get("message");
  const message = messageBucket ? extractMessageBody([messageBucket.inline, ...messageBucket.extra]) : null;

  const doNotDoBucket = buckets.get("doNotDo");
  const doNotDo = doNotDoBucket ? extractDoNotDo([doNotDoBucket.inline, ...doNotDoBucket.extra]) : [];

  const stopBucket = buckets.get("stopActiveFollowUp");
  const stopActiveFollowUp = stopBucket ? parseBooleanWord(stopBucket.inline) : null;

  const missingBucket = buckets.get("missingInformation");
  const missingInformation = missingBucket ? extractMissingInformation(missingBucket.inline, missingBucket.extra) : [];

  const single = (key: keyof ParsedCard): string | null => {
    const b = buckets.get(key);
    if (!b) return null;
    const joined = [b.inline, ...b.extra.map((l) => l.trim())].filter((l) => l !== "").join(" ");
    return joined === "" ? null : joined;
  };

  return {
    decision: decision || null,
    decisionName,
    timing: single("timing"),
    reason: single("reason"),
    action: single("action"),
    message,
    noResponsePlan: single("noResponsePlan"),
    doNotDo,
    stopActiveFollowUp,
    missingInformation,
  };
}

// ---------------------------------------------------------------------------
// parseAnswer (design §9.1)
// ---------------------------------------------------------------------------

export function parseAnswer(rawText: string): ParsedAnswer {
  const text = sanitize(rawText);
  const problems: string[] = [];

  const extracted = extractJson(text);
  const json = extracted.json ? coerceRescueJson(extracted.json) : null;
  const card = parseCard(text);

  let status: ParseStatus;
  if (json !== null) {
    status = "OK";
  } else if (extracted.truncated) {
    status = "TRUNCATED";
    problems.push("A JSON candidate appears to have been cut off before it closed.");
  } else if (extracted.anyCandidateFound) {
    status = "INVALID";
    problems.push("A JSON-like candidate was found but did not parse as an object with a `decision` field.");
  } else {
    status = "NOT_FOUND";
    if (card === null) problems.push("No JSON block and no readable card were found in the answer.");
    else problems.push("No JSON block was found; only the readable card could be parsed.");
  }

  return { json, card, status, problems };
}
