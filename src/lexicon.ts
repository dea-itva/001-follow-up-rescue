/**
 * Phrase lists (EN + Taglish/Filipino), each with category and severity (design §9.6).
 *
 * These are FLAGS ONLY (DL-03): matching a phrase never decides anything by itself.
 * `src/precheck.ts` uses the "lead signal", "user signal" and `INSTRUCTION_IN_DATA`
 * categories to raise signals for the Rescue Desk. The "message anti-pattern"
 * categories are for `src/validate.ts` (phase P1b) to scan drafted messages.
 *
 * Sources: docs/design/TECHNICAL_DESIGN.md §9.6 (categories), §5.4-§5.9 (hard-stop /
 * NRN / vague wording), §7.4 step 4 (injection patterns);
 * docs/research/INDUSTRY_RESEARCH.md §B6 (message anti-pattern starter list) and §E
 * (Taglish/Filipino reading notes).
 */

import type { PrecheckCategory } from "./types.js";

export type MessageAntiPatternCategory =
  | "VAGUE_CHECKIN"
  | "GUILT"
  | "FAKE_URGENCY"
  | "FAKE_SCARCITY"
  | "PRESUMPTION"
  | "ASSUMED_OBJECTION"
  | "DISGUISED_RESTART"
  | "ATTRIBUTION";

export type LexiconCategory = PrecheckCategory | MessageAntiPatternCategory;

export type LexiconLang = "en" | "fil" | "taglish";
export type LexiconSeverity = "error" | "warning" | "info";

export interface LexiconEntry {
  id: string;
  pattern: RegExp;
  category: LexiconCategory;
  lang: LexiconLang;
  severity: LexiconSeverity;
  note: string;
}

