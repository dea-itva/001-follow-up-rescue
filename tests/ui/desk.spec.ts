/**
 * UI smoke tests for the Rescue Desk (design §10, TEST_PLAN §9).
 *
 * Runs against dist/lead-follow-up-rescue.html via file://. Build first
 * (`npm run build`), then `npm run test:ui`.
 *
 * No `@types/node` dependency: `process` is declared ambiently in
 * types/node-shim.d.ts (matches the convention in tests/*.test.ts).
 */

import { expect, test, type Page } from "@playwright/test";

const DIST_PATH = `${process.cwd()}/dist/lead-follow-up-rescue.html`;
const DIST_URL = `file://${DIST_PATH}`;

async function gotoDesk(page: Page): Promise<void> {
  await page.goto(DIST_URL);
  await expect(page.locator("#slipDecisionCode")).not.toHaveText("");
}

// ---------------------------------------------------------------------------
// Fixture-derived answers (design TEST_PLAN §3.3; tests/fixtures/integrity.json OI-004)
// ---------------------------------------------------------------------------

const D03_GOOD_ANSWER = `DECISION: FOLLOW_UP (Follow up)
TIMING: Now
REASON: You sent the proposal on Sept 14 and followed up once on Sept 17 with no reply. After one unanswered follow-up the next step is a normal follow-up tied to the pending proposal.
ACTION: Reply in the same email thread with the message below.
MESSAGE:
\`\`\`text
Hi Ana,

I'd like to make the bookkeeping proposal easy to decide on. If a short walkthrough would help, would Tuesday or Wednesday afternoon work for 10 minutes?

Best,
[Your name] · [Business name]
[Business postal address]
If you'd prefer not to hear from me again, just reply "stop" and I won't contact you further.
\`\`\`
NO-RESPONSE PLAN: If there's no reply, the next step is a different angle (not another reminder), after a few business days.
DO NOT DO:
- Don't send 'just checking in'.
- Don't mention how many times you've followed up.
STOP ACTIVE FOLLOW-UP: No
MISSING INFORMATION: None

LFR_JSON_START
\`\`\`json
{
  "lfr": "1.0",
  "decision": "FOLLOW_UP",
  "interaction": "SEQUENCE",
  "timing": { "mode": "NOW", "date": null, "note": "A week has passed since your follow-up on Sept 17. Sending today is reasonable (typical practice: 2–3 business days between follow-ups)." },
  "reason": "You sent the proposal on Sept 14 and followed up once on Sept 17 with no reply. After one unanswered follow-up the next step is a normal follow-up tied to the pending proposal.",
  "contactReason": "The proposal Ana asked for is still waiting for her decision.",
  "action": "Reply in the same email thread with the message below.",
  "message": { "channel": "EMAIL", "subject": null, "body": "Hi Ana,\\n\\nI'd like to make the bookkeeping proposal easy to decide on. If a short walkthrough would help, would Tuesday or Wednesday afternoon work for 10 minutes?\\n\\nBest,\\n[Your name] · [Business name]\\n[Business postal address]\\nIf you'd prefer not to hear from me again, just reply \\"stop\\" and I won't contact you further." },
  "cta": { "text": "If a short walkthrough would help, would Tuesday or Wednesday afternoon work for 10 minutes?", "type": "CHOOSE_ONE" },
  "angle": null,
  "noResponsePlan": "If there's no reply, the next step is a different angle (not another reminder), after a few business days.",
  "doNotDo": ["Don't send 'just checking in'.", "Don't mention how many times you've followed up."],
  "stopActiveFollowUp": false,
  "suppression": "NONE",
  "missingInformation": [],
  "facts": { "scope": "IN_SCOPE", "scenario": "PROPOSAL_SENT", "channel": "EMAIL", "attempts": 1, "attemptsRange": null, "closeLoopSent": false, "hardStop": null, "notRightNow": null, "owedResponse": null, "commitment": null, "deadline": null, "reason": { "type": "PENDING_PROPOSAL", "text": "Proposal sent Sept 14" }, "newInfo": null, "tooSoon": false },
  "evidence": [],
  "rejectedAssumptions": []
}
\`\`\`
LFR_JSON_END`;

