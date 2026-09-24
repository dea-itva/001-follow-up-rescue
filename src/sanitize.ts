/**
 * Strips invisible Unicode that can hide prompt-injection payloads or corrupt
 * grounding comparisons (design §7.4 step 1, §9.1 step 1).
 *
 * Removed:
 *  - the byte-order mark (U+FEFF)
 *  - zero-width characters (U+200B ZWSP, U+200C ZWNJ, U+200D ZWJ, U+2060 word joiner)
 *  - bidi control characters U+202A–U+202E and U+2066–U+2069
 *  - the Unicode tag block U+E0000–U+E007F
 */

// eslint-disable-next-line no-misleading-character-class -- intentionally matches invisible code points
const INVISIBLE_RE = /[​-‍⁠﻿‪-‮⁦-⁩]|[\u{E0000}-\u{E007F}]/gu;

/** Removes invisible/control characters that could hide instructions or break exact-match grounding. */
export function stripInvisible(text: string): string {
  return text.replace(INVISIBLE_RE, "");
}

/**
 * Full sanitize pass used before building the case block or before parsing an AI answer:
 * strips invisible characters, replaces NBSP with a normal space, and normalizes line endings to `\n`.
 */
export function sanitize(text: string): string {
  return stripInvisible(text)
    .replace(/ /g, " ")
    .replace(/\r\n?/g, "\n");
}
