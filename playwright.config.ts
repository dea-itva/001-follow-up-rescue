import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const DEFAULT_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = process.env.PW_CHROMIUM ?? (existsSync(DEFAULT_CHROMIUM) ? DEFAULT_CHROMIUM : undefined);

export default defineConfig({
  testDir: "tests/ui",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  reporter: [["list"]],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
});