const OI004_BAD_ANSWER = `DECISION: CLOSE_LOOP (Close the loop)
TIMING: Now
REASON: Four follow-ups with no reply and no new reason to keep chasing. Time to close the loop.
ACTION: Send the closing message below, then stop following up.
MESSAGE:
\`\`\`text
Hi Ana,

Should I close your file?

Best,
[Your name]
\`\`\`
NO-RESPONSE PLAN: No further follow-up.
DO NOT DO:
- Don't ask if they're still interested.
- Don't promise to check back later.
STOP ACTIVE FOLLOW-UP: Yes
MISSING INFORMATION: None

LFR_JSON_START
\`\`\`json
{
  "lfr": "1.0",
  "decision": "CLOSE_LOOP",
  "interaction": "SEQUENCE",
  "timing": { "mode": "NOW", "date": null, "note": null },
  "reason": "Four follow-ups with no reply and no new reason to keep chasing. Time to close the loop.",
  "contactReason": null,
  "action": "Send the closing message below, then stop following up.",
  "message": { "channel": "EMAIL", "subject": null, "body": "Hi Ana,\\n\\nShould I close your file?\\n\\nBest,\\n[Your name]" },
  "cta": null,
  "angle": null,
  "noResponsePlan": "No further follow-up.",
  "doNotDo": ["Don't ask if they're still interested.", "Don't promise to check back later."],
  "stopActiveFollowUp": true,
  "suppression": "NONE",
  "missingInformation": [],
  "facts": { "scope": "IN_SCOPE", "scenario": "PROPOSAL_SENT", "channel": "EMAIL", "attempts": 4, "attemptsRange": null, "closeLoopSent": false, "hardStop": null, "notRightNow": null, "owedResponse": null, "commitment": null, "deadline": null, "reason": null, "newInfo": null, "tooSoon": false },
  "evidence": [],
  "rejectedAssumptions": []
}
\`\`\`
LFR_JSON_END`;

// ---------------------------------------------------------------------------
// 1. Opens in a working state
// ---------------------------------------------------------------------------

test("1. opens in a working state: example badge, FOLLOW_UP slip, rung 1", async ({ page }) => {
  await gotoDesk(page);
  await expect(page.locator("#exampleBadge")).toBeVisible();
  await expect(page.locator("#slipDecisionCode")).toHaveText("FOLLOW_UP");
  await expect(page.locator('.rung[data-rung="1"]')).toHaveClass(/is-current/);
});

// ---------------------------------------------------------------------------
// 2. Attempts = 4 -> CLOSE_LOOP, rung 4+
// ---------------------------------------------------------------------------

test("2. follow-ups = 4 shows CLOSE_LOOP and highlights rung 4+", async ({ page }) => {
  await gotoDesk(page);
  await page.locator("#attempts-4").check();
  await expect(page.locator("#slipDecisionCode")).toHaveText("CLOSE_LOOP");
  await expect(page.locator('.rung[data-rung="4"]')).toHaveClass(/is-current/);
});

// ---------------------------------------------------------------------------
// 3. Hard stop -> STOP, no message
// ---------------------------------------------------------------------------

test("3. 'they asked me to stop' shows STOP with no message needed", async ({ page }) => {
  await gotoDesk(page);
  await page.locator("#stop-optout").check();
  await page.locator("#stopWords").fill("please stop contacting me");
  await expect(page.locator("#slipDecisionCode")).toHaveText("STOP_ACTIVE_FOLLOW_UP");
  await expect(page.locator("#slipMessageState")).toHaveText(/No message needed/);
});

// ---------------------------------------------------------------------------
// 4. Scenario not-now + exact future date -> WAIT until that date
// ---------------------------------------------------------------------------

