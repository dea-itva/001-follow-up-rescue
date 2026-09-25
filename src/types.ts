/**
 * Lead Follow-Up Rescue: shared domain types.
 * Design reference: docs/design/TECHNICAL_DESIGN.md §4.
 *
 * This module has zero runtime dependencies and performs no I/O.
 */

// ---------------------------------------------------------------------------
// §14 Versioning
// ---------------------------------------------------------------------------

export const ENGINE_VERSION = "1.0.0";
export const PROMPT_VERSION = "1.0.0";
export const SCHEMA = "lfr/1.0";
export const SCHEMA_VERSION = "1.0";

// ---------------------------------------------------------------------------
// §4.1 Enums
// ---------------------------------------------------------------------------

export const DECISIONS = [
  "RESPOND_NOW",
  "WAIT",
  "FOLLOW_UP",
  "CHANGE_ANGLE",
  "LOWER_FRICTION",
  "CLOSE_LOOP",
  "STOP_ACTIVE_FOLLOW_UP",
  "NEED_MISSING_INFORMATION",
  "NEED_FOLLOW_UP_REASON",
  "OUT_OF_SCOPE",
  "DO_NOTHING",
] as const;
export type Decision = (typeof DECISIONS)[number];

export type Scenario =
  | "NEW_INQUIRY" // they reached out; you have not replied yet
  | "REQUESTED_INFO" // they asked for something (info, pricing, a document) and you have not sent it
  | "INFO_SENT" // you sent what they asked for; awaiting their reaction
  | "PROPOSAL_SENT" // proposal or quote sent; awaiting a decision
  | "POST_MEETING" // after a call, meeting or demo
  | "POST_EVENT" // met at or after an event or webinar
  | "NOT_RIGHT_NOW" // they said not now (with or without timing)
  | "RECONNECT_DUE" // a previously agreed reconnect time has come
  | "OTHER_WARM_FOLLOWUP" // anything else with a warm lead: needs an explicit legitimate reason
  | "NOTHING_PENDING"; // the conversation is resolved; nothing is open

export const SCENARIOS: readonly Scenario[] = [
  "NEW_INQUIRY",
  "REQUESTED_INFO",
  "INFO_SENT",
  "PROPOSAL_SENT",
  "POST_MEETING",
  "POST_EVENT",
  "NOT_RIGHT_NOW",
  "RECONNECT_DUE",
  "OTHER_WARM_FOLLOWUP",
  "NOTHING_PENDING",
];

export type Channel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "MESSENGER"
  | "VIBER"
  | "LINKEDIN"
  | "INSTAGRAM"
  | "OTHER";

export type ReasonType =
  | "PENDING_PROPOSAL"
  | "THEIR_REQUEST"
  | "MEETING_FOLLOWUP"
  | "EVENT_FOLLOWUP"
  | "AGREED_NEXT_STEP"
  | "EXPIRED_COMMITMENT"
  | "UNTIMED_COMMITMENT"
  | "LEAD_REQUESTED_RECONNECT"
  | "PROMISED_RESOURCE"
  | "REQUESTED_STATUS_UPDATE"
  | "MEANINGFUL_UPDATE"
  | "MATERIAL_CHANGE"
  | "NEW_RELEVANT_INFO"
  | "CONCRETE_DEADLINE";

export type DesiredOutcome =
  | "BOOK_CALL"
  | "GET_DECISION"
  | "RECEIVE_DOCUMENTS"
  | "CONFIRM_ATTENDANCE"
  | "ANSWER_QUESTION"
  | "MOVE_PROPOSAL_FORWARD"
  | "OTHER";

export type TimingType = "SPECIFIC" | "VAGUE" | "NONE";
export type TimingResolution = "FUTURE" | "ARRIVED" | "PASSED" | "AMBIGUOUS" | "UNTIMED";
export type HardStopKind = "OPT_OUT" | "DECLINE";
export type Suppression = "NONE" | "OPT_OUT" | "DECLINE" | "PAUSED";
export type Interaction = "REPLY" | "SEQUENCE" | "NEW_REASON" | "DEADLINE_FINAL";
export type TimingMode = "NOW" | "SCHEDULED" | "WAIT_UNTIL" | "NONE";
export type CtaType = "ANSWER" | "YES_NO" | "CHOOSE_ONE" | "BOOK_TIME" | "SEND_ITEM" | "CONFIRM";

