import { describe, expect, it } from "vitest";
import { sanitize, stripInvisible } from "../../src/sanitize.js";

describe("sanitize / stripInvisible", () => {
  it("strips the BOM", () => {
    expect(stripInvisible("﻿hello")).toBe("hello");
  });

  it("strips zero-width characters", () => {
    expect(stripInvisible("he​llo‌‍⁠")).toBe("hello");
  });

  it("strips bidi controls", () => {
    expect(stripInvisible("a‪b‫c‬d‭d‮e⁦f⁩")).toBe("abcddef");
  });

  it("strips the Unicode tag block", () => {
    expect(stripInvisible("hi\u{E0041}\u{E0042}there")).toBe("hithere");
  });

  it("leaves ordinary text untouched", () => {
    expect(stripInvisible("Hi Ana, thanks for the proposal.")).toBe("Hi Ana, thanks for the proposal.");
  });

  it("sanitize also normalizes NBSP and line endings", () => {
    expect(sanitize("a b\r\nc\rd")).toBe("a b\nc\nd");
  });
});
