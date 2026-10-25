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
  'Every refused parcel costs forward freight, return freight and packaging — and earns nothing. Spread across couriers and cities, the real cost is hard to see.',
  sampleValue: '27.1%',
  sampleCaption: 'RTO rate · Leopards → Karachi',
  detection:
  'RTO rates by courier, city and product on closed cohorts, so parcels still in transit never distort the number.'
},
{
  icon: 'deductions',
  title: 'Unexpected courier deductions',
  problem:
  'Weight surcharges, zone adjustments and return fees on parcels that were actually delivered quietly reduce what reaches your account.',
  sampleValue: 'PKR 4,050',
  sampleCaption: 'Return fees billed on 9 delivered parcels',
  detection:
  'True cost per delivered parcel that includes every attributable charge, with unusual deductions flagged for review.'
},
{
  icon: 'settlement',
  title: 'Delayed COD settlements',
  problem:
  'Cash collected at the door can sit with couriers for weeks. Without tracking each order, late payouts blend into normal cash flow.',
  sampleValue: 'PKR 168,900',
  sampleCaption: 'COD past its 7-day settlement term',
  detection:
  'Each order is marked Settled, Not yet due, Overdue, Disputed or Unmatched — overdue only when a real settlement term exists.'
},
{
  icon: 'payout',
  title: 'Payment discrepancies',
  problem:
  'When a remittance is lower than expected, finding which orders caused the gap means hours of matching spreadsheets row by row.',
  sampleValue: 'PKR 12,460',
  sampleCaption: 'Payout variance across 14 orders',
  detection:
  'Expected net remittance compared with actual payout after documented deductions. Unknown fees keep the variance provisional.'
}];