import { CalculatorIcon, Clock3Icon, FileSearchIcon, HourglassIcon, LockKeyholeIcon, PackageXIcon, ReceiptTextIcon, ScaleIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { leaks, LeakIcon } from "../data/leaks";
import { principles, PrincipleIcon } from "../data/principles";
const leakIcons: Record<LeakIcon, LucideIcon> = {
  rto: PackageXIcon,
  deductions: ReceiptTextIcon,
  settlement: Clock3Icon,
  payout: ScaleIcon
};
const principleIcons: Record<PrincipleIcon, LucideIcon> = {
  source: FileSearchIcon,
  provisional: HourglassIcon,
  precision: CalculatorIcon,
  privacy: LockKeyholeIcon
};
export function LeaksSection() {
  return <section id="features" aria-labelledby="features-heading" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <SectionHeader id="features-heading" title="Four places your margin quietly disappears" description="COD selling has costs that never appear together in a single report. Profit Leak Analyzer brings them into one view — and shows its working." />

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-soft md:grid-cols-2">
          {leaks.map((leak) => {
          const Icon = leakIcons[leak.icon];
          return <article key={leak.title} className="flex flex-col bg-surface p-7 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-semibold tracking-tight text-ink tabular-nums">{leak.sampleValue}</p>
                    <p className="text-[12px] text-muted">
                      {leak.sampleCaption} <span className="text-warn">· sample</span>
                    </p>
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-ink">{leak.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{leak.problem}</p>
                <div className="mt-auto pt-6">
                  <div className="rounded-xl bg-canvas px-4 py-3.5">
                    <p className="text-[13px] font-semibold text-accent-ink">How Profit Leak Analyzer catches it</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/80">{leak.detection}</p>
                  </div>
                </div>
              </article>;
        })}
        </div>

        <div className="mt-20 border-t border-line pt-12">
          <h3 className="text-lg font-semibold tracking-tight text-ink">Built to be trusted with financial data</h3>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => {
            const Icon = principleIcons[p.icon];
            return <li key={p.title}>
                  <Icon className="h-5 w-5 text-accent-ink" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-ink">{p.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.description}</p>
                </li>;
          })}
          </ul>
        </div>
      </div>
    </section>;
}