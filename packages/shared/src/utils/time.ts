/**
 * CommutePool — IST ↔ UTC timezone helpers
 *
 * Rules (TECH_DECISIONS.md):
 *   - All DB timestamps are UTC.
 *   - Departure windows are stored as "HH:MM" IST strings.
 *   - week_start_date = Monday of the target week (DATE).
 *   - days arrays: 0 = Sunday … 6 = Saturday.
 *   - NO inline conversions anywhere else in the codebase — all IST↔UTC
 *     logic goes through this module.
 *   - No external dependencies.
 */

const IST_OFFSET_MINUTES = 330; // UTC+5:30

/**
 * Convert an IST "HH:MM" string on a given date (ISO YYYY-MM-DD) to a
 * UTC Date object.
 *
 * @param dateISO  - Date in IST calendar, e.g. "2026-06-16"
 * @param hhmm     - Time in IST, e.g. "07:30"
 * @returns UTC Date representing that moment
 */
export function istHHMMToUtcDate(dateISO: string, hhmm: string): Date {
  const [year, month, day] = dateISO.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const [hours, minutes] = hhmm.split(":").map(Number) as [number, number];

  // Construct as if it were UTC, then subtract IST offset to get real UTC.
  const utcMs =
    Date.UTC(year, month - 1, day, hours, minutes) -
    IST_OFFSET_MINUTES * 60 * 1000;

  return new Date(utcMs);
}

/**
 * Convert a UTC Date to an IST "HH:MM" string.
 *
 * @param d - Any Date (stored as UTC)
 * @returns "HH:MM" in IST, zero-padded
 */
export function utcDateToIstHHMM(d: Date): string {
  const istMs = d.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const hh = String(istDate.getUTCHours()).padStart(2, "0");
  const mm = String(istDate.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Return the number of whole minutes from `from` (default: now) until `target`.
 * Returns a negative number if `target` is in the past.
 *
 * @param target - Future (or past) moment
 * @param from   - Reference point; defaults to new Date()
 */
export function minutesUntil(target: Date, from: Date = new Date()): number {
  return Math.floor((target.getTime() - from.getTime()) / (60 * 1000));
}

/**
 * Given any Date, return the ISO date string (YYYY-MM-DD) of the Monday of
 * that week in IST.
 *
 * CommutePool week convention: week_start_date is always a Monday.
 * days[] uses 0=Sunday…6=Saturday, so Monday = 1.
 *
 * @param d - Any Date
 * @returns YYYY-MM-DD string (Monday, IST calendar)
 */
export function getWeekStartMonday(d: Date): string {
  // Shift to IST to get the correct calendar date.
  const istMs = d.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const ist = new Date(istMs);

  // getUTCDay() on an IST-shifted date gives the IST day-of-week.
  const dow = ist.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat

  // Days to subtract to land on Monday (dow=1).
  // Sunday (0) → go back 6 days; Monday (1) → 0; Tuesday (2) → 1; etc.
  const daysBack = dow === 0 ? 6 : dow - 1;

  const mondayMs = istMs - daysBack * 24 * 60 * 60 * 1000;
  const monday = new Date(mondayMs);

  const yyyy = monday.getUTCFullYear();
  const mm = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(monday.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}
