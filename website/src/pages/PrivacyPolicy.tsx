import { LegalPage } from '../components/LegalPage';
import { privacyPolicy } from '../data/legal';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function PrivacyPolicy() {
  useDocumentMeta(
    'Privacy Policy · Marginovia',
    'How the Marginovia academic prototype handles information: a static demo with no accounts, uploads or stored requests.'
  );
  return <LegalPage document={privacyPolicy} related={{ label: 'Terms of Service', to: '/terms' }} />;
}