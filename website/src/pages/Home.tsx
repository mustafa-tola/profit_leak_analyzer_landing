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

type HomeProps = { isDark: boolean };

export function Home({ isDark }: HomeProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free');

  useDocumentMeta(
    'Marginovia — COD Reconciliation & Settlement Intelligence',
    'Discover leaks. Recover revenue. Protect profits. Reconcile courier settlements, track verified payments and outstanding receivables, and review evidence-backed exceptions in one workspace.'
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
    </main>
  );
}

function DashboardPreviewFallback() {
  return (
    <section
      id="demo"
      aria-busy="true"
      aria-label="Loading dashboard preview"
      className="bg-[#F1F5F9] py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="h-8 w-2/3 max-w-lg animate-pulse rounded-md bg-surface" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-subtle" />
        <div className="mt-12 min-h-[560px] animate-pulse rounded-[14px] border border-line bg-surface" />
      </div>
    </section>
  );
}
