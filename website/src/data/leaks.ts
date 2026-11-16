export type LeakIcon = 'rto' | 'deductions' | 'settlement' | 'payout';

export type Leak = {
  icon: LeakIcon;
  title: string;
  problem: string;
  sampleValue: string;
  sampleCaption: string;
  detection: string;
};

export const leaks: Leak[] = [
  {
    icon: 'rto',
    title: 'Return-to-origin losses',
    problem:
      'Refused and returned parcels add forward, return, and handling costs without revenue. Without reconciliation, the true impact stays hidden across couriers and cities.',
    sampleValue: '27.1%',
    sampleCaption: 'RTO rate · sample cohort',
    detection:
      'Track RTO and outcome patterns from shipment data so returns and unresolved parcels are visible with context.',
  },
  {
    icon: 'deductions',
    title: 'Unexpected courier deductions',
    problem:
      'Weight adjustments, fees, and other deductions can reduce net payouts in ways that are hard to spot in raw exports.',
    sampleValue: 'PKR 4,050',
    sampleCaption: 'Fee variance · sample',
    detection:
      'Compare expected amounts and settlement evidence to surface deduction-related differences for review.',
  },
  {
    icon: 'settlement',
    title: 'Delayed COD settlements',
    problem:
      'COD collected by couriers may be paid late or partially, making cash flow and outstanding balances difficult to track manually.',
    sampleValue: 'PKR 168,900',
    sampleCaption: 'Outstanding receivable · sample',
    detection:
      'Measure expected vs verified payments and outstanding receivables per run, with clear coverage and quality signals.',
  },
  {
    icon: 'payout',
    title: 'Payment discrepancies',
    problem:
      'When payouts don’t match expectations, finding the cause across orders and settlements can take hours of spreadsheet work.',
    sampleValue: 'PKR 12,460',
    sampleCaption: 'Flagged variance · sample',
    detection:
      'Flag provisional, evidence-backed exceptions tied to analyzed records so your team can investigate efficiently.',
  },
];
