/**
 * Builds the case block sent alongside the engine prompt, and assembles the
 * full and short prompts (design §7.4, §7.5, §7.6).
 *
 * Zero runtime dependencies, no DOM. The embedded prompt text itself lives in
 * `src/generated/prompts.ts` (produced by `scripts/gen-prompts.mjs` from
 * `prompt/lead-follow-up-rescue.md` and `prompt/lead-follow-up-rescue.compact.md`).
 */

import { weekdayName } from "./dates.js";
import { COMPACT_PROMPT, ENGINE_PROMPT } from "./generated/prompts.js";
import { prepareCaseText } from "./redact.js";
import { sanitize } from "./sanitize.js";
import type { CaseInput, EngineResult, Precheck } from "./types.js";

export { ENGINE_PROMPT, COMPACT_PROMPT };

export type PromptOutputMode = "card-and-json" | "json-only";

export interface CaseBlockOptions {
  output: PromptOutputMode;
}

// ---------------------------------------------------------------------------
// Field rendering helpers (design §7.5's worked example)
// ---------------------------------------------------------------------------

const UNKNOWN = "unknown";

function quoted(text: string): string {
  return `"${text.trim()}"`;
}

function renderAttempts(attempts: CaseInput["attempts"]): string {
  if (attempts === null) return UNKNOWN;
  if (attempts === "UNSURE") return "not sure";
  if (attempts >= 5) return "5+";
  return String(attempts);
}

function renderOwed(owed: CaseInput["owed"]): string {
  const text = owed.text.trim();
  switch (owed.answer) {
    case null:
      return UNKNOWN;
    case "NO":
      return "no";
    case "UNSURE":
      return text ? `not sure (${quoted(text)})` : "not sure";
    case "YES":
      return text ? `yes (${quoted(text)})` : "yes";
  }
}

function renderStop(stop: CaseInput["stop"]): string {
  const words = stop.words.trim();
  switch (stop.answer) {
    case null:
      return UNKNOWN;
    case "NO":
      return "no";
    case "OPT_OUT":
      return words ? `yes, asked to stop (${quoted(words)})` : "yes, asked to stop";
    case "DECLINE":
      return words ? `yes, said no/not interested (${quoted(words)})` : "yes, said no/not interested";
  }
}

function renderTimeframe(tf: CaseInput["timeframe"]): string {
  const words = tf.words.trim();
  switch (tf.answer) {
    case null:
      return UNKNOWN;
    case "NA":
      return "not applicable";
    case "UNSURE":
      return words ? `not sure (${quoted(words)})` : "not sure";
    case "NONE_GIVEN":
      return "no timeframe given";
    case "EXACT": {
      const date = tf.date ? `, ${tf.date}` : "";
      return words ? `exact${date} (${quoted(words)})` : `exact${date}`;
    }
    case "VAGUE": {
      const status =
        tf.vagueStatus === "PASSED"
          ? "has clearly passed"
          : tf.vagueStatus === "FUTURE"
            ? "still ahead"
            : "not sure if it has passed";
      return words ? `vague (${quoted(words)}; ${status})` : `vague (${status})`;
    }
  }
}

function renderDeadline(deadline: CaseInput["deadline"]): string {
  if (deadline.answer === null) return UNKNOWN;
  if (deadline.answer === "NO") return "none";
  const whose =
    deadline.whose === "LEAD" ? "theirs" : deadline.whose === "MINE" ? "only mine" : deadline.whose === "EXTERNAL" ? "external" : UNKNOWN;
  const what = deadline.what.trim() ? quoted(deadline.what) : "unspecified";
  const date = deadline.date ? `, ${deadline.date}` : "";
  return `${what}${date} (whose: ${whose})`;
}

function renderNewInfo(newInfo: CaseInput["newInfo"]): string {
  const text = newInfo.text.trim();
  if (text === "") return "none";
  const linkedWords = newInfo.linkedWords.trim();
  const linked =
    newInfo.linked === "YES"
      ? `; connected to: ${linkedWords ? quoted(linkedWords) : "(their words not given)"}`
      : newInfo.linked === "NO"
        ? "; not connected to anything they said"
        : newInfo.linked === "UNSURE"
          ? "; not sure if connected"
          : "";
  return `${quoted(text)}${linked}`;
}

function renderCloseLoopSent(v: boolean | null): string {
  if (v === null) return UNKNOWN;
  return v ? "yes" : "no";
}

function renderNames(names: CaseInput["names"]): string {
  const lead = names.lead.trim() ? "[LEAD]" : UNKNOWN;
  const me = names.me.trim() ? "[ME]" : UNKNOWN;
  const business = names.business.trim() ? "[BUSINESS]" : UNKNOWN;
  return `lead=${lead}, you=${me}, business=${business}`;
}