/** Escapes regex metacharacters in a literal token. */
function escapeToken(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive, whole-word regex from a plain-language phrase.
 * Internal whitespace becomes `\s+` (tolerant of extra spaces/newlines);
 * a `\b` boundary is added at either edge only when that edge is a word
 * character, so punctuation-led/trailing phrases still match sensibly.
 */
function wb(phrase: string, flags = "iu"): RegExp {
  const trimmed = phrase.trim();
  const tokens = trimmed.split(/\s+/).map(escapeToken);
  const body = tokens.join("\\s+");
  const first = trimmed[0] ?? "";
  const last = trimmed[trimmed.length - 1] ?? "";
  const left = /[\p{L}\p{N}]/u.test(first) ? "\\b" : "";
  const right = /[\p{L}\p{N}]/u.test(last) ? "\\b" : "";
  return new RegExp(left + body + right, flags);
}

/** Builds a lexicon entry from a plain-language phrase via {@link wb}. */
function e(
  id: string,
  phrase: string,
  category: LexiconCategory,
  lang: LexiconLang,
  severity: LexiconSeverity,
  note: string,
): LexiconEntry {
  return { id, pattern: wb(phrase), category, lang, severity, note };
}

/** Builds a lexicon entry from a raw, already-constructed regex (for guards/alternations). */
function raw(
  id: string,
  pattern: RegExp,
  category: LexiconCategory,
  lang: LexiconLang,
  severity: LexiconSeverity,
  note: string,
): LexiconEntry {
  return { id, pattern, category, lang, severity, note };
}

export const LEXICON: LexiconEntry[] = [
  // ---------------------------------------------------------------------
  // Lead signals: OPT_OUT (design §5.4, TEST_PLAN §7.2)
  // ---------------------------------------------------------------------
  e("opt_out.do_not_contact", "do not contact me", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.dont_contact", "don't contact me", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.stop_contacting", "stop contacting me", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.stop_emailing", "stop emailing me", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.stop_messaging", "stop messaging me", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.stop_texting", "stop texting me", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.remove_me", "remove me", "OPT_OUT", "en", "warning", "\"Please remove me [from your list]\"."),
  e("opt_out.unsubscribe", "unsubscribe", "OPT_OUT", "en", "warning", "Opt-out request."),
  e("opt_out.dont_message_again", "don't message me again", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e("opt_out.leave_me_alone", "leave me alone", "OPT_OUT", "en", "warning", "Explicit stop request."),
  e(
    "opt_out.tigilan",
    "tigilan niyo na po ako",
    "OPT_OUT",
    "taglish",
    "warning",
    "\"Please stop [contacting] me.\"",
  ),
  e(
    "opt_out.wag_na_mag_message",
    "wag na po kayong mag-message",
    "OPT_OUT",
    "taglish",
    "warning",
    "\"Please don't message [me] anymore.\"",
  ),
  e(
    "opt_out.pakitanggal",
    "pakitanggal na po ako",
    "OPT_OUT",
    "taglish",
    "warning",
    "\"Please remove me [from the list].\"",
  ),
  e(
    "opt_out.huwag_niyo_i_message",
    "huwag n'yo na akong i-message",
    "OPT_OUT",
    "taglish",
    "warning",
    "\"Please don't message me anymore.\"",
  ),
  e("opt_out.stop_na_po", "stop na po", "OPT_OUT", "taglish", "warning", "\"Stop, please.\""),

  // ---------------------------------------------------------------------
  // Lead signals: DECLINE (design §5.4, TEST_PLAN §7.2)
  // ---------------------------------------------------------------------
  raw(
    "decline.bare_no",
    // A standalone "no" that is not the start of "No problem" / "No worries" / "Not …".
    /\bno\b(?!\s*(problem|worries|prob\b|biggie|,?\s*that'?s (fine|ok(ay)?)))/iu,
    "DECLINE",
    "en",
    "warning",
    "A bare \"No.\" is a weak signal (DL-03): could be a decline, or an answer to a narrow question.",
  ),
  e("decline.not_interested", "not interested", "DECLINE", "en", "warning", "Refusal of the offer."),
  e("decline.well_pass", "we'll pass", "DECLINE", "en", "warning", "Refusal of the offer."),
  e("decline.we_will_pass", "we will pass", "DECLINE", "en", "warning", "Refusal of the offer."),
  e(
    "decline.went_with_someone_else",
    "we went with someone else",
    "DECLINE",
    "en",
    "warning",
    "Refusal of the offer.",
  ),
  e(
    "decline.decided_not_to_move_forward",
    "decided not to move forward",
    "DECLINE",
    "en",
    "warning",
    "Refusal of the offer.",
  ),
  e(
    "decline.hindi_na_po_salamat",
    "hindi na po, salamat",
    "DECLINE",
    "taglish",
    "warning",
    "\"No more, thanks.\"",
  ),
  e("decline.pass_po", "pass po", "DECLINE", "taglish", "warning", "\"Pass.\" (declining, not deferring)."),
  e("decline.ayoko_na_po", "ayoko na po", "DECLINE", "taglish", "warning", "\"I don't want it [any more].\""),
  e(
    "decline.hindi_interesado",
    "hindi po ako interesado",
    "DECLINE",
    "taglish",
    "warning",
    "\"I'm not interested.\"",
  ),

  // ---------------------------------------------------------------------
  // Lead signals: NRN — not right now, no fixed timeframe (design §5.5)
  // ---------------------------------------------------------------------
  e("nrn.not_right_now", "not right now", "NRN", "en", "info", "Deferral, no timeframe given."),
  e("nrn.not_now", "not now", "NRN", "en", "info", "Deferral, no timeframe given."),
  e("nrn.not_until", "not until", "NRN", "en", "info", "A deferral, this time with a timeframe (\"not until January\")."),
  e("nrn.maybe_later", "maybe later", "NRN", "en", "info", "Deferral, no timeframe given."),
  e("nrn.some_other_time", "some other time", "NRN", "en", "info", "Deferral, no timeframe given."),
  e("nrn.next_time_na_lang", "next time na lang", "NRN", "taglish", "info", "\"Maybe next time.\""),
  e("nrn.saka_na_lang", "saka na lang", "NRN", "taglish", "info", "\"Later.\""),
  e("nrn.pass_muna_po", "pass muna po", "NRN", "taglish", "info", "\"Pass for now.\""),
  e("nrn.hindi_pa_po_ngayon", "hindi pa po ngayon", "NRN", "taglish", "info", "\"Not yet, right now.\""),
  e("nrn.hindi_pa_ngayon", "hindi pa ngayon", "NRN", "taglish", "info", "\"Not yet, right now.\""),

  // ---------------------------------------------------------------------
  // Lead signals: VAGUE_COMMITMENT (design §5.7)
  // ---------------------------------------------------------------------
  e(
    "vague_commitment.think_about_it",
    "think about it",
    "VAGUE_COMMITMENT",
    "en",
    "info",
    "A commitment with no stated timeframe (\"I'll think about it\" / \"they said they'd think about it\").",
  ),
  raw(
    "vague_commitment.ill_get_back_to_you",
    /\bget\s+back\s+to\s+(you|me)\b/iu,
    "VAGUE_COMMITMENT",
    "en",
    "info",
    "A commitment with no stated timeframe (also matches a paraphrase: \"get back to me\").",
  ),
  e(
    "vague_commitment.pag_iisipan_ko",
    "pag-iisipan ko",
    "VAGUE_COMMITMENT",
    "taglish",
    "info",
    "\"I'll think about it.\"",
  ),
  e(
    "vague_commitment.balikan_kita",
    "balikan kita",
    "VAGUE_COMMITMENT",
    "taglish",
    "info",
    "\"I'll get back to you.\"",
  ),
  e(
    "vague_commitment.babalikan_kita",
    "babalikan kita",
    "VAGUE_COMMITMENT",
    "taglish",
    "info",
    "\"I'll get back to you.\"",
  ),
  e(
    "vague_commitment.titingnan_ko_po",
    "titingnan ko po",
    "VAGUE_COMMITMENT",
    "taglish",
    "info",
    "\"I'll look into it.\"",
  ),
  e(
    "vague_commitment.balitaan_na_lang_kita",
    "balitaan na lang kita",
    "VAGUE_COMMITMENT",
    "taglish",
    "info",
    "\"I'll update you.\"",
  ),

  // ---------------------------------------------------------------------
  // Lead signals: VAGUE_TIMING (design §5.5, §5.6)
  // ---------------------------------------------------------------------
  e("vague_timing.soon", "soon", "VAGUE_TIMING", "en", "info", "No fixed start; unanimity principle applies (§5.6)."),
  e("vague_timing.after_the_holidays", "after the holidays", "VAGUE_TIMING", "en", "info", "Vague window."),
  e("vague_timing.later_this_year", "later this year", "VAGUE_TIMING", "en", "info", "Vague window."),
  e("vague_timing.next_quarter", "next quarter", "VAGUE_TIMING", "en", "info", "Vague window."),
  e("vague_timing.in_a_few_months", "in a few months", "VAGUE_TIMING", "en", "info", "Vague window."),
  e("vague_timing.early_next_year", "early next year", "VAGUE_TIMING", "en", "info", "Vague window."),

  // ---------------------------------------------------------------------
  // Lead signals: VAGUE_URGENCY (design §5.13 — never a deadline by itself)
  // ---------------------------------------------------------------------
  e("vague_urgency.asap", "asap", "VAGUE_URGENCY", "en", "info", "Not a concrete deadline by itself."),
  e("vague_urgency.urgent", "urgent", "VAGUE_URGENCY", "en", "info", "Not a concrete deadline by itself."),
  e("vague_urgency.when_you_can", "when you can", "VAGUE_URGENCY", "en", "info", "Not a concrete deadline."),

  // ---------------------------------------------------------------------
  // Lead signals: AUTO_REPLY (design DL-10)
  // ---------------------------------------------------------------------
  e("auto_reply.out_of_office", "out of the office", "AUTO_REPLY", "en", "info", "Automated reply, not a real reply."),
  e("auto_reply.out_of_office_hyphen", "out-of-office", "AUTO_REPLY", "en", "info", "Automated reply."),
  e("auto_reply.automatic_reply", "automatic reply", "AUTO_REPLY", "en", "info", "Automated reply."),
  e("auto_reply.auto_reply", "auto-reply", "AUTO_REPLY", "en", "info", "Automated reply."),

  // ---------------------------------------------------------------------
  // Lead signals: CHANNEL_PREFERENCE (negative guard vs OPT_OUT)
  // ---------------------------------------------------------------------
  raw(
    "channel_preference.dont_text_me",
    /\b(don'?t|do not)\s+text\s+me\b/iu,
    "CHANNEL_PREFERENCE",
    "en",
    "info",
    "A channel switch, not a stop request.",
  ),
  raw(
    "channel_preference.email_instead",
    /\bemail\s+(is\s+better|instead)\b/iu,
    "CHANNEL_PREFERENCE",
    "en",
    "info",
    "A channel switch, not a stop request.",
  ),
  raw(
    "channel_preference.call_me_instead",
    /\bcall\s+me\s+instead\b/iu,
    "CHANNEL_PREFERENCE",
    "en",
    "info",
    "A channel switch, not a stop request.",
  ),

  // ---------------------------------------------------------------------
  // User signals: USER_ASSUMPTION (design §4.3 userAssumptions)
  // ---------------------------------------------------------------------
  e("user_assumption.ghosting", "ghosting", "USER_ASSUMPTION", "en", "info", "Unsupported claim about the lead's state."),
  e("user_assumption.ghosted", "ghosted", "USER_ASSUMPTION", "en", "info", "Unsupported claim."),
  e("user_assumption.dodging", "dodging", "USER_ASSUMPTION", "en", "info", "Unsupported claim."),
  e(
    "user_assumption.obviously_interested",
    "obviously interested",
    "USER_ASSUMPTION",
    "en",
    "info",
    "Unsupported claim.",
  ),
  e("user_assumption.just_busy", "just busy", "USER_ASSUMPTION", "en", "info", "Unsupported claim."),

  // ---------------------------------------------------------------------
  // User signals: USER_PRESSURE
  // ---------------------------------------------------------------------
  e("user_pressure.i_need_this_deal", "need this deal", "USER_PRESSURE", "en", "info", "Internal urgency; never changes the decision."),
  e("user_pressure.my_boss_wants_it", "my boss wants", "USER_PRESSURE", "en", "info", "Internal urgency."),
  e("user_pressure.my_boss_is_on_me", "my boss is on me", "USER_PRESSURE", "en", "info", "Internal urgency."),
  e(
    "user_pressure.manager_needs_this",
    "manager needs this",
    "USER_PRESSURE",
    "en",
    "info",
    "Internal urgency.",
  ),
  e(
    "user_pressure.manager_wants",
    "manager wants",
    "USER_PRESSURE",
    "en",
    "info",
    "Internal urgency (\"my manager wants an answer this week\").",
  ),
  e(
    "user_pressure.need_to_close_this_deal",
    "need to close this deal",
    "USER_PRESSURE",
    "en",
    "info",
    "Internal urgency.",
  ),

  // ---------------------------------------------------------------------
  // User signals: DEAL_LABEL
  // ---------------------------------------------------------------------
  e("deal_label.hot_lead", "hot lead", "DEAL_LABEL", "en", "info", "Deal label; never changes the decision."),
  e("deal_label.vip", "vip", "DEAL_LABEL", "en", "info", "Deal label."),
  e("deal_label.huge_account", "huge account", "DEAL_LABEL", "en", "info", "Deal label."),
  e("deal_label.big_account", "big account", "DEAL_LABEL", "en", "info", "Deal label."),
  e("deal_label.high_intent", "high intent", "DEAL_LABEL", "en", "info", "Deal label."),

  // ---------------------------------------------------------------------
  // User signals: MESSAGE_FIRST_REQUEST / DISGUISE_REQUEST (spec §29 traps)
  // ---------------------------------------------------------------------
  raw(
    "message_first.write_me",
    /\bwrite\s+me\b/iu,
    "MESSAGE_FIRST_REQUEST",
    "en",
    "info",
    "Asks for a message before a decision; the prompt must still decide first.",
  ),
  raw(
    "message_first.write_a_x",
    /\bwrite\s+(a|one)\b[^.?!\n]{0,40}\b(follow[\s-]?up|check[\s-]?in|email)\b/iu,
    "MESSAGE_FIRST_REQUEST",
    "en",
    "info",
    "Asks for a message before a decision.",
  ),
  raw(
    "message_first.follow_up_with",
    /\bfollow\s+up\s+with\b/iu,
    "MESSAGE_FIRST_REQUEST",
    "en",
    "info",
    "Asks for the follow-up itself, before a decision.",
  ),
  raw(
    "message_first.what_do_i_say",
    /\bwhat\s+(do|should)\s+i\s+say\b/iu,
    "MESSAGE_FIRST_REQUEST",
    "en",
    "info",
    "Asks for a message before a decision.",
  ),
  raw(
    "disguise.not_look_like_a_follow_up",
    /\b(make\s+it\s+)?(not\s+)?look\s+like\s+a\s+follow[\s-]?up\b/iu,
    "DISGUISE_REQUEST",
    "en",
    "warning",
    "Asks to hide that this is a follow-up; must still be decided honestly (spec §29).",
  ),

  // ---------------------------------------------------------------------
  // Prompt injection (design §7.4 step 4)
  // ---------------------------------------------------------------------
  raw(
    "injection.ignore_instructions",
    /\bignore\s+(all|previous|prior)\s+instructions\b/iu,
    "INSTRUCTION_IN_DATA",
    "en",
    "warning",
    "Pasted text tries to override the prompt.",
  ),
  raw(
    "injection.system_prompt",
    /\bsystem\s+prompt\b/iu,
    "INSTRUCTION_IN_DATA",
    "en",
    "warning",
    "Pasted text references the system prompt.",
  ),
  raw(
    "injection.you_are_now",
    /\byou\s+are\s+now\b/iu,
    "INSTRUCTION_IN_DATA",
    "en",
    "warning",
    "Attempted role reassignment.",
  ),
  raw(
    "injection.assistant_colon",
    /\bassistant\s*:/iu,
    "INSTRUCTION_IN_DATA",
    "en",
    "warning",
    "Fake transcript / role marker.",
  ),
  raw(
    "injection.developer_mode",
    /\bdeveloper\s+mode\b/iu,
    "INSTRUCTION_IN_DATA",
    "en",
    "warning",
    "Jailbreak attempt.",
  ),
  raw(
    "injection.respond_only_with",
    /\brespond\s+only\s+with\b/iu,
    "INSTRUCTION_IN_DATA",
    "en",
    "warning",
    "Attempted output hijack.",
  ),

  // =======================================================================
  // Message anti-patterns (design §9.6; used by src/validate.ts in P1b)
  // =======================================================================

  // VAGUE_CHECKIN
  e("vague_checkin.just_checking_in", "just checking in", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.just_following_up", "just following up", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.touching_base", "touching base", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.circling_back", "circling back", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.bumping_this", "bumping this", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.any_updates", "any updates", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.any_update", "any update", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e(
    "vague_checkin.did_you_get_a_chance_to",
    "did you get a chance to",
    "VAGUE_CHECKIN",
    "en",
    "warning",
    "Content-free check-in.",
  ),
  e(
    "vague_checkin.did_you_see_my_email",
    "did you see my email",
    "VAGUE_CHECKIN",
    "en",
    "warning",
    "Content-free check-in.",
  ),
  e("vague_checkin.per_my_last_email", "per my last email", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e("vague_checkin.as_i_mentioned", "as i mentioned", "VAGUE_CHECKIN", "en", "warning", "Content-free check-in."),
  e(
    "vague_checkin.friendly_reminder",
    "friendly reminder",
    "VAGUE_CHECKIN",
    "en",
    "warning",
    "OK only when tied to a real date; flagged for the validator to check context.",
  ),
  e(
    "vague_checkin.gentle_reminder",
    "gentle reminder",
    "VAGUE_CHECKIN",
    "en",
    "warning",
    "OK only when tied to a real date.",
  ),
  e(
    "vague_checkin.follow_up_ko_lang_po",
    "follow up ko lang po",
    "VAGUE_CHECKIN",
    "taglish",
    "warning",
    "\"Just following up.\"",
  ),
  e("vague_checkin.update_po", "update po?", "VAGUE_CHECKIN", "taglish", "warning", "\"Any update?\""),
  e("vague_checkin.bump_po", "bump po", "VAGUE_CHECKIN", "taglish", "warning", "\"Bumping this.\""),

  // GUILT
  e("guilt.havent_heard_back", "haven't heard back", "GUILT", "en", "warning", "Guilt-trip phrasing."),
  e("guilt.never_heard_back", "never heard back", "GUILT", "en", "warning", "Guilt-trip phrasing."),
  e("guilt.you_havent_replied", "you haven't replied", "GUILT", "en", "warning", "Guilt-trip phrasing."),
  e(
    "guilt.reached_out_several_times",
    "reached out several times",
    "GUILT",
    "en",
    "warning",
    "Counts follow-ups at the lead (spec §21).",
  ),
  e("guilt.im_sure_youre_busy", "i'm sure you're busy", "GUILT", "en", "warning", "Guilt-trip phrasing."),
  e(
    "guilt.sorry_to_bother_you_again",
    "sorry to bother you again",
    "GUILT",
    "en",
    "warning",
    "Guilt-trip phrasing.",
  ),
  e(
    "guilt.dont_want_to_be_a_pest",
    "don't want to be a pest",
    "GUILT",
    "en",
    "warning",
    "Guilt-trip phrasing.",
  ),
  e("guilt.left_me_on_read", "left me on read", "GUILT", "en", "warning", "Guilt-trip / read-receipt phrasing."),
  raw(
    "guilt.you_missed_your_deadline",
    /\byou\s+missed\s+(your|the)\s+deadline\b/iu,
    "GUILT",
    "en",
    "warning",
    "Blames the lead for an expired commitment, instead of stating it neutrally (design §9.2 E_GUILT, OI-020).",
  ),
  e("guilt.i_saw_you_read", "i saw you read", "GUILT", "en", "warning", "Read-receipt guilt."),
  e("guilt.nag_seen_ka_lang", "nag-seen ka lang", "GUILT", "taglish", "warning", "\"You just left me on seen.\""),
  e(
    "guilt.hindi_ka_na_nagreply",
    "hindi ka na nagreply",
    "GUILT",
    "taglish",
    "warning",
    "\"You stopped replying.\"",
  ),
  e("guilt.pinaasa", "pinaasa", "GUILT", "taglish", "warning", "\"[You] got my hopes up.\""),

  // FAKE_URGENCY
  e("fake_urgency.last_chance", "last chance", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),
  e("fake_urgency.final_offer", "final offer", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),
  e("fake_urgency.act_now", "act now", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),
  e("fake_urgency.dont_miss_out", "don't miss out", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),
  e(
    "fake_urgency.before_its_too_late",
    "before it's too late",
    "FAKE_URGENCY",
    "en",
    "error",
    "Manufactured urgency.",
  ),
  e("fake_urgency.hurry", "hurry", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),
  e("fake_urgency.today_only", "today only", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),
  e("fake_urgency.limited_time", "limited time", "FAKE_URGENCY", "en", "error", "Manufactured urgency."),

  // FAKE_SCARCITY
  raw(
    "fake_scarcity.only_n_spots_left",
    /\bonly\s+\d+\s+(spots?|slots?|seats?)\s+left\b/iu,
    "FAKE_SCARCITY",
    "en",
    "error",
    "Manufactured scarcity.",
  ),
  e("fake_scarcity.almost_full", "almost full", "FAKE_SCARCITY", "en", "error", "Manufactured scarcity."),
  e(
    "fake_scarcity.prices_going_up",
    "prices going up",
    "FAKE_SCARCITY",
    "en",
    "error",
    "Manufactured scarcity.",
  ),
  e(
    "fake_scarcity.calendar_filling_up",
    "my calendar is filling up",
    "FAKE_SCARCITY",
    "en",
    "error",
    "Manufactured scarcity.",
  ),
  e(
    "fake_scarcity.last_na_po_ito",
    "last na po ito",
    "FAKE_SCARCITY",
    "taglish",
    "error",
    "\"This is the last one.\"",
  ),
  e(
    "fake_scarcity.ubos_na_po_ang_slots",
    "ubos na po ang slots",
    "FAKE_SCARCITY",
    "taglish",
    "error",
    "\"The slots are running out.\"",
  ),

  // PRESUMPTION
  e(
    "presumption.take_that_as_a_no",
    "take that as a no",
    "PRESUMPTION",
    "en",
    "error",
    "Presumes the lead's answer.",
  ),
  e("presumption.ill_assume", "i'll assume", "PRESUMPTION", "en", "error", "Presumes the lead's answer."),
  e(
    "presumption.should_i_close_your_file",
    "should i close your file",
    "PRESUMPTION",
    "en",
    "error",
    "Disguised restart / presumptive question.",
  ),
  e(
    "presumption.have_you_given_up",
    "have you given up",
    "PRESUMPTION",
    "en",
    "error",
    "Presumes the lead's state.",
  ),
  e(
    "presumption.eaten_by_an_alligator",
    "eaten by an alligator",
    "PRESUMPTION",
    "en",
    "error",
    "Flippant presumption.",
  ),
  e(
    "presumption.fell_off_the_face_of_the_earth",
    "fell off the face of the earth",
    "PRESUMPTION",
    "en",
    "error",
    "Presumes the lead's state.",
  ),
  e(
    "presumption.you_must_have_forgotten",
    "you must have forgotten",
    "PRESUMPTION",
    "en",
    "error",
    "Presumes the lead's state.",
  ),
  e(
    "presumption.i_know_youre_interested",
    "i know you're interested",
    "PRESUMPTION",
    "en",
    "error",
    "Invented interest (spec §20).",
  ),
  e(
    "presumption.i_noticed_you_opened",
    "i noticed you opened",
    "PRESUMPTION",
    "en",
    "error",
    "Tracking-based guilt.",
  ),
  e(
    "presumption.you_were_so_excited",
    "you were so excited",
    "PRESUMPTION",
    "en",
    "error",
    "Invented interest not stated by the lead (e.g. \"since you were so excited about the proposal\").",
  ),

  // ASSUMED_OBJECTION
  e(
    "assumed_objection.budget_might_be_a_concern",
    "budget might be a concern",
    "ASSUMED_OBJECTION",
    "en",
    "error",
    "Invents an objection the lead never raised.",
  ),
  e(
    "assumed_objection.understand_if_budget",
    "understand if budget",
    "ASSUMED_OBJECTION",
    "en",
    "error",
    "Invents an objection.",
  ),

  // DISGUISED_RESTART (CLOSE_LOOP only; structural checks — "?" and links — live in validate.ts)
  e("disguised_restart.let_me_know_if", "let me know if", "DISGUISED_RESTART", "en", "error", "Reopens the chase in a close-out message."),
  e("disguised_restart.just_reply", "just reply", "DISGUISED_RESTART", "en", "error", "Reopens the chase."),
  raw(
    "disguised_restart.reply_digit",
    /\breply\s+[123]\b/iu,
    "DISGUISED_RESTART",
    "en",
    "error",
    "Reopens the chase.",
  ),
  raw(
    "disguised_restart.ill_check_back",
    /\bi(?:'ll| will)\s+check\s+back\b/iu,
    "DISGUISED_RESTART",
    "en",
    "error",
    "Promises future contact by the user (breaks the close) — a CLOSE_LOOP message must not restart the sequence.",
  ),
  e("disguised_restart.before_i_go", "before i go", "DISGUISED_RESTART", "en", "error", "Reopens the chase."),
  e("disguised_restart.one_last_thing", "one last thing", "DISGUISED_RESTART", "en", "error", "Reopens the chase."),
  e(
    "disguised_restart.want_me_to_check_back",
    "want me to check back",
    "DISGUISED_RESTART",
    "en",
    "error",
    "Promises future contact.",
  ),
  e(
    "disguised_restart.reply_lang_po",
    "reply lang po",
    "DISGUISED_RESTART",
    "taglish",
    "error",
    "\"Just reply.\"",
  ),
  e(
    "disguised_restart.pwede_ko_po_ba_i_follow_up_ulit",
    "pwede ko po ba kayong i-follow up ulit",
    "DISGUISED_RESTART",
    "taglish",
    "error",
    "\"May I follow up with you again?\"",
  ),

  // ATTRIBUTION (invented history; a fake "Re:" is structural — checked in validate.ts)
  e("attribution.as_we_discussed", "as we discussed", "ATTRIBUTION", "en", "error", "Invented prior conversation."),
  e("attribution.per_our_call", "per our call", "ATTRIBUTION", "en", "error", "Invented prior conversation."),
  e("attribution.like_you_mentioned", "like you mentioned", "ATTRIBUTION", "en", "error", "Invented prior conversation."),
  raw(
    "attribution.you_promised",
    /\byou\s+promised\b/iu,
    "ATTRIBUTION",
    "en",
    "error",
    "Attributes a specific promise to the lead; state what they said neutrally instead (design §9.2 E_UNSUPPORTED_ATTRIBUTION, OI-020).",
  ),
  raw("attribution.you_said", /\byou\s+said\b/iu, "ATTRIBUTION", "en", "error", "Attributes specific words to the lead."),
  raw("attribution.you_mentioned", /\byou\s+mentioned\b/iu, "ATTRIBUTION", "en", "error", "Attributes specific words to the lead."),
  raw("attribution.you_told_me", /\byou\s+told\s+me\b/iu, "ATTRIBUTION", "en", "error", "Attributes specific words to the lead."),
];
