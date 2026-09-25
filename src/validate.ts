/**
 * The output validator (design §9). Deterministic, pure, no network access.
 *
 * `validate(parsed, ctx)` checks an already-parsed AI answer (`src/parse.ts`)
 * against the case: schema shape, the per-decision invariant table (§8.1),
 * the engine recompute (§9.2 `E_RULE_MISMATCH`), quote grounding (§9.3),
 * message anti-patterns (§9.6 lexicon), the CTA detector (§9.5), negation
 * handling (§9.4), and form-vs-AI fact cross-checks (§9.2 `W_FACT_MISMATCH`).
 * `checkAnswer(text, ctx)` is `validate(parseAnswer(text), ctx)`.
 */

import { compareFacts, factsFromForm } from "./facts.js";
import { baseMessageAllowed, baseStopActiveFollowUp } from "./engine.js";
import { decide } from "./engine.js";
import { groundingText, isGrounded, normalize, similarity } from "./grounding.js";
import { LEXICON, type LexiconCategory } from "./lexicon.js";
import { parseAnswer, type ParsedAnswer, type ParsedCard } from "./parse.js";
import { EMAIL_RE, PHONE_RE, URL_RE } from "./redact.js";
import {
  DECISIONS,
  SCHEMA_VERSION,
  type CtaType,
  type Decision,
  type DesiredOutcome,
  type EngineResult,
  type EvidenceItem,
  type Facts,
  type Interaction,
  type MissingInformationItem,
  type ReasonType,
  type RescueCta,
  type RescueFacts,
  type RescueMessage,
  type RescueResult,
  type RescueTiming,
  type Suppression,
  type TimingMode,
  type UnknownField,
  type ValidationContext,
  type ValidationReport,
  type Violation,
  type ViolationCode,
} from "./types.js";

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

function V(code: ViolationCode, severity: Violation["severity"], message: string, rule: string, found?: string): Violation {
  return found === undefined ? { code, severity, message, rule } : { code, severity, message, rule, found };
}

function isPlainObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim() !== "";
}

function countWords(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

// ---------------------------------------------------------------------------
// §9.1-adjacent: coercing the loosely-typed parsed JSON into a safe RescueResult
// ---------------------------------------------------------------------------

const REQUIRED_KEYS: (keyof RescueResult)[] = [
  "lfr",
  "decision",
  "interaction",
  "timing",
  "reason",
  "contactReason",
  "action",
  "message",
  "cta",
  "angle",
  "noResponsePlan",
  "doNotDo",
  "stopActiveFollowUp",
  "suppression",
  "missingInformation",
  "facts",
  "evidence",
  "rejectedAssumptions",
];

interface SchemaCheck {
  problems: string[];
  fatal: boolean;
}

function checkSchema(json: Record<string, unknown>): SchemaCheck {
  const problems: string[] = [];
  for (const key of REQUIRED_KEYS) {
    if (!(key in json)) problems.push(`missing "${key}"`);
  }
  const decisionOk = typeof json.decision === "string" && (DECISIONS as readonly string[]).includes(json.decision);
  if (!decisionOk) {
    problems.push(`"decision" is not one of the 11 recognized labels${typeof json.decision === "string" ? `: ${json.decision}` : ""}`);
  }
  const factsOk = isPlainObjectLike(json.facts);
  if (!factsOk) problems.push('"facts" is missing or not an object');
  if (json.timing !== undefined && !isPlainObjectLike(json.timing)) problems.push('"timing" must be an object');
  if (json.message !== null && json.message !== undefined && !isPlainObjectLike(json.message)) {
    problems.push('"message" must be an object or null');
  }
  if (json.cta !== null && json.cta !== undefined && !isPlainObjectLike(json.cta)) {
    problems.push('"cta" must be an object or null');
  }
  for (const arrKey of ["doNotDo", "missingInformation", "evidence", "rejectedAssumptions"] as const) {
    if (json[arrKey] !== undefined && !Array.isArray(json[arrKey])) problems.push(`"${arrKey}" must be an array`);
  }
  return { problems, fatal: !decisionOk || !factsOk };
}

/** Fills a fully-typed, safe `RescueResult` from the loosely-typed parsed JSON, defaulting anything malformed. */
function toSafeResult(json: Record<string, unknown>): RescueResult {
  const timing = isPlainObjectLike(json.timing) ? (json.timing as unknown as RescueTiming) : { mode: "NONE" as TimingMode, date: null, note: null };
  return {
    lfr: typeof json.lfr === "string" ? json.lfr : "",
    decision: json.decision as Decision,
    interaction: (typeof json.interaction === "string" ? (json.interaction as Interaction) : "SEQUENCE") as Interaction,
    timing: { mode: timing.mode ?? "NONE", date: timing.date ?? null, note: timing.note ?? null },
    reason: typeof json.reason === "string" ? json.reason : "",
    contactReason: typeof json.contactReason === "string" ? json.contactReason : null,
    action: typeof json.action === "string" ? json.action : "",
    message: isPlainObjectLike(json.message) ? (json.message as unknown as RescueMessage) : null,
    cta: isPlainObjectLike(json.cta) ? (json.cta as unknown as RescueCta) : null,
    angle: typeof json.angle === "string" ? json.angle : null,
    noResponsePlan: typeof json.noResponsePlan === "string" ? json.noResponsePlan : "",
    doNotDo: Array.isArray(json.doNotDo) ? (json.doNotDo as string[]) : [],
    stopActiveFollowUp: typeof json.stopActiveFollowUp === "boolean" ? json.stopActiveFollowUp : false,
    suppression: (typeof json.suppression === "string" ? (json.suppression as Suppression) : "NONE") as Suppression,
    missingInformation: Array.isArray(json.missingInformation) ? (json.missingInformation as MissingInformationItem[]) : [],
    facts: json.facts as unknown as RescueFacts,
    evidence: Array.isArray(json.evidence) ? (json.evidence as EvidenceItem[]) : [],
    rejectedAssumptions: Array.isArray(json.rejectedAssumptions) ? (json.rejectedAssumptions as string[]) : [],
  };
}

/** Builds the full engine `Facts` the recompute needs from the AI's own (partial) `facts` object. */
function toEngineFacts(rescueFacts: RescueFacts, today: string): Facts {
  const f = rescueFacts as unknown as Record<string, unknown>;
  return {
    today,
    scope: f.scope === "OUT_OF_SCOPE" ? "OUT_OF_SCOPE" : "IN_SCOPE",
    scenario: (f.scenario as Facts["scenario"]) ?? null,
    channel: (f.channel as Facts["channel"]) ?? null,
    attempts: typeof f.attempts === "number" ? f.attempts : null,
    attemptsRange: Array.isArray(f.attemptsRange) && f.attemptsRange.length === 2 ? (f.attemptsRange as [number, number]) : null,
    closeLoopSent: typeof f.closeLoopSent === "boolean" ? f.closeLoopSent : false,
    hardStop: (f.hardStop as Facts["hardStop"]) ?? null,
    notRightNow: (f.notRightNow as Facts["notRightNow"]) ?? null,
    owedResponse: (f.owedResponse as Facts["owedResponse"]) ?? null,
    commitment: (f.commitment as Facts["commitment"]) ?? null,
    deadline: (f.deadline as Facts["deadline"]) ?? null,
    reason: (f.reason as Facts["reason"]) ?? null,
    newInfo: (f.newInfo as Facts["newInfo"]) ?? null,
    tooSoon: typeof f.tooSoon === "boolean" ? f.tooSoon : false,
    intentEvidence: [],
    userAssumptions: [],
    pressure: [],
    desiredOutcome: null,
  };
}

// ---------------------------------------------------------------------------
// §5.11-adjacent: reasons that need no `evidence` entry (design §9.2 E_EVIDENCE_MISSING)
// ---------------------------------------------------------------------------

const NO_EVIDENCE_NEEDED_REASONS = new Set<ReasonType>([
  "PENDING_PROPOSAL",
  "THEIR_REQUEST",
  "MEETING_FOLLOWUP",
  "EVENT_FOLLOWUP",
  "LEAD_REQUESTED_RECONNECT",
  "EXPIRED_COMMITMENT",
  "UNTIMED_COMMITMENT",
  "CONCRETE_DEADLINE",
]);

// ---------------------------------------------------------------------------
// §9.5 CTA / request-sentence detection
// ---------------------------------------------------------------------------

const SIGNOFF_WORDS_RE = /^(best|regards|sincerely|cheers|thanks|thank you|warm regards|kind regards|salamat)[,.]?$/i;

function isSignatureOrFooterLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return true;
  if (SIGNOFF_WORDS_RE.test(trimmed)) return true;
  const stripped = trimmed.replace(/\[[^\]]*\]/g, "").replace(/[·•,]/g, "").trim();
  return stripped === "";
}