test("4. not-now with an exact future date shows WAIT until that date", async ({ page }) => {
  await gotoDesk(page);
  await page.locator("#scenario-NOT_RIGHT_NOW").check();
  await page.locator("#timeframe-exact").check();
  await page.locator("#timeframeDate").fill("2027-01-15");
  await expect(page.locator("#slipDecisionCode")).toHaveText("WAIT");
  await expect(page.locator("#ladderCaption")).toContainText("2027-01-15");
});

// ---------------------------------------------------------------------------
// 5. Copy prompt: clipboard contents + AI links have no query string
// ---------------------------------------------------------------------------

test("5. copy prompt copies the full case and shows query-string-free AI links", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoDesk(page);
  await page.locator("#copyPromptBtn").click();

  const clipboardText: string = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("engine prompt v1.0.0");
  // "today" is the viewer's LOCAL date, not the UTC date.
  const localToday: string = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  });
  expect(clipboardText).toContain(`today: ${localToday}`);
  expect(clipboardText).toContain("output: card-and-json");
  // Their words are embedded as a JSON string (design §7.4).
  expect(clipboardText).toContain(JSON.stringify("Thanks! Please send the proposal over and I'll take a look."));
  // Names are given in the example case, so pseudonymization replaces "Ana" with "[LEAD]"
  // (design §10.7) before the text is embedded in the case block.
  // Check the case block only: the engine prompt's own worked example mentions "Ana".
  const caseBlock = clipboardText.slice(clipboardText.lastIndexOf("<case>"));
  expect(caseBlock).toContain("Hi [LEAD], here's the bookkeeping proposal");
  expect(caseBlock).not.toContain("Ana");

  for (const id of ["#linkChatGPT", "#linkClaude", "#linkGemini", "#linkCopilot"]) {
    const href = await page.locator(id).getAttribute("href");
    expect(href).not.toBeNull();
    expect(href as string).not.toContain("?");
  }
});

// ---------------------------------------------------------------------------
// 6. Check an answer: D-03 good output
// ---------------------------------------------------------------------------

test("6. checking the D-03 good answer shows Ready to send with Copy message and highlighted placeholders", async ({ page }) => {
  await gotoDesk(page);
  await page.locator("#answerInput").fill(D03_GOOD_ANSWER);
  await expect(page.locator("#resultCard")).toBeVisible();
  await expect(page.locator("#resultStatus")).toHaveText("Ready to send");
  await expect(page.locator("#copyMessageBtn")).toBeVisible();
  await expect(page.locator("#resultMessageBody mark").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// 7. Check an answer: OI-004 bad output
// ---------------------------------------------------------------------------

test("7. checking the OI-004 bad answer lists E_CLOSE_LOOP_CTA and offers Copy fix-it prompt", async ({ page }) => {
  await gotoDesk(page);
  await page.locator("#answerInput").fill(OI004_BAD_ANSWER);
  await expect(page.locator("#resultCard")).toBeVisible();
  await expect(page.locator('#resultChecks li[data-code="E_CLOSE_LOOP_CTA"]')).toBeVisible();
  await expect(page.locator("#copyFixItBtn")).toBeVisible();
});

// ---------------------------------------------------------------------------
// 8. Claude mode (mocked)
// ---------------------------------------------------------------------------

test("8a. Run with Claude appears when window.claude.use resolves sample", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { claude: unknown }).claude = {
      use: async (name: string) => (name === "sample" ? async () => ({ text: "ok", truncated: false }) : null),
    };
  });
  await gotoDesk(page);
  await expect(page.locator("#runClaudeBtn")).toBeVisible();
});

