/**
 * Builds the repair / fix-it prompt (design §9.8) and the "please finish"
 * prompt for a truncated answer.
 */

import type { ValidationReport, Violation } from "./types.js";

function describeViolation(v: Violation, index: number): string {
  const suffix = v.found ? ` Found: "${v.found}"` : "";
  return `${index + 1}. [${v.code}] ${v.message}${suffix}`;
}

/**
 * Builds the repair prompt for a report with one or more errors (design
 * §9.8). Returns `null` when there are no errors — a warnings-only report
 * needs no repair round.
 */
export function buildRepairPrompt(report: ValidationReport): string | null {
  if (report.errors.length === 0) return null;

  const lines = [
    "Your previous Lead Follow-Up Rescue answer broke these rules:",
    ...report.errors.map(describeViolation),
    "Rewrite the complete answer in the same format (card, then JSON). Keep everything that was correct.",
    "Do not add facts that are not in the case. If you believe a flagged item is not a violation (for example,",
    '"don\'t text me, email instead" is a channel preference, not a stop request), keep it and explain in',
    '"rejectedAssumptions".',
  ];
  return lines.join("\n");
}

/** The "please finish" prompt for a `TRUNCATED` answer (design §9.1 step 2, §10.6 `invalid_json`/`empty_completion`). */
export function buildFinishPrompt(): string {
  return [
    "Your last answer was cut off before it finished.",
    "Please continue and complete the answer in the exact same format (card, then the JSON block between",
    "LFR_JSON_START and LFR_JSON_END), starting again from the beginning so the whole answer is valid on its own.",
    "Do not add any new facts, and do not explain — just the complete answer.",
  ].join("\n");
}
