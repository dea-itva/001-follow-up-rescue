/**
 * Lead Follow-Up Rescue: Rescue Desk UI logic (design §10).
 *
 * Plain TypeScript and DOM, no framework. Bundled by scripts/build.mjs as an
 * IIFE and inlined into dist/lead-follow-up-rescue.html and dist/artifact.html.
 */

import {
  ENGINE_VERSION,
  PROMPT_VERSION,
  SCHEMA_VERSION,
  ENGINE_PROMPT,
  COMPACT_PROMPT,
  precheck,
  factsFromForm,
  decide,
  buildCaseBlock,
  buildFullPrompt,
  buildShortCase,
  checkAnswer,
  parseAnswer,
  buildRepairPrompt,
  buildFinishPrompt,
  restoreNames,
  type CaseInput,
  type Facts,
  type EngineResult,
  type ValidationReport,
  type Decision,
  type PrecheckSignal,
  type Violation,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Small DOM helpers
// ---------------------------------------------------------------------------

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`missing element #${id}`);
  return found as T;
}

function setText(node: Element, text: string): void {
  node.textContent = text;
}

function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function radioValue(name: string): string | null {
  const found = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return found ? found.value : null;
}

function setRadioValue(name: string, value: string | null): void {
  const nodes = document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
  nodes.forEach((node) => {
    node.checked = value !== null && node.value === value;
  });
}

function textValue(id: string): string {
  return (el<HTMLInputElement | HTMLTextAreaElement>(id)).value;
}

function setTextValue(id: string, value: string): void {
  (el<HTMLInputElement | HTMLTextAreaElement>(id)).value = value;
}

function checkboxValue(id: string): boolean {
  return el<HTMLInputElement>(id).checked;
}

function setCheckboxValue(id: string, value: boolean): void {
  el<HTMLInputElement>(id).checked = value;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const fallback = el<HTMLTextAreaElement>("clipboardFallback");
      fallback.value = text;
      fallback.hidden = false;
      fallback.style.position = "fixed";
      fallback.style.top = "0";
      fallback.style.left = "0";
      fallback.style.opacity = "0.01";
      fallback.focus();
      fallback.select();
      const ok = document.execCommand && document.execCommand("copy");
      fallback.blur();
      fallback.hidden = true;
      return !!ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Example case (design §10.2, matches fixture D-03)
// ---------------------------------------------------------------------------

/** Today's date in the viewer's own time zone (not UTC), as YYYY-MM-DD. */
function localToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function blankCaseInput(): CaseInput {
  return {
    today: localToday(),
    timezone: localTimezone(),
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
}

function exampleCaseInput(): CaseInput {
  const base = blankCaseInput();
  return {
    ...base,
    scenario: "PROPOSAL_SENT",
    channel: "EMAIL",
    leadMessages: "Thanks! Please send the proposal over and I'll take a look.",
    userMessages:
      "Hi Ana, here's the bookkeeping proposal for Casa Verde we talked about. Happy to walk you through it.\n\n" +
      "Hi Ana, just following up on the proposal I sent on Monday. Let me know if you have any questions.",
    notes: "Proposal sent Monday the 14th, followed up once on Thursday the 17th. Nothing back since.",
    attempts: 1,
    owed: { answer: "NO", text: "" },
    stop: { answer: "NO", words: "" },
    lastLeadMessageDate: "2026-09-11",
    lastUserMessageDate: "2026-09-17",
    originalSubject: "Bookkeeping proposal for Casa Verde",
    desiredOutcome: "GET_DECISION",
    leadCountry: "PH",
    names: { lead: "Ana", me: "", business: "" },
    complianceFooter: true,
    redact: true,
  };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const DRAFT_KEY = "lfr.draft.v1";

interface State {
  caseInput: CaseInput;
  isExample: boolean;
}

type SampleFn = (input: unknown, opts?: Record<string, unknown>) => Promise<{ text: string }>;

let state: State = { caseInput: exampleCaseInput(), isExample: true };
let sampleFn: SampleFn | null = null;

// ---------------------------------------------------------------------------
// Persistence (design §10.7): localStorage, wrapped in try/catch
// ---------------------------------------------------------------------------

function saveDraft(): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state.caseInput));
  } catch {
    // storage unavailable or full: the page still works without it.
  }
}

function loadDraft(): CaseInput | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CaseInput;
  } catch {
    return null;
  }
}

function forgetDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Form <-> CaseInput sync
// ---------------------------------------------------------------------------

function attemptsFromRadio(v: string | null): CaseInput["attempts"] {
  if (v === null) return null;
  if (v === "UNSURE") return "UNSURE";
  return Number(v);
}

function attemptsToRadio(v: CaseInput["attempts"]): string | null {
  if (v === null) return null;
  if (v === "UNSURE") return "UNSURE";
  return String(Math.min(v, 5));
}

