import { useState } from 'react';
import { Hero } from '../components/Hero';
import { LeaksSection } from '../components/LeaksSection';
import { HowItWorks } from '../components/HowItWorks';
import { DashboardPreview } from '../components/dashboard/DashboardPreview';
import { Pricing } from '../components/Pricing';
import { FaqSection } from '../components/FaqSection';
import { LeadForm } from '../components/LeadForm';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { PlanId } from '../data/pricing';

type HomeProps = {isDark: boolean;};

export function Home({ isDark }: HomeProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free');

  useDocumentMeta(
    'Profit Leak Analyzer — Find hidden courier costs and COD settlement gaps',
    'An academic prototype of Profit Leak Analyzer, showing how Pakistani COD sellers could uncover hidden courier charges, RTO costs, delayed settlements and potential payment discrepancies.'
  );

  return (
    <main>
      <Hero />
      <LeaksSection />
      <HowItWorks />
      <DashboardPreview isDark={isDark} />
      <Pricing onSelectPlan={setSelectedPlan} />
      <FaqSection />
      <LeadForm plan={selectedPlan} onPlanChange={setSelectedPlan} />
    </main>);

}