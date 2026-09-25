/**
 * Normalisation, quote grounding and text similarity (design §9.3).
 *
 * Two different similarity measures are used deliberately, per design:
 *  - quote grounding (`isGrounded`) uses a normalised-Levenshtein sliding
 *    window, because a paraphrased *quote* is usually the same words in
 *    nearly the same order;
 *  - general text similarity (`similarity`, e.g. for `W_ANGLE_TOO_SIMILAR`
 *    in the validator) uses word-trigram Jaccard, which better tolerates
 *    reordering and insertions between two whole *messages*.
 */

import { prepareCaseText } from "./redact.js";
import { sanitize } from "./sanitize.js";
import type { ValidationContext } from "./types.js";

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const SMART_SINGLE_QUOTES = /[‘’‛′]/g;
const SMART_DOUBLE_QUOTES = /[“”‟″]/g;
const EDGE_PUNCTUATION_RE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * NFKC-normalises, lower-cases, straightens smart quotes, collapses
 * whitespace, and strips leading/trailing punctuation (design §9.3).
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(SMART_SINGLE_QUOTES, "'")
    .replace(SMART_DOUBLE_QUOTES, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(EDGE_PUNCTUATION_RE, "");
}

// ---------------------------------------------------------------------------
// Levenshtein similarity (used only inside quote grounding)
// ---------------------------------------------------------------------------

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prevDiag = dp[0] ?? 0;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min((dp[j] ?? 0) + 1, (dp[j - 1] ?? 0) + 1, prevDiag + cost);
      prevDiag = tmp;
    }
  }
  return dp[n] ?? 0;
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/** Best Levenshtein similarity between `quote` and any similarly-sized word window of `text` (both normalized). */
function bestWindowSimilarity(quote: string, text: string): number {
  const qWords = quote.split(" ").filter(Boolean);
  const tWords = text.split(" ").filter(Boolean);
  if (qWords.length === 0 || tWords.length === 0) return levenshteinSimilarity(quote, text);

  let best = levenshteinSimilarity(quote, text);
  const candidateLens = new Set<number>([qWords.length, Math.max(1, qWords.length - 1), qWords.length + 1]);
  for (const len of candidateLens) {
    if (len <= 0 || len > tWords.length) continue;
    for (let i = 0; i + len <= tWords.length; i++) {
      const window = tWords.slice(i, i + len).join(" ");
      const sim = levenshteinSimilarity(quote, window);
      if (sim > best) best = sim;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Word-trigram Jaccard similarity (general purpose)
// ---------------------------------------------------------------------------

function wordTrigrams(text: string): Set<string> {
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return new Set();
  if (words.length < 3) return new Set([words.join(" ")]);
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= words.length; i++) {
    grams.add(words.slice(i, i + 3).join(" "));
  }
  return grams;
}

/** Word-trigram Jaccard similarity of two texts, after {@link normalize}. 1 = identical, 0 = disjoint. */
export function similarity(a: string, b: string): number {
  const ta = wordTrigrams(normalize(a));
  const tb = wordTrigrams(normalize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const g of ta) if (tb.has(g)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

// ---------------------------------------------------------------------------
// Quote grounding (design §9.3)
// ---------------------------------------------------------------------------

export type GroundingStatus = "exact" | "paraphrased" | "ungrounded";

export interface GroundingCheck {
  status: GroundingStatus;
  /** 1 for exact/ellipsis matches; the best fuzzy similarity found otherwise. */
  score: number;
}

const ELLIPSIS_RE = /\.\.\.|…/;
const PARAPHRASE_THRESHOLD = 0.9;

/**
 * Grounds a quote against `caseText` (design §9.3):
 *  - exact: the normalised quote is a substring of the normalised case text;
 *  - ellipsis: a quote containing "..." or "…" is grounded if every segment
 *    of 3+ characters appears, in order;
 *  - paraphrased: best fuzzy similarity ≥ 0.9 (Levenshtein, sliding window);
 *  - otherwise: ungrounded.
 */
export function isGrounded(quote: string, caseText: string): GroundingCheck {
  const normalizedQuote = normalize(quote);
  const normalizedText = normalize(caseText);
  if (normalizedQuote === "") return { status: "exact", score: 1 };

  if (ELLIPSIS_RE.test(quote)) {
    const segments = quote
      .split(ELLIPSIS_RE)
      .map((s) => normalize(s))
      .filter((s) => s.length >= 3);
    if (segments.length > 0) {
      let cursor = 0;
      let allFound = true;
      for (const seg of segments) {
        const idx = normalizedText.indexOf(seg, cursor);
        if (idx === -1) {
          allFound = false;
          break;
        }
        cursor = idx + seg.length;
      }
      if (allFound) return { status: "exact", score: 1 };
    }
  }

  if (normalizedText.includes(normalizedQuote)) {
    return { status: "exact", score: 1 };
  }

  const score = bestWindowSimilarity(normalizedQuote, normalizedText);
  if (score >= PARAPHRASE_THRESHOLD) return { status: "paraphrased", score };
  return { status: "ungrounded", score };
}

// ---------------------------------------------------------------------------
// groundingText (design §9.2a, §9.3)
// ---------------------------------------------------------------------------

/**
 * The case text quotes are grounded against. In raw mode (`ctx.raw`, no
 * `caseInput`) it is the sanitized raw text. In Desk mode it renders the
 * case's pasted fields plus the form's own free-text answers (decoded, not
 * JSON-escaped, since this is for comparison, not for building a prompt).
 *
 * Full case-block rendering is `buildCaseBlock` (`src/prompt.ts`); this
 * covers grounding for the engine/validator layer. Redaction and
 * pseudonymization (design §10.7) are applied here too, via the shared
 * `prepareCaseText` helper, so that quotes the model saw only in their
 * redacted/pseudonymized form (e.g. "[LEAD]" instead of a real name) are
 * still grounded correctly rather than reported as invented.
 */
export function groundingText(ctx: ValidationContext): string {
  if (ctx.caseInput) {
    const c = ctx.caseInput;
    const parts = [
      c.leadMessages,
      c.userMessages,
      c.notes,
      c.owed.text,
      c.stop.words,
      c.timeframe.words,
      c.deadline.what,
      c.newInfo.text,
      c.newInfo.linkedWords,
      c.originalSubject,
    ];
    const text = sanitize(parts.filter((p) => p.trim() !== "").join("\n"));
    return prepareCaseText(text, c);
  }
  if (ctx.raw) return sanitize(ctx.raw);
  return "";
}