function writeFormFromCaseInput(ci: CaseInput): void {
  setRadioValue("scenario", ci.scenario);
  setTextValue("leadMessages", ci.leadMessages);
  setRadioValue("attempts", attemptsToRadio(ci.attempts));
  setRadioValue("owedAnswer", ci.owed.answer);
  setTextValue("owedText", ci.owed.text);
  setRadioValue("stopAnswer", ci.stop.answer);
  setTextValue("stopWords", ci.stop.words);
  setRadioValue("timeframeAnswer", ci.timeframe.answer);
  setTextValue("timeframeWords", ci.timeframe.answer === "EXACT" ? ci.timeframe.words : "");
  setTextValue("timeframeVagueWords", ci.timeframe.answer === "VAGUE" ? ci.timeframe.words : "");
  setTextValue("timeframeDate", ci.timeframe.date ?? "");
  setRadioValue("vagueStatus", ci.timeframe.vagueStatus);
  setRadioValue("deadlineAnswer", ci.deadline.answer);
  setTextValue("deadlineWhat", ci.deadline.what);
  setTextValue("deadlineDate", ci.deadline.date ?? "");
  setRadioValue("deadlineWhose", ci.deadline.whose);
  setTextValue("newInfoText", ci.newInfo.text);
  setRadioValue("newInfoLinked", ci.newInfo.linked);
  setTextValue("newInfoLinkedWords", ci.newInfo.linkedWords);
  setCheckboxValue("closeLoopSent", ci.closeLoopSent === true);
  setTextValue("lastLeadMessageDate", ci.lastLeadMessageDate ?? "");
  setTextValue("lastUserMessageDate", ci.lastUserMessageDate ?? "");
  setTextValue("userMessages", ci.userMessages);
  setTextValue("originalSubject", ci.originalSubject);
  setRadioValue("desiredOutcome", ci.desiredOutcome);
  setRadioValue("channel", ci.channel);
  setRadioValue("language", ci.language);
  setRadioValue("tone", ci.tone);
  setTextValue("notes", ci.notes);
  setTextValue("nameLead", ci.names.lead);
  setTextValue("nameMe", ci.names.me);
  setTextValue("nameBusiness", ci.names.business);
  setRadioValue("leadCountry", ci.leadCountry);
  setCheckboxValue("complianceFooter", ci.complianceFooter);
  setCheckboxValue("redactToggle", ci.redact);
  updateConditionalVisibility();
  updateCharCount();
}

function readCaseInputFromForm(): CaseInput {
  const prev = state.caseInput;
  return {
    today: prev.today,
    timezone: prev.timezone,
    scenario: radioValue("scenario") as CaseInput["scenario"],
    channel: (radioValue("channel") as CaseInput["channel"]) ?? null,
    leadMessages: textValue("leadMessages"),
    userMessages: textValue("userMessages"),
    notes: textValue("notes"),
    attempts: attemptsFromRadio(radioValue("attempts")),
    owed: { answer: radioValue("owedAnswer") as CaseInput["owed"]["answer"], text: textValue("owedText") },
    stop: { answer: radioValue("stopAnswer") as CaseInput["stop"]["answer"], words: textValue("stopWords") },
    timeframe: {
      answer: radioValue("timeframeAnswer") as CaseInput["timeframe"]["answer"],
      words: radioValue("timeframeAnswer") === "VAGUE" ? textValue("timeframeVagueWords") : textValue("timeframeWords"),
      date: textValue("timeframeDate") || null,
      vagueStatus: radioValue("vagueStatus") as CaseInput["timeframe"]["vagueStatus"],
    },
    deadline: {
      answer: radioValue("deadlineAnswer") as CaseInput["deadline"]["answer"],
      what: textValue("deadlineWhat"),
      date: textValue("deadlineDate") || null,
      whose: radioValue("deadlineWhose") as CaseInput["deadline"]["whose"],
    },
    newInfo: {
      text: textValue("newInfoText"),
      linked: radioValue("newInfoLinked") as CaseInput["newInfo"]["linked"],
      linkedWords: textValue("newInfoLinkedWords"),
    },
    closeLoopSent: checkboxValue("closeLoopSent"),
    lastLeadMessageDate: textValue("lastLeadMessageDate") || null,
    lastUserMessageDate: textValue("lastUserMessageDate") || null,
    originalSubject: textValue("originalSubject"),
    desiredOutcome: radioValue("desiredOutcome") as CaseInput["desiredOutcome"],
    language: (radioValue("language") as CaseInput["language"]) ?? "MATCH",
    tone: (radioValue("tone") as CaseInput["tone"]) ?? "WARM",
    leadCountry: radioValue("leadCountry") as CaseInput["leadCountry"],
    names: { lead: textValue("nameLead"), me: textValue("nameMe"), business: textValue("nameBusiness") },
    complianceFooter: checkboxValue("complianceFooter"),
    redact: checkboxValue("redactToggle"),
  };
}

