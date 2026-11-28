export type StepIcon = 'upload' | 'analyze' | 'identify' | 'download';

export type Step = {
  icon: StepIcon;
  title: string;
  description: string;
};

export const steps: Step[] = [
  {
    icon: 'upload',
    title: 'Upload your exports',
    description:
      'Add Orders, Shipments, and Settlements CSV files for the same seller. Allocations are optional.',
  },
  {
    icon: 'analyze',
    title: 'Validate and reconcile',
    description:
      'Marginovia checks required fields, matches records, and computes expected vs verified payment outcomes.',
  },
  {
    icon: 'identify',
    title: 'Review exceptions',
    description:
      'See outstanding receivables and evidence-backed exceptions flagged for investigation, with clear quality labels.',
  },
  {
    icon: 'download',
    title: 'Track run history',
    description:
      'Open previous runs in your seller-scoped workspace to compare results and follow up on findings.',
  },
];
