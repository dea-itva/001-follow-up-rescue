/**
 * Public API of the Lead Follow-Up Rescue deterministic core (design §3.3).
 *
 * Phase P1a (this file, as it stands): types, dates, sanitize, lexicon,
 * precheck, facts, engine, grounding, redact. Phase P1b adds parse.ts,
 * validate.ts, repair.ts and prompt.ts and extends these exports.
 */

export * from "./types.js";
export * from "./dates.js";
export * from "./sanitize.js";
export * from "./lexicon.js";
export * from "./precheck.js";
export * from "./facts.js";
export * from "./engine.js";
export * from "./grounding.js";
export * from "./redact.js";
