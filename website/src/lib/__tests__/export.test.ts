import { describe, expect, it } from 'vitest';
import { buildRunCsv, csvCell, paisaToPkr, toCsv } from '../export';
import type { PublicAnalysisRun } from '../api';

const run = {
  run_id: '11111111-2222-3333-4444-555555555555',
  seller_id: 'SELLER-DEMO',
  created_at: '2026-11-21T00:00:00.000Z',
  as_of_date: '2026-11-20',
  analysis_quality: 'PARTIAL_DATA',
  quality_message: 'Some input records were rejected.',
  engine_version: 'pla-engine-1',
  schema_version: 'pla-schema-1',
  mapping_version: 'pla-map-1',
  output_hash: 'hash-123',
  counts: { exceptions: 1, validation_errors: 1, shipments: 2 },
  kpis_pkr: { expected_receivable_pkr: 'PKR 1,000.00' },
  source_files: [{ source: 'orders', filename: 'orders.csv', row_count: 2 }],
  result: {
    output_hash: 'hash-123',
    exceptions: [
      {
        exception_id: 'EX-1',
        type: 'PARTIAL_SETTLEMENT',
        severity: 'medium',
        confidence: 'HIGH',
        seller_id: 'SELLER-DEMO',
        order_id: 'ORD-1',
        shipment_id: 'SHP-1',
        tracking_number: 'TRK-1',
        settlement_id: 'SET-1',
        amount_paisa: '2550',
        description: '=SUM(A1:A2)',
        evidence: { courier: 'TCS' },
      },
    ],
    settlement_summary: [
      {
        settlement_id: 'SET-1',
        courier: 'TCS',
        entry_type: 'PAYMENT',
        settlement_date: '2026-11-20',
        gross_cod_paisa: '100000',
        delivery_fees_paisa: '5000',
        rto_fees_paisa: null,
        other_deductions_paisa: '0',
        net_paid_paisa: '95000',
        allocated_paisa: '95000',
        unallocated_paisa: '0',
        attributed_fee_paisa: '5000',
        unattributed_fee_paisa: '0',
        arithmetic_ok: true,
        allocation_ids: ['ALLOC-1'],
      },
    ],
  },
} as unknown as PublicAnalysisRun;

describe('CSV exports', () => {
  it('escapes delimiters and neutralizes spreadsheet formulas', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(csvCell('@cmd')).toBe("'@cmd");
  });

  it('writes CRLF rows with a trailing newline', () => {
    expect(toCsv(['a', 'b'], [[1, 2]])).toBe('a,b\r\n1,2\r\n');
  });

  it('converts integer paisa without floating point drift', () => {
    expect(paisaToPkr('2550')).toBe('25.50');
    expect(paisaToPkr('5')).toBe('0.05');
    expect(paisaToPkr('-1005')).toBe('-10.05');
    expect(paisaToPkr(null)).toBe('');
  });

  it('builds a summary export from persisted run metadata and KPIs', () => {
    const csv = buildRunCsv(run, 'summary');
    expect(csv).toContain('section,field,value');
    expect(csv).toContain('run,run_id,11111111-2222-3333-4444-555555555555');
    expect(csv).toContain('kpi_pkr,expected_receivable_pkr,"PKR 1,000.00"');
    expect(csv).toContain('count,exceptions,1');
  });

  it('builds an exceptions export with rule codes and safe evidence', () => {
    const csv = buildRunCsv(run, 'exceptions');
    expect(csv).toContain('exception_id,rule_code,severity');
    expect(csv).toContain('EX-1,PARTIAL_SETTLEMENT,medium');
    expect(csv).toContain('2550,25.50');
    expect(csv).toContain("'=SUM(A1:A2)");
    expect(csv).toContain('"{""courier"":""TCS""}"');
  });

  it('builds a settlement evidence export with PKR amounts', () => {
    const csv = buildRunCsv(run, 'settlements');
    expect(csv).toContain('settlement_id,courier,entry_type');
    expect(csv).toContain('SET-1,TCS,PAYMENT');
    expect(csv).toContain('1000.00,50.00,,0.00,950.00');
  });
});
