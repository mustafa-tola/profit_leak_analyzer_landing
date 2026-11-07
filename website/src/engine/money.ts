/**
 * Integer-paisa money helpers.
 *
 * Financial values never pass through IEEE-754 arithmetic. Imported decimal
 * strings are converted to bigint paisa, and every aggregation is bigint.
 */

export type MoneyParseResult =
  | { ok: true; blank: true; value: null }
  | { ok: true; blank: false; value: bigint }
  | { ok: false; code: 'INVALID_AMOUNT' | 'TOO_MANY_DECIMALS'; message: string };

const MAX_INTEGER_DIGITS = 13;

export function parseMoney(raw: unknown): MoneyParseResult {
  const text = raw === undefined || raw === null ? '' : String(raw).trim();
  if (text === '') return { ok: true, blank: true, value: null };

  let normalised = text;
  if (normalised.includes(',')) {
    if (!/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(normalised)) {
      return {
        ok: false,
        code: 'INVALID_AMOUNT',
        message: 'Invalid thousands separators',
      };
    }
    normalised = normalised.replace(/,/g, '');
  }

  if (/^-?\d+\.\d{3,}$/.test(normalised)) {
    return {
      ok: false,
      code: 'TOO_MANY_DECIMALS',
      message: 'More than 2 decimal places',
    };
  }

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalised)) {
    return {
      ok: false,
      code: 'INVALID_AMOUNT',
      message: 'Not a valid PKR amount',
    };
  }

  const negative = normalised.startsWith('-');
  const body = negative ? normalised.slice(1) : normalised;
  const [rawInteger, rawFraction = ''] = body.split('.');
  const integerPart = rawInteger.replace(/^0+(?=\d)/, '');
  if (integerPart.length > MAX_INTEGER_DIGITS) {
    return {
      ok: false,
      code: 'INVALID_AMOUNT',
      message: 'Amount too large for exact integer arithmetic',
    };
  }

  const fraction = rawFraction.padEnd(2, '0');
  let value = BigInt(integerPart) * 100n + BigInt(fraction);
  if (negative && value !== 0n) value = -value;

  return { ok: true, blank: false, value };
}

export function paisaToDecimalString(paisa: bigint | null | undefined): string | null {
  if (paisa === null || paisa === undefined) return null;
  const negative = paisa < 0n;
  const absolute = negative ? -paisa : paisa;
  const rupees = absolute / 100n;
  const cents = absolute % 100n;
  return `${negative ? '-' : ''}${rupees}.${cents.toString().padStart(2, '0')}`;
}

export function formatPkr(paisa: bigint | null | undefined): string {
  if (paisa === null || paisa === undefined) return 'Unknown';
  const negative = paisa < 0n;
  const absolute = negative ? -paisa : paisa;
  const rupees = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cents = (absolute % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}PKR ${rupees}.${cents}`;
}

export function sumKnown(values: Array<bigint | null | undefined>): bigint {
  return values.reduce<bigint>((total, value) => total + (value ?? 0n), 0n);
}

export function maxZero(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

export function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}
