#!/usr/bin/env node
/**
 * Generates src/generated/prompts.ts from the prompt source files (design §7,
 * §13). Reads prompt/lead-follow-up-rescue.md (FULL) and
 * prompt/lead-follow-up-rescue.compact.md (COMPACT), and writes a TypeScript
 * module exporting each as a string constant plus its character count. Uses
 * "" for a file that does not (yet) exist, so this can run while the prompt
 * files are still being written.
 *
 * Usage: node scripts/gen-prompts.mjs   (also: npm run gen:prompts)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function readOrEmpty(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const fullPath = join(root, "prompt", "lead-follow-up-rescue.md");
const compactPath = join(root, "prompt", "lead-follow-up-rescue.compact.md");

const full = readOrEmpty(fullPath);
const compact = readOrEmpty(compactPath);

const outDir = join(root, "src", "generated");
mkdirSync(outDir, { recursive: true });

const contents = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by \`scripts/gen-prompts.mjs\` from:
 *   prompt/lead-follow-up-rescue.md          (FULL)
 *   prompt/lead-follow-up-rescue.compact.md  (COMPACT)
 *
 * Run \`npm run gen:prompts\` to regenerate (design §7.1, §13). A missing
 * source file is embedded as an empty string rather than failing the build.
 */

export const ENGINE_PROMPT = ${JSON.stringify(full)};
export const ENGINE_PROMPT_CHARS = ${full.length};

export const COMPACT_PROMPT = ${JSON.stringify(compact)};
export const COMPACT_PROMPT_CHARS = ${compact.length};
`;

writeFileSync(join(outDir, "prompts.ts"), contents, "utf8");

console.log(
  `Wrote src/generated/prompts.ts — ENGINE_PROMPT: ${full.length} chars, COMPACT_PROMPT: ${compact.length} chars` +
    (full.length === 0 ? " (prompt/lead-follow-up-rescue.md not found or empty)" : "") +
    (compact.length === 0 ? " (prompt/lead-follow-up-rescue.compact.md not found or empty)" : ""),
);