function updateConditionalVisibility(): void {
  const ci = state.caseInput;

  el("owedText").hidden = ci.owed.answer !== "YES" && ci.owed.answer !== "UNSURE";
  el("stopWords").hidden = ci.stop.answer !== "OPT_OUT" && ci.stop.answer !== "DECLINE";

  const wantsTimeframe =
    ci.scenario === "NOT_RIGHT_NOW" ||
    ci.scenario === "RECONNECT_DUE" ||
    /\b(after|next|later|soon|holidays|quarter|month|until|not until)\b/i.test(ci.leadMessages);
  const timeframeDetails = el<HTMLDetailsElement>("timeframeGroup");
  if (wantsTimeframe && !timeframeDetails.open) timeframeDetails.open = true;

  el("timeframeExactGroup").hidden = ci.timeframe.answer !== "EXACT";
  el("timeframeVagueGroup").hidden = ci.timeframe.answer !== "VAGUE";

  el("deadlineDetail").hidden = ci.deadline.answer !== "YES";

  const newInfoDetails = el<HTMLDetailsElement>("newInfoGroup");
  const attemptsNum = typeof ci.attempts === "number" ? ci.attempts : 0;
  if (attemptsNum >= 2 && !newInfoDetails.open) newInfoDetails.open = true;
  el("newInfoLinkedWords").hidden = ci.newInfo.linked !== "YES";

  el("field-closeLoopSent").hidden = attemptsNum < 4;

  el("field-complianceFooter").hidden = ci.channel !== "EMAIL";
  el("originalSubject").closest(".subfield")?.toggleAttribute("hidden", ci.channel !== "EMAIL");
}

function updateCharCount(): void {
  const len = state.caseInput.leadMessages.length;
  const node = el("leadMessagesCount");
  setText(node, `${len.toLocaleString()} / 12,000 characters${len > 6000 ? " (long — consider trimming)" : ""}`);
}

// ---------------------------------------------------------------------------
// Recompute pipeline (design §3.2): the local fast path
// ---------------------------------------------------------------------------

let recomputeTimer: ReturnType<typeof setTimeout> | null = null;
let lastFacts: Facts | null = null;
let lastEngine: EngineResult | null = null;

function scheduleRecompute(): void {
  if (recomputeTimer !== null) clearTimeout(recomputeTimer);
  recomputeTimer = setTimeout(recomputeNow, 150);
}

function recomputeNow(): void {
  recomputeTimer = null;
  state.caseInput = readCaseInputFromForm();
  updateConditionalVisibility();
  updateCharCount();
  if (!state.isExample) saveDraft();

  const pre = precheck(state.caseInput);
  const facts = factsFromForm(state.caseInput);
  const engineResult = decide(facts);
  lastFacts = facts;
  lastEngine = engineResult;

  renderPrecheckChips(pre.signals);
  renderLadder(state.caseInput.attempts, engineResult);
  renderSlip(engineResult);
  renderStickyBar(engineResult);
  updateSizeMeter();
}

// ---------------------------------------------------------------------------
// Decision vocabulary
// ---------------------------------------------------------------------------

const DECISION_NAMES: Record<Decision, string> = {
  RESPOND_NOW: "Respond now",
  WAIT: "Wait",
  FOLLOW_UP: "Follow up",
  CHANGE_ANGLE: "Change the angle",
  LOWER_FRICTION: "Make it easy",
  CLOSE_LOOP: "Close the loop",
  STOP_ACTIVE_FOLLOW_UP: "Stop following up",
  NEED_MISSING_INFORMATION: "Need more information",
  NEED_FOLLOW_UP_REASON: "Need a reason to follow up",
  OUT_OF_SCOPE: "Out of scope",
  DO_NOTHING: "Nothing to do",
};

type Family = "go" | "wait" | "stop" | "close" | "info";

const DECISION_FAMILY: Record<Decision, Family> = {
  RESPOND_NOW: "go",
  FOLLOW_UP: "go",
  CHANGE_ANGLE: "go",
  LOWER_FRICTION: "go",
  WAIT: "wait",
  STOP_ACTIVE_FOLLOW_UP: "stop",
  CLOSE_LOOP: "close",
  DO_NOTHING: "close",
  OUT_OF_SCOPE: "close",
  NEED_MISSING_INFORMATION: "info",
  NEED_FOLLOW_UP_REASON: "info",
};

const SIGNAL_LABELS: Record<string, string> = {
  OPT_OUT: "Stop request found",
  DECLINE: "Decline found",
  NRN: "“not right now” found",
  VAGUE_COMMITMENT: "Vague commitment",
  VAGUE_TIMING: "Vague timing word",
  VAGUE_URGENCY: "Not a real deadline",
  AUTO_REPLY: "Auto-reply detected",
  CHANNEL_PREFERENCE: "Channel preference, not a stop",
  USER_ASSUMPTION: "Unsupported assumption",
  USER_PRESSURE: "Internal pressure noted",
  DEAL_LABEL: "Deal label noted",
  MESSAGE_FIRST_REQUEST: "Message-first request",
  DISGUISE_REQUEST: "Disguise-the-follow-up request",
  INSTRUCTION_IN_DATA: "Possible instruction in pasted text",
};

