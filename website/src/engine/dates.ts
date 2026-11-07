/**
 * Deterministic ISO calendar-date helpers.
 * Dates are stored and compared as YYYY-MM-DD strings; no local timezone is used.
 */

export type DateParseResult =
  | { ok: true; blank: true; value: null }
  | { ok: true; blank: false; value: string }
  | { ok: false; code: 'INVALID_DATE'; message: string };

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseDate(raw: unknown): DateParseResult {
  const text = raw === undefined || raw === null ? '' : String(raw).trim();
  if (text === '') return { ok: true, blank: true, value: null };

  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(
      text,
    );
  if (!match) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: 'Date must be ISO YYYY-MM-DD or ISO datetime',
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return { ok: false, code: 'INVALID_DATE', message: 'Not a real calendar date' };
  }

  if (match[4] !== undefined) {
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const seconds = match[6] !== undefined ? Number(match[6]) : 0;
    if (hours > 23 || minutes > 59 || seconds > 59) {
      return {
        ok: false,
        code: 'INVALID_DATE',
        message: 'Invalid time component',
      };
    }
  }

  return { ok: true, blank: false, value: `${match[1]}-${match[2]}-${match[3]}` };
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day) + days * 86_400_000;
  const date = new Date(timestamp);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}
