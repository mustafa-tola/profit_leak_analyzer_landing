export type Faq = {question: string;answer: string;};

export const faqs: Faq[] = [
{
  question: 'Which couriers are supported?',
  answer:
  'At launch, Profit Leak Analyzer reads report layouts from at least two major Pakistani couriers, with TCS, Leopards, PostEx, Trax, M&P and Call Courier on the support roadmap. If your courier’s export isn’t recognised, you can map its columns manually once and the layout is saved for next time.'
},
{
  question: 'What files do I need to upload?',
  answer:
  'The demo does not accept uploads. The planned product would take your store’s order export (Shopify, WooCommerce or a spreadsheet) and your courier’s shipment or payment report, in CSV or XLSX. The minimum fields would be order ID, order date, order value and tracking number. A separate settlement file would be optional but would improve payout matching.'
},
{
  question: 'How is my business data protected?',
  answer:
  'This academic prototype does not accept or store uploads. In the planned product, files would be transferred over encrypted connections and scoped to a merchant workspace. The current demo only displays illustrative sample data, so do not enter real business or customer information into it.'
},
{
  question: 'What counts as a settlement discrepancy?',
  answer:
  'A potential discrepancy is flagged when the payout you received differs from the expected net remittance after documented courier deductions. If a fee or settlement term is unknown, the finding is marked provisional. A discrepancy is a signal to investigate — not a confirmed loss.'
},
{
  question: 'How accurate are the reports?',
  answer:
  'The dashboard on this page uses fixed sample figures for illustration. The planned product is designed to use decimal PKR arithmetic, cite the rule and source rows behind each finding, and label incomplete data rather than silently estimating it.'
},
{
  question: 'Do I need to share my courier login?',
  answer:
  'No. The planned product would work entirely from the exports you upload, so there would be no passwords or API keys to share. This prototype does not request or accept any courier credentials.'
}];