const OPTOUT_LINE_RE = /if\s+you'?d\s+(rather|prefer)\b[\s\S]*?\b(not|stop)\b|reply\s+["“']?stop["”']?/i;
const OPEN_DOOR_RE =
  /\b(if|whenever|should|in case)\b[\s\S]*?\b(feel free|reach out|you know where to find me|i'?m here|happy to help|welcome to|glad to hear from you)\b/i;
const COURTESY_RE = /let me know if you have (any )?(other |more )?questions|happy to (help|answer)/i;

const REQUEST_START_RE =
  /^(?:please|pls)?\s*(let me know|reply|respond|confirm|book|schedule|pick|choose|click|call|text|send|share|sign|review|tell me|drop me|grab|hop on)\b/i;
const REQUEST_CONTAINS_RE = /\b(would you|could you|can you|are you (open|free|available)|do you want|shall we|should i)\b/i;
const URL_IN_TEXT_RE = /https?:\/\/|www\./i;

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]?/g) ?? [];
  return matches.map((s) => s.trim()).filter((s) => s !== "");
}

function isRequestSentence(sentenceRaw: string): boolean {
  const sentence = sentenceRaw.trim();
  if (sentence === "") return false;
  if (OPTOUT_LINE_RE.test(sentence)) return false;
  if (OPEN_DOOR_RE.test(sentence)) return false;
  if (COURTESY_RE.test(sentence)) return false;
  if (/\?\s*$/.test(sentence)) return true;
  if (REQUEST_START_RE.test(sentence)) return true;
  if (REQUEST_CONTAINS_RE.test(sentence)) return true;
  if (URL_IN_TEXT_RE.test(sentence)) return true;
  return false;
}

function countRequestSentences(body: string): { count: number; sentences: string[] } {
  const lines = body.split("\n").filter((l) => !isSignatureOrFooterLine(l));
  const sentences = splitSentences(lines.join(" "));
  const requests = sentences.filter(isRequestSentence);
  return { count: requests.length, sentences: requests };
}

/** design §9.5: `cta.text` should be found in the body, exact or fuzzy (>=0.85). */
function ctaTextInMessage(ctaText: string, body: string): boolean {
  if (normalize(body).includes(normalize(ctaText))) return true;
  return similarity(ctaText, body) >= 0.85;
}

// ---------------------------------------------------------------------------
// CLOSE_LOOP-specific: reopening / restart phrases (design §9.6 DISGUISED_RESTART)
// ---------------------------------------------------------------------------

/** These specifically promise the *user's own* future contact (a restart); everything else in the category reopens via a CTA-like ask. */
const RESTART_PROMISE_IDS = new Set([
  "disguised_restart.want_me_to_check_back",
  "disguised_restart.ill_check_back",
  "disguised_restart.pwede_ko_po_ba_i_follow_up_ulit",
]);

function scanCategory(body: string, category: LexiconCategory, excludeIds: ReadonlySet<string> = new Set()) {
  return LEXICON.filter((e) => e.category === category && !excludeIds.has(e.id) && e.pattern.test(body));
}

// ---------------------------------------------------------------------------
// §9.4 Negation and chase-phrase detection (E_PLAN_CHASES, E_WAIT_EARLY_CONTACT, E_ACTION_INCONSISTENT, …)
// ---------------------------------------------------------------------------

const CHASE_PHRASE_RE =
  /\b(follow[\s-]?up(?:s)?|reach out|check(?:ing)?\s+(?:in|back)|send(?:ing)?\s+(?:\w+\s+){0,3}?(?:messages?|emails?|reminders?|notes?|follow[\s-]?ups?)|messag(?:e|ing)\s+(?:them|him|her)|contact(?:ing)?\s+(?:them|him|her)|chase\s+(?:them|him|her|again)|keep\s+chasing|try(?:ing)?\s+again|touch(?:ing)?\s+base)\b/gi;

// "no" does not negate what follows when it is part of "no reply/response/answer" (a condition,
// e.g. "if no reply, follow up in 3 days" - the chase instruction after the comma is NOT negated).
const NEGATION_NEARBY_RE = /\b(don'?t|do not|no(?!\s+(?:reply|response|answer))|never|stop|avoid|without|hindi|huwag|wag)\b/i;

function isNegatedBefore(text: string, matchIndex: number): boolean {
  const before = text.slice(Math.max(0, matchIndex - 30), matchIndex);
  return NEGATION_NEARBY_RE.test(before);
}

function findUnnegatedChaseMatches(text: string): string[] {
  const hits: string[] = [];
  const re = new RegExp(CHASE_PHRASE_RE.source, CHASE_PHRASE_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (!isNegatedBefore(text, m.index)) hits.push(m[0]);
  }
  return hits;
}

const RECONTACT_INTERVAL_RE =
  /\bin\s+\d+\s+(days?|weeks?|months?)\b|\bnext\s+(week|month|quarter|year)\b|\b\d+\s+(days?|weeks?|months?)\s+(from now|later)\b|\bcheck(?:ing)?\s+back\s+in\b/i;

// ---------------------------------------------------------------------------
// §9.4 Owed-question / new-reason key terms
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "are", "do", "does", "did", "you", "your",
  "i", "we", "they", "it", "that", "this", "what", "how", "can", "could", "would", "will", "with", "about", "me",
  "my", "us", "our", "not", "now", "just", "be", "if", "so",
]);