function renderPrecheckChips(signals: PrecheckSignal[]): void {
  const container = el("precheckChips");
  clear(container);
  const deduped = new Map<string, PrecheckSignal>();
  for (const s of signals) deduped.set(`${s.category}:${s.matchedText}`, s);
  if (deduped.size === 0) {
    const none = document.createElement("span");
    none.className = "signal-none";
    setText(none, "Rescue check: nothing flagged in their words.");
    container.appendChild(none);
    return;
  }
  for (const s of deduped.values()) {
    const chip = document.createElement("span");
    chip.className = `signal-chip severity-${s.severity}`;
    setText(chip, `${SIGNAL_LABELS[s.category] ?? s.category}: “${s.matchedText}”`);
    container.appendChild(chip);
  }
}

const NORMAL_LADDER_DECISIONS = new Set<Decision>(["FOLLOW_UP", "CHANGE_ANGLE", "LOWER_FRICTION", "CLOSE_LOOP"]);

function ladderRungFor(attempts: CaseInput["attempts"]): number | null {
  if (attempts === null || attempts === "UNSURE") return null;
  return Math.min(attempts, 4);
}

function overrideCaption(engineResult: EngineResult): string {
  switch (engineResult.decision) {
    case "STOP_ACTIVE_FOLLOW_UP":
      return "Stopped: they said no, or asked to stop.";
    case "WAIT":
      return engineResult.waitUntil ? `Paused: wait until ${engineResult.waitUntil}.` : "Paused: they gave a timeframe.";
    case "RESPOND_NOW":
      return "They're waiting on you — reply first.";
    case "NEED_MISSING_INFORMATION":
      return "Need more information before deciding.";
    case "NEED_FOLLOW_UP_REASON":
      return "Need a reason before following up again.";
    case "OUT_OF_SCOPE":
      return "Out of scope for this tool.";
    case "DO_NOTHING":
      return "Nothing pending.";
    default:
      return "";
  }
}

function renderLadder(attempts: CaseInput["attempts"], engineResult: EngineResult): void {
  const ladder = el("ladder");
  const caption = el("ladderCaption");
  const rungs = ladder.querySelectorAll<HTMLElement>(".rung");
  const isNormal = NORMAL_LADDER_DECISIONS.has(engineResult.decision);
  const current = ladderRungFor(attempts);

  rungs.forEach((rung) => {
    const idx = Number(rung.dataset.rung);
    rung.classList.toggle("is-current", isNormal && current !== null && idx === current);
  });

  ladder.classList.toggle("dimmed", !isNormal);
  const captionText = isNormal ? "" : overrideCaption(engineResult);
  caption.hidden = captionText === "";
  setText(caption, captionText);
}

function attemptsPhrase(attempts: CaseInput["attempts"]): string {
  if (attempts === null || attempts === "UNSURE") return "some follow-ups";
  if (attempts === 0) return "no follow-ups yet";
  if (attempts === 1) return "one follow-up";
  return `${attempts >= 5 ? "5 or more" : attempts} follow-ups`;
}

/** Plain-language explanation of the gate that decided (design §6.1). */
function slipWhy(engineResult: EngineResult, ci: CaseInput): string {
  const since = attemptsPhrase(ci.attempts);
  const until = engineResult.waitUntil ? ` until ${formatDate(engineResult.waitUntil)}` : "";
  const rule = engineResult.rule;
  if (rule === "G0") return "This isn't a single warm lead, so it's outside what the Rescue covers.";
  if (rule === "G1") return "They said no or asked you to stop. That ends the chase, whatever else is going on.";
  if (rule === "G2") return "They asked for something you haven't answered yet. Reply before anything else.";
  if (rule === "G3a.future") return `They asked you to wait${until}. Don't contact them before then.`;
  if (rule === "G3a.untimed") return "They said not right now, with no timeframe. Stop chasing; don't invent a date to check back.";
  if (rule === "G3a.newReason") return "They said not right now, but something genuinely new answers what they needed. One message, then stop.";
  if (rule === "G3b.future") return `They said they'd get back to you${until}. Give them until then.`;
  if (rule === "G4") return "It's too soon to follow up. Give them time before sending anything.";
  if (rule === "G5.close") return `After ${since} with no reply, end the chase cleanly and politely.`;
  if (rule === "G5.alreadyClosed") return "You already closed the loop. There's nothing new, so there's nothing to send.";
  if (rule === "G5.newReason") return `After ${since}, only a genuinely new, relevant reason justifies one more message.`;
  if (rule === "G5.deadline") return `After ${since}, a real deadline that matters to them justifies one final message.`;
  if (rule === "G6.noReason") return "You'd be following up without a real reason. Find one first; 'checking in' isn't one.";
  if (rule === "G6.nothingPending") return "Nothing is pending and nothing is owed. No need to reach out.";
  if (rule === "G7.0") return "Nothing has been sent since your last message. One follow-up with a real reason is fine.";
  if (rule === "G7.1") return `You've sent ${since} with no reply. One more follow-up, tied to the pending item, is fine.`;
  if (rule === "G7.2") return `You've sent ${since} with no reply. Don't repeat yourself: try a genuinely different angle.`;
  if (rule === "G7.3") return `You've sent ${since} with no reply. Make it effortless to answer, then prepare to close.`;
  if (rule === "unknowns.scenario") return "Tell the Rescue what happened most recently before it can decide.";
  if (rule === "unknowns.nfr") return "There's no clear reason to contact them yet, and a detail is missing.";
  return "A missing detail would change the decision. Answer the question below.";
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  try {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  } catch {
    return iso;
  }
}

