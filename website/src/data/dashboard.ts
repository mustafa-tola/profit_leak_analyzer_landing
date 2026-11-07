export type Kpi = {
  id: string;
  label: string;
  value: string;
  detail: string;
  note?: string;
  emphasis?: boolean;
};

export const rtoDefinition =
'RTO rate = returned parcels ÷ parcels with a final outcome (delivered + returned) in the September 2026 shipping cohort. Parcels still in transit are excluded from the denominator and reported separately until resolved. Orders cancelled before shipment are never counted as RTO.';

export const costDefinition =
'Cost per delivered parcel = all forward and return freight for the cohort ÷ 1,152 delivered parcels.';

export const kpis: Kpi[] = [
{
  id: 'discrepancy',
  label: 'Potential settlement discrepancies',
  value: 'PKR 38,240',
  detail: '47 orders flagged · provisional',
  emphasis: true
},
{ id: 'expenses', label: 'Courier expenses', value: 'PKR 412,860', detail: '+6.1% vs August' },
{
  id: 'rto',
  label: 'RTO rate',
  value: '19.2%',
  detail: '273 returned ÷ 1,425 resolved parcels',
  note: '61 in transit excluded until resolved'
},
{ id: 'cost', label: 'Cost per delivered parcel', value: 'PKR 358', detail: 'Forward + return freight' }];


export type MonthlyExpense = {month: string;forward: number;returns: number;};

export const monthlyExpenses: MonthlyExpense[] = [
{ month: 'Apr', forward: 240.2, returns: 58.1 },
{ month: 'May', forward: 256.4, returns: 64.8 },
{ month: 'Jun', forward: 270.1, returns: 73.6 },
{ month: 'Jul', forward: 282.3, returns: 79.9 },
{ month: 'Aug', forward: 300.6, returns: 88.6 },
{ month: 'Sep', forward: 318.4, returns: 94.5 }];


export type CourierRow = {
  courier: string;
  shipped: number;
  inTransit: number;
  returned: number;
  costPerDelivered: number;
  avgSettleDays: number;
};

export const courierComparison: CourierRow[] = [
{ courier: 'TCS', shipped: 512, inTransit: 20, returned: 73, costPerDelivered: 372, avgSettleDays: 6.1 },
{ courier: 'Leopards', shipped: 438, inTransit: 18, returned: 95, costPerDelivered: 365, avgSettleDays: 9.4 },
{ courier: 'PostEx', shipped: 356, inTransit: 15, returned: 72, costPerDelivered: 341, avgSettleDays: 4.8 },
{ courier: 'Trax', shipped: 180, inTransit: 8, returned: 33, costPerDelivered: 352, avgSettleDays: 7.2 }];


export type SettlementSlice = {label: string;amount: number;colorClass: string;};

export const settlementStatus: SettlementSlice[] = [
{ label: 'Settled', amount: 2846300, colorClass: 'bg-accent' },
{ label: 'Not yet due', amount: 412500, colorClass: 'bg-navy dark:bg-[#6B8DB5]' },
{ label: 'Overdue', amount: 168900, colorClass: 'bg-amber-500' },
{ label: 'Disputed', amount: 38240, colorClass: 'bg-orange-700 dark:bg-orange-400' },
{ label: 'Unmatched', amount: 54700, colorClass: 'bg-slate-400 dark:bg-slate-500' }];


export type FindingStatus = 'Provisional' | 'Needs review' | 'Overdue';

export type Finding = {
  ruleId: string;
  title: string;
  courier: string;
  orders: number;
  amount: number;
  status: FindingStatus;
  /** Optional exception metadata for display only (no raw source rows). */
  evidence?: Record<string, unknown>;
};

export const findings: Finding[] = [
{
  ruleId: 'SD-02',
  title: 'Settlement past agreed 7-day term',
  courier: 'TCS',
  orders: 18,
  amount: 16830,
  status: 'Overdue'
},
{
  ruleId: 'PV-07',
  title: 'Payout below expected net remittance',
  courier: 'Leopards',
  orders: 14,
  amount: 12460,
  status: 'Provisional'
},
{
  ruleId: 'CH-03',
  title: 'Return fee on a delivered parcel',
  courier: 'PostEx',
  orders: 9,
  amount: 4050,
  status: 'Needs review'
},
{
  ruleId: 'CH-05',
  title: 'Weight surcharge without weight evidence',
  courier: 'Trax',
  orders: 6,
  amount: 4900,
  status: 'Needs review'
}];

export interface DashboardData {
  source: 'sample' | 'live';
  runId?: string;
  sellerId?: string;
  analysisQuality?: string;
  qualityMessage?: string;
  asOfDate?: string | null;
  kpis: Kpi[];
  monthlyExpenses: MonthlyExpense[];
  monthlyExpensesLabel?: string;
  courierComparison: CourierRow[];
  courierComparisonLabel?: string;
  settlementStatus: SettlementSlice[];
  settlementLabel?: string;
  findings: Finding[];
  findingsLabel?: string;
  rtoDefinition?: string;
  costDefinition?: string;
}

export const sampleDashboardData: DashboardData = {
  source: 'sample',
  kpis,
  monthlyExpenses,
  monthlyExpensesLabel: 'Apr – Sep 2026 · PKR thousands',
  courierComparison,
  courierComparisonLabel: 'September 2026 cohort · RTO calculated on resolved parcels only',
  settlementStatus,
  settlementLabel: 'PKR 3,520,640 across 1,152 delivered orders',
  findings,
  findingsLabel: '47 orders · provisional until verified',
  rtoDefinition,
  costDefinition,
};