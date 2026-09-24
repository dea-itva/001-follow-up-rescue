/**
 * Pure date math on `YYYY-MM-DD` strings (design §3.3).
 * All arithmetic is done in UTC to avoid time-zone drift: a "YYYY-MM-DD" string
 * is parsed as a UTC midnight instant and never touches the local clock.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Parses a `YYYY-MM-DD` string into a UTC-midnight `Date`. Throws on malformed input. */
export function parseDate(date: string): Date {
  const m = DATE_RE.exec(date);
  if (!m) {
    throw new Error(`Invalid date string: ${JSON.stringify(date)}`);
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  // Guard against overflowing inputs like 2026-02-30, which Date.UTC silently rolls over.
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new Error(`Invalid calendar date: ${JSON.stringify(date)}`);
  }
  return d;
}

/** Formats a UTC-midnight `Date` back to `YYYY-MM-DD`. */
export function formatDate(d: Date): string {
  const year = String(d.getUTCFullYear()).padStart(4, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Compares two `YYYY-MM-DD` dates: negative if a < b, zero if equal, positive if a > b. */
export function compareDates(a: string, b: string): number {
  const da = parseDate(a).getTime();
  const db = parseDate(b).getTime();
  if (da < db) return -1;
  if (da > db) return 1;
  return 0;
}

/** The weekday name ("Thursday", …) for a `YYYY-MM-DD` date. */
export function weekdayName(date: string): string {
  const idx = parseDate(date).getUTCDay();
  const name = WEEKDAY_NAMES[idx];
  if (name === undefined) throw new Error("unreachable: getUTCDay() out of range");
  return name;
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Adds `n` business days (Mon–Fri) to a `YYYY-MM-DD` date, skipping weekends.
 * `n` must be a non-negative integer. A Friday + 1 business day → the following Monday.
 */
export function addBusinessDays(date: string, n: number): string {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`addBusinessDays: n must be a non-negative integer, got ${n}`);
  }
  let d = parseDate(date);
  let remaining = n;
  while (remaining > 0) {
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    if (!isWeekend(d)) remaining -= 1;
  }
  return formatDate(d);
}

/** Adds `n` calendar days (may be negative) to a `YYYY-MM-DD` date. */
export function addDays(date: string, n: number): string {
  const d = parseDate(date);
  return formatDate(new Date(d.getTime() + n * 24 * 60 * 60 * 1000));
}

/** True if `date` is a syntactically and calendrically valid `YYYY-MM-DD` string. */
export function isValidDate(date: string): boolean {
  try {
    parseDate(date);
    return true;
  } catch {
    return false;
  }
}
