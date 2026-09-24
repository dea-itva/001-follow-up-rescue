import { describe, expect, it } from "vitest";
import { pseudonymize, redact, restoreNames } from "../../src/redact.js";

describe("redact", () => {
  it("replaces email addresses", () => {
    expect(redact("Reach me at ana.cruz@example.com please.")).toBe("Reach me at [email] please.");
  });

  it("replaces PH phone numbers", () => {
    expect(redact("Call +63 917 123 4567 or 0917-123-4567.")).toBe("Call [phone] or [phone].");
  });

  it("replaces US phone numbers", () => {
    expect(redact("Call (555) 123-4567 today.")).toBe("Call [phone] today.");
  });

  it("replaces URLs", () => {
    expect(redact("Book here: https://calendly.com/me/10min")).toBe("Book here: [link]");
    expect(redact("See www.example.com/pricing")).toBe("See [link]");
  });

  it("replaces multiple kinds of contact detail in one pass", () => {
    const out = redact("Email ana@example.com or call 0917-123-4567, or see https://example.com");
    expect(out).toBe("Email [email] or call [phone], or see [link]");
  });
});

describe("pseudonymize / restoreNames", () => {
  const names = { lead: "Ana", me: "Sam", business: "Casa Verde" };

  it("replaces the lead's, the user's and the business's names, whole-word and case-insensitively", () => {
    const out = pseudonymize("hi ANA, this is sam from Casa Verde.", names);
    expect(out).toBe("hi [LEAD], this is [ME] from [BUSINESS].");
  });

  it('does not touch "Banana" when the name is "Ana"', () => {
    expect(pseudonymize("I like Banana bread.", names)).toBe("I like Banana bread.");
  });

  it('replaces the longest name first, so a shorter name does not pre-empt a longer one that contains it ("Ana Cruz" before "Ana")', () => {
    // The business name contains the lead's first name as its own first word;
    // if the shorter "Ana" were substituted first, it would eat into the
    // business name and "Ana Cruz Design" would never match as a whole.
    const collidingNames = { lead: "Ana", me: "Sam", business: "Ana Cruz Design" };
    const out = pseudonymize("Hi Ana, this is Sam from Ana Cruz Design.", collidingNames);
    expect(out).toBe("Hi [LEAD], this is [ME] from [BUSINESS].");
  });

  it("restore round-trips exactly", () => {
    const original = "Hi Ana, this is Sam from Casa Verde. Ana, let me know!";
    const pseudo = pseudonymize(original, names);
    expect(pseudo).not.toContain("Ana");
    const restored = restoreNames(pseudo, names);
    expect(restored).toBe(original);
  });

  it("blank name fields are ignored", () => {
    const out = pseudonymize("Hi Ana, no business name here.", { lead: "Ana", me: "", business: "" });
    expect(out).toBe("Hi [LEAD], no business name here.");
  });
});