function renderSlip(engineResult: EngineResult): void {
  const slip = el("slip");
  slip.dataset.family = DECISION_FAMILY[engineResult.decision];
  setText(el("slipDecisionCode"), engineResult.decision);
  setText(el("slipDecisionName"), DECISION_NAMES[engineResult.decision]);
  setText(el("slipReason"), slipWhy(engineResult, state.caseInput));
  setText(
    el("slipMessageState"),
    engineResult.messageAllowed ? "Your AI will draft one message for this." : "No message needed. You don't need an AI for this step.",
  );

  const questionsBox = el("slipQuestions");
  clear(questionsBox);
  const isUnknownDecision = engineResult.decision === "NEED_MISSING_INFORMATION" || engineResult.decision === "NEED_FOLLOW_UP_REASON";
  if (isUnknownDecision && engineResult.questions.length > 0) {
    questionsBox.hidden = false;
    engineResult.questions.forEach((q, i) => {
      const row = document.createElement("div");
      row.className = "question-row";
      const label = document.createElement("span");
      setText(label, q);
      row.appendChild(label);
      questionsBox.appendChild(row);
    });
    const hint = document.createElement("p");
    hint.className = "hint";
    setText(hint, "Answer these in the form on the left to update the decision.");
    questionsBox.appendChild(hint);
  } else {
    questionsBox.hidden = true;
  }
}

function renderStickyBar(engineResult: EngineResult): void {
  const bar = el("stickyBar");
  bar.hidden = false;
  setText(el("stickyDecision"), DECISION_NAMES[engineResult.decision]);
}

// ---------------------------------------------------------------------------
// Prompt assembly + size meter
// ---------------------------------------------------------------------------

function currentPre() {
  return precheck(state.caseInput);
}

function buildFullPromptText(outputMode: "card-and-json" | "json-only"): string {
  const pre = currentPre();
  const engineResult = lastEngine ?? decide(factsFromForm(state.caseInput));
  const caseBlock = buildCaseBlock(state.caseInput, pre, engineResult, { output: outputMode });
  return buildFullPrompt(ENGINE_PROMPT, caseBlock);
}

function buildCompactPromptText(): string {
  const pre = currentPre();
  const engineResult = lastEngine ?? decide(factsFromForm(state.caseInput));
  const caseBlock = buildCaseBlock(state.caseInput, pre, engineResult, { output: "card-and-json" });
  return buildFullPrompt(COMPACT_PROMPT, caseBlock);
}

function buildShortCaseText(): string {
  const pre = currentPre();
  const engineResult = lastEngine ?? decide(factsFromForm(state.caseInput));
  return buildShortCase(state.caseInput, pre, engineResult, { output: "card-and-json" });
}

function updateSizeMeter(): void {
  const text = buildFullPromptText("card-and-json");
  const tokens = Math.round(text.length / 4);
  const meter = el("sizeMeter");
  setText(meter, `${text.length.toLocaleString()} characters ≈ ${tokens.toLocaleString()} tokens`);
  meter.classList.toggle("over", tokens > 10000);
  if (tokens > 10000) {
    meter.title = "Trim the pasted conversation. Very long prompts can fail on free plans.";
  }
}

// ---------------------------------------------------------------------------
// Result card rendering (design §10.5)
// ---------------------------------------------------------------------------

function displayNames(text: string): string {
  return restoreNames(text, state.caseInput.names);
}

function renderMessageBody(container: HTMLElement, body: string): void {
  clear(container);
  const restored = displayNames(body);
  const re = /\[[^\[\]\n]{1,80}\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(restored)) !== null) {
    if (match.index > lastIndex) {
      container.appendChild(document.createTextNode(restored.slice(lastIndex, match.index)));
    }
    const mark = document.createElement("mark");
    setText(mark, match[0]);
    container.appendChild(mark);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < restored.length) {
    container.appendChild(document.createTextNode(restored.slice(lastIndex)));
  }
}

let lastReport: ValidationReport | null = null;
let lastRawAnswer: string = "";
let lastMessageBody: string | null = null;

function severityRank(sev: Violation["severity"]): number {
  return sev === "error" ? 0 : sev === "warning" ? 1 : 2;
}