// ---------------------------------------------------------------------------
// §4.2 CaseInput: what the Rescue Desk form collects
// ---------------------------------------------------------------------------

export interface CaseInput {
  today: string; // YYYY-MM-DD, from the browser's local date
  timezone: string; // IANA, e.g. "Asia/Manila"
  scenario: Scenario | null;
  channel: Channel | null;
  leadMessages: string; // their words, verbatim (may be empty)
  userMessages: string; // your messages since their last reply, verbatim (may be empty)
  notes: string; // anything else from the user
  attempts: number | "UNSURE" | null; // follow-ups since their last real reply; 5 means "5+"
  owed: { answer: "YES" | "NO" | "UNSURE" | null; text: string }; // their unanswered question/request, or something you promised
  stop: { answer: "OPT_OUT" | "DECLINE" | "NO" | null; words: string }; // "asked me to stop" / "said no or not interested" / neither
  timeframe: {
    answer: "EXACT" | "VAGUE" | "NONE_GIVEN" | "UNSURE" | "NA" | null;
    words: string; // their words about timing
    date: string | null; // for EXACT
    vagueStatus: "PASSED" | "FUTURE" | "UNSURE" | null; // for VAGUE: "Has that clearly passed?"
  };
  deadline: { answer: "YES" | "NO" | null; what: string; date: string | null; whose: "LEAD" | "EXTERNAL" | "MINE" | null };
  newInfo: { text: string; linked: "YES" | "NO" | "UNSURE" | null; linkedWords: string };
  closeLoopSent: boolean | null;
  lastLeadMessageDate: string | null;
  lastUserMessageDate: string | null;
  originalSubject: string; // email only, for "reply in thread"
  desiredOutcome: DesiredOutcome | null;
  language: "MATCH" | "EN" | "TAGLISH" | "FIL";
  tone: "WARM" | "PROFESSIONAL" | "BRIEF";
  leadCountry: "PH" | "US" | "CA" | "UK" | "EU" | "AU" | "OTHER" | null; // compliance tips and quiet hours only; never changes the decision
  names: { lead: string; me: string; business: string }; // optional; used for pseudonymization (§10.7)
  complianceFooter: boolean; // default true (§11.2)
  redact: boolean; // default true (§10.7)
}

// ---------------------------------------------------------------------------
// §4.3 Facts: the normalized case
// ---------------------------------------------------------------------------

export interface TimingRef {
  type: TimingType;
  words: string | null; // e.g. "Friday", "after the holidays"
  date: string | null; // SPECIFIC only: the resolved start date of the window (YYYY-MM-DD)
  resolution: TimingResolution | null;
  // SPECIFIC: the engine derives resolution from date vs today; the supplied value is ignored.
  // VAGUE:    FUTURE or PASSED only if every reasonable reading agrees (§5.6); otherwise AMBIGUOUS.
  // NONE:     for commitments, UNTIMED only when the user confirmed no timeframe was given, else AMBIGUOUS;
  //           for not-right-now, NONE always means UNTIMED (spec §7).
}

export interface Facts {
  today: string;
  scope: "IN_SCOPE" | "OUT_OF_SCOPE";
  scenario: Scenario | null; // null = unknown
  channel: Channel | null;
  attempts: number | null; // null = unknown
  attemptsRange: [number, number] | null; // for vague counts ("a few" → [2, 4]); used only when attempts is null
  closeLoopSent: boolean;
  hardStop: null | { kind: HardStopKind; quote: string; sure: boolean };
  notRightNow: null | { quote: string; timing: TimingRef };
  owedResponse: null | { kind: "QUESTION" | "REQUEST" | "USER_PROMISE"; quote: string; sure: boolean };
  commitment: null | { by: "LEAD" | "MUTUAL"; quote: string; timing: TimingRef };
  deadline:
    | null
    | {
        quote: string;
        kind: "CONCRETE" | "VAGUE";
        date: string | null;
        owner: "LEAD" | "EXTERNAL" | "USER_INTERNAL";
        materialToLead: boolean | null;
      };
  reason: null | { type: ReasonType; text: string };
  newInfo: null | { text: string; linkedNeedQuote: string | null; material: "YES" | "NO" | "UNCLEAR" };
  tooSoon: boolean; // LLM or user judgment; default false (§5.9)
  // Context only. These NEVER change the decision (spec §17, §18):
  intentEvidence: string[]; // the lead's actual words showing interest
  userAssumptions: string[]; // unsupported user claims ("obviously interested", "just busy", "ghosting")
  pressure: string[]; // internal urgency and deal labels ("need this deal", "VIP", "huge account")
  desiredOutcome: DesiredOutcome | null;
}

