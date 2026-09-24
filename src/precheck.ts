/**
 * Scans the case text for lexicon signals and computes the raw attempt band
 * (design §3.3, §9.6, TEST_PLAN §7.2).
 *
 * Source separation: `leadMessages` is the only field scanned for "lead signal"
 * categories (OPT_OUT, DECLINE, NRN, VAGUE_COMMITMENT, VAGUE_TIMING, VAGUE_URGENCY,
 * AUTO_REPLY, CHANNEL_PREFERENCE). A phrase in `userMessages` or `notes` — the
 * user's own words — never raises a lead signal, even if it matches the same text.
 */

import { LEXICON } from "./lexicon.js";
import { sanitize } from "./sanitize.js";
import type { AttemptBand, CaseInput, Precheck, PrecheckCategory, PrecheckSignal, PrecheckSource } from "./types.js";

const LEAD_SIGNAL_CATEGORIES: readonly PrecheckCategory[] = [
  "OPT_OUT",
  "DECLINE",
  "NRN",
  "VAGUE_COMMITMENT",
  "VAGUE_TIMING",
  "VAGUE_URGENCY",
  "AUTO_REPLY",
  "CHANNEL_PREFERENCE",
];

const USER_SIGNAL_CATEGORIES: readonly PrecheckCategory[] = [
  "USER_ASSUMPTION",
  "USER_PRESSURE",
  "DEAL_LABEL",
  "MESSAGE_FIRST_REQUEST",
  "DISGUISE_REQUEST",
];

const INJECTION_CATEGORIES: readonly PrecheckCategory[] = ["INSTRUCTION_IN_DATA"];

function scan(text: string, source: PrecheckSource, categories: readonly PrecheckCategory[]): PrecheckSignal[] {
  const clean = sanitize(text);
  if (!clean.trim()) return [];
  const allowed = new Set<string>(categories);
  const signals: PrecheckSignal[] = [];
  for (const entry of LEXICON) {
    if (!allowed.has(entry.category)) continue;
    const match = entry.pattern.exec(clean);
    if (!match) continue;
    signals.push({
      category: entry.category as PrecheckCategory,
      matchedText: match[0],
      source,
      severity: entry.severity,
    });
  }
  return signals;
}

/** The raw attempt band from the attempt count alone, ignoring every other fact (§7.2). */
export function attemptBandFor(attempts: number | "UNSURE" | null): AttemptBand | null {
  if (attempts === null || attempts === "UNSURE") return null;
  const n = Math.min(attempts, 4);
  if (n <= 1) return "FOLLOW_UP";
  if (n === 2) return "CHANGE_ANGLE";
  if (n === 3) return "LOWER_FRICTION";
  return "CLOSE_LOOP";
}

/**
 * Scans a case's text fields for deterministic lexicon signals and computes the
 * default attempt band. This never decides anything by itself (DL-03) — it only
 * surfaces flags for the Rescue Desk and the prompt's "desk_check" block.
 */
export function precheck(input: CaseInput): Precheck {
  const signals: PrecheckSignal[] = [
    ...scan(input.leadMessages, "lead", [...LEAD_SIGNAL_CATEGORIES, ...INJECTION_CATEGORIES]),
    ...scan(input.userMessages, "user", [...USER_SIGNAL_CATEGORIES, ...INJECTION_CATEGORIES]),
    ...scan(input.notes, "notes", [...USER_SIGNAL_CATEGORIES, ...INJECTION_CATEGORIES]),
  ];

  return {
    signals,
    attemptBand: attemptBandFor(input.attempts),
  };
}