function contentWordsMinLen(text: string, minLen: number): string[] {
  // Word-token regex (not a plain split(" ")) so punctuation-adjacent words like "[price]" or
  // "pricing?" still yield the bare word "price"/"pricing" rather than a punctuation-glued token.
  const words = normalize(text).match(/[\p{L}\p{N}']+/gu) ?? [];
  return words.filter((w) => w.length >= minLen && !STOPWORDS.has(w));
}

const SYNONYM_GROUPS: string[][] = [
  ["price", "pricing", "rate", "cost", "fee", "magkano"],
  ["schedule", "time", "slot", "available", "availability"],
  ["include", "included", "inclusions", "inclusion"],
  ["contract", "agreement"],
  ["invoice", "bill"],
];

function expandSynonyms(words: string[]): Set<string> {
  const set = new Set(words);
  for (const w of words) {
    for (const group of SYNONYM_GROUPS) {
      if (group.includes(w)) for (const g of group) set.add(g);
    }
  }
  return set;
}

function messageAnswersOwed(body: string, owedQuote: string): boolean {
  const terms = expandSynonyms(contentWordsMinLen(owedQuote, 3));
  if (terms.size === 0) return true;
  const bodyWords = new Set(contentWordsMinLen(body, 1));
  for (const t of terms) if (bodyWords.has(t)) return true;
  return false;
}

function newReasonKeyTerms(text: string): string[] {
  const long = contentWordsMinLen(text, 4);
  const capitalized = (text.match(/\b[A-Z][a-zA-Z]*\b/g) ?? []).map((w) => normalize(w));
  return [...new Set([...long, ...capitalized])].filter((t) => t.length > 0);
}

function firstKeyTermSentenceIndex(body: string, terms: string[]): number | null {
  const sentences = splitSentences(body);
  for (let idx = 0; idx < sentences.length; idx++) {
    const norm = normalize(sentences[idx]!);
    if (terms.some((t) => norm.includes(t))) return idx + 1;
  }
  return null;
}

// ---------------------------------------------------------------------------
// §9.4 Invented deadline / numbers / links
// ---------------------------------------------------------------------------

const WEEKDAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday|lunes|martes|miyerkules|huwebes|biyernes|sabado|linggo";
const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december|enero|pebrero|marso|abril|mayo|hunyo|hulyo|agosto|setyembre|oktubre|nobyembre|disyembre";
const DATE_EXPR_RE = new RegExp(
  `\\b(?:${WEEKDAYS}|${MONTHS})\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?\\b|\\btoday\\b|\\btomorrow\\b|\\btonight\\b|\\bnext week\\b|\\bend of (?:day|week|month)\\b|\\beod\\b|\\beow\\b|\\bbukas\\b|\\bmamaya\\b`,
  "i",
);
const DEADLINE_WORD_RE = /\b(by|before|until|no later than|deadline|expires?|closes?|closing|ends?|ending|last day|cutoff|hanggang)\b/gi;

function findDeadlineNearDate(body: string): string | null {
  const re = new RegExp(DEADLINE_WORD_RE.source, DEADLINE_WORD_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const start = Math.max(0, m.index - 40);
    const end = Math.min(body.length, m.index + m[0].length + 40);
    const window = body.slice(start, end);
    const dateMatch = DATE_EXPR_RE.exec(window);
    if (dateMatch) return dateMatch[0];
  }
  return null;
}

const CURRENCY_RE = /[$₱€£]\s?\d[\d,.]*|\d[\d,.]*\s?(usd|php|eur|gbp|k)\b|\bpesos?\b/gi;
const PERCENT_RE = /\d+(?:\.\d+)?\s?%/g;

function scanRegexAll(text: string, re: RegExp): string[] {
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  return [...text.matchAll(r)].map((m) => m[0]);
}

// ---------------------------------------------------------------------------
// §9.4 Missing-info keyword map
// ---------------------------------------------------------------------------

const MISSING_INFO_KEYWORDS: Record<UnknownField, RegExp> = {
  scenario: /\bhappened\b|\brecently\b|\bwhat\b/i,
  attempts: /\bfollow(?:ed|s)?[\s-]?up|\btimes\b|\bhow many\b|\breached\b|\bmessages\b/i,
  hardStop: /\bexact\b|\bwords\b|\bsay\b|\bsaid\b/i,
  owedResponse: /\bask(?:ed)?\b|\bquestion\b|\brequest\b|\banswer\b/i,
  commitmentTiming: /\bwhen\b|\bdate\b|\btimeframe\b|\btime\b|\bpassed\b/i,
  notRightNowTiming: /\bwhen\b|\bdate\b|\btimeframe\b|\btime\b|\bpassed\b/i,
  newInfoMateriality: /\bconnected\b|\brelated\b|\brelevant\b|\basked for\b|\bneed\b|\bworried\b/i,
  deadlineMateriality: /\bdeadline\b|\bmatter\b|\btheirs\b|\byours\b/i,
  reason: /\breason\b|\bwhy\b/i,
};

// ---------------------------------------------------------------------------
// §9.4 CTA-type vs desired-outcome map
// ---------------------------------------------------------------------------

const CTA_OUTCOME_MAP: Partial<Record<DesiredOutcome, CtaType[]>> = {
  BOOK_CALL: ["BOOK_TIME", "CHOOSE_ONE", "YES_NO"],
  GET_DECISION: ["YES_NO", "CHOOSE_ONE", "ANSWER"],
  RECEIVE_DOCUMENTS: ["SEND_ITEM", "CONFIRM", "YES_NO"],
  CONFIRM_ATTENDANCE: ["CONFIRM", "YES_NO"],
  ANSWER_QUESTION: ["ANSWER", "YES_NO"],
  // MOVE_PROPOSAL_FORWARD, OTHER: any CTA type fits.
};

// ---------------------------------------------------------------------------
// §8.1 timing.mode per decision
// ---------------------------------------------------------------------------

const ALLOWED_TIMING_MODES: Record<Decision, TimingMode[]> = {
  RESPOND_NOW: ["NOW"],
  WAIT: ["WAIT_UNTIL"],
  FOLLOW_UP: ["NOW", "SCHEDULED"],
  CHANGE_ANGLE: ["NOW", "SCHEDULED"],
  LOWER_FRICTION: ["NOW", "SCHEDULED"],
  CLOSE_LOOP: ["NOW", "SCHEDULED"],
  STOP_ACTIVE_FOLLOW_UP: ["NONE"],
  NEED_MISSING_INFORMATION: ["NONE"],
  NEED_FOLLOW_UP_REASON: ["NONE"],
  OUT_OF_SCOPE: ["NONE"],
  DO_NOTHING: ["NONE"],
};

// ---------------------------------------------------------------------------
// Word-count limits (§8.2) — the compliance footer is excluded
// ---------------------------------------------------------------------------

const CHAT_LIKE_CHANNELS = new Set(["SMS", "WHATSAPP", "MESSENGER", "VIBER", "INSTAGRAM", "LINKEDIN"]);

function wordLimitFor(decision: Decision, channel: string | null | undefined): number {
  if (decision === "RESPOND_NOW") return 180;
  if (channel && CHAT_LIKE_CHANNELS.has(channel)) return 60;
  if (decision === "LOWER_FRICTION" || decision === "CLOSE_LOOP") return 80;
  return 125;
}

function bodyForWordLimit(body: string): string {
  const lines = body.split("\n");
  const optOutIdx = lines.findIndex((l) => OPTOUT_LINE_RE.test(l));
  if (optOutIdx === -1) return body;
  let cut = optOutIdx;
  while (cut > 0 && isSignatureOrFooterLine(lines[cut - 1]!)) cut -= 1;
  return lines.slice(0, cut).join("\n");
}

// ---------------------------------------------------------------------------
// Placeholders (design §9.2 I_PLACEHOLDERS)
// ---------------------------------------------------------------------------

function extractPlaceholders(body: string): string[] {
  return [...new Set([...body.matchAll(/\[[^\]]+\]/g)].map((m) => m[0]))];
}

// ---------------------------------------------------------------------------
// Card vs JSON (design §9.2 E_CARD_MISMATCH)
// ---------------------------------------------------------------------------

function checkCardMismatch(card: ParsedCard, safe: RescueResult): Violation[] {
  const violations: Violation[] = [];
  if (card.decision && card.decision !== safe.decision) {
    violations.push(
      V(
        "E_CARD_MISMATCH",
        "error",
        `The card's DECISION line ("${card.decision}") disagrees with the JSON's decision ("${safe.decision}").`,
        "design §9.2 E_CARD_MISMATCH",
        card.decision,
      ),
    );
  }
  if (card.stopActiveFollowUp !== null && card.stopActiveFollowUp !== safe.stopActiveFollowUp) {
    violations.push(
      V(
        "E_CARD_MISMATCH",
        "error",
        `The card's STOP ACTIVE FOLLOW-UP ("${card.stopActiveFollowUp ? "Yes" : "No"}") disagrees with the JSON ("${safe.stopActiveFollowUp ? "Yes" : "No"}").`,
        "design §9.2 E_CARD_MISMATCH",
      ),
    );
  }
  if (card.message !== null && safe.message === null) {
    violations.push(
      V(
        "E_CARD_MISMATCH",
        "error",
        "The card shows a message body, but the JSON's `message` is null.",
        "design §9.2 E_CARD_MISMATCH",
      ),
    );
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Message anti-patterns (design §9.6)
// ---------------------------------------------------------------------------

const TRACKING_EXCLUDE_IDS = new Set([
  "presumption.i_noticed_you_opened",
  "guilt.i_saw_you_read",
  "guilt.left_me_on_read",
  "guilt.nag_seen_ka_lang",
]);

function checkMessageAntiPatterns(body: string, decision: Decision): Violation[] {
  const violations: Violation[] = [];

  for (const id of TRACKING_EXCLUDE_IDS) {
    const entry = LEXICON.find((e) => e.id === id);
    if (entry && entry.pattern.test(body)) {
      violations.push(V("E_TRACKING_OR_READ_GUILT", "error", entry.note, "design §9.2 E_TRACKING_OR_READ_GUILT", entry.pattern.exec(body)?.[0]));
    }
  }

  for (const hit of scanCategory(body, "GUILT", TRACKING_EXCLUDE_IDS)) {
    violations.push(V("E_GUILT", "error", hit.note, "design §9.2 E_GUILT", hit.pattern.exec(body)?.[0]));
  }
  for (const hit of scanCategory(body, "FAKE_URGENCY")) {
    violations.push(V("E_FAKE_URGENCY", "error", hit.note, "design §9.2 E_FAKE_URGENCY", hit.pattern.exec(body)?.[0]));
  }
  for (const hit of scanCategory(body, "FAKE_SCARCITY")) {
    violations.push(V("E_FAKE_SCARCITY", "error", hit.note, "design §9.2 E_FAKE_SCARCITY", hit.pattern.exec(body)?.[0]));
  }
  for (const hit of scanCategory(body, "PRESUMPTION", TRACKING_EXCLUDE_IDS)) {
    violations.push(V("E_ASSUMED_LEAD_STATE", "error", hit.note, "design §9.2 E_ASSUMED_LEAD_STATE", hit.pattern.exec(body)?.[0]));
  }
  for (const hit of scanCategory(body, "ASSUMED_OBJECTION")) {
    violations.push(V("E_ASSUMED_OBJECTION", "error", hit.note, "design §9.2 E_ASSUMED_OBJECTION", hit.pattern.exec(body)?.[0]));
  }
  for (const hit of scanCategory(body, "ATTRIBUTION")) {
    violations.push(V("E_UNSUPPORTED_ATTRIBUTION", "error", hit.note, "design §9.2 E_UNSUPPORTED_ATTRIBUTION", hit.pattern.exec(body)?.[0]));
  }

  const vagueHits = scanCategory(body, "VAGUE_CHECKIN");
  if (vagueHits.length > 0) {
    const isErrorDecision = decision === "CHANGE_ANGLE" || decision === "LOWER_FRICTION" || decision === "CLOSE_LOOP";
    const code: ViolationCode = isErrorDecision ? "E_VAGUE_CHECKIN" : "W_VAGUE_CHECKIN";
    const severity: Violation["severity"] = isErrorDecision ? "error" : "warning";
    violations.push(V(code, severity, vagueHits[0]!.note, "design §9.2 E_VAGUE_CHECKIN", vagueHits[0]!.pattern.exec(body)?.[0]));
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main entry points
// ---------------------------------------------------------------------------

function emptyReport(status: ValidationReport["status"], errors: Violation[] = [], warnings: Violation[] = []): ValidationReport {
  return { status, errors, warnings, infos: [], engine: null, factMismatches: [], placeholders: [] };
}

/** A reduced validation when only the readable card parsed (no JSON block found). */
function validateCardOnly(card: ParsedCard): ValidationReport {
  const violations: Violation[] = [];
  const warnings: Violation[] = [
    V("W_NO_CHECKER_DATA", "warning", "No JSON block was found; only the readable card could be checked.", "design §9.1 step 4"),
  ];
  const infos: Violation[] = [];

  const decision = card.decision && (DECISIONS as readonly string[]).includes(card.decision) ? (card.decision as Decision) : null;
  const hasMessage = card.message !== null;

  if (decision) {
    const allowed = baseMessageAllowed(decision);
    if (allowed && !hasMessage) {
      violations.push(V("E_MESSAGE_REQUIRED", "error", `${decision} requires a message, but the card shows none.`, "design §8.1"));
    }
    if (!allowed && hasMessage) {
      violations.push(V("E_MESSAGE_NOT_ALLOWED", "error", `${decision} does not allow a message, but the card shows one.`, "design §8.1"));
    }
  }

  const placeholders = card.message ? extractPlaceholders(card.message) : [];
  if (card.message) {
    violations.push(...checkMessageAntiPatterns(card.message, decision ?? "FOLLOW_UP"));
  }
  if (placeholders.length > 0) {
    infos.push(V("I_PLACEHOLDERS", "info", `Fill in before sending: ${placeholders.join(", ")}`, "design §9.2 I_PLACEHOLDERS"));
  }

  const errors = violations.filter((v) => v.severity === "error");
  const extraWarnings = violations.filter((v) => v.severity === "warning");
  const status: ValidationReport["status"] =
    errors.length > 0 ? "FIX_REQUIRED" : decision && !baseMessageAllowed(decision) ? "NO_MESSAGE_NEEDED" : "READY_WITH_WARNINGS";
  return { status, errors, warnings: [...warnings, ...extraWarnings], infos, engine: null, factMismatches: [], placeholders };
}

export function validate(parsed: ParsedAnswer, ctx: ValidationContext = {}): ValidationReport {
  if (parsed.json === null) {
    if (parsed.card !== null) return validateCardOnly(parsed.card);
    return emptyReport("UNPARSEABLE");
  }

  const json = parsed.json;
  const schema = checkSchema(json);
  const schemaViolations = schema.problems.length > 0 ? [V("E_SCHEMA", "error", schema.problems.join("; "), "design §9.2 E_SCHEMA")] : [];

  if (schema.fatal) {
    return emptyReport("FIX_REQUIRED", schemaViolations);
  }

  const safe = toSafeResult(json);
  const errors: Violation[] = [...schemaViolations];
  const warnings: Violation[] = [];
  const infos: Violation[] = [];

  const decision = safe.decision;
  const messageAllowed = baseMessageAllowed(decision);
  const body = safe.message?.body ?? "";
  const hasMessage = safe.message !== null;

  // ---- §8.1 message presence -------------------------------------------------
  if (messageAllowed && !hasMessage) {
    errors.push(V("E_MESSAGE_REQUIRED", "error", `${decision} requires a message, but none was provided.`, "design §8.1"));
  }
  if (!messageAllowed && hasMessage) {
    errors.push(V("E_MESSAGE_NOT_ALLOWED", "error", `${decision} does not allow a message, but one was provided.`, "design §8.1"));
  }

  // ---- §9.5 CTA detection + §8.1 per-decision CTA rules ----------------------
  if (hasMessage) {
    const { count: detectedCount } = countRequestSentences(body);
    const ctaPresent = safe.cta !== null;
    const zeroCta = decision !== "RESPOND_NOW" && !["FOLLOW_UP", "CHANGE_ANGLE", "LOWER_FRICTION"].includes(decision) && decision !== "CLOSE_LOOP";
    const exactlyOne = decision === "FOLLOW_UP" || decision === "CHANGE_ANGLE" || decision === "LOWER_FRICTION";

    if (decision === "CLOSE_LOOP") {
      const restartHits = scanCategory(body, "DISGUISED_RESTART").filter((e) => RESTART_PROMISE_IDS.has(e.id));
      const ctaReopenHits = scanCategory(body, "DISGUISED_RESTART").filter((e) => !RESTART_PROMISE_IDS.has(e.id));
      if (detectedCount > 0 || ctaReopenHits.length > 0 || ctaPresent) {
        errors.push(
          V(
            "E_CLOSE_LOOP_CTA",
            "error",
            "A CLOSE_LOOP message must not ask for a reply, a question, or a booking link (an open-door line is fine).",
            "design §8.5 E_CLOSE_LOOP_CTA",
            ctaReopenHits[0]?.pattern.exec(body)?.[0],
          ),
        );
      }
      if (restartHits.length > 0) {
        errors.push(
          V(
            "E_CLOSE_LOOP_RESTART",
            "error",
            "A CLOSE_LOOP message must not promise the user will make future contact.",
            "design §8.5 E_CLOSE_LOOP_RESTART",
            restartHits[0]!.pattern.exec(body)?.[0],
          ),
        );
      }
    } else if (zeroCta) {
      if (detectedCount > 0 || ctaPresent) {
        errors.push(V("E_CTA_NOT_ALLOWED", "error", `${decision} does not allow a call to action, but one was found.`, "design §8.1 E_CTA_NOT_ALLOWED"));
      }
    } else {
      // RESPOND_NOW (0-1) or an exactly-one decision.
      if (detectedCount > 1) {
        errors.push(V("E_MULTIPLE_CTAS", "error", "More than one distinct request sentence was found in the message.", "design §9.5 E_MULTIPLE_CTAS"));
      }
      if (exactlyOne && detectedCount === 0 && !ctaPresent) {
        errors.push(V("E_CTA_MISSING", "error", `${decision} requires exactly one call to action.`, "design §8.1 E_CTA_MISSING"));
      }
      if (ctaPresent && safe.cta!.text && !ctaTextInMessage(safe.cta!.text, body)) {
        warnings.push(V("E_CTA_NOT_IN_MESSAGE", "warning", "`cta.text` was not found in the message body.", "design §9.2 E_CTA_NOT_IN_MESSAGE", safe.cta!.text));
      }
      if (decision === "LOWER_FRICTION") {
        if (ctaPresent && safe.cta!.type !== "YES_NO" && safe.cta!.type !== "CHOOSE_ONE") {
          errors.push(
            V("E_FRICTION_NOT_LOWERED", "error", "LOWER_FRICTION's CTA must be a yes/no or choose-one ask.", "design §8.4 E_FRICTION_NOT_LOWERED", safe.cta!.type),
          );
        }
        if (detectedCount > 1) {
          errors.push(V("E_FRICTION_NOT_LOWERED", "error", "LOWER_FRICTION must ask only one question.", "design §8.4 E_FRICTION_NOT_LOWERED"));
        }
        if (countWords(bodyForWordLimit(body)) > 80) {
          errors.push(V("E_FRICTION_NOT_LOWERED", "error", "LOWER_FRICTION's message is longer than the 80-word limit.", "design §8.4 E_FRICTION_NOT_LOWERED"));
        }
      }
    }

    // ---- Message anti-patterns (§9.6) ---------------------------------------
    for (const v of checkMessageAntiPatterns(body, decision)) (v.severity === "error" ? errors : warnings).push(v);

    // ---- Invented deadline / numbers / links (§9.4, §9.2) -------------------
    const caseText = groundingText(ctx);
    const deadlineExpr = findDeadlineNearDate(body);
    if (deadlineExpr) {
      const facts = json.facts as Record<string, unknown> | undefined;
      const deadline = isPlainObjectLike(facts?.deadline) ? (facts!.deadline as Record<string, unknown>) : null;
      const deadlineGrounded =
        (deadline?.kind === "CONCRETE" && typeof deadline.quote === "string" && isGrounded(deadline.quote, caseText).status !== "ungrounded") ||
        normalize(caseText).includes(normalize(deadlineExpr));
      if (!deadlineGrounded) {
        errors.push(V("E_INVENTED_DEADLINE", "error", `Deadline language near a date ("${deadlineExpr}") is not grounded in the case.`, "design §9.2 E_INVENTED_DEADLINE", deadlineExpr));
      }
    }

    for (const hit of scanRegexAll(body, CURRENCY_RE)) {
      if (!normalize(caseText).includes(normalize(hit))) {
        errors.push(V("E_INVENTED_NUMBER", "error", `A currency amount ("${hit}") is not present in the case.`, "design §9.2 E_INVENTED_NUMBER", hit));
      }
    }
    for (const hit of scanRegexAll(body, PERCENT_RE)) {
      if (!normalize(caseText).includes(normalize(hit))) {
        errors.push(V("E_INVENTED_NUMBER", "error", `A percentage ("${hit}") is not present in the case.`, "design §9.2 E_INVENTED_NUMBER", hit));
      }
    }
    for (const re of [EMAIL_RE, URL_RE, PHONE_RE]) {
      for (const hit of scanRegexAll(body, re)) {
        if (!caseText.toLowerCase().includes(hit.toLowerCase())) {
          errors.push(V("E_INVENTED_LINK", "error", `A contact detail ("${hit}") is not present in the case.`, "design §9.2 E_INVENTED_LINK", hit));
        }
      }
    }

    // ---- Decision-specific message rules -------------------------------------
    if (decision === "CHANGE_ANGLE") {
      if (!nonEmpty(safe.angle)) {
        errors.push(V("E_ANGLE_MISSING", "error", "CHANGE_ANGLE requires a non-empty `angle`.", "design §8.3 E_ANGLE_MISSING"));
      }
      const previous = ctx.caseInput?.userMessages;
      if (nonEmpty(previous) && similarity(bodyForWordLimit(body), previous) >= 0.5) {
        warnings.push(V("W_ANGLE_TOO_SIMILAR", "warning", "The message is very similar to the previous follow-up.", "design §8.3 W_ANGLE_TOO_SIMILAR"));
      }
    }

    if (decision === "RESPOND_NOW") {
      const facts = json.facts as Record<string, unknown> | undefined;
      const owed = isPlainObjectLike(facts?.owedResponse) ? (facts!.owedResponse as Record<string, unknown>) : null;
      const owedQuote = typeof owed?.quote === "string" ? owed.quote : "";
      if (nonEmpty(owedQuote) && !messageAnswersOwed(body, owedQuote)) {
        errors.push(V("E_QUESTION_NOT_ANSWERED", "error", "The message does not appear to answer the owed question/request.", "design §8.6 E_QUESTION_NOT_ANSWERED"));
      }
    }

    if (safe.interaction === "NEW_REASON") {
      const facts = json.facts as Record<string, unknown> | undefined;
      const newInfo = isPlainObjectLike(facts?.newInfo) ? (facts!.newInfo as Record<string, unknown>) : null;
      const newInfoText = typeof newInfo?.text === "string" ? newInfo.text : "";
      const terms = newReasonKeyTerms(newInfoText);
      if (terms.length > 0) {
        const normBody = normalize(body);
        if (!terms.some((t) => normBody.includes(t))) {
          errors.push(V("E_NEW_REASON_NOT_IN_MESSAGE", "error", "The new material reason is not reflected in the message.", "design §9.2 E_NEW_REASON_NOT_IN_MESSAGE"));
        } else {
          const idx = firstKeyTermSentenceIndex(body, terms);
          if (idx !== null && idx > 2) {
            warnings.push(V("W_NEW_REASON_NOT_LEADING", "warning", "The new material reason appears late in the message, not leading it.", "design §9.2 W_NEW_REASON_NOT_LEADING"));
          }
        }
      }
    }

    // ---- Word count / length (§8.2), excluded from LOWER_FRICTION's dedicated check ----
    if (decision !== "LOWER_FRICTION") {
      const limit = wordLimitFor(decision, safe.message?.channel);
      const words = countWords(bodyForWordLimit(body));
      if (words > limit) {
        warnings.push(V("W_TOO_LONG", "warning", `The message is ${words} words, over the ${limit}-word guideline.`, "design §8.2 W_TOO_LONG"));
      }
    }

    // ---- Subject line honesty (§11.3) ---------------------------------------
    if (safe.message?.subject && /^(re|fwd):/i.test(safe.message.subject.trim()) && !nonEmpty(ctx.caseInput?.originalSubject)) {
      warnings.push(V("W_FAKE_RE_SUBJECT", "warning", "The subject uses Re:/Fwd: but no original subject was given.", "design §11.3 W_FAKE_RE_SUBJECT"));
    }

    // ---- Compliance footer (§11.2) ------------------------------------------
    const complianceOn = ctx.caseInput ? ctx.caseInput.complianceFooter : true;
    if (
      complianceOn &&
      safe.message?.channel === "EMAIL" &&
      (decision === "FOLLOW_UP" || decision === "CHANGE_ANGLE" || decision === "LOWER_FRICTION") &&
      !OPTOUT_LINE_RE.test(body)
    ) {
      warnings.push(V("W_OPTOUT_LINE_MISSING", "warning", "The email is missing the opt-out line from the compliance footer.", "design §11.2 W_OPTOUT_LINE_MISSING"));
    }

    // ---- CTA vs desired outcome (§9.4) --------------------------------------
    const desiredOutcome = ctx.caseInput?.desiredOutcome;
    if (desiredOutcome && safe.cta && CTA_OUTCOME_MAP[desiredOutcome] && !CTA_OUTCOME_MAP[desiredOutcome]!.includes(safe.cta.type)) {
      warnings.push(V("W_CTA_OUTCOME_MISMATCH", "warning", `The CTA type (${safe.cta.type}) doesn't fit the desired outcome (${desiredOutcome}).`, "design §9.4 W_CTA_OUTCOME_MISMATCH"));
    }

    // ---- Placeholders --------------------------------------------------------
    const placeholders = extractPlaceholders(body);
    if (placeholders.length > 0) {
      infos.push(V("I_PLACEHOLDERS", "info", `Fill in before sending: ${placeholders.join(", ")}`, "design §9.2 I_PLACEHOLDERS"));
    }
  }

  // ---- §9.2 E_REASON_MISSING --------------------------------------------------
  if (messageAllowed && decision !== "CLOSE_LOOP" && !nonEmpty(safe.contactReason)) {
    errors.push(V("E_REASON_MISSING", "error", "A message decision needs a non-empty `contactReason`.", "design §8.2 E_REASON_MISSING"));
  }

  // ---- §9.2 E_EVIDENCE_MISSING --------------------------------------------------
  {
    const facts = json.facts as Record<string, unknown>;
    const quoteFields: [string, unknown][] = [
      ["hardStop", facts.hardStop],
      ["notRightNow", facts.notRightNow],
      ["owedResponse", facts.owedResponse],
      ["commitment", facts.commitment],
      ["deadline", facts.deadline],
    ];
    for (const [name, value] of quoteFields) {
      if (isPlainObjectLike(value) && !nonEmpty(value.quote as string | undefined)) {
        errors.push(V("E_EVIDENCE_MISSING", "error", `\`facts.${name}\` is present but has no quote.`, "design §9.2 E_EVIDENCE_MISSING"));
      }
    }
    const newInfo = isPlainObjectLike(facts.newInfo) ? facts.newInfo : null;
    if (newInfo && newInfo.material === "YES" && !nonEmpty(newInfo.linkedNeedQuote as string | undefined)) {
      errors.push(V("E_EVIDENCE_MISSING", "error", "`facts.newInfo.material` is YES but has no `linkedNeedQuote`.", "design §9.2 E_EVIDENCE_MISSING"));
    }
    const reason = isPlainObjectLike(facts.reason) ? facts.reason : null;
    if (reason && !NO_EVIDENCE_NEEDED_REASONS.has(reason.type as ReasonType)) {
      const hasEntry = safe.evidence.some((e) => e.fact === "reason" && nonEmpty(e.quote));
      if (!hasEntry) {
        errors.push(V("E_EVIDENCE_MISSING", "error", "A non-inherent `reason` needs an `evidence` entry (`fact: \"reason\"`).", "design §9.2 E_EVIDENCE_MISSING"));
      }
    }
  }

  // ---- §9.3 Quote grounding -----------------------------------------------------
  {
    const caseText = groundingText(ctx);
    const facts = json.facts as Record<string, unknown>;
    const quoteSources: [string, string | undefined][] = [
      ["hardStop.quote", (facts.hardStop as Record<string, unknown> | undefined)?.quote as string | undefined],
      ["notRightNow.quote", (facts.notRightNow as Record<string, unknown> | undefined)?.quote as string | undefined],
      ["owedResponse.quote", (facts.owedResponse as Record<string, unknown> | undefined)?.quote as string | undefined],
      ["commitment.quote", (facts.commitment as Record<string, unknown> | undefined)?.quote as string | undefined],
      ["deadline.quote", (facts.deadline as Record<string, unknown> | undefined)?.quote as string | undefined],
      ["newInfo.linkedNeedQuote", (facts.newInfo as Record<string, unknown> | undefined)?.linkedNeedQuote as string | undefined],
    ];
    for (const [field, quote] of quoteSources) {
      if (!nonEmpty(quote)) continue;
      const g = isGrounded(quote, caseText);
      if (g.status === "ungrounded") {
        errors.push(V("E_UNGROUNDED_QUOTE", "error", `\`facts.${field}\` is not found in the case.`, "design §9.3 E_UNGROUNDED_QUOTE", quote));
      } else if (g.status === "paraphrased") {
        warnings.push(V("W_QUOTE_PARAPHRASED", "warning", `\`facts.${field}\` only approximately matches the case.`, "design §9.3 W_QUOTE_PARAPHRASED", quote));
      }
    }
    for (const ev of safe.evidence) {
      if (!nonEmpty(ev.quote)) continue;
      const g = isGrounded(ev.quote, caseText);
      if (g.status === "ungrounded") {
        errors.push(V("E_UNGROUNDED_QUOTE", "error", `An evidence quote for "${ev.fact}" is not found in the case.`, "design §9.3 E_UNGROUNDED_QUOTE", ev.quote));
      } else if (g.status === "paraphrased") {
        warnings.push(V("W_QUOTE_PARAPHRASED", "warning", `An evidence quote for "${ev.fact}" only approximately matches the case.`, "design §9.3 W_QUOTE_PARAPHRASED", ev.quote));
      }
    }
  }

  // ---- §9.2 E_STOP_FLAG / E_SUPPRESSION / E_TIMING_MODE --------------------------
  {
    const expectedStop = (decision === "FOLLOW_UP" && (safe.interaction === "NEW_REASON" || safe.interaction === "DEADLINE_FINAL")) || baseStopActiveFollowUp(decision);
    if (safe.stopActiveFollowUp !== expectedStop) {
      errors.push(V("E_STOP_FLAG", "error", `\`stopActiveFollowUp\` should be ${expectedStop} for ${decision}/${safe.interaction}.`, "design §5.10 E_STOP_FLAG"));
    }
    if (decision === "STOP_ACTIVE_FOLLOW_UP" ? safe.suppression === "NONE" : safe.suppression !== "NONE") {
      errors.push(V("E_SUPPRESSION", "error", "`suppression` is inconsistent with the decision.", "design §8.1 E_SUPPRESSION"));
    }
    const allowedModes = ALLOWED_TIMING_MODES[decision];
    if (!allowedModes.includes(safe.timing.mode)) {
      errors.push(V("E_TIMING_MODE", "error", `\`timing.mode\` (${safe.timing.mode}) is not valid for ${decision}.`, "design §8.1 E_TIMING_MODE"));
    }
  }

  // ---- §9.2 Engine recompute: E_RULE_MISMATCH / W_NMI_NFR_SWAP -------------------
  const today = ctx.today ?? ctx.caseInput?.today ?? null;
  let engineResult: EngineResult | null = null;
  let aiFacts: Facts | null = null;
  if (today) {
    aiFacts = toEngineFacts(safe.facts, today);
    engineResult = decide(aiFacts);
    if (engineResult.decision !== decision) {
      const isSwap =
        (engineResult.decision === "NEED_MISSING_INFORMATION" && decision === "NEED_FOLLOW_UP_REASON") ||
        (engineResult.decision === "NEED_FOLLOW_UP_REASON" && decision === "NEED_MISSING_INFORMATION");
      if (isSwap) {
        warnings.push(V("W_NMI_NFR_SWAP", "warning", `The engine recomputes ${engineResult.decision}; the AI answered ${decision}.`, "design §9.2 W_NMI_NFR_SWAP"));
      } else {
        errors.push(V("E_RULE_MISMATCH", "error", `The engine recomputes ${engineResult.decision} from the AI's own facts; the AI answered ${decision}.`, "design §9.2 E_RULE_MISMATCH"));
      }
    }

    // §9.2 E_TIMING_DATE_UNGROUNDED
    if (safe.timing.date) {
      const ref = aiFacts.commitment?.timing ?? aiFacts.notRightNow?.timing ?? null;
      const ungroundedByType = ref !== null && ref.type !== "SPECIFIC";
      const waitMismatch = decision === "WAIT" && safe.timing.date !== engineResult.waitUntil;
      if (ungroundedByType || waitMismatch) {
        errors.push(V("E_TIMING_DATE_UNGROUNDED", "error", "`timing.date` is not grounded in a SPECIFIC timing, or disagrees with the engine's `waitUntil`.", "design §9.2 E_TIMING_DATE_UNGROUNDED"));
      }
    }

    // §7 E_INVENTED_RECONTACT_INTERVAL: after an untimed NRN, no invented interval in plan/timing.note
    const nrn = aiFacts.notRightNow;
    if (nrn) {
      const isUntimed = nrn.timing.type === "NONE";
      if (isUntimed) {
        const candidateText = `${safe.noResponsePlan} ${safe.timing.note ?? ""}`;
        if (RECONTACT_INTERVAL_RE.test(candidateText)) {
          errors.push(V("E_INVENTED_RECONTACT_INTERVAL", "error", "An untimed \"not right now\" must not invent a re-contact interval.", "design §7 E_INVENTED_RECONTACT_INTERVAL"));
        }
      }
    }

    // §9.2 E_MISSING_INFO_NOT_MATERIAL / E_TOO_MANY_QUESTIONS
    if (decision === "NEED_MISSING_INFORMATION" || decision === "NEED_FOLLOW_UP_REASON") {
      const n = safe.missingInformation.length;
      if (n === 0 || n > 3) {
        errors.push(V("E_TOO_MANY_QUESTIONS", "error", `${decision} must ask 1-3 questions; found ${n}.`, "design §9.2 E_TOO_MANY_QUESTIONS"));
      } else {
        const material = engineResult.materialUnknowns;
        const matchesAny = safe.missingInformation.some((q) => material.some((field) => MISSING_INFO_KEYWORDS[field].test(q.question)));
        if (material.length > 0 && !matchesAny) {
          errors.push(V("E_MISSING_INFO_NOT_MATERIAL", "error", "None of the questions map to a material unknown.", "design §9.2 E_MISSING_INFO_NOT_MATERIAL"));
        }
      }
    }
  }

  // ---- §9.2 E_HARD_STOP_OVERRIDDEN ------------------------------------------------
  {
    const facts = json.facts as Record<string, unknown>;
    const hardStop = isPlainObjectLike(facts.hardStop) ? facts.hardStop : null;
    const formSaysStop = ctx.caseInput?.stop.answer === "OPT_OUT" || ctx.caseInput?.stop.answer === "DECLINE";
    const aiSaysStop = hardStop !== null && hardStop.sure === true;
    if ((formSaysStop || aiSaysStop) && decision !== "STOP_ACTIVE_FOLLOW_UP") {
      errors.push(V("E_HARD_STOP_OVERRIDDEN", "error", "The lead's hard stop was not honored.", "design §3 E_HARD_STOP_OVERRIDDEN"));
    }
  }

  // ---- §9.2 E_STOP_PHRASE_UNADDRESSED ---------------------------------------------
  {
    const leadText = ctx.caseInput?.leadMessages ?? ctx.raw ?? "";
    const optOutHits = scanCategory(leadText, "OPT_OUT");
    if (optOutHits.length > 0 && decision !== "STOP_ACTIVE_FOLLOW_UP") {
      const matchedPhrases = optOutHits.map((h) => h.pattern.exec(leadText)?.[0]).filter(nonEmpty);
      const explained = matchedPhrases.some((phrase) =>
        safe.rejectedAssumptions.some((r) => normalize(r).includes(normalize(phrase))),
      );
      const severity: Violation["severity"] = explained ? "warning" : "error";
      (severity === "error" ? errors : warnings).push(
        V(
          "E_STOP_PHRASE_UNADDRESSED",
          severity,
          "The lead used a strong stop phrase, but the decision is not STOP_ACTIVE_FOLLOW_UP.",
          "design §3 E_STOP_PHRASE_UNADDRESSED",
          matchedPhrases[0],
        ),
      );
    }
  }

  // ---- §9.2 W_VERSION_MISMATCH -----------------------------------------------------
  if (nonEmpty(safe.lfr) && safe.lfr !== SCHEMA_VERSION) {
    warnings.push(V("W_VERSION_MISMATCH", "warning", `The answer's schema version ("${safe.lfr}") differs from the current one ("${SCHEMA_VERSION}").`, "design §14 W_VERSION_MISMATCH"));
  }

  // ---- §9.2 E_CARD_MISMATCH ---------------------------------------------------------
  if (parsed.card) {
    errors.push(...checkCardMismatch(parsed.card, safe));
  }

  // ---- §9.2 W_FACT_MISMATCH (form vs AI facts) -------------------------------------
  let factMismatches: ValidationReport["factMismatches"] = [];
  if (ctx.caseInput && aiFacts) {
    const formFacts = factsFromForm(ctx.caseInput);
    factMismatches = compareFacts(formFacts, aiFacts);
    for (const m of factMismatches) {
      warnings.push(V("W_FACT_MISMATCH", "warning", m.message, "design §9.2 W_FACT_MISMATCH"));
    }
  }

  // ---- §9.2 E_ACTION_INCONSISTENT / E_PLAN_CHASES / E_PLAN_EXCEEDS_SAFETY / E_WAIT_EARLY_CONTACT --
  {
    if (!messageAllowed) {
      const actionHits = findUnnegatedChaseMatches(safe.action);
      if (actionHits.length > 0) {
        errors.push(V("E_ACTION_INCONSISTENT", "error", "The action tells the user to send or contact the lead, but no message is allowed.", "design §9.2 E_ACTION_INCONSISTENT", actionHits[0]));
      }
    }

    const singleShot = decision === "FOLLOW_UP" && (safe.interaction === "NEW_REASON" || safe.interaction === "DEADLINE_FINAL");
    const planChasesApplies = decision === "CLOSE_LOOP" || decision === "STOP_ACTIVE_FOLLOW_UP" || decision === "DO_NOTHING" || singleShot;
    if (planChasesApplies) {
      const planHits = findUnnegatedChaseMatches(safe.noResponsePlan);
      if (planHits.length > 0) {
        errors.push(V("E_PLAN_CHASES", "error", "The no-response plan schedules or instructs further outreach.", "design §8.7 E_PLAN_CHASES", planHits[0]));
      }
    }

    if (decision === "LOWER_FRICTION") {
      const planHits = findUnnegatedChaseMatches(safe.noResponsePlan);
      const multipleFollowUps = /\b(two|three|2|3)\s+(more\s+)?follow[\s-]?ups?\b/i.test(safe.noResponsePlan);
      if (planHits.length > 0 || multipleFollowUps) {
        errors.push(V("E_PLAN_EXCEEDS_SAFETY", "error", "The plan continues follow-ups instead of closing the loop.", "design §8.7 E_PLAN_EXCEEDS_SAFETY"));
      }
    } else {
      const multipleFollowUps = /\b(two|three|2|3)\s+(more\s+)?follow[\s-]?ups?\b/i.test(safe.noResponsePlan);
      if (multipleFollowUps) {
        errors.push(V("E_PLAN_EXCEEDS_SAFETY", "error", "The plan instructs more than one further follow-up.", "design §8.7 E_PLAN_EXCEEDS_SAFETY"));
      }
    }

    if (decision === "WAIT") {
      const hits = [...findUnnegatedChaseMatches(safe.noResponsePlan), ...findUnnegatedChaseMatches(safe.action)];
      if (hits.length > 0) {
        errors.push(V("E_WAIT_EARLY_CONTACT", "error", "WAIT's plan or action instructs contact before the wait ends.", "design §8.7 E_WAIT_EARLY_CONTACT", hits[0]));
      }
    }
  }

  const status: ValidationReport["status"] =
    errors.length > 0 ? "FIX_REQUIRED" : !messageAllowed ? "NO_MESSAGE_NEEDED" : warnings.length > 0 ? "READY_WITH_WARNINGS" : "READY";

  return {
    status,
    errors,
    warnings,
    infos,
    engine: engineResult,
    factMismatches,
    placeholders: hasMessage ? extractPlaceholders(body) : [],
  };
}

/** `validate(parseAnswer(answerText), ctx)` (design §9.2a). */
export function checkAnswer(answerText: string, ctx: ValidationContext = {}): ValidationReport {
  return validate(parseAnswer(answerText), ctx);
}
