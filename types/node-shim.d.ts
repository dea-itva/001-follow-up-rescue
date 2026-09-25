/**
 * Minimal ambient declarations for the handful of Node built-ins used by
 * `playwright.config.ts`, `tests/ui/*.spec.ts` and `eval/run.ts`.
 *
 * No `@types/node` dependency (design §13's pinned devDependency list has
 * none), matching the convention already used in `tests/*.test.ts`
 * (`declare const console: …`). These are intentionally narrow: only the
 * members actually called anywhere in this repo.
 */

declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  argv: string[];
  exitCode: number | undefined;
};

declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function writeFileSync(path: string, data: string): void;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}

declare module "node:path" {
  export function dirname(p: string): string;
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function isAbsolute(p: string): boolean;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}