/** JSON-stringifies pasted text, then HTML-entity-escapes `<`/`>` so it can never close or fake a tag (design §7.4 step 2). */
function jsonStringField(text: string): string {
  return JSON.stringify(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sanitizes, then applies the case's own redact/pseudonymize settings, matching exactly what `groundingText` checks against. */
function preparedPastedText(text: string, input: CaseInput): string {
  return prepareCaseText(sanitize(text), input);
}

// ---------------------------------------------------------------------------
// desk_check block
// ---------------------------------------------------------------------------

const VAGUE_TIME_CATEGORIES = new Set(["VAGUE_TIMING", "VAGUE_URGENCY"]);

function renderDeskCheck(input: CaseInput, pre: Precheck, provisional: EngineResult): string {
  const leadSignals = pre.signals.filter((s) => s.source === "lead");
  const flagged = leadSignals.filter((s) => !VAGUE_TIME_CATEGORIES.has(s.category));
  const vagueTiming = leadSignals.filter((s) => VAGUE_TIME_CATEGORIES.has(s.category));
  const assumptions = pre.signals.filter((s) => s.source !== "lead" && s.category === "USER_ASSUMPTION");

  const list = (signals: Precheck["signals"]): string =>
    signals.length === 0 ? "none" : [...new Set(signals.map((s) => quoted(s.matchedText)))].join(", ");

  const messageLine = provisional.messageAllowed ? "will be drafted" : "not needed";

  return [
    "Computed by the Rescue Desk from the user's answers. Treat it as a starting point. If the lead's own words",
    'contradict an answer, follow the lead\'s words, apply the rules, and say what changed.',
    `- provisional decision: ${provisional.decision} (rule ${provisional.rule})`,
    `- message: ${messageLine}`,
    `- flagged phrases in their messages: ${list(flagged)}`,
    `- vague timing words: ${list(vagueTiming)}`,
    `- unsupported assumptions in notes: ${list(assumptions)}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// buildCaseBlock (design §7.5)
// ---------------------------------------------------------------------------

/**
 * Builds the `<case>` block: the form's own answers rendered as plain lines,
 * plus the pasted fields as sanitized/redacted/pseudonymized JSON strings
 * inside labelled tags, plus a `desk_check` summary of the deterministic
 * signals already computed (design §7.5). Every quote used inside this block
 * comes from the case's own text, so `groundingText`/`isGrounded` (§9.3)
 * check the model's answer against exactly what it was shown.
 */
export function buildCaseBlock(
  caseInput: CaseInput,
  pre: Precheck,
  provisional: EngineResult,
  options: CaseBlockOptions,
): string {
  const c = caseInput;
  const lines: string[] = [];

  lines.push("<case>");
  lines.push(`today: ${c.today} (${weekdayName(c.today)}) · timezone: ${c.timezone}`);
  lines.push(`output: ${options.output}`);
  lines.push(`scenario (user-selected): ${c.scenario ?? UNKNOWN}`);

  if (c.channel === "EMAIL") {
    const subject = c.originalSubject.trim();
    lines.push(`channel: EMAIL · original subject: ${subject ? quoted(subject) : "none"}`);
  } else {
    lines.push(`channel: ${c.channel ?? UNKNOWN}`);
  }

  lines.push(`follow-ups since their last reply (user-stated): ${renderAttempts(c.attempts)}`);
  lines.push(`their last message: ${c.lastLeadMessageDate ?? UNKNOWN} · your last message: ${c.lastUserMessageDate ?? UNKNOWN}`);
  lines.push(`unanswered question or request (user-stated): ${renderOwed(c.owed)}`);
  lines.push(`stop or decline (user-stated): ${renderStop(c.stop)}`);
  lines.push(`timeframe they gave (user-stated): ${renderTimeframe(c.timeframe)}`);
  lines.push(`real deadline (user-stated): ${renderDeadline(c.deadline)}`);
  lines.push(`anything new (user-stated): ${renderNewInfo(c.newInfo)}`);
  lines.push(`close-the-loop message already sent (user-stated): ${renderCloseLoopSent(c.closeLoopSent)}`);
  lines.push(`desired outcome: ${c.desiredOutcome ?? UNKNOWN} · message language: ${c.language} · tone: ${c.tone}`);
  lines.push(
    `lead location: ${c.leadCountry ?? UNKNOWN} · compliance footer: ${c.complianceFooter ? "on" : "off"} · names: ${renderNames(c.names)}`,
  );

  const leadMessages = preparedPastedText(c.leadMessages, c);
  const userMessages = preparedPastedText(c.userMessages, c);
  const notes = preparedPastedText(c.notes, c);

  lines.push('<lead_messages format="json-string">');
  lines.push(jsonStringField(leadMessages));
  lines.push("</lead_messages>");

  lines.push('<your_messages format="json-string">');
  lines.push(jsonStringField(userMessages));
  lines.push("</your_messages>");

  lines.push('<user_notes format="json-string">');
  lines.push(jsonStringField(notes));
  lines.push("</user_notes>");

  lines.push("<desk_check>");
  lines.push(renderDeskCheck(c, pre, provisional));
  lines.push("</desk_check>");

  lines.push("</case>");

  return lines.join("\n");
}

/**
 * The case block alone, for a saved assistant (Claude Project, ChatGPT
 * Project, Gemini Gem, Claude Skill) that already holds the engine prompt
 * (design §7.4, §10.4's "Copy compact prompt").
 */
export function buildShortCase(
  caseInput: CaseInput,
  pre: Precheck,
  provisional: EngineResult,
  options: CaseBlockOptions,
): string {
  return buildCaseBlock(caseInput, pre, provisional, options);
}

/** Concatenates the engine prompt (FULL or COMPACT) with the case block, for a plain copy-paste run. */
export function buildFullPrompt(enginePrompt: string, caseBlock: string): string {
  return `${enginePrompt.trimEnd()}\n\n${caseBlock.trimStart()}\n`;
}
