/**
 * Stage 2: exact matching, reconciliation, exceptions and KPIs.
 * Ported from PLA Financial Engine v1.2.0 with bigint paisa.
 */

import { createHash } from 'node:crypto';
import { addDays } from './dates';
import { abs, formatPkr, maxZero, sumKnown } from './money';
import type { EntryType, NormalizedInput, ValidatedRecord } from './types';

export type SettlementCompleteness =
  | 'NOT_APPLICABLE'
  | 'UNKNOWN'
  | 'SETTLED'
  | 'OVERSETTLED'
  | 'UNSETTLED'
  | 'PARTIALLY_SETTLED';

export type DueDateStatus = 'NOT_APPLICABLE' | 'UNKNOWN' | 'NOT_DUE' | 'OVERDUE';

export interface ReconciliationResult {
  order_id: string | null;
  shipment_id: string | null;
  tracking_number: string | null;
  courier: string | null;
  normalized_status: string;
  raw_status: string | null;
  status_date: string | null;
  cod_order_paisa: bigint | null;
  cod_collected_paisa: bigint | null;
  contracted_delivery_fee_paisa: bigint | null;
  charged_delivery_fee_paisa: bigint | null;
  fee_attribution: string;
  contracted_rto_fee_paisa: bigint | null;
  charged_rto_fee_paisa: bigint | null;
  expected_receivable_paisa: bigint | null;
  verified_paid_paisa: bigint;
  adjustment_paisa: bigint;
  settlement_variance_paisa: bigint | null;
  outstanding_receivable_paisa: bigint | null;
  overpaid_paisa: bigint | null;
  verified_fee_discrepancy_paisa: bigint | null;
  rto_fee_discrepancy_paisa: bigint | null;
  rto_cost_paisa: bigint | null;
  rto_cost_basis: string | null;
  settlement_completeness: SettlementCompleteness;
  due_date_status: DueDateStatus;
  due_date_reason: string | null;
  due_date: string | null;
  due_date_confidence: string | null;
  coverage_source: string | null;
  allocation_ids: string[];
  settlement_ids: string[];
  order_match_status: 'MATCHED' | 'UNMATCHED' | 'NOT_APPLICABLE';
}

export interface SettlementSummary {
  settlement_id: string;
  courier: string;
  entry_type: EntryType | null;
  settlement_date: string | null;
  gross_cod_paisa: bigint | null;
  delivery_fees_paisa: bigint | null;
  rto_fees_paisa: bigint | null;
  other_deductions_paisa: bigint | null;
  net_paid_paisa: bigint | null;
  allocated_paisa: bigint;
  unallocated_paisa: bigint | null;
  attributed_fee_paisa: bigint;
  unattributed_fee_paisa: bigint;
  arithmetic_ok: boolean;
  allocation_ids: string[];
}

export interface ExceptionRecord {
  exception_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  confidence: string;
  seller_id: string;
  order_id: string | null;
  shipment_id: string | null;
  tracking_number: string | null;
  settlement_id: string | null;
  amount_paisa: bigint | null;
  description: string;
  evidence: Record<string, unknown>;
}

export interface ReconciliationKpis {
  expected_receivable_paisa: bigint;
  verified_paid_paisa: bigint;
  verified_paid_non_delivered_paisa: bigint;
  adjustment_paisa: bigint;
  total_adjustment_paisa: bigint;
  allocated_adjustment_paisa: bigint;
  unallocated_adjustment_paisa: bigint;
  net_settlement_variance_paisa: bigint;
  outstanding_receivable_paisa: bigint;
  overdue_receivable_confirmed_paisa: bigint;
  overdue_receivable_provisional_paisa: bigint;
  overpaid_paisa: bigint;
  verified_fee_discrepancy_paisa: bigint;
  rto_fee_discrepancy_paisa: bigint;
  rto_operational_cost_paisa: bigint;
  rto_cost_unknown_count: number;
  unallocated_settlement_paisa: bigint;
  over_allocated_settlement_count: number;
  unattributed_fee_paisa: bigint;
  potential_exposure_paisa: bigint;
  potential_exposure_unknown_count: number;
  counts_by_completeness: Record<string, number>;
  counts_by_due_date_status: Record<string, number>;
  unknown_expected_count: number;
  exception_count: number;
  exceptions_by_type: Record<string, number>;
  invalid_row_count: number;
  shipment_count: number;
  settlement_count: number;
  [key: string]: bigint | number | Record<string, number>;
}

export interface ReconciliationOutput {
  engine_version: string;
  seller_id: string;
  as_of_date: string | null;
  coverage_used: NormalizedInput['coverage'];
  courier_rules_used: NormalizedInput['rules'];
  warnings: Array<Record<string, unknown>>;
  input_counts: NormalizedInput['input_counts'];
  valid_counts: NormalizedInput['valid_counts'];
  validation_errors: NormalizedInput['validation_errors'];
  results: ReconciliationResult[];
  settlement_summary: SettlementSummary[];
  exceptions: ExceptionRecord[];
  kpis: ReconciliationKpis;
  kpis_pkr: Record<string, string>;
  output_hash: string;
}

type AppliedAllocation = {
  rec: ValidatedRecord;
  settlement: ValidatedRecord;
  entry_type: EntryType | null;
  shipment_id: string;
};

