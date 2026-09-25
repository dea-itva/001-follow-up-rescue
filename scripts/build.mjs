#!/usr/bin/env node
/**
 * Builds the Rescue Desk (design §10.9, §13):
 *
 *   1. Regenerates src/generated/prompts.ts from prompt/*.md (scripts/gen-prompts.mjs).
 *   2. Bundles wrapper/app.ts as a minified IIFE with esbuild.
 *   3. Inlines the bundled CSS and JS into wrapper/index.template.html and writes:
 *        - dist/lead-follow-up-rescue.html  (a full standalone document)
 *        - dist/artifact.html               (the same page as an artifact-contract fragment)
 *   4. Copies prompt/*.md to dist/prompt/.
 *   5. Regenerates skill/lead-follow-up-rescue/SKILL.md (frontmatter kept, body = FULL prompt).
 *   6. Bundles eval/run.ts (if present) to dist/eval.mjs.
 *
 * Usage: node scripts/build.mjs   (also: npm run build)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function log(msg) {
  console.log(`[build] ${msg}`);
}

// ---------------------------------------------------------------------------
// 1. Regenerate src/generated/prompts.ts
// ---------------------------------------------------------------------------

log("running scripts/gen-prompts.mjs");
execFileSync(process.execPath, [join(root, "scripts", "gen-prompts.mjs")], { stdio: "inherit" });

// ---------------------------------------------------------------------------
// 2. Bundle wrapper/app.ts (IIFE, minified)
// ---------------------------------------------------------------------------

log("bundling wrapper/app.ts");
const appResult = await esbuild.build({
  entryPoints: [join(root, "wrapper", "app.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  write: false,
  logLevel: "warning",
});
const appJs = appResult.outputFiles[0].text;

// ---------------------------------------------------------------------------
// 3. Assemble dist/lead-follow-up-rescue.html and dist/artifact.html
// ---------------------------------------------------------------------------

const css = readFileSync(join(root, "wrapper", "styles.css"), "utf8");
const template = readFileSync(join(root, "wrapper", "index.template.html"), "utf8");

const BODY_MARKER = "<!--__BODY_START__-->";
const markerIndex = template.indexOf(BODY_MARKER);
if (markerIndex < 0) {
  throw new Error("wrapper/index.template.html is missing the <!--__BODY_START__--> marker");
}

let headPart = template.slice(0, markerIndex);
let bodyPart = template.slice(markerIndex + BODY_MARKER.length);

if (!headPart.includes("/*__STYLES__*/")) {
  throw new Error("wrapper/index.template.html is missing the /*__STYLES__*/ placeholder before the body marker");
}
if (!bodyPart.includes("/*__SCRIPT__*/")) {
  throw new Error("wrapper/index.template.html is missing the /*__SCRIPT__*/ placeholder after the body marker");
}

headPart = headPart.replace("/*__STYLES__*/", () => css);
bodyPart = bodyPart.replace("/*__SCRIPT__*/", () => appJs);

headPart = headPart.trim();
bodyPart = bodyPart.trim();

const distDir = join(root, "dist");
mkdirSync(distDir, { recursive: true });

// dist/artifact.html: the artifact-contract fragment. No doctype/html/head/body —
// starts with <title>, then font links, then <style>, then markup and script (design §10.9).
const artifactHtml = `${headPart}\n${bodyPart}\n`;
writeFileSync(join(distDir, "artifact.html"), artifactHtml, "utf8");
log(`wrote dist/artifact.html (${Buffer.byteLength(artifactHtml, "utf8").toLocaleString()} bytes)`);

// dist/lead-follow-up-rescue.html: a full standalone document.
const fullHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${headPart}
</head>
<body>
${bodyPart}
</body>
</html>
`;
writeFileSync(join(distDir, "lead-follow-up-rescue.html"), fullHtml, "utf8");
log(`wrote dist/lead-follow-up-rescue.html (${Buffer.byteLength(fullHtml, "utf8").toLocaleString()} bytes)`);

// ---------------------------------------------------------------------------
// 4. Copy prompt/*.md to dist/prompt/
// ---------------------------------------------------------------------------

const promptSrcDir = join(root, "prompt");
const promptDistDir = join(distDir, "prompt");
mkdirSync(promptDistDir, { recursive: true });
if (existsSync(promptSrcDir)) {
  for (const name of readdirSync(promptSrcDir)) {
    if (!name.endsWith(".md")) continue;
    writeFileSync(join(promptDistDir, name), readFileSync(join(promptSrcDir, name)), null);
  }
  log(`copied prompt/*.md to dist/prompt/`);
}

// ---------------------------------------------------------------------------
// 5. Regenerate skill/lead-follow-up-rescue/SKILL.md
// ---------------------------------------------------------------------------

const skillPath = join(root, "skill", "lead-follow-up-rescue", "SKILL.md");
const fullPromptPath = join(promptSrcDir, "lead-follow-up-rescue.md");

function extractFrontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return match ? match[0] : null;
}

if (existsSync(skillPath) && existsSync(fullPromptPath)) {
  const existingSkill = readFileSync(skillPath, "utf8");
  const frontmatter = extractFrontmatter(existingSkill) ??
    "---\nname: lead-follow-up-rescue\ndescription: Use when deciding the next step for one warm lead who has gone quiet, or drafting a follow-up message for them, so the decision follows a fixed procedure instead of guesswork.\n---\n";
  const fullPrompt = readFileSync(fullPromptPath, "utf8");
  const generatedComment =
    "<!-- Generated from prompt/lead-follow-up-rescue.md by scripts/build.mjs; edit the source, not this file. -->\n";
  const skillMd = `${frontmatter}\n${generatedComment}\n${fullPrompt.trimEnd()}\n`;
  mkdirSync(dirname(skillPath), { recursive: true });
  writeFileSync(skillPath, skillMd, "utf8");
  log(`wrote ${skillPath.replace(root + "/", "")} (${skillMd.length.toLocaleString()} chars)`);
} else {
  log("skipping SKILL.md regeneration: skill file or prompt/lead-follow-up-rescue.md not found");
}

// ---------------------------------------------------------------------------
// 6. Bundle eval/run.ts (optional; owned by another worker)
// ---------------------------------------------------------------------------

const evalEntry = join(root, "eval", "run.ts");
if (existsSync(evalEntry)) {
  log("bundling eval/run.ts");
  await esbuild.build({
    entryPoints: [evalEntry],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "es2022",
    outfile: join(distDir, "eval.mjs"),
    logLevel: "warning",
  });
  log("wrote dist/eval.mjs");
} else {
  log("WARNING: eval/run.ts not found; skipping dist/eval.mjs (owned by another worker)");
}

log("build complete");