function renderChecks(report: ValidationReport): void {
  const list = el("resultChecks");
  clear(list);
  const all = [...report.errors, ...report.warnings, ...report.infos].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  if (all.length === 0) {
    const li = document.createElement("li");
    li.dataset.severity = "pass";
    setText(li, "Passed all checks.");
    list.appendChild(li);
    return;
  }
  for (const v of all) {
    const li = document.createElement("li");
    li.dataset.severity = v.severity;
    li.dataset.code = v.code;
    const msg = document.createElement("span");
    setText(msg, `${v.message}${v.found ? ` Found: “${displayNames(v.found)}”` : ""}`);
    const code = document.createElement("code");
    setText(code, v.code);
    li.append(msg, " ", code);
    list.appendChild(li);
  }
}

function describeTiming(timing: { mode?: string; date?: string | null; note?: string | null } | undefined): string {
  if (!timing) return "—";
  const when = timing.date ? formatDate(timing.date) : null;
  const head =
    timing.mode === "NOW" ? "Now" :
    timing.mode === "SCHEDULED" ? (when ? `Send on ${when}` : "Send later") :
    timing.mode === "WAIT_UNTIL" ? (when ? `Wait until ${when}` : "Wait") :
    "—";
  return timing.note ? `${head}. ${displayNames(timing.note)}` : head;
}