function compare(a: string | number, b: string | number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function evidenceOf(record: ValidatedRecord | null) {
  return record
    ? { source: record.source, row_number: record.row_number, raw: record.raw }
    : null;
}

function canonicalize(value: unknown): unknown {
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        out[key] = canonicalize((value as Record<string, unknown>)[key]);
      });
    return out;
  }
  return value;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function countBy<T extends string>(list: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  list.forEach((key) => {
    counts[key] = (counts[key] ?? 0) + 1;
  });
  const sorted: Record<string, number> = {};
  Object.keys(counts)
    .sort()
    .forEach((key) => {
      sorted[key] = counts[key];
    });
  return sorted;
}

export function reconcile(normalized: NormalizedInput): ReconciliationOutput {
  const seller = normalized.seller_id;
  const orders = new Map<string, ValidatedRecord>();
  const settlements = new Map<string, ValidatedRecord>();
  const shipmentsByTracking = new Map<string, ValidatedRecord[]>();
  const invalidSettlementKeys = new Set(normalized.invalid_settlement_keys);

  normalized.valid.orders.forEach((record) => orders.set(record.refs.order_id, record));
  normalized.valid.settlements.forEach((record) =>
    settlements.set(record.refs.settlement_id, record),
  );
  normalized.valid.shipments.forEach((record) => {
    const tracking = record.refs.tracking_number;
    const group = shipmentsByTracking.get(tracking);
    if (group) group.push(record);
    else shipmentsByTracking.set(tracking, [record]);
  });

  const exceptions: ExceptionRecord[] = [];

  function addException(entry: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    confidence?: string;
    order_id?: string | null;
    shipment_id?: string | null;
    tracking_number?: string | null;
    settlement_id?: string | null;
    key_extra?: string;
    amount_paisa?: bigint | null;
    description: string;
    evidence?: Record<string, unknown>;
  }): void {
    const keyParts = [
      entry.type,
      entry.order_id ?? '',
      entry.shipment_id ?? '',
      entry.tracking_number ?? '',
      entry.settlement_id ?? '',
      entry.key_extra ?? '',
    ];
    exceptions.push({
      exception_id: `EXC-${sha256(`${seller}|${keyParts.join('|')}`).slice(0, 20)}`,
      type: entry.type,
      severity: entry.severity,
      confidence: entry.confidence ?? 'n/a',
      seller_id: seller,
      order_id: entry.order_id ?? null,
      shipment_id: entry.shipment_id ?? null,
      tracking_number: entry.tracking_number ?? null,
      settlement_id: entry.settlement_id ?? null,
      amount_paisa: entry.amount_paisa === undefined ? null : entry.amount_paisa,
      description: entry.description,
      evidence: entry.evidence ?? {},
    });
  }

  // ---- Allocations: exact matching only ----
  const appliedByShipment = new Map<string, AppliedAllocation[]>();
  const appliedBySettlement = new Map<string, AppliedAllocation[]>();

  normalized.valid.allocations
    .slice()
    .sort((a, b) => compare(a.refs.allocation_id, b.refs.allocation_id))
    .forEach((allocation) => {
      const settlementId = allocation.refs.settlement_id;
      const tracking = allocation.refs.tracking_number;
      const settlement = settlements.get(settlementId);

      if (!settlement) {
        const reason = invalidSettlementKeys.has(settlementId)
          ? 'settlement_invalid_or_conflicting'
          : 'settlement_not_found';
        addException({
          type: 'UNMATCHED_ALLOCATION',
          severity: 'medium',
          tracking_number: allocation.vals.tracking_number,
          settlement_id: allocation.vals.settlement_id,
          key_extra: allocation.refs.allocation_id,
          amount_paisa: allocation.money.allocated_net_pkr,
          description: `Allocation ${allocation.vals.allocation_id} not applied: ${reason
            .split('_')
            .join(' ')}`,
          evidence: { reason, allocation: evidenceOf(allocation) },
        });
        return;
      }

      const candidates = shipmentsByTracking.get(tracking) ?? [];
      if (candidates.length > 1) {
        addException({
          type: 'AMBIGUOUS_RELATIONSHIP',
          severity: 'high',
          tracking_number: allocation.vals.tracking_number,
          settlement_id: allocation.vals.settlement_id,
          key_extra: allocation.refs.allocation_id,
          amount_paisa: allocation.money.allocated_net_pkr,
          description: `Allocation ${allocation.vals.allocation_id} matches ${candidates.length} shipments with the same tracking number; not applied`,
          evidence: {
            reason: 'tracking_number_matches_multiple_shipments',
            allocation: evidenceOf(allocation),
            candidate_shipments: candidates.map(evidenceOf),
          },
        });
        return;
      }

      if (candidates.length === 0) {
        addException({
          type: 'UNMATCHED_ALLOCATION',
          severity: 'medium',
          tracking_number: allocation.vals.tracking_number,
          settlement_id: allocation.vals.settlement_id,
          key_extra: allocation.refs.allocation_id,
          amount_paisa: allocation.money.allocated_net_pkr,
          description: `Allocation ${allocation.vals.allocation_id} not applied: no valid shipment with tracking number ${allocation.vals.tracking_number}`,
          evidence: {
            reason: 'shipment_not_found',
            allocation: evidenceOf(allocation),
            settlement: evidenceOf(settlement),
          },
        });
        return;
      }

      const shipment = candidates[0];
      const applied: AppliedAllocation = {
        rec: allocation,
        settlement,
        entry_type: settlement.entry_type,
        shipment_id: shipment.refs.shipment_id,
      };
      const byShipment = appliedByShipment.get(shipment.refs.shipment_id);
      if (byShipment) byShipment.push(applied);
      else appliedByShipment.set(shipment.refs.shipment_id, [applied]);
      const bySettlement = appliedBySettlement.get(settlementId);
      if (bySettlement) bySettlement.push(applied);
      else appliedBySettlement.set(settlementId, [applied]);
    });

  // ---- Per-shipment reconciliation ----
  const results: ReconciliationResult[] = [];
  const shipmentsByOrder = new Map<string, ValidatedRecord[]>();

  normalized.valid.shipments
    .slice()
    .sort((a, b) => compare(a.refs.shipment_id, b.refs.shipment_id))
    .forEach((shipment) => {
      const order = orders.get(shipment.refs.order_id) ?? null;
      const orderShipments = shipmentsByOrder.get(shipment.refs.order_id);
      if (orderShipments) orderShipments.push(shipment);
      else shipmentsByOrder.set(shipment.refs.order_id, [shipment]);

      const allocations = appliedByShipment.get(shipment.refs.shipment_id) ?? [];
      const status = shipment.normalized_status ?? 'unknown';
      const cod = shipment.money.cod_collected_pkr;
      const contractedFee = shipment.money.contracted_delivery_fee_pkr;
      const contractedRto = shipment.money.contracted_rto_fee_pkr;
      const ids = {
        order_id: shipment.vals.order_id,
        shipment_id: shipment.vals.shipment_id,
        tracking_number: shipment.vals.tracking_number,
      };

      const allocationEvidence = allocations.map((allocation) => ({
        allocation_id: allocation.rec.vals.allocation_id,
        settlement_id: allocation.rec.vals.settlement_id,
        entry_type: allocation.entry_type,
        row_number: allocation.rec.row_number,
        raw: allocation.rec.raw,
      }));

      let verified = 0n;
      let adjustment = 0n;
      allocations.forEach((allocation) => {
        verified += allocation.rec.money.allocated_net_pkr ?? 0n;
        if (allocation.entry_type === 'ADJUSTMENT') {
          adjustment += allocation.rec.money.allocated_net_pkr ?? 0n;
        }
      });

      function attributed(field: string): { value: bigint | null; status: string } {
        if (allocations.length === 0) return { value: null, status: 'no_allocations' };
        let total = 0n;
        for (const allocation of allocations) {
          const value = allocation.rec.money[field];
          if (value === null || value === undefined) {
            return { value: null, status: 'not_attributed' };
          }
          total += value;
        }
        return { value: total, status: 'attributed' };
      }

      const chargedFee = attributed('allocated_delivery_fee_pkr');
      const chargedRto = attributed('allocated_rto_fee_pkr');

      const delivered = status === 'delivered';
      const returned = status === 'returned';
      const expected = delivered && cod !== null && contractedFee !== null ? cod - contractedFee : null;
      const variance = expected === null ? null : verified - expected;
      const outstanding = expected === null ? null : maxZero(expected - verified);
      const overpaid = expected === null ? null : maxZero(verified - expected);

      let feeDiscrepancy: bigint | null = null;
      if (
        delivered &&
        chargedFee.value !== null &&
        contractedFee !== null &&
        chargedFee.value > contractedFee
      ) {
        feeDiscrepancy = chargedFee.value - contractedFee;
      }

      let rtoDiscrepancy: bigint | null = null;
      let rtoCost: bigint | null = null;
      let rtoBasis: string | null = null;
      if (returned) {
        if (
          chargedRto.value !== null &&
          contractedRto !== null &&
          chargedRto.value > contractedRto
        ) {
          rtoDiscrepancy = chargedRto.value - contractedRto;
        }
        if (chargedRto.value !== null) {
          rtoCost = chargedRto.value;
          rtoBasis = 'charged';
        } else if (contractedRto !== null) {
          rtoCost = contractedRto;
          rtoBasis = 'contracted';
        } else {
          rtoCost = null;
          rtoBasis = 'unknown';
        }
      }

      let completeness: SettlementCompleteness = 'NOT_APPLICABLE';
      if (delivered) {
        if (expected === null) completeness = 'UNKNOWN';
        else if (verified === expected) completeness = 'SETTLED';
        else if (verified > expected) completeness = 'OVERSETTLED';
        else if (verified <= 0n) completeness = 'UNSETTLED';
        else completeness = 'PARTIALLY_SETTLED';
      }

      let due: DueDateStatus = 'NOT_APPLICABLE';
      let dueReason: string | null = null;
      let dueDate: string | null = null;
      let dueConfidence: string | null = null;
      let coverageSource: string | null = null;
      let ruleUsed: NormalizedInput['rules'][number] | null = null;
      let coverageUsed: NormalizedInput['coverage'][number] | null = null;

      if (completeness === 'UNSETTLED' || completeness === 'PARTIALLY_SETTLED') {
        const courier = shipment.refs.courier;
        const rules = normalized.rules.filter((rule) => rule.courier === courier);
        const distinctDays = Array.from(new Set(rules.map((rule) => rule.settlement_days)));
        const statusDate = shipment.dates.status_date;

        if (rules.length === 0) {
          due = 'UNKNOWN';
          dueReason = 'no_rule';
        } else if (distinctDays.length > 1) {
          due = 'UNKNOWN';
          dueReason = 'conflicting_rules';
        } else if (!statusDate) {
          due = 'UNKNOWN';
          dueReason = 'no_status_date';
        } else if (!normalized.as_of_date) {
          due = 'UNKNOWN';
          dueReason = 'no_as_of_date';
        } else {
          ruleUsed = rules[0];
          const dueDateValue = addDays(statusDate, ruleUsed.settlement_days);
          dueDate = dueDateValue;
          if (dueDateValue >= normalized.as_of_date) {
            due = 'NOT_DUE';
          } else {
            const coverage = normalized.coverage.filter(
              (entry) => entry.courier === courier || entry.courier === '*',
            );
            if (coverage.length === 0) {
              due = 'UNKNOWN';
              dueReason = 'no_coverage';
            } else {
              const qualifying = coverage
                .filter((entry) => entry.covered_through >= dueDateValue)
                .sort(
                  (a, b) =>
                    compare(a.source === 'evidenced' ? 0 : 1, b.source === 'evidenced' ? 0 : 1) ||
                    compare(b.covered_through, a.covered_through) ||
                    compare(a.courier, b.courier),
                );
              if (qualifying.length === 0) {
                due = 'UNKNOWN';
                dueReason = 'coverage_before_deadline';
              } else {
                coverageUsed = qualifying[0];
                due = 'OVERDUE';
                coverageSource = coverageUsed.source;
                dueConfidence = coverageUsed.source === 'evidenced' ? 'CONFIRMED' : 'PROVISIONAL';
              }
            }
          }
        }
      }

      const result: ReconciliationResult = {
        order_id: shipment.vals.order_id,
        shipment_id: shipment.vals.shipment_id,
        tracking_number: shipment.vals.tracking_number,
        courier: shipment.vals.courier,
        normalized_status: status,
        raw_status: shipment.vals.status,
        status_date: shipment.dates.status_date,
        cod_order_paisa: order ? order.money.cod_amount_pkr : null,
        cod_collected_paisa: cod,
        contracted_delivery_fee_paisa: contractedFee,
        charged_delivery_fee_paisa: chargedFee.value,
        fee_attribution: chargedFee.status,
        contracted_rto_fee_paisa: contractedRto,
        charged_rto_fee_paisa: chargedRto.value,
        expected_receivable_paisa: expected,
        verified_paid_paisa: verified,
        adjustment_paisa: adjustment,
        settlement_variance_paisa: variance,
        outstanding_receivable_paisa: outstanding,
        overpaid_paisa: overpaid,
        verified_fee_discrepancy_paisa: feeDiscrepancy,
        rto_fee_discrepancy_paisa: rtoDiscrepancy,
        rto_cost_paisa: rtoCost,
        rto_cost_basis: rtoBasis,
        settlement_completeness: completeness,
        due_date_status: due,
        due_date_reason: dueReason,
        due_date: dueDate,
        due_date_confidence: dueConfidence,
        coverage_source: coverageSource,
        allocation_ids: allocations.map((allocation) => allocation.rec.vals.allocation_id),
        settlement_ids: Array.from(
          new Set(allocations.map((allocation) => allocation.rec.vals.settlement_id)),
        ).sort(),
        order_match_status: order ? 'MATCHED' : 'UNMATCHED',
      };
      results.push(result);

      const computed = {
        expected_receivable_paisa: expected,
        verified_paid_paisa: verified,
        adjustment_paisa: adjustment,
        settlement_variance_paisa: variance,
        outstanding_receivable_paisa: outstanding,
        overpaid_paisa: overpaid,
        contracted_delivery_fee_paisa: contractedFee,
        charged_delivery_fee_paisa: chargedFee.value,
        fee_attribution: chargedFee.status,
      };
      const baseEvidence = {
        shipment: evidenceOf(shipment),
        order: evidenceOf(order),
        allocations: allocationEvidence,
        computed,
      };

      if (!order) {
        addException({
          type: 'UNMATCHED_SHIPMENT',
          severity: 'medium',
          amount_paisa: cod,
          description: `Shipment ${shipment.vals.shipment_id} references order ${shipment.vals.order_id} which is not in the valid orders file`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (status === 'unknown') {
        addException({
          type: 'UNKNOWN_STATUS',
          severity: 'medium',
          amount_paisa: null,
          description: `Courier status "${shipment.vals.status}" is not recognised; shipment not treated as delivered`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (delivered && expected === null) {
        const missing: string[] = [];
        if (cod === null) missing.push('cod_collected_pkr');
        if (contractedFee === null) missing.push('contracted_delivery_fee_pkr');
        addException({
          type: 'EXPECTED_UNKNOWN',
          severity: 'medium',
          amount_paisa: null,
          description: `Expected receivable cannot be calculated; missing ${missing.join(', ')}`,
          evidence: { missing_fields: missing, ...baseEvidence },
          ...ids,
        });
      }

      if (completeness === 'UNSETTLED') {
        addException({
          type: 'UNSETTLED_SHIPMENT',
          severity: 'high',
          amount_paisa: outstanding,
          description: `Delivered shipment has no verified settlement (expected ${formatPkr(
            expected,
          )}, verified ${formatPkr(verified)})`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (completeness === 'PARTIALLY_SETTLED') {
        addException({
          type: 'PARTIAL_SETTLEMENT',
          severity: 'high',
          amount_paisa: outstanding,
          description: `Partially settled: expected ${formatPkr(expected)}, verified ${formatPkr(
            verified,
          )}, outstanding ${formatPkr(outstanding)}`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (completeness === 'OVERSETTLED') {
        addException({
          type: 'OVERPAID',
          severity: 'medium',
          amount_paisa: overpaid,
          description: `Verified payments exceed expected receivable by ${formatPkr(overpaid)}`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (due === 'OVERDUE') {
        addException({
          type: 'OVERDUE_SETTLEMENT',
          severity: 'high',
          confidence: dueConfidence === 'CONFIRMED' ? 'confirmed' : 'provisional',
          amount_paisa: outstanding,
          description: `${
            dueConfidence === 'PROVISIONAL'
              ? 'Provisional – based on user-declared coverage. '
              : 'Confirmed by evidenced coverage. '
          }Settlement deadline ${dueDate} passed (as of ${
            normalized.as_of_date
          }); outstanding ${formatPkr(outstanding)}`,
          evidence: {
            rule: ruleUsed,
            coverage: coverageUsed,
            due_date: dueDate,
            as_of_date: normalized.as_of_date,
            status_date: shipment.dates.status_date,
            ...baseEvidence,
          },
          ...ids,
        });
      }

      if (due === 'UNKNOWN') {
        addException({
          type: 'DUE_DATE_UNKNOWN',
          severity: 'low',
          amount_paisa: outstanding,
          description: `Overdue status unknown (${dueReason?.split('_').join(' ')})`,
          evidence: {
            reason: dueReason,
            rule: ruleUsed,
            due_date: dueDate,
            as_of_date: normalized.as_of_date,
            ...baseEvidence,
          },
          ...ids,
        });
      }

      if (feeDiscrepancy !== null) {
        addException({
          type: 'FEE_DISCREPANCY',
          severity: 'medium',
          confidence: 'confirmed',
          amount_paisa: feeDiscrepancy,
          description: `Attributed delivery fees ${formatPkr(
            chargedFee.value,
          )} exceed contracted ${formatPkr(
            contractedFee,
          )} by ${formatPkr(feeDiscrepancy)} (explains part of the settlement variance; not additive)`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (delivered && chargedFee.status === 'not_attributed') {
        addException({
          type: 'FEE_NOT_ATTRIBUTABLE',
          severity: 'low',
          amount_paisa: null,
          description:
            'At least one allocation has no delivery fee breakdown; charged fee cannot be attributed to this shipment',
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (returned) {
        addException({
          type: 'RTO_COST',
          severity: 'low',
          amount_paisa: rtoCost,
          description: `Return-to-origin operational cost ${formatPkr(
            rtoCost,
          )} (basis: ${rtoBasis}); separate from receivables`,
          evidence: {
            rto_cost_basis: rtoBasis,
            contracted_rto_fee_paisa: contractedRto,
            charged_rto_fee_paisa: chargedRto.value,
            ...baseEvidence,
          },
          ...ids,
        });
        if (rtoDiscrepancy !== null) {
          addException({
            type: 'RTO_FEE_DISCREPANCY',
            severity: 'medium',
            confidence: 'confirmed',
            amount_paisa: rtoDiscrepancy,
            description: `Attributed RTO fees ${formatPkr(
              chargedRto.value,
            )} exceed contracted ${formatPkr(contractedRto)} by ${formatPkr(rtoDiscrepancy)}`,
            evidence: baseEvidence,
            ...ids,
          });
        }
      }

      if (!delivered && verified > 0n) {
        addException({
          type: 'UNEXPECTED_PAYMENT_ON_NON_DELIVERED',
          severity: 'medium',
          amount_paisa: verified,
          description: `Positive settlement of ${formatPkr(
            verified,
          )} allocated to a shipment with status ${status}`,
          evidence: baseEvidence,
          ...ids,
        });
      }

      if (delivered && cod !== null) {
        let allocatedCod = 0n;
        let allKnown = allocations.length > 0;
        allocations.forEach((allocation) => {
          const value = allocation.rec.money.allocated_cod_pkr;
          if (value === null || value === undefined) allKnown = false;
          else allocatedCod += value;
        });
        if (allKnown && allocatedCod > cod) {
          addException({
            type: 'COD_MISMATCH',
            severity: 'medium',
            key_extra: 'allocation_vs_collected',
            amount_paisa: allocatedCod - cod,
            description: `Allocated COD ${formatPkr(
              allocatedCod,
            )} exceeds COD collected ${formatPkr(cod)}`,
            evidence: {
              comparison: 'allocated_cod_vs_cod_collected',
              allocated_cod_paisa: allocatedCod,
              ...baseEvidence,
            },
            ...ids,
          });
        }
      }
    });

  // ---- Orders without shipments + COD comparison ----
  normalized.valid.orders
    .slice()
    .sort((a, b) => compare(a.refs.order_id, b.refs.order_id))
    .forEach((order) => {
      const orderShipments = shipmentsByOrder.get(order.refs.order_id) ?? [];
      if (orderShipments.length === 0) {
        results.push({
          order_id: order.vals.order_id,
          shipment_id: null,
          tracking_number: null,
          courier: null,
          normalized_status: 'no_shipment',
          raw_status: null,
          status_date: null,
          cod_order_paisa: order.money.cod_amount_pkr,
          cod_collected_paisa: null,
          contracted_delivery_fee_paisa: null,
          charged_delivery_fee_paisa: null,
          fee_attribution: 'no_allocations',
          contracted_rto_fee_paisa: null,
          charged_rto_fee_paisa: null,
          expected_receivable_paisa: null,
          verified_paid_paisa: 0n,
          adjustment_paisa: 0n,
          settlement_variance_paisa: null,
          outstanding_receivable_paisa: null,
          overpaid_paisa: null,
          verified_fee_discrepancy_paisa: null,
          rto_fee_discrepancy_paisa: null,
          rto_cost_paisa: null,
          rto_cost_basis: null,
          settlement_completeness: 'NOT_APPLICABLE',
          due_date_status: 'NOT_APPLICABLE',
          due_date_reason: null,
          due_date: null,
          due_date_confidence: null,
          coverage_source: null,
          allocation_ids: [],
          settlement_ids: [],
          order_match_status: 'NOT_APPLICABLE',
        });
        addException({
          type: 'UNMATCHED_ORDER',
          severity: 'medium',
          order_id: order.vals.order_id,
          amount_paisa: order.money.cod_amount_pkr,
          description: `Order ${order.vals.order_id} has no matching valid shipment`,
          evidence: { order: evidenceOf(order) },
        });
        return;
      }

      const allDelivered = orderShipments.every(
        (shipment) => shipment.normalized_status === 'delivered',
      );
      const allCodKnown = orderShipments.every(
        (shipment) => shipment.money.cod_collected_pkr !== null,
      );
      if (allDelivered && allCodKnown) {
        const total = sumKnown(
          orderShipments.map((shipment) => shipment.money.cod_collected_pkr),
        );
        const orderCod = order.money.cod_amount_pkr;
        if (orderCod !== null && total !== orderCod) {
          addException({
            type: 'COD_MISMATCH',
            severity: 'medium',
            order_id: order.vals.order_id,
            key_extra: 'order_vs_shipments',
            amount_paisa: total - orderCod,
            description: `Order COD ${formatPkr(
              orderCod,
            )} differs from COD collected across ${orderShipments.length} delivered shipment(s) ${formatPkr(
              total,
            )}`,
            evidence: {
              comparison: 'order_cod_vs_sum_cod_collected',
              order: evidenceOf(order),
              shipments: orderShipments.map(evidenceOf),
              order_cod_paisa: orderCod,
              cod_collected_total_paisa: total,
            },
          });
        }
      }
    });

  // ---- Settlement level ----
  const settlementSummary: SettlementSummary[] = [];
  normalized.valid.settlements
    .slice()
    .sort((a, b) => compare(a.refs.settlement_id, b.refs.settlement_id))
    .forEach((settlement) => {
      const money = settlement.money;
      const allocations = appliedBySettlement.get(settlement.refs.settlement_id) ?? [];
      const allocated = sumKnown(
        allocations.map((allocation) => allocation.rec.money.allocated_net_pkr),
      );
      const unallocated =
        money.net_paid_pkr === null ? null : money.net_paid_pkr - allocated;
      const arithmeticNet =
        money.gross_cod_pkr !== null &&
        money.delivery_fees_pkr !== null &&
        money.rto_fees_pkr !== null &&
        money.other_deductions_pkr !== null
          ? money.gross_cod_pkr -
            money.delivery_fees_pkr -
            money.rto_fees_pkr -
            money.other_deductions_pkr
          : null;
      const standaloneAdjustment =
        settlement.entry_type === 'ADJUSTMENT' &&
        money.gross_cod_pkr === 0n &&
        money.delivery_fees_pkr === 0n &&
        money.rto_fees_pkr === 0n &&
        money.other_deductions_pkr === 0n;
      const arithmeticOk =
        standaloneAdjustment ||
        (arithmeticNet !== null && arithmeticNet === money.net_paid_pkr);

      const feeTotal =
        money.delivery_fees_pkr !== null && money.rto_fees_pkr !== null
          ? money.delivery_fees_pkr + money.rto_fees_pkr
          : null;
      let attributedFees = 0n;
      allocations.forEach((allocation) => {
        const delivery = allocation.rec.money.allocated_delivery_fee_pkr;
        const rto = allocation.rec.money.allocated_rto_fee_pkr;
        if (delivery !== null && delivery !== undefined) attributedFees += delivery;
        if (rto !== null && rto !== undefined) attributedFees += rto;
      });
      const unattributed = feeTotal === null ? null : feeTotal - attributedFees;
      const direction = money.net_paid_pkr !== null && money.net_paid_pkr < 0n ? -1n : 1n;
      const overAllocated =
        unallocated !== null ? unallocated * direction < 0n : false;
      const isUnallocated =
        unallocated !== null ? unallocated * direction > 0n : false;
      const feeExceeds =
        feeTotal !== null &&
        (abs(attributedFees) > abs(feeTotal) ||
          (feeTotal !== 0n && attributedFees !== 0n && feeTotal > 0n !== attributedFees > 0n));

      const row: SettlementSummary = {
        settlement_id: settlement.vals.settlement_id,
        courier: settlement.vals.courier,
        entry_type: settlement.entry_type,
        settlement_date: settlement.dates.settlement_date,
        gross_cod_paisa: money.gross_cod_pkr,
        delivery_fees_paisa: money.delivery_fees_pkr,
        rto_fees_paisa: money.rto_fees_pkr,
        other_deductions_paisa: money.other_deductions_pkr,
        net_paid_paisa: money.net_paid_pkr,
        allocated_paisa: allocated,
        unallocated_paisa: unallocated,
        attributed_fee_paisa: attributedFees,
        unattributed_fee_paisa: feeExceeds || unattributed === null ? 0n : unattributed,
        arithmetic_ok: arithmeticOk,
        allocation_ids: allocations.map((allocation) => allocation.rec.vals.allocation_id),
      };
      settlementSummary.push(row);

      const settlementEvidence = {
        settlement: evidenceOf(settlement),
        allocations: allocations.map((allocation) => ({
          allocation_id: allocation.rec.vals.allocation_id,
          tracking_number: allocation.rec.vals.tracking_number,
          row_number: allocation.rec.row_number,
          allocated_net_paisa: allocation.rec.money.allocated_net_pkr,
        })),
        computed: row,
      };

      if (!arithmeticOk) {
        addException({
          type: 'SETTLEMENT_ARITHMETIC_MISMATCH',
          severity: 'high',
          settlement_id: settlement.vals.settlement_id,
          amount_paisa:
            money.net_paid_pkr === null || arithmeticNet === null
              ? null
              : money.net_paid_pkr - arithmeticNet,
          description: `gross − delivery − rto − other = ${formatPkr(
            arithmeticNet,
          )} but net paid is ${formatPkr(money.net_paid_pkr)}`,
          evidence: { computed_net_paisa: arithmeticNet, ...settlementEvidence },
        });
      }

      if (isUnallocated && unallocated !== null) {
        addException({
          type: 'UNALLOCATED_SETTLEMENT',
          severity: 'medium',
          settlement_id: settlement.vals.settlement_id,
          amount_paisa: unallocated,
          description: `${formatPkr(unallocated)} of ${
            settlement.entry_type
          } ${settlement.vals.settlement_id} (net ${formatPkr(
            money.net_paid_pkr,
          )}) is not allocated to any shipment`,
          evidence: settlementEvidence,
        });
      }

      if (overAllocated && unallocated !== null) {
        addException({
          type: 'OVER_ALLOCATED_SETTLEMENT',
          severity: 'high',
          settlement_id: settlement.vals.settlement_id,
          amount_paisa: -unallocated,
          description: `Allocations ${formatPkr(allocated)} exceed settlement net ${formatPkr(
            money.net_paid_pkr,
          )}`,
          evidence: settlementEvidence,
        });
      }

      if (feeExceeds && feeTotal !== null) {
        addException({
          type: 'FEE_ATTRIBUTION_EXCEEDS_SETTLEMENT',
          severity: 'medium',
          settlement_id: settlement.vals.settlement_id,
          amount_paisa: attributedFees - feeTotal,
          description: `Fees attributed to shipments ${formatPkr(
            attributedFees,
          )} exceed settlement fee total ${formatPkr(feeTotal)}`,
          evidence: settlementEvidence,
        });
      }

      if (settlement.entry_type === 'ADJUSTMENT') {
        addException({
          type: 'ADJUSTMENT_PRESENT',
          severity: 'low',
          settlement_id: settlement.vals.settlement_id,
          amount_paisa: money.net_paid_pkr,
          description: `Adjustment ${settlement.vals.settlement_id} of ${formatPkr(
            money.net_paid_pkr,
          )} (positive = paid to seller, negative = deducted); counted once in cash`,
          evidence: settlementEvidence,
        });
      }
    });

  // ---- Invalid rows ----
  const errorsByRow = new Map<string, NormalizedInput['validation_errors']>();
  normalized.validation_errors.forEach((error) => {
    const key = `${error.source}|${error.row_number}`;
    const group = errorsByRow.get(key);
    if (group) group.push(error);
    else errorsByRow.set(key, [error]);
  });

  normalized.invalid_rows.forEach((row) => {
    const errors = (errorsByRow.get(`${row.source}|${row.row_number}`) ?? []).filter(
      (error) => error.level !== 'warning',
    );
    addException({
      type: 'INVALID_ROW',
      severity: row.cross_seller ? 'low' : 'medium',
      key_extra: `${row.source}:${row.row_number}`,
      amount_paisa: null,
      description: `${row.source} row ${row.row_number} excluded: ${errors
        .map((error) => `${error.code}${error.field ? `(${error.field})` : ''}`)
        .join(', ')}`,
      evidence: {
        source: row.source,
        row_number: row.row_number,
        raw: row.raw,
        errors,
      },
    });
  });

  // ---- Deterministic sorting ----
  results.sort(
    (a, b) =>
      compare(a.shipment_id ?? '~', b.shipment_id ?? '~') ||
      compare(a.order_id ?? '', b.order_id ?? ''),
  );
  exceptions.sort(
    (a, b) =>
      compare(a.type, b.type) ||
      compare(a.settlement_id ?? '', b.settlement_id ?? '') ||
      compare(a.shipment_id ?? '', b.shipment_id ?? '') ||
      compare(a.order_id ?? '', b.order_id ?? '') ||
      compare(a.exception_id, b.exception_id),
  );

  const sourceOrder: Record<string, number> = {
    orders: 0,
    shipments: 1,
    settlements: 2,
    allocations: 3,
  };
  const validationErrors = normalized.validation_errors
    .slice()
    .sort(
      (a, b) =>
        compare(sourceOrder[a.source], sourceOrder[b.source]) ||
        compare(a.row_number, b.row_number) ||
        compare(a.field ?? '', b.field ?? '') ||
        compare(a.code, b.code),
    );

  // ---- KPIs ----
  const deliveredRows = results.filter(
    (result) => result.normalized_status === 'delivered',
  );
  const returnedRows = results.filter(
    (result) => result.normalized_status === 'returned',
  );
  const nonDeliveredShipments = results.filter(
    (result) => result.shipment_id && result.normalized_status !== 'delivered',
  );

  const exposureRows = deliveredRows.filter(
    (result) =>
      result.settlement_completeness === 'UNKNOWN' ||
      ((result.settlement_completeness === 'UNSETTLED' ||
        result.settlement_completeness === 'PARTIALLY_SETTLED') &&
        result.due_date_status === 'UNKNOWN'),
  );

  const adjustmentSettlements = settlementSummary.filter(
    (settlement) => settlement.entry_type === 'ADJUSTMENT',
  );
  const totalAdjustment = sumKnown(
    adjustmentSettlements.map((settlement) => settlement.net_paid_paisa),
  );
  const allocatedAdjustment = sumKnown(
    adjustmentSettlements.map((settlement) => settlement.allocated_paisa),
  );
  const unallocatedAdjustment = sumKnown(
    adjustmentSettlements.map((settlement) => settlement.unallocated_paisa),
  );

  if (totalAdjustment !== allocatedAdjustment + unallocatedAdjustment) {
    throw new Error('ADJUSTMENT_RECONCILIATION_INVARIANT_FAILED');
  }

  const exceptionCounts = countBy(exceptions.map((exception) => exception.type));

  const kpis: ReconciliationKpis = {
    expected_receivable_paisa: sumKnown(
      deliveredRows.map((row) => row.expected_receivable_paisa),
    ),
    verified_paid_paisa: sumKnown(
      deliveredRows.map((row) => row.verified_paid_paisa),
    ),
    verified_paid_non_delivered_paisa: sumKnown(
      nonDeliveredShipments.map((row) => row.verified_paid_paisa),
    ),
    adjustment_paisa: sumKnown(deliveredRows.map((row) => row.adjustment_paisa)),
    total_adjustment_paisa: totalAdjustment,
    allocated_adjustment_paisa: allocatedAdjustment,
    unallocated_adjustment_paisa: unallocatedAdjustment,
    net_settlement_variance_paisa: sumKnown(
      deliveredRows.map((row) => row.settlement_variance_paisa),
    ),
    outstanding_receivable_paisa: sumKnown(
      deliveredRows.map((row) => row.outstanding_receivable_paisa),
    ),
    overdue_receivable_confirmed_paisa: sumKnown(
      deliveredRows
        .filter(
          (row) =>
            row.due_date_status === 'OVERDUE' &&
            row.due_date_confidence === 'CONFIRMED',
        )
        .map((row) => row.outstanding_receivable_paisa),
    ),
    overdue_receivable_provisional_paisa: sumKnown(
      deliveredRows
        .filter(
          (row) =>
            row.due_date_status === 'OVERDUE' &&
            row.due_date_confidence === 'PROVISIONAL',
        )
        .map((row) => row.outstanding_receivable_paisa),
    ),
    overpaid_paisa: sumKnown(deliveredRows.map((row) => row.overpaid_paisa)),
    verified_fee_discrepancy_paisa: sumKnown(
      deliveredRows.map((row) => row.verified_fee_discrepancy_paisa),
    ),
    rto_fee_discrepancy_paisa: sumKnown(
      returnedRows.map((row) => row.rto_fee_discrepancy_paisa),
    ),
    rto_operational_cost_paisa: sumKnown(
      returnedRows.map((row) => row.rto_cost_paisa),
    ),
    rto_cost_unknown_count: returnedRows.filter((row) => row.rto_cost_paisa === null)
      .length,
    unallocated_settlement_paisa: sumKnown(
      settlementSummary
        .filter((row) => {
          if (row.unallocated_paisa === null) return true;
          const direction = row.net_paid_paisa !== null && row.net_paid_paisa < 0n ? -1n : 1n;
          return row.unallocated_paisa * direction >= 0n;
        })
        .map((row) => row.unallocated_paisa),
    ),
    over_allocated_settlement_count: settlementSummary.filter((row) => {
      if (row.unallocated_paisa === null) return false;
      const direction = row.net_paid_paisa !== null && row.net_paid_paisa < 0n ? -1n : 1n;
      return row.unallocated_paisa * direction < 0n;
    }).length,
    unattributed_fee_paisa: sumKnown(
      settlementSummary.map((row) => row.unattributed_fee_paisa),
    ),
    potential_exposure_paisa: sumKnown(
      exposureRows.map((row) => row.cod_collected_paisa),
    ),
    potential_exposure_unknown_count: exposureRows.filter(
      (row) => row.cod_collected_paisa === null,
    ).length,
    counts_by_completeness: countBy(
      results
        .filter((row) => row.shipment_id)
        .map((row) => row.settlement_completeness),
    ),
    counts_by_due_date_status: countBy(
      results.filter((row) => row.shipment_id).map((row) => row.due_date_status),
    ),
    unknown_expected_count: deliveredRows.filter(
      (row) => row.expected_receivable_paisa === null,
    ).length,
    exception_count: exceptions.length,
    exceptions_by_type: exceptionCounts,
    invalid_row_count: normalized.invalid_rows.length,
    shipment_count: results.filter((row) => row.shipment_id).length,
    settlement_count: settlementSummary.length,
  };

  const kpisPkr: Record<string, string> = {};
  Object.keys(kpis).forEach((key) => {
    if (/_paisa$/.test(key)) {
      kpisPkr[key.replace(/_paisa$/, '_pkr')] = formatPkr(kpis[key] as bigint);
    }
  });

  const core = {
    engine_version: normalized.engine_version,
    seller_id: seller,
    as_of_date: normalized.as_of_date,
    coverage_used: normalized.coverage,
    courier_rules_used: normalized.rules,
    warnings: normalized.warnings,
    input_counts: normalized.input_counts,
    valid_counts: normalized.valid_counts,
    validation_errors: validationErrors,
    results,
    settlement_summary: settlementSummary,
    exceptions,
    kpis,
    kpis_pkr: kpisPkr,
  };

  const outputHash = sha256(JSON.stringify(canonicalize(core)));

  return { ...core, output_hash: outputHash };
}
