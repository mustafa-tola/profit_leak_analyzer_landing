import { LegalPage } from '../components/LegalPage';
import { termsOfService } from '../data/legal';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function TermsOfService() {
  useDocumentMeta(
    'Terms of Service · Profit Leak Analyzer',
    'Terms for the Profit Leak Analyzer academic prototype, covering the demo form, sample data and limitations.'
  );
  return <LegalPage document={termsOfService} related={{ label: 'Privacy Policy', to: '/privacy' }} />;
}