import { describe, expect, it } from "vitest";
import { addBusinessDays, addDays, compareDates, isValidDate, weekdayName } from "../../src/dates.js";

describe("dates", () => {
  it("compareDates: equal, before, after", () => {
    expect(compareDates("2026-09-24", "2026-09-24")).toBe(0);
    expect(compareDates("2026-09-23", "2026-09-24")).toBeLessThan(0);
    expect(compareDates("2026-09-25", "2026-09-24")).toBeGreaterThan(0);
  });

  it("addBusinessDays skips weekends", () => {
    // 2026-09-24 is a Thursday.
    expect(addBusinessDays("2026-09-24", 1)).toBe("2026-09-25"); // Friday
    expect(addBusinessDays("2026-09-24", 2)).toBe("2026-09-28"); // Monday (skips Sat/Sun)
  });

  it("a Friday + 1 business day is the following Monday", () => {
    expect(addBusinessDays("2026-09-25", 1)).toBe("2026-09-28");
  });

  it("weekdayName for 2026-09-24 is Thursday", () => {
    expect(weekdayName("2026-09-24")).toBe("Thursday");
  });

  it("handles month rollover", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addBusinessDays("2026-09-29", 3)).toBe("2026-10-02"); // Tue -> Wed, Thu, Fri
  });

  it("handles year rollover", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("isValidDate", () => {
    expect(isValidDate("2026-09-24")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false); // Feb has no 30th in any year
    expect(isValidDate("not-a-date")).toBe(false);
  });
});
