/**
 * Optional redaction of contact details, and name pseudonymization (design §10.7).
 */

import type { CaseInput } from "./types.js";

// Exported for `src/validate.ts`'s `E_INVENTED_LINK` check, which scans a drafted message for
// contact details not present in the case, reusing exactly the patterns `redact()` itself matches.
export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

// PH: "+63 917 123 4567", "0917-123-4567". US: "(555) 123-4567", "555-123-4567".
export const PHONE_RE =
  /(\+63[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4})|(\b0\d{3}[\s-]?\d{3}[\s-]?\d{4}\b)|(\(\d{3}\)\s?\d{3}[\s-]?\d{4})|(\b\d{3}[.-]\d{3}[.-]\d{4}\b)/g;

/** Replaces emails with `[email]`, PH/US-style phone numbers with `[phone]`, and URLs with `[link]`. */
export function redact(text: string): string {
  return text.replace(EMAIL_RE, "[email]").replace(URL_RE, "[link]").replace(PHONE_RE, "[phone]");
}

function escapeToken(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A case-insensitive, whole-word (Unicode-aware), global regex matching `name` exactly. */
function wholeWordNameRegex(name: string): RegExp {
  const pattern = name
    .trim()
    .split(/\s+/)
    .map(escapeToken)
    .join("\\s+");
  return new RegExp(`\\b${pattern}\\b`, "giu");
}

type NameToken = "[LEAD]" | "[ME]" | "[BUSINESS]";

function nameEntries(names: CaseInput["names"]): Array<[string, NameToken]> {
  const entries: Array<[string, NameToken]> = [];
  if (names.lead.trim()) entries.push([names.lead.trim(), "[LEAD]"]);
  if (names.me.trim()) entries.push([names.me.trim(), "[ME]"]);
  if (names.business.trim()) entries.push([names.business.trim(), "[BUSINESS]"]);
  // Longest name first, so "Ana Cruz" is replaced before a later "Ana".
  entries.sort((a, b) => b[0].length - a[0].length);
  return entries;
}

/**
 * Replaces occurrences of the lead's, the user's and the business's names with
 * `[LEAD]`, `[ME]` and `[BUSINESS]`. Matching is whole-word and case-insensitive;
 * the longest name is replaced first, so "Ana Cruz" doesn't leave a dangling
 * "Cruz" once "Ana" alone has been substituted, and "Banana" is left untouched
 * when the name is "Ana".
 */
export function pseudonymize(text: string, names: CaseInput["names"]): string {
  let result = text;
  for (const [name, token] of nameEntries(names)) {
    result = result.replace(wholeWordNameRegex(name), token);
  }
  return result;
}

/** Reverses {@link pseudonymize}: replaces `[LEAD]`/`[ME]`/`[BUSINESS]` back with the real names. */
export function restoreNames(text: string, names: CaseInput["names"]): string {
  let result = text;
  for (const [name, token] of nameEntries(names)) {
    result = result.split(token).join(name);
  }
  return result;
}

/**
 * Applies a case's own privacy settings to a block of case text, in the
 * order the Desk applies them before a model ever sees it (design §10.7):
 * optional contact-detail redaction, then optional name pseudonymization
 * (only when at least one name was given). Shared by `buildCaseBlock`
 * (`src/prompt.ts`) and `groundingText` (`src/grounding.ts`) so that
 * grounding always checks quotes against exactly what the model saw.
 */
export function prepareCaseText(text: string, input: Pick<CaseInput, "redact" | "names">): string {
  let result = text;
  if (input.redact) result = redact(result);
  const hasNames = input.names.lead.trim() !== "" || input.names.me.trim() !== "" || input.names.business.trim() !== "";
  if (hasNames) result = pseudonymize(result, input.names);
  return result;
}
