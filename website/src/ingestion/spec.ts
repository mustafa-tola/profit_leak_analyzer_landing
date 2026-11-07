import type { SourceName } from '../engine/types';

/**
 * Version identifiers are persisted with every upload so a run can be
 * reproduced even if a future mapping changes.
 *
 * These match the n8n reference workflow:
 *   SCHEMA_VERSION  = pla-schema-1
 *   MAPPING_VERSION = pla-map-1
 */
export const SCHEMA_VERSION = 'pla-schema-1';
export const MAPPING_VERSION = 'pla-map-1';

export const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_TOTAL_BYTES = 40 * 1024 * 1024;

export interface SourceSpec {
  fields: readonly string[];
  mandatory: readonly string[];
  synonyms: Readonly<Record<string, readonly string[]>>;
}

/**
 * Canonical columns and the aliases accepted by the n8n ingestion workflow.
 * Keep this list server-side: it is the compatibility contract for uploads.
 */
export const SOURCE_SPECS: Record<SourceName, SourceSpec> = {
  orders: {
    fields: [
      'seller_id',
      'order_id',
      'order_date',
      'cod_amount_pkr',
      'order_status',
      'customer_ref',
      'notes',
    ],
    mandatory: ['seller_id', 'order_id', 'order_date', 'cod_amount_pkr', 'order_status'],
    synonyms: {
      seller_id: ['seller_id', 'seller', 'merchant_id', 'account_id'],
      order_id: ['order_id', 'order_no', 'order_number', 'order', 'order_ref'],
      order_date: ['order_date', 'date', 'created_at', 'order_created'],
      cod_amount_pkr: ['cod_amount_pkr', 'cod_amount', 'cod', 'amount', 'order_amount'],
      order_status: ['order_status'],
      customer_ref: ['customer_ref', 'customer', 'customer_id'],
      notes: ['notes', 'note', 'remarks'],
    },
  },
  shipments: {
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
    synonyms: {
      seller_id: ['seller_id', 'seller', 'merchant_id', 'account_id'],
      shipment_id: ['shipment_id', 'shipment_no', 'shipment'],
      order_id: ['order_id', 'order_no', 'order_number', 'order', 'order_ref'],
      tracking_number: [
        'tracking_number',
        'tracking_no',
        'tracking',
        'cn',
        'cn_number',
        'consignment_no',
        'consignment_number',
        'awb',
      ],
      courier: ['courier', 'courier_name', 'carrier'],
      booked_date: ['booked_date', 'booking_date', 'booked_on'],
      status: ['status', 'delivery_status', 'shipment_status'],
      status_date: ['status_date', 'delivered_date', 'delivery_date'],
      cod_collected_pkr: ['cod_collected_pkr', 'cod_collected', 'collected_amount'],
      contracted_delivery_fee_pkr: [
        'contracted_delivery_fee_pkr',
        'contracted_delivery_fee',
        'delivery_fee_contract',
      ],
      contracted_rto_fee_pkr: [
        'contracted_rto_fee_pkr',
        'contracted_rto_fee',
        'rto_fee_contract',
      ],
    },
  },
  settlements: {
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
    synonyms: {
      seller_id: ['seller_id', 'seller', 'merchant_id', 'account_id'],
      settlement_id: ['settlement_id', 'settlement_no', 'batch_id', 'payment_batch'],
      courier: ['courier', 'courier_name', 'carrier'],
      settlement_date: ['settlement_date', 'payment_date', 'paid_on'],
      entry_type: ['entry_type', 'type', 'transaction_type'],
      gross_cod_pkr: ['gross_cod_pkr', 'gross_cod', 'gross_amount'],
      delivery_fees_pkr: ['delivery_fees_pkr', 'delivery_fees', 'delivery_charges'],
      rto_fees_pkr: ['rto_fees_pkr', 'rto_fees', 'rto_charges'],
      other_deductions_pkr: ['other_deductions_pkr', 'other_deductions', 'deductions'],
      net_paid_pkr: ['net_paid_pkr', 'net_paid', 'net_amount', 'amount_paid'],
      payment_reference: ['payment_reference', 'payment_ref', 'bank_ref', 'reference'],
    },
  },
  allocations: {
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
    synonyms: {
      seller_id: ['seller_id', 'seller', 'merchant_id', 'account_id'],
      allocation_id: ['allocation_id', 'line_id', 'allocation_line'],
      settlement_id: ['settlement_id', 'settlement_no', 'batch_id', 'payment_batch'],
      tracking_number: [
        'tracking_number',
        'tracking_no',
        'tracking',
        'cn',
        'cn_number',
        'consignment_no',
        'consignment_number',
        'awb',
      ],
      allocated_net_pkr: ['allocated_net_pkr', 'allocated_net', 'net_allocated'],
      allocated_cod_pkr: ['allocated_cod_pkr', 'allocated_cod'],
      allocated_delivery_fee_pkr: [
        'allocated_delivery_fee_pkr',
        'allocated_delivery_fee',
      ],
      allocated_rto_fee_pkr: ['allocated_rto_fee_pkr', 'allocated_rto_fee'],
    },
  },
};

/**
 * Mirrors the reference workflow's normalisation: trim, lower-case, remove
 * parenthetical text, replace non-alphanumeric runs with underscores.
 */
export function normalizeHeader(header: string): string {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function aliasLookup(source: SourceName): Map<string, string> {
  const lookup = new Map<string, string>();
  const spec = SOURCE_SPECS[source];
  spec.fields.forEach((field) => {
    const aliases = spec.synonyms[field] ?? [field];
    aliases.forEach((alias) => {
      const normalized = normalizeHeader(alias);
      if (normalized && !lookup.has(normalized)) lookup.set(normalized, field);
    });
    lookup.set(normalizeHeader(field), field);
  });
  return lookup;
}
