export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: 'Which couriers are supported?',
    answer:
      'Codvera is designed to work with COD settlement exports from major Pakistani couriers such as TCS, Leopards, PostEx, Trax, M&P, and Call Courier. If your export format differs, we can help map the required fields so your data reconciles correctly.',
  },
  {
    question: 'What files do I need to upload?',
    answer:
      'Upload your Orders, Shipments, and Settlements CSV files for the same seller. An Allocations file is optional if you have it. The system validates required fields and uses seller-scoped matching to produce a reconciliation run.',
  },
  {
    question: 'How is my business data handled?',
    answer:
      'Access to the workspace is authenticated and seller-scoped. Uploaded data is processed to generate reconciliation results and audit-friendly run history. You should review your deployment’s data retention and access policies before using production data.',
  },
  {
    question: 'What counts as a settlement discrepancy?',
    answer:
      'A discrepancy is flagged when expected receivables and verified settlement payments do not align based on available evidence. These findings are shown as provisional indicators to investigate — not as confirmed financial losses — until reviewed against courier statements and records.',
  },
  {
    question: 'How accurate are the reports?',
    answer:
      'Codvera uses deterministic reconciliation logic, preserves amounts precisely, and labels run quality (such as clean or partial data) when inputs are incomplete or invalid. Each run surfaces evidence-backed exceptions so you can trace and verify outcomes.',
  },
  {
    question: 'Do I need to share courier logins or passwords?',
    answer:
      'No. Codvera works from the CSV exports you upload. You do not need to share courier portal passwords or provide direct courier account access.',
  },
];