test("8b. bad-then-good mock answer takes exactly 2 calls and ends valid", async ({ page }) => {
  const goodAnswer = D03_GOOD_ANSWER;
  const badAnswer = OI004_BAD_ANSWER;

  await page.addInitScript(
    ({ bad, good }) => {
      let calls = 0;
      (window as unknown as { claude: unknown; __sampleCalls: number }).__sampleCalls = 0;
      (window as unknown as { claude: unknown }).claude = {
        use: async (name: string) => {
          if (name !== "sample") return null;
          return async () => {
            calls += 1;
            (window as unknown as { __sampleCalls: number }).__sampleCalls = calls;
            return { text: calls === 1 ? bad : good, truncated: false };
          };
        },
      };
    },
    { bad: badAnswer, good: goodAnswer },
  );

  await gotoDesk(page);
  await expect(page.locator("#runClaudeBtn")).toBeVisible();
  await page.locator("#runClaudeBtn").click();
  await expect(page.locator("#resultCard")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#resultStatus")).toHaveText("Ready to send", { timeout: 10000 });

  const calls: number = await page.evaluate(() => (window as unknown as { __sampleCalls: number }).__sampleCalls);
  expect(calls).toBe(2);
});

test("8c. sample rejecting not_granted hides the button and shows the copy path", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { claude: unknown }).claude = {
      use: async (name: string) => {
        if (name !== "sample") return null;
        return async () => {
          const err = { code: "not_granted", message: "not granted" };
          throw err;
        };
      },
    };
  });
  await gotoDesk(page);
  await expect(page.locator("#runClaudeBtn")).toBeVisible();
  await page.locator("#runClaudeBtn").click();
  await expect(page.locator("#runClaudeBtn")).toBeHidden();
  await expect(page.locator("#claudeUnavailableNote")).toBeVisible();
});

// ---------------------------------------------------------------------------
// 9. Dark mode
// ---------------------------------------------------------------------------

test("9. dark mode follows the OS scheme; data-theme=light forces light", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await gotoDesk(page);
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBg).toBe("rgb(13, 18, 24)"); // #0D1218

  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(lightBg).toBe("rgb(243, 246, 249)"); // #F3F6F9
});

// ---------------------------------------------------------------------------
// 10. Phone width
// ---------------------------------------------------------------------------

test("10. phone width 390px has no horizontal scroll and a visible sticky bottom bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await gotoDesk(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(overflow).toBe(true);
  await expect(page.locator("#stickyBar")).toBeVisible();
});

// ---------------------------------------------------------------------------
// 11. No unexpected network
// ---------------------------------------------------------------------------

test("11. no network requests beyond Google Fonts", async ({ page }) => {
  const disallowed: string[] = [];
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "file:") {
      route.continue();
      return;
    }
    if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
      route.abort(); // allowed hosts, but we still don't need to actually fetch fonts for this test
      return;
    }
    disallowed.push(url.href);
    route.abort();
  });
  await gotoDesk(page);
  await page.waitForTimeout(500);
  expect(disallowed).toEqual([]);
});

// ---------------------------------------------------------------------------
// 12. XSS guard
// ---------------------------------------------------------------------------

test("12. pasted <img onerror> in Check an answer renders literally, no element is created", async ({ page }) => {
  await gotoDesk(page);
  const payload = `Some notes with <img src=x onerror=alert(1)> inline.`;
  await page.locator("#answerInput").fill(payload);
  const imgCount = await page.locator("#resultCard img").count();
  expect(imgCount).toBe(0);
  const hasAlertFired = await page.evaluate(() => (window as unknown as { __xssFired?: boolean }).__xssFired === true);
  expect(hasAlertFired).toBe(false);
});

// ---------------------------------------------------------------------------
// 13. Storage failure tolerance
// ---------------------------------------------------------------------------

test("13. the page still renders and works when localStorage throws", async ({ page }) => {
  await page.addInitScript(() => {
    const throwingStorage: Storage = {
      length: 0,
      clear() {
        throw new Error("blocked");
      },
      getItem() {
        throw new Error("blocked");
      },
      key() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    Object.defineProperty(window, "localStorage", { value: throwingStorage, configurable: true });
  });
  await gotoDesk(page);
  await expect(page.locator("#slipDecisionCode")).toHaveText("FOLLOW_UP");
  await page.locator("#attempts-2").check();
  await expect(page.locator("#slipDecisionCode")).toHaveText("CHANGE_ANGLE");
});
