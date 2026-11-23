import type { PublicAnalysisRun } from './api';

export type RunExportKind = 'summary' | 'exceptions' | 'settlements';

export const RUN_EXPORT_LABELS: Record<RunExportKind, string> = {
  summary: 'Summary',
  exceptions: 'Exceptions',
  settlements: 'Settlement evidence',
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(cellText).join(' | ');
  return JSON.stringify(value);
}

export function csvCell(value: unknown): string {
  let text = cellText(value);
  if (/^[\t\r\n]|^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: readonly unknown[][]): string {
  return `${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function paisaToPkr(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  if (!/^-?\d+$/.test(text)) return text;
  const negative = text.startsWith('-');
  const digits = (negative ? text.slice(1) : text).padStart(3, '0');
  return `${negative ? '-' : ''}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

function summaryRows(run: PublicAnalysisRun): unknown[][] {
  const result = asRecord(run.result);
  const rows: unknown[][] = [];
  const metadata: Array<[string, unknown]> = [
    ['run_id', run.run_id],
    ['seller_id', run.seller_id],
    ['created_at', run.created_at],
    ['as_of_date', run.as_of_date],
    ['analysis_quality', run.analysis_quality],
    ['quality_message', run.quality_message],
    ['engine_version', run.engine_version],
    ['schema_version', run.schema_version],
    ['mapping_version', run.mapping_version],
    ['output_hash', run.output_hash],
  ];
  for (const [field, value] of metadata) rows.push(['run', field, value]);
  for (const [field, value] of Object.entries(run.kpis_pkr ?? {})) {
    rows.push(['kpi_pkr', field, value]);
  }
  for (const [field, value] of Object.entries(run.counts ?? {})) {
    rows.push(['count', field, value]);
  }
  rows.push(['source', 'files', (run.source_files ?? []).map((file) => file.filename).join(' | ')]);
  rows.push(['evidence', 'method', 'Amounts are engine output; exceptions are provisional until reviewed.']);
  if (result && 'output_hash' in result) {
    rows.push(['engine', 'result_output_hash', result.output_hash]);
  }
  return rows;
}

function exceptionRows(run: PublicAnalysisRun): unknown[][] {
  return asArray(asRecord(run.result)?.exceptions).map((raw) => {
    const ex = asRecord(raw) ?? {};
    return [
      ex.exception_id,
      ex.type,
      ex.severity,
      ex.confidence,
      ex.seller_id,
      ex.order_id,
      ex.shipment_id,
      ex.tracking_number,
      ex.settlement_id,
      ex.amount_paisa,
      paisaToPkr(ex.amount_paisa),
      ex.description,
      ex.evidence === undefined ? '' : JSON.stringify(ex.evidence),
    ];
  });
}

function settlementRows(run: PublicAnalysisRun): unknown[][] {
  return asArray(asRecord(run.result)?.settlement_summary).map((raw) => {
    const row = asRecord(raw) ?? {};
    return [
      row.settlement_id,
      row.courier,
      row.entry_type,
      row.settlement_date,
      paisaToPkr(row.gross_cod_paisa),
      paisaToPkr(row.delivery_fees_paisa),
      paisaToPkr(row.rto_fees_paisa),
      paisaToPkr(row.other_deductions_paisa),
      paisaToPkr(row.net_paid_paisa),
      paisaToPkr(row.allocated_paisa),
      paisaToPkr(row.unallocated_paisa),
      paisaToPkr(row.attributed_fee_paisa),
      paisaToPkr(row.unattributed_fee_paisa),
      row.arithmetic_ok,
      cellText(row.allocation_ids),
    ];
  });
}

export function buildRunCsv(run: PublicAnalysisRun, kind: RunExportKind): string {
  switch (kind) {
    case 'summary':
      return toCsv(['section', 'field', 'value'], summaryRows(run));
    case 'exceptions':
      return toCsv(
        [
          'exception_id',
          'rule_code',
          'severity',
          'confidence',
          'seller_id',
          'order_id',
          'shipment_id',
          'tracking_number',
          'settlement_id',
          'amount_paisa',
          'amount_pkr',
          'description',
          'evidence_json',
        ],
        exceptionRows(run),
      );
    case 'settlements':
      return toCsv(
        [
          'settlement_id',
          'courier',
          'entry_type',
          'settlement_date',
          'gross_cod_pkr',
          'delivery_fees_pkr',
          'rto_fees_pkr',
          'other_deductions_pkr',
          'net_paid_pkr',
          'allocated_pkr',
          'unallocated_pkr',
          'attributed_fee_pkr',
          'unattributed_fee_pkr',
          'arithmetic_ok',
          'allocation_ids',
        ],
        settlementRows(run),
      );
  }
}

export function runExportFileName(run: PublicAnalysisRun, kind: RunExportKind): string {
  return `codvera-${kind}-${run.run_id.slice(0, 8)}.csv`;
}

export function downloadRunCsv(run: PublicAnalysisRun, kind: RunExportKind): void {
  const blob = new Blob([`\uFEFF${buildRunCsv(run, kind)}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = runExportFileName(run, kind);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
