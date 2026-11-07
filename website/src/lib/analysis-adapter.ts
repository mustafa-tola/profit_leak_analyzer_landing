import type { DashboardData, Kpi, CourierRow, SettlementSlice, Finding } from '../data/dashboard';
import { sampleDashboardData } from '../data/dashboard';
import type { PublicAnalysisRun, PublicAnalysisSummary } from './api';

function num(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function paisaToRupees(value: unknown): number {
  return num(value) / 100;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function statusLabel(status: unknown): 'Provisional' | 'Needs review' | 'Overdue' {
  const s = String(status ?? '').toUpperCase();
  if (s.includes('OVERDUE') || s.includes('HIGH')) return 'Overdue';
  if (s.includes('PROVISIONAL') || s.includes('MEDIUM')) return 'Provisional';
  return 'Needs review';
}

function buildKpis(run: PublicAnalysisSummary | PublicAnalysisRun): Kpi[] {
  const counts = run.counts ?? {};
  const k = run.kpis_pkr ?? {};
  const exceptions = num(counts.exceptions);
  const shipments = num(counts.shipments ?? counts.results);
  const outstanding = k.outstanding_receivable_pkr ?? 'PKR 0.00';
  const expected = k.expected_receivable_pkr ?? 'PKR 0.00';
  const paid = k.verified_paid_pkr ?? k.verified_paid_paisa_pkr ?? 'PKR 0.00';
  const exposure = k.potential_exposure_pkr;
  const discrepancyValue = exposure ?? outstanding;
  const discrepancyBasis = exposure ? 'potential exposure' : 'outstanding receivable (no exposure field returned)';

  return [
    {
      id: 'discrepancy',
      label: 'Potential settlement discrepancies',
      value: discrepancyValue,
      detail: `${exceptions} exception${exceptions === 1 ? '' : 's'} flagged · provisional indicator`,
      note: `Informational estimate based on ${discrepancyBasis}. Not a confirmed financial loss — verify against courier statements before action.`,
      emphasis: true,
    },
    {
      id: 'expected',
      label: 'Expected receivable',
      value: expected,
      detail: `${shipments} shipment${shipments === 1 ? '' : 's'} analyzed`,
    },
    {
      id: 'paid',
      label: 'Verified payments',
      value: paid,
      detail: `As of ${run.as_of_date ?? 'analysis date'}`,
    },
    {
      id: 'outstanding',
      label: 'Outstanding receivable',
      value: outstanding,
      detail: run.quality_message || `${run.analysis_quality} run`,
    },
  ];
}

function buildCourierRows(result: Record<string, unknown> | undefined): CourierRow[] {
  const rows = asArray(result?.results);
  const byCourier = new Map<string, {
    shipped: number; inTransit: number; returned: number; delivered: number;
    feeTotal: number; settleDays: number[]; codTotal: number; paidTotal: number;
  }>();
  for (const raw of rows) {
    const row = asRecord(raw);
    if (!row) continue;
    const courier = String(row.courier ?? row.courier_name ?? 'Unknown');
    const entry = byCourier.get(courier) ?? {
      shipped: 0, inTransit: 0, returned: 0, delivered: 0, feeTotal: 0, settleDays: [], codTotal: 0, paidTotal: 0,
    };
    entry.shipped += 1;
    const status = String(row.normalized_status ?? row.status ?? '').toUpperCase();
    if (status.includes('TRANSIT') || status.includes('PENDING') || status.includes('IN_PROCESS')) entry.inTransit += 1;
    else if (status.includes('RTO') || status.includes('RETURN')) entry.returned += 1;
    else if (status.includes('DELIVER')) entry.delivered += 1;
    entry.feeTotal += paisaToRupees(row.charged_delivery_fee_paisa ?? row.delivery_fee_paisa ?? row.total_deductions_paisa);
    entry.codTotal += paisaToRupees(row.cod_collected_paisa ?? row.expected_receivable_paisa);
    entry.paidTotal += paisaToRupees(row.verified_paid_paisa);
    byCourier.set(courier, entry);
  }
  const mapped = Array.from(byCourier.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([courier, s]) => ({
      courier,
      shipped: s.shipped,
      inTransit: s.inTransit,
      returned: s.returned,
      costPerDelivered: s.delivered > 0 ? Math.round(s.feeTotal / s.delivered) : Math.round(s.feeTotal),
      avgSettleDays: 0,
    }));
  return mapped.length > 0 ? mapped : sampleDashboardData.courierComparison;
}

function buildSettlementSlices(run: PublicAnalysisRun): { slices: SettlementSlice[]; label: string } {
  const kpis = asRecord(run.result?.kpis) ?? {};
  const counts = (kpis.counts_by_completeness as Record<string, number> | undefined) ?? {};
  const dueCounts = (kpis.counts_by_due_date_status as Record<string, number> | undefined) ?? {};
  const settled = num(counts.SETTLED);
  const partial = num(counts.PARTIALLY_SETTLED);
  const unsettled = num(counts.UNSETTLED);
  const oversettled = num(counts.OVERSETTLED);
  const unknown = num(counts.UNKNOWN) + num(counts.NOT_APPLICABLE);
  const overdue = num(dueCounts.OVERDUE);
  const notDue = num(dueCounts.NOT_DUE);
  const outstandingR = paisaToRupees(kpis.outstanding_receivable_paisa);
  const paidR = paisaToRupees(kpis.verified_paid_paisa);
  const overpaidR = paisaToRupees(kpis.overpaid_paisa);

  const slices: SettlementSlice[] = [
    { label: 'Verified paid', amount: Math.max(0, Math.round(paidR)), colorClass: 'bg-accent' },
    { label: 'Outstanding', amount: Math.max(0, Math.round(outstandingR)), colorClass: 'bg-amber-500' },
    { label: 'Overpaid', amount: Math.max(0, Math.round(overpaidR)), colorClass: 'bg-orange-700 dark:bg-orange-400' },
  ].filter((s) => s.amount > 0 || s.label === 'Verified paid');

  if (slices.length === 0) slices.push({ label: 'No settlement amounts', amount: 1, colorClass: 'bg-slate-400' });
  const label = `Settled ${settled} · Partial ${partial} · Unsettled ${unsettled} · Oversettled ${oversettled} · Overdue ${overdue} · Not due ${notDue} · Unknown/NA ${unknown}`;
  return { slices, label };
}

function buildFindings(result: Record<string, unknown> | undefined): { items: Finding[]; label: string } {
  const exceptions = asArray(result?.exceptions);
  const items: Finding[] = exceptions.slice(0, 12).map((raw, index) => {
    const ex = asRecord(raw) ?? {};
    const amount = Math.round(paisaToRupees(ex.amount_paisa ?? ex.impact_paisa ?? ex.delta_paisa));
    const evidence: Record<string, unknown> = {};
    for (const key of [
      'order_id', 'shipment_id', 'tracking_number', 'settlement_id', 'courier',
      'expected_receivable_paisa', 'verified_paid_paisa', 'outstanding_paisa',
      'amount_paisa', 'delta_paisa', 'impact_paisa', 'due_date', 'settlement_date',
      'reason', 'details', 'source', 'confidence', 'severity',
    ]) {
      if (ex[key] !== undefined && ex[key] !== null && ex[key] !== '') evidence[key] = ex[key];
    }
    return {
      ruleId: String(ex.type ?? ex.exception_type ?? `EX-${index + 1}`).slice(0, 16),
      title: String(ex.description ?? ex.message ?? ex.type ?? 'Exception flagged'),
      courier: String(ex.courier ?? '—'),
      orders: 1,
      amount: Math.max(0, amount),
      status: statusLabel(ex.severity ?? ex.due_date_status ?? ex.confidence),
      ...(Object.keys(evidence).length ? { evidence } : {}),
    };
  });
  if (items.length === 0) {
    return { items: [], label: 'No exceptions flagged in this run' };
  }
  return { items, label: `${exceptions.length} exception${exceptions.length === 1 ? '' : 's'} flagged · provisional, verify before action` };
}

export function toDashboardData(run: PublicAnalysisRun): DashboardData {
  const courierComparison = buildCourierRows(run.result);
  const settlement = buildSettlementSlices(run);
  const findings = buildFindings(run.result);
  return {
    source: 'live',
    runId: run.run_id,
    sellerId: run.seller_id,
    analysisQuality: run.analysis_quality,
    qualityMessage: run.quality_message,
    asOfDate: run.as_of_date,
    kpis: buildKpis(run),
    monthlyExpenses: sampleDashboardData.monthlyExpenses,
    monthlyExpensesLabel: 'Monthly trend is not available for a single live run · sample trend shown',
    courierComparison,
    courierComparisonLabel: 'Derived from live shipment results',
    settlementStatus: settlement.slices,
    settlementLabel: settlement.label,
    findings: findings.items,
    findingsLabel: findings.label,
    rtoDefinition: 'Live RTO metrics are derived from shipment statuses in the analyzed run. Returned/RTO rows are compared to resolved rows where available.',
    costDefinition: 'Live cost figures are derived from charged delivery/fee fields present in the analyzed run.',
  };
}

export function summaryToKpis(run: PublicAnalysisSummary): Kpi[] {
  return buildKpis(run);
}
