/**
 * Phase 1 manual acceptance smoke check.
 *
 * Read-only: loads the checked-in synthetic fixtures, runs the engine and
 * compares the result to the approved regression baseline. It does not touch
 * the database, API or UI.
 *
 * Run from website/:  npx vite-node scripts/phase1-manual-check.ts
 */

import { join, resolve } from 'node:path';
import { analyze } from '../src/engine/analyze';
import { readCsvFile } from '../src/engine/csv';
import { formatPkr } from '../src/engine/money';
import type { AnalysisResult } from '../src/engine/analyze';
import type { EngineInput } from '../src/engine/types';

const fixtureRoot =
  process.env.PLA_FIXTURES ?? resolve(process.cwd(), '..', 'n8n', 'sample-data');

type Check = { name: string; expected: string; actual: string; pass: boolean };
const checks: Check[] = [];

function check(name: string, expected: string, actual: string): void {
  checks.push({ name, expected, actual, pass: expected === actual });
}

function checkPack(dir: string, expected: {
  quality: string;
  validationErrors: number;
  rejectedRows: number;
  exceptions: number;
  expectedReceivable: bigint;
  verifiedPaid: bigint;
  outstanding: bigint;
  settled: number;
  partiallySettled?: number;
  unsettled?: number;
}): AnalysisResult {
  const load = (file: string) =>
    readCsvFile(join(fixtureRoot, dir, file));
  const input: EngineInput = {
    seller_id: 'SELLER-DEMO',
    as_of_date: '2026-10-30',
    courier_rules: [{ courier: 'TCS', settlement_days: '7' }],
    orders: load('orders.csv'),
    shipments: load('shipments.csv'),
    settlements: load('settlements.csv'),
    allocations: load('allocations.csv'),
  };
  const result = analyze(input);

  check(`${dir}: analysis quality`, expected.quality, result.analysis_quality);
  check(
    `${dir}: validation errors`,
    String(expected.validationErrors),
    String(result.validation_error_count),
  );
  check(`${dir}: rejected rows`, String(expected.rejectedRows), String(result.rejected_row_count));
  check(`${dir}: exceptions`, String(expected.exceptions), String(result.exceptions.length));
  check(
    `${dir}: expected receivable`,
    formatPkr(expected.expectedReceivable),
    formatPkr(result.kpis.expected_receivable_paisa),
  );
  check(
    `${dir}: verified payments`,
    formatPkr(expected.verifiedPaid),
    formatPkr(result.kpis.verified_paid_paisa),
  );
  check(
    `${dir}: outstanding`,
    formatPkr(expected.outstanding),
    formatPkr(result.kpis.outstanding_receivable_paisa),
  );
  check(
    `${dir}: settled count`,
    String(expected.settled),
    String(result.kpis.counts_by_completeness.SETTLED ?? 0),
  );
  if (expected.partiallySettled !== undefined) {
    check(
      `${dir}: partially settled count`,
      String(expected.partiallySettled),
      String(result.kpis.counts_by_completeness.PARTIALLY_SETTLED ?? 0),
    );
  }
  if (expected.unsettled !== undefined) {
    check(
      `${dir}: unsettled count`,
      String(expected.unsettled),
      String(result.kpis.counts_by_completeness.UNSETTLED ?? 0),
    );
  }

  return result;
}

