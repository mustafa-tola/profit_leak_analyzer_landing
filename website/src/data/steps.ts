export type StepIcon = 'upload' | 'analyze' | 'identify' | 'download';

export type Step = {icon: StepIcon;title: string;description: string;};

export const steps: Step[] = [
{
  icon: 'upload',
  title: 'Upload order and courier files',
  description:
  'Add your store’s order export and your courier’s CSV or XLSX report. Map columns once — the layout is remembered.'
},
{
  icon: 'analyze',
  title: 'Analyze transactions',
  description:
  'Orders are matched to shipments by tracking number and checked for duplicates, missing IDs and invalid amounts.'
},
{
  icon: 'identify',
  title: 'Identify potential discrepancies',
  description:
  'Rules compare expected and actual remittances, charges and settlement terms. Anything uncertain stays provisional.'
},
{
  icon: 'download',
  title: 'Download evidence-backed reports',
  description:
  'Export PDF or CSV reports with date ranges, assumptions and row citations you can share with your courier.'
}];