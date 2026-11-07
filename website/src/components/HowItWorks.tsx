import { FileDownIcon, FileSpreadsheetIcon, GitMergeIcon, SearchCheckIcon, UploadIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { steps, StepIcon } from "../data/steps";
const stepIcons: Record<StepIcon, LucideIcon> = {
  upload: UploadIcon,
  analyze: GitMergeIcon,
  identify: SearchCheckIcon,
  download: FileDownIcon
};
export function HowItWorks() {
  return <section id="how-it-works" aria-labelledby="how-heading" className="border-y border-line bg-surface py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <SectionHeader id="how-heading" title="From raw exports to a report you can act on" description="No integrations to set up. Bring the files you already download every week." />

        <div className="relative mt-16">
        <div className="absolute left-5 right-5 top-5 hidden h-px bg-line lg:block" aria-hidden="true" />
        <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, i) => {
            const Icon = stepIcons[step.icon];
            return <li key={step.title} className="relative flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-ink shadow-soft">
                    {i + 1}
                  </span>
                  <span className="relative z-10 bg-surface pr-2">
                    <Icon className="h-4 w-4 text-accent-ink" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                <div className="mt-auto pt-6">
                  <StepArtifact index={i} />
                </div>
              </li>;
          })}
        </ol>
        </div>
      </div>
    </section>;
}
function StepArtifact({
  index


}: {index: number;}) {
  const shell = 'rounded-xl border border-line bg-canvas p-3.5 text-[12px]';
  if (index === 0) {
    return <div className={`${shell} space-y-2`}>
        {[{
        name: 'orders_sep_2026.csv',
        rows: '1,502 rows'
      }, {
        name: 'courier_sep_2026.xlsx',
        rows: '1,486 rows'
      }].map((f) => <div key={f.name} className="flex items-center gap-2">
            <FileSpreadsheetIcon className="h-3.5 w-3.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <span className="truncate font-medium text-ink">{f.name}</span>
            <span className="ml-auto shrink-0 text-muted">{f.rows}</span>
          </div>)}
      </div>;
  }
  if (index === 1) {
    return <div className={shell}>
        <div className="flex justify-between">
          <span className="font-medium text-ink">Matched 1,486 of 1,502</span>
          <span className="text-muted tabular-nums">98.9%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full w-[98.9%] rounded-full bg-accent" />
        </div>
        <p className="mt-2 text-muted">16 ambiguous rows sent to review</p>
      </div>;
  }
  if (index === 2) {
    return <div className={shell}>
        <p className="font-medium text-ink">47 potential discrepancies</p>
        <p className="mt-1 text-muted">
          PKR 38,240 · <span className="text-warn">provisional</span>
        </p>
      </div>;
  }
  return <div className={`${shell} flex items-center gap-2`}>
      {['PDF', 'CSV'].map((t) => <span key={t} className="rounded-md border border-line bg-surface px-2 py-0.5 font-semibold text-ink">
          {t}
        </span>)}
      <span className="ml-1 text-muted">Row citations included</span>
    </div>;
}