function renderResultCard(report: ValidationReport, json: Record<string, unknown> | null, rawAnswer: string): void {
  lastReport = report;
  lastRawAnswer = rawAnswer;

  const card = el("resultCard");
  card.hidden = false;

  const statusText: Record<ValidationReport["status"], string> = {
    READY: "Ready to send",
    READY_WITH_WARNINGS: "Ready — a few things to check",
    NO_MESSAGE_NEEDED: "No message needed",
    FIX_REQUIRED: "Things to fix",
    UNPARSEABLE: "Couldn't read that answer",
  };
  setText(el("resultStatus"), statusText[report.status]);

  const decision = (json?.decision as Decision | undefined) ?? null;
  const family = decision ? DECISION_FAMILY[decision] : "info";
  card.dataset.family = family;
  setText(el("resultDecisionCode"), decision ?? "—");
  setText(el("resultDecisionName"), decision ? DECISION_NAMES[decision] : "");

  const timing = json?.timing as { mode?: string; date?: string | null; note?: string | null } | undefined;
  setText(el("resultTiming"), describeTiming(timing));
  setText(el("resultReason"), displayNames(String(json?.reason ?? "")));
  setText(el("resultAction"), displayNames(String(json?.action ?? "")));

  const message = json?.message as { body?: string } | null | undefined;
  const messageSection = el("resultMessageSection");
  if (message && message.body) {
    messageSection.hidden = false;
    lastMessageBody = message.body;
    renderMessageBody(el("resultMessageBody"), message.body);
    el<HTMLParagraphElement>("placeholderNote").hidden = report.placeholders.length === 0;
  } else {
    lastMessageBody = null;
    setText(el("resultMessageBody"), "No message needed.");
    el<HTMLParagraphElement>("placeholderNote").hidden = true;
  }

  setText(el("resultNoResponsePlan"), displayNames(String(json?.noResponsePlan ?? "")));

  const doNotDo = el("resultDoNotDo");
  clear(doNotDo);
  const doNotDoList = Array.isArray(json?.doNotDo) ? (json!.doNotDo as string[]) : [];
  for (const item of doNotDoList) {
    const li = document.createElement("li");
    setText(li, displayNames(String(item)));
    doNotDo.appendChild(li);
  }

  const stopFlag = el("resultStopFlag");
  const isStop = json?.stopActiveFollowUp === true;
  stopFlag.className = `pill ${isStop ? "yes" : "no"}`;
  setText(stopFlag, isStop ? "Yes" : "No");

  const missingSection = el("resultMissingInfoSection");
  const missingInfo = el("resultMissingInfo");
  clear(missingInfo);
  const missingList = Array.isArray(json?.missingInformation) ? (json!.missingInformation as { question: string; why: string }[]) : [];
  if (missingList.length > 0) {
    missingSection.hidden = false;
    for (const item of missingList) {
      const p = document.createElement("p");
      setText(p, item.question);
      missingInfo.appendChild(p);
    }
  } else {
    missingSection.hidden = true;
  }

  const evidenceList = el("resultEvidence");
  clear(evidenceList);
  const evidence = Array.isArray(json?.evidence) ? (json!.evidence as { fact: string; quote: string }[]) : [];
  for (const item of evidence) {
    const li = document.createElement("li");
    setText(li, `${item.fact}: “${displayNames(item.quote)}”`);
    evidenceList.appendChild(li);
  }

  const mismatchSection = el("resultFactMismatchSection");
  if (report.factMismatches.length > 0) {
    mismatchSection.hidden = false;
    setText(
      el("resultFactMismatch"),
      `Your AI read their message differently: ${report.factMismatches.map((m) => m.message).join(" ")}`,
    );
  } else {
    mismatchSection.hidden = true;
  }

  renderChecks(report);

  const fixItSection = el("resultFixItSection");
  const copyFixItBtn = el<HTMLButtonElement>("copyFixItBtn");
  const tryAgainBtn = el<HTMLButtonElement>("tryAgainBtn");
  const copyFinishBtn = el<HTMLButtonElement>("copyFinishBtn");
  copyFixItBtn.hidden = true;
  tryAgainBtn.hidden = true;
  copyFinishBtn.hidden = true;

  if (report.status === "UNPARSEABLE") {
    fixItSection.hidden = false;
    copyFinishBtn.hidden = false;
  } else if (report.errors.length > 0) {
    fixItSection.hidden = false;
    copyFixItBtn.hidden = false;
    tryAgainBtn.hidden = sampleFn === null;
  } else {
    fixItSection.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// Claude mode (design §7, §9.8, §10.6)
// ---------------------------------------------------------------------------

const CLAUDE_ERROR_COPY: Record<string, string> = {
  not_granted: "Claude isn't available here. Copy the prompt into any AI instead.",
  sampling_disabled: "Claude isn't available here. Copy the prompt into any AI instead.",
  not_declared: "Claude isn't available here. Copy the prompt into any AI instead.",
  capability_disabled: "Claude isn't available here. Copy the prompt into any AI instead.",
  capability_removed: "Claude isn't available here. Copy the prompt into any AI instead.",
  rate_limited: "You've reached a Claude usage limit. Try again later, or copy the prompt into another AI.",
  session_expired: "Sign in to Claude again, then retry.",
  refused: "Claude declined this case. Edit it and try again.",
  prompt_too_large: "The pasted conversation is too long. Remove the oldest messages.",
  invalid_json: "That didn't come back as a usable answer.",
  empty_completion: "That didn't come back as a usable answer.",
  upstream_error: "Something interrupted the request.",
  cancelled: "",
};

interface ClaudeWindow {
  claude?: { use?: (name: string) => Promise<unknown> };
}

async function initClaude(): Promise<void> {
  try {
    const use = (window as unknown as ClaudeWindow).claude?.use;
    if (!use) return;
    const fn = await use("sample");
    if (typeof fn === "function") {
      sampleFn = fn as SampleFn;
      el<HTMLButtonElement>("runClaudeBtn").hidden = false;
      el("runClaudeFineprint").hidden = false;
      el("thinkHarderLabel").hidden = false;
    }
  } catch {
    // sample unavailable: keep the copy-paste path only.
  }
}

function setClaudeStatus(text: string): void {
  setText(el("claudeStatus"), text);
}

async function runWithClaude(): Promise<void> {
  if (sampleFn === null) return;
  const sample = sampleFn;
  const runBtn = el<HTMLButtonElement>("runClaudeBtn");
  runBtn.disabled = true;
  el("claudeUnavailableNote").hidden = true;
  setClaudeStatus("Reading their words…");

  const modelTier = checkboxValue("thinkHarder") ? "complex" : "default";
  const fullPrompt = buildFullPromptText("json-only");

  try {
    const first = await sample(fullPrompt, { modelTier });
    setClaudeStatus("Checking the answer…");
    let report = checkAnswer(first.text, { caseInput: state.caseInput, today: state.caseInput.today });

    if (report.errors.length > 0) {
      const repairPrompt = buildRepairPrompt(report);
      if (repairPrompt) {
        setClaudeStatus("Fixing a few things…");
        try {
          const second = await sample(
            [
              { role: "user", content: fullPrompt },
              { role: "assistant", content: first.text },
              { role: "user", content: repairPrompt },
            ],
            { modelTier, cache: false },
          );
          const secondReport = checkAnswer(second.text, { caseInput: state.caseInput, today: state.caseInput.today });
          setClaudeStatus("");
          renderResultCard(secondReport, parseJsonSafely(second.text), second.text);
          runBtn.disabled = false;
          return;
        } catch {
          // repair call failed: fall back to showing the first (unrepaired) answer.
        }
      }
    }
    setClaudeStatus("");
    renderResultCard(report, parseJsonSafely(first.text), first.text);
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "upstream_error";
    const partial = (err as { text?: string })?.text;
    setClaudeStatus("");
    if (code === "cancelled") {
      // restore idle state silently
    } else if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      runBtn.hidden = true;
      el("runClaudeFineprint").hidden = true;
      el("thinkHarderLabel").hidden = true;
      el("claudeUnavailableNote").hidden = false;
    } else {
      setClaudeStatus(CLAUDE_ERROR_COPY[code] ?? "Something interrupted the request.");
      if (partial) {
        const report = checkAnswer(partial, { caseInput: state.caseInput, today: state.caseInput.today });
        renderResultCard(report, parseJsonSafely(partial), partial);
      }
    }
  } finally {
    runBtn.disabled = false;
  }
}

function parseJsonSafely(text: string): Record<string, unknown> | null {
  // Display fields come from the same tolerant parser the validator uses.
  const parsed = parseAnswer(text);
  return (parsed.json as unknown as Record<string, unknown> | null) ?? null;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

function onFormChange(): void {
  if (state.isExample) {
    // The user started editing the example: from now on it is their own case.
    state.isExample = false;
    el("exampleBadge").hidden = true;
  }
  scheduleRecompute();
}

function wireForm(): void {
  const form = el<HTMLFormElement>("caseForm");
  form.addEventListener("input", onFormChange);
  form.addEventListener("change", onFormChange);
}

function wireExample(): void {
  el<HTMLButtonElement>("startNewCaseBtn").addEventListener("click", () => {
    state = { caseInput: blankCaseInput(), isExample: false };
    el("exampleBadge").hidden = true;
    writeFormFromCaseInput(state.caseInput);
    forgetDraft();
    recomputeNow();
  });
}

function wireCopyButtons(): void {
  el<HTMLButtonElement>("copyPromptBtn").addEventListener("click", async () => {
    const text = buildFullPromptText("card-and-json");
    const ok = await copyText(text);
    el<HTMLParagraphElement>("copyStepText").hidden = !ok;
    el("aiLinks").hidden = !ok;
    updateSizeMeter();
  });

  el<HTMLButtonElement>("copyCompactBtn").addEventListener("click", async () => {
    await copyText(buildCompactPromptText());
  });

  el<HTMLButtonElement>("copyShortBtn").addEventListener("click", async () => {
    await copyText(buildShortCaseText());
  });

  el<HTMLButtonElement>("copyMessageBtn").addEventListener("click", async () => {
    if (lastMessageBody === null) return;
    await copyText(displayNames(lastMessageBody));
  });

  el<HTMLButtonElement>("copyFixItBtn").addEventListener("click", async () => {
    if (!lastReport) return;
    const prompt = buildRepairPrompt(lastReport);
    if (prompt) await copyText(prompt);
  });

  el<HTMLButtonElement>("copyFinishBtn").addEventListener("click", async () => {
    await copyText(buildFinishPrompt());
  });

  el<HTMLButtonElement>("tryAgainBtn").addEventListener("click", async () => {
    if (sampleFn === null || !lastReport) return;
    const prompt = buildRepairPrompt(lastReport);
    if (!prompt) return;
    const sample = sampleFn;
    const fullPrompt = buildFullPromptText("json-only");
    setClaudeStatus("Trying again…");
    try {
      const result = await sample(
        [
          { role: "user", content: fullPrompt },
          { role: "assistant", content: lastRawAnswer },
          { role: "user", content: prompt },
        ],
        { modelTier: checkboxValue("thinkHarder") ? "complex" : "default", cache: false },
      );
      const report = checkAnswer(result.text, { caseInput: state.caseInput, today: state.caseInput.today });
      setClaudeStatus("");
      renderResultCard(report, parseJsonSafely(result.text), result.text);
    } catch {
      setClaudeStatus("That didn't work. You can copy the fix-it prompt instead.");
    }
  });
}

function wireCheckAnswer(): void {
  const textarea = el<HTMLTextAreaElement>("answerInput");
  const run = () => {
    const text = textarea.value;
    if (text.trim().length < 8) return;
    const report = checkAnswer(text, { caseInput: state.caseInput, today: state.caseInput.today });
    renderResultCard(report, parseJsonSafely(text), text);
  };
  textarea.addEventListener("input", run);
  textarea.addEventListener("paste", () => setTimeout(run, 0));
}

function wireRerun(): void {
  el<HTMLButtonElement>("rerunBtn").addEventListener("click", () => {
    recomputeNow();
  });
}

function wireForget(): void {
  el<HTMLButtonElement>("forgetBtn").addEventListener("click", () => {
    forgetDraft();
    state = { caseInput: blankCaseInput(), isExample: false };
    el("exampleBadge").hidden = true;
    writeFormFromCaseInput(state.caseInput);
    recomputeNow();
  });
}

function wireRunClaude(): void {
  el<HTMLButtonElement>("runClaudeBtn").addEventListener("click", () => {
    void runWithClaude();
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot(): void {
  setText(el("engineVersion"), ENGINE_VERSION);
  setText(el("promptVersion"), PROMPT_VERSION);
  setText(el("schemaVersion"), SCHEMA_VERSION);

  const draft = loadDraft();
  if (draft) {
    state = { caseInput: { ...draft, today: localToday(), timezone: localTimezone() }, isExample: false };
    el("exampleBadge").hidden = true;
  } else {
    state = { caseInput: exampleCaseInput(), isExample: true };
    el("exampleBadge").hidden = false;
  }

  writeFormFromCaseInput(state.caseInput);
  wireForm();
  wireExample();
  wireCopyButtons();
  wireCheckAnswer();
  wireRerun();
  wireForget();
  wireRunClaude();

  recomputeNow();
  void initClaude();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