/** Facts with every field the engine treats as an "unknown" resolved to a concrete value. */
export type KnownFacts = Facts;

// ---------------------------------------------------------------------------
// §4.4 EngineResult
// ---------------------------------------------------------------------------

/**
 * The gate (or tie-break path) that produced the decision, e.g. "G1", "G3a.untimed", "G6.close".
 * Left as a plain string (rather than an exhaustive union) because gates carry sub-labels
 * (e.g. "G3a.future", "G7.3") that are documentation, not a closed enumeration.
 */
export type RuleId = string;

export type UnknownField =
  | "scenario"
  | "attempts"
  | "hardStop"
  | "owedResponse"
  | "commitmentTiming"
  | "notRightNowTiming"
  | "deadlineMateriality"
  | "newInfoMateriality"
  | "reason";

export interface EngineResult {
  decision: Decision;
  possible: Decision[]; // all decisions reachable under the unknowns (length 1 when determined)
  interaction: Interaction; // REPLY for RESPOND_NOW; SEQUENCE / NEW_REASON / DEADLINE_FINAL for FOLLOW_UP family
  messageAllowed: boolean; // from the invariant table (§8.1)
  stopActiveFollowUp: boolean; // §5.10
  suppression: Suppression;
  waitUntil: string | null; // WAIT only; null when the wait is event-based or vague
  rule: RuleId; // the gate that decided, e.g. "G1", "G3a.untimed", "G6.close"
  materialUnknowns: UnknownField[]; // fields whose value would change the decision (§6.3)
  questions: string[]; // default questions for materialUnknowns (≤ 3)
}

// ---------------------------------------------------------------------------
// §4.5 RescueResult: the LLM's JSON block (schema lfr/1.0)
// ---------------------------------------------------------------------------

export interface RescueTiming {
  mode: TimingMode;
  date: string | null;
  note: string | null;
}

export interface RescueMessage {
  channel: Channel;
  subject: string | null;
  body: string;
}

export interface RescueCta {
  text: string;
  type: CtaType;
}

export interface MissingInformationItem {
  question: string;
  why: string;
}

export type EvidenceFact =
  | "hardStop"
  | "notRightNow"
  | "owedResponse"
  | "commitment"
  | "deadline"
  | "reason"
  | "newInfo"
  | "intent";

export interface EvidenceItem {
  fact: EvidenceFact;
  quote: string;
}

/**
 * `facts` inside a RescueResult omits `today`, `intentEvidence`, `userAssumptions`,
 * `pressure` and `desiredOutcome` (design §4.5).
 */
export type RescueFacts = Omit<Facts, "today" | "intentEvidence" | "userAssumptions" | "pressure" | "desiredOutcome">;

export interface RescueResult {
  lfr: string;
  decision: Decision;
  interaction: Interaction;
  timing: RescueTiming;
  reason: string;
  contactReason: string | null;
  action: string;
  message: RescueMessage | null;
  cta: RescueCta | null;
  angle: string | null;
  noResponsePlan: string;
  doNotDo: string[];
  stopActiveFollowUp: boolean;
  suppression: Suppression;
  missingInformation: MissingInformationItem[];
  facts: RescueFacts;
  evidence: EvidenceItem[];
  rejectedAssumptions: string[];
}

// ---------------------------------------------------------------------------
// §9.2 Validator: violation catalogue
// ---------------------------------------------------------------------------

