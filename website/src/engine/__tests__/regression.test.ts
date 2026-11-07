import { describe, expect, it } from 'vitest';
import { analyze } from '../analyze';
import type { EngineInput } from '../types';
import { readCsvFixture, readFixture } from './support/csv';

function mixedStressInput(): EngineInput {
  return {
    seller_id: 'SELLER-DEMO',
    as_of_date: '2026-10-30',
    courier_rules: [{ courier: 'TCS', settlement_days: '7' }],
    orders: readCsvFixture('orders.csv'),
    shipments: readCsvFixture('shipments.csv'),
    settlements: readCsvFixture('settlements.csv'),
    allocations: readCsvFixture('allocations.csv'),
  };
}

const output = analyze(mixedStressInput());

describe('PLA realistic mixed-stress regression baseline (437 rows)', () => {
  it('loads exactly 437 source rows', () => {
    expect(output.input_counts).toEqual({
      orders: 117,
      shipments: 116,
      settlements: 105,
      allocations: 99,
    });
    expect(
      output.input_counts.orders +
        output.input_counts.shipments +
        output.input_counts.settlements +
        output.input_counts.allocations,
    ).toBe(437);
  });

  it('preserves expected receivables of PKR 556,960', () => {
    expect(output.kpis.expected_receivable_paisa).toBe(55_696_000n);
    expect(output.kpis_pkr.expected_receivable_pkr).toBe('PKR 556,960.00');
  });

  it('preserves verified payments of PKR 488,285', () => {
    expect(output.kpis.verified_paid_paisa).toBe(48_828_500n);
    expect(output.kpis_pkr.verified_paid_pkr).toBe('PKR 488,285.00');
  });

  it('preserves outstanding receivable of PKR 68,675', () => {
    expect(output.kpis.outstanding_receivable_paisa).toBe(6_867_500n);
    expect(output.kpis_pkr.outstanding_receivable_pkr).toBe('PKR 68,675.00');
  });

  it('preserves 87 exceptions and 5 validation errors', () => {
    expect(output.validation_errors).toHaveLength(5);
    expect(output.exceptions).toHaveLength(87);
    expect(output.kpis.exceptions_by_type?.FEE_DISCREPANCY).toBe(5);
  });

  it('classifies the run as PARTIAL_DATA', () => {
    expect(output.analysis_quality).toBe('PARTIAL_DATA');
    expect(output.rejected_row_count).toBe(5);
    expect(output.validation_error_count).toBe(5);
  });

  it('keeps settlement completeness and order matching independent', () => {
    // Engine completeness, not fixture scenario labels: the 5 fee-overcharge
    // shipments are partially settled because PKR 50 remains outstanding,
    // and the 3 unmatched + 1 conflicting shipment are treated as unsettled.
    expect(output.kpis.counts_by_completeness).toEqual({
      NOT_APPLICABLE: 5,
      PARTIALLY_SETTLED: 17,
      SETTLED: 82,
      UNSETTLED: 12,
    });
    // 3 absent orders + the shipment whose order was excluded as a conflicting duplicate.
    expect(output.kpis.exceptions_by_type.UNMATCHED_SHIPMENT).toBe(4);
    expect(output.kpis.exceptions_by_type.UNMATCHED_ORDER ?? 0).toBe(0);
    expect(output.kpis.exceptions_by_type.PARTIAL_SETTLEMENT).toBe(17);
    expect(output.kpis.exceptions_by_type.UNSETTLED_SHIPMENT).toBe(12);
  });

  it('reports operational RTO cost separately from receivables', () => {
    expect(output.kpis.rto_operational_cost_paisa).toBe(60_000n);
    expect(output.kpis.exceptions_by_type?.RTO_COST).toBe(5);
  });

  it('reports fee overcharges without adding them to receivables', () => {
    expect(output.kpis.verified_fee_discrepancy_paisa).toBe(25_000n);
    expect(output.kpis.exceptions_by_type?.COD_MISMATCH).toBe(2);
  });

  it('keeps allocated and unallocated adjustments reconciled', () => {
    expect(output.kpis.total_adjustment_paisa).toBe(1_500n);
    expect(output.kpis.allocated_adjustment_paisa).toBe(0n);
    expect(output.kpis.unallocated_adjustment_paisa).toBe(1_500n);
    expect(output.kpis.exceptions_by_type?.ADJUSTMENT_PRESENT).toBe(2);
  });

  it('matches the checked-in row-level oracle for every scenario row', () => {
    const oracle = readCsvFixture('expected_scenarios.csv');
    expect(oracle).toHaveLength(119);

    const byShipment = new Map(
      output.results
        .filter((row) => row.shipment_id)
        .map((row) => [row.shipment_id as string, row]),
    );

    const invalidScenario = new Set([
      'TOO_MANY_DECIMALS',
      'INVALID_DATE',
      'CROSS_SELLER',
    ]);

    for (const expected of oracle) {
      if (invalidScenario.has(expected.expectation)) continue;
      const actual = byShipment.get(expected.shipment_id);
      expect(actual, `missing result for ${expected.shipment_id}`).toBeDefined();
      if (!actual) throw new Error(`missing result for ${expected.shipment_id}`);

      if (expected.expected_receivable_paisa !== '0') {
        expect(actual.expected_receivable_paisa, expected.shipment_id).toBe(
          BigInt(expected.expected_receivable_paisa),
        );
      }
      if (expected.expected_paid_paisa !== '0') {
        expect(actual.verified_paid_paisa, expected.shipment_id).toBe(
          BigInt(expected.expected_paid_paisa),
        );
      }
    }
  });

  it('is deterministic across repeated runs', () => {
    const second = analyze(mixedStressInput());
    expect(second.output_hash).toBe(output.output_hash);
    expect(second.kpis).toEqual(output.kpis);
  });

  it('keeps the fixture control counts aligned', () => {
    const control = JSON.parse(readFixture('control_counts.json')) as {
      expected_row_counts: Record<string, number>;
      clean_settled_count: number;
      partial_count: number;
      unsettled_count: number;
      fee_overcharge_count: number;
      rto_count: number;
      unmatched_shipment_count: number;
      cod_mismatch_count: number;
      invalid_source_order_rows: number;
      duplicate_conflict_rows: number;
      unallocated_payment_entries: number;
      standalone_adjustment_entries: number;
    };

    const scenarios = readCsvFixture('expected_scenarios.csv');
    const countScenario = (name: string) =>
      scenarios.filter((row) => row.scenario === name).length;

    expect(control.expected_row_counts).toEqual(output.input_counts);
    expect(control.clean_settled_count).toBe(countScenario('CLEAN_SETTLED'));
    expect(control.partial_count).toBe(countScenario('PARTIAL_SETTLEMENT'));
    expect(control.unsettled_count).toBe(countScenario('UNSETTLED'));
    expect(control.fee_overcharge_count).toBe(output.kpis.exceptions_by_type.FEE_DISCREPANCY);
    expect(control.rto_count).toBe(output.kpis.exceptions_by_type.RTO_COST);
    // Fixture count is scenario rows, not exception count: the excluded
    // duplicate order adds one extra UNMATCHED_SHIPMENT exception.
    expect(control.unmatched_shipment_count).toBe(countScenario('UNMATCHED_SHIPMENT'));
    expect(output.kpis.exceptions_by_type.UNMATCHED_SHIPMENT).toBe(
      control.unmatched_shipment_count + 1,
    );
    expect(control.cod_mismatch_count).toBe(output.kpis.exceptions_by_type.COD_MISMATCH);
    expect(control.invalid_source_order_rows).toBe(5);
    expect(control.duplicate_conflict_rows).toBe(2);
    expect(control.unallocated_payment_entries).toBe(4);
    expect(control.standalone_adjustment_entries).toBe(2);
  });
});

