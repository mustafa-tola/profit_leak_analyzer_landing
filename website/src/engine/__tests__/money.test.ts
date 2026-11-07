import { describe, expect, it } from 'vitest';
import {
  formatPkr,
  paisaToDecimalString,
  parseMoney,
  sumKnown,
} from '../money';

describe('integer-paisa money', () => {
  it('parses two-decimal PKR exactly', () => {
    expect(parseMoney('1234.56')).toEqual({ ok: true, blank: false, value: 123456n });
  });

  it('parses whole rupees and thousands separators', () => {
    expect(parseMoney('1,234')).toEqual({ ok: true, blank: false, value: 123400n });
    expect(parseMoney('1,234.50')).toEqual({ ok: true, blank: false, value: 123450n });
  });

  it('normalises negative amounts', () => {
    expect(parseMoney('-10.05')).toEqual({ ok: true, blank: false, value: -1005n });
    expect(parseMoney('-0.00')).toEqual({ ok: true, blank: false, value: 0n });
  });

  it('rejects more than two decimal places', () => {
    const result = parseMoney('100.123');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TOO_MANY_DECIMALS');
  });

  it('rejects malformed amounts and separators', () => {
    for (const raw of ['12.3.4', 'abc', '1,23.00', '']) {
      const result = parseMoney(raw);
      if (raw === '') {
        expect(result).toEqual({ ok: true, blank: true, value: null });
      } else {
        expect(result.ok).toBe(false);
      }
    }
  });

  it('keeps blank money unknown instead of zero', () => {
    expect(parseMoney('')).toEqual({ ok: true, blank: true, value: null });
    expect(parseMoney('   ')).toEqual({ ok: true, blank: true, value: null });
  });

  it('aggregates without floating-point drift', () => {
    const values = Array.from({ length: 1000 }, () => parseMoney('0.10'));
    const total = sumKnown(
      values.map((value) => (value.ok && !value.blank ? value.value : null)),
    );
    expect(total).toBe(10000n);
    expect(paisaToDecimalString(total)).toBe('100.00');
  });

  it('formats PKR from integer paisa', () => {
    expect(formatPkr(55696000n)).toBe('PKR 556,960.00');
    expect(formatPkr(-1005n)).toBe('-PKR 10.05');
    expect(formatPkr(null)).toBe('Unknown');
  });
});