function main(): void {
  console.log('PLA Phase 1 manual acceptance smoke check');
  console.log(`Fixture root: ${fixtureRoot}`);
  console.log('');

  // 1. CLEAN: fully settled, no data-quality findings.
  checkPack('01_clean_settled', {
    quality: 'CLEAN',
    validationErrors: 0,
    rejectedRows: 0,
    exceptions: 0,
    expectedReceivable: 340_000n,
    verifiedPaid: 340_000n,
    outstanding: 0n,
    settled: 2,
  });

  // 2. Mixed exceptions: valid input, operational findings only.
  checkPack('02_mixed_exceptions', {
    quality: 'CLEAN',
    validationErrors: 0,
    rejectedRows: 0,
    exceptions: 12,
    expectedReceivable: 850_000n,
    verifiedPaid: 510_000n,
    outstanding: 340_000n,
    settled: 1,
    partiallySettled: 2,
    unsettled: 1,
  });

  // 3. Rejected rows must be excluded but the run remains usable.
  checkPack('03_validation_failures', {
    quality: 'PARTIAL_DATA',
    validationErrors: 5,
    rejectedRows: 5,
    exceptions: 6,
    expectedReceivable: 80_000n,
    verifiedPaid: 80_000n,
    outstanding: 0n,
    settled: 1,
  });

  // 4. Standalone adjustment: counted once, not added to receivables.
  const adjustment = checkPack('04_adjustment_diagnostic', {
    quality: 'CLEAN',
    validationErrors: 0,
    rejectedRows: 0,
    exceptions: 2,
    expectedReceivable: 230_000n,
    verifiedPaid: 230_000n,
    outstanding: 0n,
    settled: 1,
  });
  check(
    '04_adjustment_diagnostic: adjustment exception',
    '1',
    String(adjustment.kpis.exceptions_by_type.ADJUSTMENT_PRESENT ?? 0),
  );
  check(
    '04_adjustment_diagnostic: unallocated adjustment',
    '1',
    String(adjustment.kpis.exceptions_by_type.UNALLOCATED_SETTLEMENT ?? 0),
  );

  // 5. Approved 437-row financial baseline.
  const stress = checkPack('PLA_Realistic_Mixed_Stress', {
    quality: 'PARTIAL_DATA',
    validationErrors: 5,
    rejectedRows: 5,
    exceptions: 87,
    expectedReceivable: 55_696_000n,
    verifiedPaid: 48_828_500n,
    outstanding: 6_867_500n,
    settled: 82,
    partiallySettled: 17,
    unsettled: 12,
  });
  check(
    'PLA_Realistic_Mixed_Stress: source rows',
    '437',
    String(
      stress.input_counts.orders +
        stress.input_counts.shipments +
        stress.input_counts.settlements +
        stress.input_counts.allocations,
    ),
  );
  check(
    'PLA_Realistic_Mixed_Stress: RTO cost separate from receivables',
    'PKR 600.00',
    formatPkr(stress.kpis.rto_operational_cost_paisa),
  );
  check(
    'PLA_Realistic_Mixed_Stress: fee discrepancy not in outstanding',
    'PKR 250.00',
    formatPkr(stress.kpis.verified_fee_discrepancy_paisa),
  );
  check(
    'PLA_Realistic_Mixed_Stress: adjustments reconcile',
    'PKR 15.00 = PKR 0.00 + PKR 15.00',
    `${formatPkr(stress.kpis.total_adjustment_paisa)} = ${formatPkr(
      stress.kpis.allocated_adjustment_paisa,
    )} + ${formatPkr(stress.kpis.unallocated_adjustment_paisa)}`,
  );

  // 6. NO_VALID_SETTLEMENTS: settlements submitted but all rejected.
  const noValidInput: EngineInput = {
    seller_id: 'SELLER-DEMO',
    as_of_date: '2026-10-30',
    courier_rules: [{ courier: 'TCS', settlement_days: '7' }],
    orders: readCsvFile(join(fixtureRoot, '01_clean_settled', 'orders.csv')),
    shipments: readCsvFile(join(fixtureRoot, '01_clean_settled', 'shipments.csv')),
    settlements: readCsvFile(join(fixtureRoot, '01_clean_settled', 'settlements.csv')).map(
      (row) => ({ ...row, net_paid_pkr: 'INVALID' }),
    ),
    allocations: readCsvFile(join(fixtureRoot, '01_clean_settled', 'allocations.csv')),
  };
  const noValid = analyze(noValidInput);
  check(
    'NO_VALID_SETTLEMENTS: analysis quality',
    'NO_VALID_SETTLEMENTS',
    noValid.analysis_quality,
  );
  check('NO_VALID_SETTLEMENTS: accepted settlements', '0', String(noValid.valid_counts.settlements));

  // 7. Deterministic rerun with identical inputs.
  const replay = analyze({
    seller_id: 'SELLER-DEMO',
    as_of_date: '2026-10-30',
    courier_rules: [{ courier: 'TCS', settlement_days: '7' }],
    orders: readCsvFile(join(fixtureRoot, 'PLA_Realistic_Mixed_Stress', 'orders.csv')),
    shipments: readCsvFile(join(fixtureRoot, 'PLA_Realistic_Mixed_Stress', 'shipments.csv')),
    settlements: readCsvFile(join(fixtureRoot, 'PLA_Realistic_Mixed_Stress', 'settlements.csv')),
    allocations: readCsvFile(join(fixtureRoot, 'PLA_Realistic_Mixed_Stress', 'allocations.csv')),
  });
  check('determinism: repeated output hash', stress.output_hash, replay.output_hash);

  const width = Math.max(...checks.map((item) => item.name.length));
  checks.forEach((item) => {
    console.log(
      `${item.pass ? 'PASS' : 'FAIL'}  ${item.name.padEnd(width)}  expected=${item.expected}  actual=${item.actual}`,
    );
  });

  const failures = checks.filter((item) => !item.pass);
  console.log('');
  console.log(`Summary: ${checks.length - failures.length}/${checks.length} checks passed`);
  if (failures.length > 0) {
    console.log('RESULT: FAIL — stop before Phase 2 and investigate the failing checks.');
    process.exitCode = 1;
    return;
  }
  console.log('RESULT: PASS — Phase 1 manual acceptance is complete.');
}

main();
