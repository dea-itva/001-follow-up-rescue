import type { CaseInput, Facts } from "../src/types.js";

/** A fully-populated, all-defaults `CaseInput`, for tests to override selectively. */
export function baseCaseInput(overrides: Partial<CaseInput> = {}): CaseInput {
  const base: CaseInput = {
    today: "2026-09-24",
    timezone: "Asia/Manila",
    scenario: null,
    channel: "EMAIL",
    leadMessages: "",
    userMessages: "",
    notes: "",
    attempts: null,
    owed: { answer: null, text: "" },
    stop: { answer: null, words: "" },
    timeframe: { answer: null, words: "", date: null, vagueStatus: null },
    deadline: { answer: null, what: "", date: null, whose: null },
    newInfo: { text: "", linked: null, linkedWords: "" },
    closeLoopSent: null,
    lastLeadMessageDate: null,
    lastUserMessageDate: null,
    originalSubject: "",
    desiredOutcome: null,
    language: "MATCH",
    tone: "WARM",
    leadCountry: null,
    names: { lead: "", me: "", business: "" },
    complianceFooter: true,
    redact: true,
  };
  return { ...base, ...overrides };
}

/** A fully-populated, all-defaults `Facts`, for tests to override selectively. */
export function baseFacts(overrides: Partial<Facts> = {}): Facts {
  const base: Facts = {
    today: "2026-09-24",
    scope: "IN_SCOPE",
    scenario: null,
    channel: null,
    attempts: null,
    attemptsRange: null,
    closeLoopSent: false,
    hardStop: null,
    notRightNow: null,
    owedResponse: null,
    commitment: null,
    deadline: null,
    reason: null,
    newInfo: null,
    tooSoon: false,
    intentEvidence: [],
    userAssumptions: [],
    pressure: [],
    desiredOutcome: null,
  };
  return { ...base, ...overrides };
}
