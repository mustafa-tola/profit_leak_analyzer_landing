import { describe, expect, it } from 'vitest';
import { addDays, parseDate } from '../dates';

describe('ISO date handling', () => {
  it('accepts real calendar dates', () => {
    expect(parseDate('2026-10-30')).toEqual({ ok: true, blank: false, value: '2026-10-30' });
  });

  it('rejects impossible dates', () => {
    expect(parseDate('2026-02-30').ok).toBe(false);
    expect(parseDate('2025-02-29').ok).toBe(false);
    expect(parseDate('2024-02-29').ok).toBe(true);
  });

  it('treats blank dates as unknown', () => {
    expect(parseDate('')).toEqual({ ok: true, blank: true, value: null });
  });

  it('adds settlement days across month boundaries', () => {
    expect(addDays('2026-10-03', 7)).toBe('2026-10-10');
    expect(addDays('2026-12-30', 7)).toBe('2027-01-06');
  });
});