export type ViolationCode =
  | "E_SCHEMA"
  | "W_NO_CHECKER_DATA"
  | "W_VERSION_MISMATCH"
  | "E_CARD_MISMATCH"
  | "E_RULE_MISMATCH"
  | "W_NMI_NFR_SWAP"
  | "W_QUOTE_PARAPHRASED"
  | "E_MESSAGE_NOT_ALLOWED"
  | "E_MESSAGE_REQUIRED"
  | "E_CTA_NOT_ALLOWED"
  | "E_CTA_MISSING"
  | "E_MULTIPLE_CTAS"
  | "E_CTA_NOT_IN_MESSAGE"
  | "E_STOP_FLAG"
  | "E_SUPPRESSION"
  | "E_TIMING_MODE"
  | "E_TIMING_DATE_UNGROUNDED"
  | "E_HARD_STOP_OVERRIDDEN"
  | "E_STOP_PHRASE_UNADDRESSED"
  | "E_UNGROUNDED_QUOTE"
  | "E_EVIDENCE_MISSING"
  | "E_REASON_MISSING"
  | "E_QUESTION_NOT_ANSWERED"
  | "E_NEW_REASON_NOT_IN_MESSAGE"
  | "W_NEW_REASON_NOT_LEADING"
  | "E_ANGLE_MISSING"
  | "W_ANGLE_TOO_SIMILAR"
  | "E_FRICTION_NOT_LOWERED"
  | "E_CLOSE_LOOP_CTA"
  | "E_CLOSE_LOOP_RESTART"
  | "E_PLAN_CHASES"
  | "E_PLAN_EXCEEDS_SAFETY"
  | "E_WAIT_EARLY_CONTACT"
  | "E_INVENTED_RECONTACT_INTERVAL"
  | "E_ACTION_INCONSISTENT"
  | "E_INVENTED_DEADLINE"
  | "E_INVENTED_NUMBER"
  | "E_INVENTED_LINK"
  | "W_OPTOUT_LINE_MISSING"
  | "E_TRACKING_OR_READ_GUILT"
  | "W_UNSUPPORTED_NUMBER"
  | "E_UNSUPPORTED_ATTRIBUTION"
  | "E_ASSUMED_LEAD_STATE"
  | "E_ASSUMED_OBJECTION"
  | "E_FAKE_URGENCY"
  | "E_FAKE_SCARCITY"
  | "E_GUILT"
  | "E_VAGUE_CHECKIN"
  | "W_VAGUE_CHECKIN"
  | "W_FAKE_RE_SUBJECT"
  | "E_TOO_MANY_QUESTIONS"
  | "E_MISSING_INFO_NOT_MATERIAL"
  | "W_FACT_MISMATCH"
  | "W_CTA_OUTCOME_MISMATCH"
  | "W_TOO_LONG"
  | "I_PLACEHOLDERS";

export interface Violation {
  code: ViolationCode;
  severity: "error" | "warning" | "info";
  message: string;
  found?: string;
  rule: string;
}

export interface FactMismatch {
  field: string;
  formValue: unknown;
  aiValue: unknown;
  message: string;
}

export interface ValidationReport {
  status: "READY" | "READY_WITH_WARNINGS" | "NO_MESSAGE_NEEDED" | "FIX_REQUIRED" | "UNPARSEABLE";
  errors: Violation[];
  warnings: Violation[];
  infos: Violation[];
  engine: EngineResult | null; // recompute on the AI's facts
  factMismatches: FactMismatch[]; // form answers vs AI facts
  placeholders: string[]; // [square bracket] items the user must fill in
}

// ---------------------------------------------------------------------------
// §9.2a Validation context
// ---------------------------------------------------------------------------

export interface ValidationContext {
  caseInput?: CaseInput; // Desk mode: enables form cross-checks and precheck-based checks
  raw?: string; // plain-chat mode: the user's own text; used for grounding when caseInput is absent
  today?: string; // defaults to caseInput.today; required when only raw is given
}

// ---------------------------------------------------------------------------
// Precheck (§9.6, §10.3-adjacent): src/precheck.ts produces this shape
// ---------------------------------------------------------------------------

export type PrecheckCategory =
  // Lead signals
  | "OPT_OUT"
  | "DECLINE"
  | "NRN"
  | "VAGUE_COMMITMENT"
  | "VAGUE_TIMING"
  | "VAGUE_URGENCY"
  | "AUTO_REPLY"
  | "CHANNEL_PREFERENCE"
  // User signals
  | "USER_ASSUMPTION"
  | "USER_PRESSURE"
  | "DEAL_LABEL"
  | "MESSAGE_FIRST_REQUEST"
  | "DISGUISE_REQUEST"
  // Prompt-injection
  | "INSTRUCTION_IN_DATA";

export type PrecheckSource = "lead" | "user" | "notes";

export interface PrecheckSignal {
  category: PrecheckCategory;
  matchedText: string;
  source: PrecheckSource;
  severity: "error" | "warning" | "info";
}

export type AttemptBand = "FOLLOW_UP" | "CHANGE_ANGLE" | "LOWER_FRICTION" | "CLOSE_LOOP";

export interface Precheck {
  signals: PrecheckSignal[];
  /** Default-before-other-rules attempt band, from the raw attempt count alone (§7.2). */
  attemptBand: AttemptBand | null;
}
