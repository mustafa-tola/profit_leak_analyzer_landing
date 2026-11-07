import { lazy, Suspense, useState } from 'react';
import { Hero } from '../components/Hero';
import { LeaksSection } from '../components/LeaksSection';
import { HowItWorks } from '../components/HowItWorks';
import { Pricing } from '../components/Pricing';
import { FaqSection } from '../components/FaqSection';
import { LeadForm } from '../components/LeadForm';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { PlanId } from '../data/pricing';

const DashboardPreview = lazy(() =>
  import('../components/dashboard/DashboardPreview').then((module) => ({
    default: module.DashboardPreview,
  }))
);

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
      <Suspense fallback={<DashboardPreviewFallback />}>
        <DashboardPreview isDark={isDark} />
      </Suspense>
      <Pricing onSelectPlan={setSelectedPlan} />
      <FaqSection />
      <LeadForm plan={selectedPlan} onPlanChange={setSelectedPlan} />
    </main>);

}

function DashboardPreviewFallback() {
  return (
    <section
      id="demo"
      aria-busy="true"
      aria-label="Loading dashboard preview"
      className="bg-navy py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="h-8 w-2/3 max-w-lg animate-pulse rounded-md bg-white/10" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-white/10" />
        <div className="mt-12 min-h-[560px] animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10" />
      </div>
    </section>);
}