export type LegalSection = {id: string;heading: string;paragraphs: string[];bullets?: string[];};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: 'October 25, 2026',
  intro:
  'This policy describes how this academic prototype of Profit Leak Analyzer handles information. The current build is a static demonstration website: it does not offer accounts, file uploads, live analysis, payments or data storage. This policy must be replaced before any production service is launched.',
  sections: [
  {
    id: 'scope',
    heading: 'Scope of this prototype',
    paragraphs: [
    'Profit Leak Analyzer is an academic demonstration of a proposed financial analytics product for cash-on-delivery sellers in Pakistan. This site and its dashboard preview are for presentation and evaluation only. None of the production features described elsewhere on the site are active.']

  },
  {
    id: 'information-we-collect',
    heading: 'Information we collect',
    paragraphs: [
    'This prototype does not create accounts and does not collect, transmit or store order, courier, settlement or customer data.'],
    bullets: [
    'Demo form — the email address, order volume and plan you enter are held only in your browser’s memory to demonstrate validation. They are not sent to a server, saved to storage or shared.',
    'Theme preference — the light/dark toggle applies to the current page only and resets on reload.',
    'No analytics or advertising — the site does not use analytics, tracking pixels, advertising cookies or similar technologies.']

  },
  {
    id: 'third-party',
    heading: 'Third-party request',
    paragraphs: [
    'The site loads the Inter typeface from Google Fonts. That request may share standard technical information, such as your IP address and browser type, with Google. No other third-party service is used to process demo form entries.']

  },
  {
    id: 'how-we-use',
    heading: 'How information is used',
    paragraphs: [
    'Information entered into the demo form is used only in the browser to show required-field and email-format validation. It is not used to contact you, create a request, produce an analysis or train any model.']

  },
  {
    id: 'sample-data',
    heading: 'Sample data',
    paragraphs: [
    'All dashboard figures, findings and reports shown on this site are fictional sample data. They do not describe any real merchant, order, parcel, payout or customer.']

  },
  {
    id: 'retention',
    heading: 'Retention and deletion',
    paragraphs: [
    'Because this prototype does not transmit or store demo form entries, there is no server-side record to retain or delete. Entries remain visible only in the current browser tab and are cleared when you reload or leave the page.']

  },
  {
    id: 'security',
    heading: 'Security',
    paragraphs: [
    'This is a static demonstration site and no production security programme is claimed. Do not enter real business, customer, payment or other confidential information into the demo form or any other part of the prototype.']

  },
  {
    id: 'sharing',
    heading: 'Sharing',
    paragraphs: [
    'We do not sell, rent or share demo form entries because they are never transmitted to us. The only external request described above is the Google Fonts font download.']

  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    paragraphs: [
    'This policy will be updated if the prototype changes or before any production service begins. The date at the top of the page shows the latest revision.']

  },
  {
    id: 'contact',
    heading: 'Questions',
    paragraphs: [
    'This academic prototype does not publish a live support email, phone number or business address. Any questions should be directed to the project owner or institution through the channel provided for the demonstration.']
  }]

};

export const termsOfService: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: 'October 25, 2026',
  intro:
  'These terms govern use of the Profit Leak Analyzer demonstration website. It is an academic prototype, not a commercial service, and no production functionality is offered.',
  sections: [
  {
    id: 'the-prototype',
    heading: 'The prototype',
    paragraphs: [
    'This site is a static demonstration of a proposed analytics product for cash-on-delivery sellers. It presents marketing content and a sample dashboard only. It does not provide accounts, file uploads, live analysis, report generation, payments, courier claims or money transfers.']

  },
  {
    id: 'demo-form',
    heading: 'Demo request form',
    paragraphs: [
    'The request form validates the email address and order volume in your browser and then displays a demo result. It does not create, send or store a request, and no analysis or response will follow. Do not enter confidential or third-party personal data.']

  },
  {
    id: 'findings',
    heading: 'Sample findings are illustrative',
    paragraphs: [
    'Every metric, finding, chart and table shown on the site is fictional sample data. A sample “discrepancy” is not evidence of a real loss and must not be relied on for any business, accounting, tax or legal decision.']

  },
  {
    id: 'not-advice',
    heading: 'No financial or legal advice',
    paragraphs: [
    'The content is informational and demonstrative only. It is not accounting, tax, legal or financial advice.']

  },
  {
    id: 'pricing',
    heading: 'Pricing',
    paragraphs: [
    'Prices and plan features shown are proposed and illustrative. No checkout, subscription or charge is available through this prototype.']

  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    paragraphs: ['You agree not to:'],
    bullets: [
    'Enter real customer, payment or confidential business data into the demo form.',
    'Misrepresent the sample dashboard as a real analysis of any merchant.',
    'Attempt to disrupt, overload or gain unauthorised access to the site or its hosting.',
    'Use the site for any unlawful purpose.']

  },
  {
    id: 'intellectual-property',
    heading: 'Content and intellectual property',
    paragraphs: [
    'The Profit Leak Analyzer name, written content, visual design and sample dashboard are presented for this academic demonstration. You may view and share the site for evaluation purposes, but you may not present it as a live commercial service.']

  },
  {
    id: 'availability',
    heading: 'Availability and changes',
    paragraphs: [
    'The prototype is provided “as is” for demonstration and evaluation. It may change, break or be taken offline without notice, and no availability or accuracy guarantee is given.']

  },
  {
    id: 'liability',
    heading: 'Limitation of liability',
    paragraphs: [
    'To the extent permitted by law, the project owner is not liable for any loss arising from use of, or reliance on, this prototype or its sample data. No fees are charged for the prototype.']

  },
  {
    id: 'governing-law',
    heading: 'Governing law',
    paragraphs: ['These terms are governed by the laws of Pakistan.']
  },
  {
    id: 'contact',
    heading: 'Questions',
    paragraphs: [
    'This academic prototype does not publish a live support email, phone number or business address. Any questions should be directed to the project owner or institution through the channel provided for the demonstration.']
  }]

};
