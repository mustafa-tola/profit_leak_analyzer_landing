import type { AnalysisResult } from '../../../engine/analyze';
import type { PersistedAnalysisRun } from '../../persistence';
import type { Jsonified } from '../../serialization';

export const SAMPLE_RUN_ID = '11111111-1111-4111-8111-111111111111';
export const SAMPLE_OUTPUT_HASH = 'b'.repeat(64);

export function sampleRun(
  overrides: { sellerId?: string; runId?: string } = {},
): PersistedAnalysisRun {
  const runId = overrides.runId ?? SAMPLE_RUN_ID;
  const sellerId = overrides.sellerId ?? 'SELLER-DEMO';

  return {
    persistence_version: 'pla-persistence-v1',
    run_id: runId,
    seller_id: sellerId,
    created_at: '2026-11-07T10:00:00.000Z',
    as_of_date: '2026-10-30',
    engine_version: 'pla-engine-1.2.0',
    schema_version: 'pla-schema-1',
    mapping_version: 'pla-map-1',
    input_fingerprint: 'a'.repeat(64),
    rules: [{ courier: 'TCS', settlement_days: 7 }],
    coverage: [
      {
        courier: 'TCS',
        covered_through: '2026-10-30',
        source: 'user_declaration',
        declared_by: sellerId,
        declared_at: '2026-11-07T00:00:00.000Z',
      },
    ],
    source_files: [
      {
        source: 'orders',
        filename: 'orders.csv',
        size_bytes: 100,
        sha256: 'c'.repeat(64),
        row_count: 1,
        schema_version: 'pla-schema-1',
        mapping_version: 'pla-map-1',
        headers: [{ source_header: 'order_id', canonical_field: 'order_id', column_index: 0 }],
        warnings: [],
      },
    ],
    source_rows: {
      orders: [{ order_id: 'O-1', seller_id: sellerId }],
      shipments: [],
      settlements: [],
      allocations: [],
    },
    result: {
      analysis_quality: 'CLEAN',
      output_hash: SAMPLE_OUTPUT_HASH,
      results: [{ order_id: 'O-1' }],
      exceptions: [],
      validation_errors: [],
      settlement_summary: [],
    } as unknown as Jsonified<AnalysisResult>,
    counts: {
      source_rows: 1,
      orders: 1,
      shipments: 0,
      settlements: 0,
      allocations: 0,
      results: 1,
      exceptions: 0,
      validation_errors: 0,
      settlement_summary: 0,
    },
    verification: {
      persisted_counts_match: true,
      checks: [{ table: 'results', expected: 1, persisted: 1, ok: true }],
    },
  };
}
