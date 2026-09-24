import { describe, expect, it } from "vitest";
import { groundingText, isGrounded, normalize, similarity } from "../../src/grounding.js";
import { baseCaseInput } from "../testUtil.js";

describe("normalize", () => {
  it("lower-cases, straightens smart quotes, collapses whitespace, strips edge punctuation", () => {
    expect(normalize('  "Hello   World!"  ')).toBe("hello world");
  });

  it("is NFKC-normalizing", () => {
    // "ﬁ" (U+FB01, ligature) NFKC-decomposes to "fi".
    expect(normalize("ﬁle")).toBe("file");
  });
});

describe("isGrounded", () => {
  const caseText = "Hi, thanks for the proposal. I'll review it with my partner and get back to you.";

  it("exact match", () => {
    const g = isGrounded("I'll review it with my partner", caseText);
    expect(g.status).toBe("exact");
    expect(g.score).toBe(1);
  });

  it("is case- and whitespace-insensitive", () => {
    const g = isGrounded("i'll REVIEW it   with my partner", caseText);
    expect(g.status).toBe("exact");
  });

  it("ellipsis: each segment of 3+ chars must appear, in order", () => {
    const g = isGrounded("thanks for the proposal ... get back to you", caseText);
    expect(g.status).toBe("exact");
  });

  it("ellipsis fails if the segments are out of order", () => {
    const g = isGrounded("get back to you ... thanks for the proposal", caseText);
    expect(g.status).not.toBe("exact");
  });

  it("paraphrase: similarity >= 0.9 is a warning-level match", () => {
    const g = isGrounded("Ill review it with my partner", caseText); // missing apostrophe
    expect(g.status).toBe("paraphrased");
    expect(g.score).toBeGreaterThanOrEqual(0.9);
  });

  it("unrelated quote is ungrounded", () => {
    const g = isGrounded("we need a bigger team before we can decide", caseText);
    expect(g.status).toBe("ungrounded");
    expect(g.score).toBeLessThan(0.9);
  });

  it("an empty quote is trivially grounded", () => {
    expect(isGrounded("", caseText).status).toBe("exact");
  });
});

describe("similarity (word-trigram Jaccard)", () => {
  it("identical texts have similarity 1", () => {
    expect(similarity("just checking in on the proposal", "just checking in on the proposal")).toBe(1);
  });

  it("completely different texts have low similarity", () => {
    expect(similarity("just checking in on the proposal", "the weather is nice today")).toBeLessThan(0.2);
  });

  it("a lightly reworded message keeps middling-to-high similarity", () => {
    const a = "just checking in on the proposal any update";
    const b = "just checking in on the proposal any updates";
    expect(similarity(a, b)).toBeGreaterThan(0.5);
  });
});

describe("groundingText", () => {
  it("raw mode returns the sanitized raw text", () => {
    expect(groundingText({ raw: "hello​ world" })).toBe("hello world");
  });

  it("Desk mode renders the case's pasted fields and free-text form answers", () => {
    const caseInput = baseCaseInput({
      leadMessages: "Can you send pricing?",
      notes: "they seem interested",
      owed: { answer: "YES", text: "pricing question" },
    });
    const text = groundingText({ caseInput });
    expect(text).toContain("Can you send pricing?");
    expect(text).toContain("they seem interested");
    expect(text).toContain("pricing question");
  });

  it("returns an empty string with neither caseInput nor raw", () => {
    expect(groundingText({})).toBe("");
  });
});
