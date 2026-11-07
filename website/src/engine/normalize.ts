/**
 * Stage 1: deterministic validation and normalization.
 * Ported from PLA Financial Engine v1.2.0 with bigint paisa.
 */

import { parseDate } from './dates';
import { parseMoney } from './money';
import type {
  EngineInput,
  EngineRow,
  EntryType,
  InvalidRow,
  NormalizedInput,
  NormalizedStatus,
  SourceName,
  ValidatedRecord,
  ValidationError,
} from './types';

export const ENGINE_VERSION = 'pla-engine-1.2.0';

type SourceSchema = {
  key: string;
  fields: string[];
  mandatory: string[];
  money: string[];
  dates: string[];
  refs: string[];
};

const SCHEMAS: Record<SourceName, SourceSchema> = {
  orders: {
    key: 'order_id',
    fields: ['seller_id', 'order_id', 'order_date', 'cod_amount_pkr', 'order_status', 'customer_ref', 'notes'],
    mandatory: ['seller_id', 'order_id', 'order_date', 'cod_amount_pkr', 'order_status'],
    money: ['cod_amount_pkr'],
    dates: ['order_date'],
    refs: ['order_id'],
  },
  shipments: {
    key: 'shipment_id',
    fields: [
      'seller_id',
      'shipment_id',
      'order_id',
      'tracking_number',
      'courier',
      'booked_date',
      'status',
      'status_date',
      'cod_collected_pkr',
      'contracted_delivery_fee_pkr',
      'contracted_rto_fee_pkr',
    ],
    mandatory: ['seller_id', 'shipment_id', 'order_id', 'tracking_number', 'courier', 'booked_date', 'status'],
    money: ['cod_collected_pkr', 'contracted_delivery_fee_pkr', 'contracted_rto_fee_pkr'],
    dates: ['booked_date', 'status_date'],
    refs: ['shipment_id', 'order_id', 'tracking_number', 'courier'],
  },
  settlements: {
    key: 'settlement_id',
    fields: [
      'seller_id',
      'settlement_id',
      'courier',
      'settlement_date',
      'entry_type',
      'gross_cod_pkr',
      'delivery_fees_pkr',
      'rto_fees_pkr',
      'other_deductions_pkr',
      'net_paid_pkr',
      'payment_reference',
    ],
    mandatory: [
      'seller_id',
      'settlement_id',
      'courier',
      'settlement_date',
      'entry_type',
      'gross_cod_pkr',
      'delivery_fees_pkr',
      'rto_fees_pkr',
      'other_deductions_pkr',
      'net_paid_pkr',
    ],
    money: [
      'gross_cod_pkr',
      'delivery_fees_pkr',
      'rto_fees_pkr',
      'other_deductions_pkr',
      'net_paid_pkr',
    ],
    dates: ['settlement_date'],
    refs: ['settlement_id', 'courier'],
  },
  allocations: {
    key: 'allocation_id',
    fields: [
      'seller_id',
      'allocation_id',
      'settlement_id',
      'tracking_number',
      'allocated_net_pkr',
      'allocated_cod_pkr',
      'allocated_delivery_fee_pkr',
      'allocated_rto_fee_pkr',
    ],
    mandatory: ['seller_id', 'allocation_id', 'settlement_id', 'tracking_number', 'allocated_net_pkr'],
    money: [
      'allocated_net_pkr',
      'allocated_cod_pkr',
      'allocated_delivery_fee_pkr',
      'allocated_rto_fee_pkr',
    ],
    dates: [],
    refs: ['allocation_id', 'settlement_id', 'tracking_number'],
  },
};

const SOURCES: SourceName[] = ['orders', 'shipments', 'settlements', 'allocations'];

const STATUS_MAP: Record<Exclude<NormalizedStatus, 'unknown'>, string[]> = {
  delivered: ['delivered', 'dlvd', 'delivery completed', 'completed'],
  returned: ['rto', 'returned', 'return to origin', 'returned to shipper', 'return delivered'],
  in_transit: ['booked', 'picked', 'picked up', 'in transit', 'out for delivery', 'arrived at hub'],
  cancelled: ['cancelled', 'canceled'],
  lost: ['lost', 'missing'],
};

function text(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeStatus(raw: unknown): NormalizedStatus {
  const key = text(raw).toLowerCase().replace(/[\s_-]+/g, ' ').trim();
  for (const status of Object.keys(STATUS_MAP) as Array<Exclude<NormalizedStatus, 'unknown'>>) {
    if (STATUS_MAP[status].includes(key)) return status;
  }
  return 'unknown';
}

function rawOf(row: EngineRow): Record<string, unknown> {
  if (row._raw && typeof row._raw === 'object') {
    return row._raw as Record<string, unknown>;
  }
  const out: Record<string, unknown> = {};
  Object.keys(row)
    .sort()
    .forEach((key) => {
      if (!key.startsWith('_')) out[key] = row[key];
    });
  return out;
}

function arrayOf(input: EngineInput, name: SourceName, warnings: Array<Record<string, unknown>>): EngineRow[] {
  const value = input[name];
  if (value === undefined || value === null) {
    warnings.push({
      code: 'ENGINE_INPUT',
      field: name,
      message: `${name} missing; treated as empty list`,
    });
    return [];
  }
  if (!Array.isArray(value)) {
    warnings.push({
      code: 'ENGINE_INPUT',
      field: name,
      message: `${name} is not a list; treated as empty list`,
    });
    return [];
  }
  return value;
}

function checkSigns(
  source: SourceName,
  entryType: EntryType | null,
  money: Record<string, bigint | null>,
  errors: ValidationError[],
  rowNumber: number,
  raw: Record<string, unknown>,
): void {
  const bad = (field: string, message: string) => {
    errors.push({
      source,
      row_number: rowNumber,
      field,
      code: 'INVALID_SIGN',
      level: 'error',
      message,
      raw_value: text(raw[field]),
    });
  };

  const fields = Object.keys(money);
  if (source === 'orders' || source === 'shipments') {
    fields.forEach((field) => {
      const value = money[field];
      if (value !== null && value < 0n) bad(field, 'Amount must not be negative');
    });
    return;
  }

  if (entryType === 'PAYMENT') {
    fields.forEach((field) => {
      const value = money[field];
      if (value !== null && value < 0n) bad(field, 'PAYMENT amounts must be >= 0');
    });
  } else if (entryType === 'REVERSAL') {
    const nonPositive =
      source === 'settlements'
        ? ['gross_cod_pkr', 'net_paid_pkr', 'delivery_fees_pkr', 'rto_fees_pkr']
        : ['allocated_net_pkr', 'allocated_cod_pkr', 'allocated_delivery_fee_pkr', 'allocated_rto_fee_pkr'];
    nonPositive.forEach((field) => {
      const value = money[field];
      if (value !== undefined && value !== null && value > 0n) {
        bad(field, 'REVERSAL amount must be <= 0');
      }
    });
  }
  // ADJUSTMENT accepts either sign: positive = paid to seller, negative = deducted.
}

export function normalizeInput(input: EngineInput): NormalizedInput {
  const warnings: Array<Record<string, unknown>> = [];
  const sellerRaw =
    input.seller_id === undefined || input.seller_id === null ? '' : String(input.seller_id).trim();
  if (!sellerRaw) throw new Error('ENGINE_INPUT: seller_id is required');
  const seller = sellerRaw.toUpperCase();

  const validationErrors: ValidationError[] = [];
  const inputCounts = {} as Record<SourceName, number>;
  const parsed = {} as Record<SourceName, ValidatedRecord[]>;
  const settlementEntryTypes: Record<string, string> = {};

  SOURCES.forEach((source) => {
    const schema = SCHEMAS[source];
    const rows = arrayOf(input, source, warnings);
    inputCounts[source] = rows.length;
    parsed[source] = [];

    rows.forEach((row, index) => {
      const safeRow = row ?? {};
      const rowNumber =
        safeRow._row_number !== undefined &&
        safeRow._row_number !== null &&
        text(safeRow._row_number) !== ''
          ? Number(safeRow._row_number)
          : index + 1;
      const raw = rawOf(safeRow as EngineRow);
      const errors: ValidationError[] = [];
      const vals: Record<string, string> = {};
      schema.fields.forEach((field) => {
        vals[field] = text((safeRow as EngineRow)[field]);
      });

      let crossSeller = false;
      if (vals.seller_id !== '' && vals.seller_id.toUpperCase() !== seller) {
        crossSeller = true;
        errors.push({
          source,
          row_number: rowNumber,
          field: 'seller_id',
          code: 'CROSS_SELLER',
          level: 'error',
          message: 'Row belongs to a different seller and was excluded',
          raw_value: vals.seller_id,
        });
      }

      schema.mandatory.forEach((field) => {
        if (vals[field] === '') {
          errors.push({
            source,
            row_number: rowNumber,
            field,
            code: 'MISSING_FIELD',
            level: 'error',
            message: 'Mandatory field is missing',
            raw_value: '',
          });
        }
      });

      const money: Record<string, bigint | null> = {};
      schema.money.forEach((field) => {
        const result = parseMoney(vals[field]);
        if (result.ok) {
          money[field] = result.value;
        } else {
          money[field] = null;
          errors.push({
            source,
            row_number: rowNumber,
            field,
            code: result.code,
            level: 'error',
            message: result.message,
            raw_value: vals[field],
          });
        }
      });

      const dates: Record<string, string | null> = {};
      schema.dates.forEach((field) => {
        const result = parseDate(vals[field]);
        if (result.ok) {
          dates[field] = result.value;
        } else {
          dates[field] = null;
          errors.push({
            source,
            row_number: rowNumber,
            field,
            code: result.code,
            level: 'error',
            message: result.message,
            raw_value: vals[field],
          });
        }
      });

      let entryType: EntryType | null = null;
      if (source === 'settlements' && vals.entry_type !== '') {
        const candidate = vals.entry_type.toUpperCase();
        if (!['PAYMENT', 'REVERSAL', 'ADJUSTMENT'].includes(candidate)) {
          errors.push({
            source,
            row_number: rowNumber,
            field: 'entry_type',
            code: 'INVALID_ENTRY_TYPE',
            level: 'error',
            message: 'entry_type must be PAYMENT, REVERSAL or ADJUSTMENT',
            raw_value: vals.entry_type,
          });
        } else {
          entryType = candidate as EntryType;
        }
      }

      if (source === 'allocations') {
        const settlementKey = vals.settlement_id.toUpperCase();
        const known = settlementEntryTypes[settlementKey];
        entryType =
          known === 'PAYMENT' || known === 'REVERSAL' || known === 'ADJUSTMENT'
            ? known
            : null;
      }

      if (source !== 'settlements' && source !== 'allocations') {
        checkSigns(source, null, money, errors, rowNumber, raw);
      } else if (entryType) {
        checkSigns(source, entryType, money, errors, rowNumber, raw);
      }

      const refs: Record<string, string> = {};
      schema.refs.forEach((field) => {
        refs[field] = vals[field].toUpperCase();
      });

      const record: ValidatedRecord = {
        source,
        row_number: rowNumber,
        raw,
        vals,
        refs,
        money,
        dates,
        entry_type: entryType,
        cross_seller: crossSeller,
        field_valid: errors.length === 0,
        is_valid: false,
      };
      if (source === 'shipments') record.normalized_status = normalizeStatus(vals.status);

      if (source === 'settlements' && entryType && !crossSeller) {
        const key = refs.settlement_id;
        if (settlementEntryTypes[key] === undefined) {
          settlementEntryTypes[key] = entryType;
        } else if (settlementEntryTypes[key] !== entryType) {
          settlementEntryTypes[key] = 'CONFLICT';
        }
      }

      validationErrors.push(...errors);
      parsed[source].push(record);
    });
  });

  const excluded = new Set<string>();
  const contentSignature = (record: ValidatedRecord): string =>
    JSON.stringify(SCHEMAS[record.source].fields.map((field) => record.vals[field]));

  function dedupe(source: SourceName, keyField: string): void {
    const groups = new Map<string, ValidatedRecord[]>();
    parsed[source].forEach((record) => {
      if (!record.field_valid || excluded.has(`${source}|${record.row_number}`)) return;
      const key = record.refs[keyField];
      if (!key) return;
      const group = groups.get(key);
      if (group) group.push(record);
      else groups.set(key, [record]);
    });

    groups.forEach((group) => {
      if (group.length < 2) return;
      const signatures = group.map(contentSignature);
      const allSame = signatures.every((signature) => signature === signatures[0]);
      if (allSame) {
        group.slice(1).forEach((record) => {
          excluded.add(`${source}|${record.row_number}`);
          validationErrors.push({
            source,
            row_number: record.row_number,
            field: keyField,
            code: 'DUPLICATE_IDENTICAL',
            level: 'error',
            message: `Identical duplicate of row ${group[0].row_number}; counted once`,
            raw_value: record.vals[keyField],
          });
        });
      } else {
        group.forEach((record) => {
          excluded.add(`${source}|${record.row_number}`);
          validationErrors.push({
            source,
            row_number: record.row_number,
            field: keyField,
            code: 'DUPLICATE_CONFLICT',
            level: 'error',
            message: `Conflicting duplicates for ${keyField} (rows ${group
              .map((item) => item.row_number)
              .join(', ')}); all copies excluded`,
            raw_value: record.vals[keyField],
          });
        });
      }
    });
  }

  dedupe('orders', 'order_id');
  dedupe('shipments', 'shipment_id');
  dedupe('settlements', 'settlement_id');
  dedupe('allocations', 'allocation_id');

  const trackingGroups = new Map<string, ValidatedRecord[]>();
  parsed.shipments.forEach((record) => {
    if (!record.field_valid || excluded.has(`shipments|${record.row_number}`)) return;
    const tracking = record.refs.tracking_number;
    const group = trackingGroups.get(tracking);
    if (group) group.push(record);
    else trackingGroups.set(tracking, [record]);
  });

  const ambiguousTracking: Record<string, string[]> = {};
  Array.from(trackingGroups.keys())
    .sort()
    .forEach((tracking) => {
      const group = trackingGroups.get(tracking);
      if (!group || group.length <= 1) return;
      const shipmentIds = group.map((record) => record.refs.shipment_id).sort();
      ambiguousTracking[tracking] = shipmentIds;
      group.forEach((record) => {
        validationErrors.push({
          source: 'shipments',
          row_number: record.row_number,
          field: 'tracking_number',
          code: 'AMBIGUOUS_TRACKING_NUMBER',
          level: 'warning',
          message: `Tracking number shared by shipments ${shipmentIds.join(
            ', ',
          )}; allocations to it cannot be applied`,
          raw_value: record.vals.tracking_number,
        });
      });
    });

  const valid = {} as Record<SourceName, ValidatedRecord[]>;
  const validCounts = {} as Record<SourceName, number>;
  const invalidRows: InvalidRow[] = [];

  SOURCES.forEach((source) => {
    valid[source] = [];
    parsed[source].forEach((record) => {
      const isValid = record.field_valid && !excluded.has(`${source}|${record.row_number}`);
      record.is_valid = isValid;
      if (isValid) valid[source].push(record);
      else {
        invalidRows.push({
          source,
          row_number: record.row_number,
          raw: record.raw,
          cross_seller: record.cross_seller,
        });
      }
    });
    validCounts[source] = valid[source].length;
  });

  const asOfResult = parseDate(input.as_of_date);
  let asOf: string | null = null;
  if (!asOfResult.ok || asOfResult.blank) {
    warnings.push({
      code: 'ENGINE_INPUT',
      field: 'as_of_date',
      message: 'as_of_date missing or invalid; due-date status will be UNKNOWN',
    });
  } else {
    asOf = asOfResult.value;
  }

  const rules: NormalizedInput['rules'] = [];
  if (Array.isArray(input.courier_rules)) {
    input.courier_rules.forEach((rule, index) => {
      const courier = text(rule && rule.courier).toUpperCase();
      const daysText = text(rule && rule.settlement_days);
      if (!courier || !/^\d+$/.test(daysText)) {
        warnings.push({
          code: 'ENGINE_INPUT',
          field: `courier_rules[${index}]`,
          message: 'Ignored invalid courier rule',
        });
        return;
      }
      rules.push({ courier, settlement_days: Number(daysText) });
    });
  } else if (input.courier_rules !== undefined) {
    warnings.push({
      code: 'ENGINE_INPUT',
      field: 'courier_rules',
      message: 'courier_rules is not a list; ignored',
    });
  }

  const coverage: NormalizedInput['coverage'] = [];
  if (Array.isArray(input.settlement_coverage)) {
    input.settlement_coverage.forEach((entry, index) => {
      const coveredThrough = parseDate(entry && entry.covered_through);
      if (!coveredThrough.ok || coveredThrough.blank) {
        warnings.push({
          code: 'ENGINE_INPUT',
          field: `settlement_coverage[${index}]`,
          message: 'Ignored coverage entry without a valid covered_through date',
        });
        return;
      }
      coverage.push({
        courier: text(entry && entry.courier) === '' ? '*' : text(entry.courier).toUpperCase(),
        covered_through: coveredThrough.value,
        source: text(entry && entry.source) === 'evidenced' ? 'evidenced' : 'user_declaration',
        declared_by: text(entry && entry.declared_by),
        declared_at: text(entry && entry.declared_at),
      });
    });
  } else if (input.settlement_coverage !== undefined) {
    warnings.push({
      code: 'ENGINE_INPUT',
      field: 'settlement_coverage',
      message: 'settlement_coverage is not a list; ignored',
    });
  }

  return {
    engine_version: ENGINE_VERSION,
    seller_id: seller,
    run_id: text(input.run_id),
    as_of_date: asOf,
    rules,
    coverage,
    warnings,
    input_counts: inputCounts,
    valid_counts: validCounts,
    validation_errors: validationErrors,
    invalid_rows: invalidRows,
    valid,
    settlement_entry_types: settlementEntryTypes,
    invalid_settlement_keys: parsed.settlements
      .filter((record) => !record.is_valid && !record.cross_seller)
      .map((record) => record.refs.settlement_id),
    ambiguous_tracking: ambiguousTracking,
  };
}
