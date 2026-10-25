import { Link } from 'react-router-dom';
import { ArrowLeftIcon, FileTextIcon } from 'lucide-react';
import type { LegalDocument } from '../data/legal';

type LegalPageProps = {
  document: LegalDocument;
  related: {label: string;to: string;};
};

export function LegalPage({ document, related }: LegalPageProps) {
  return (
    <main className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors duration-150 ease-out hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>

        <header className="mt-8 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{document.title}</h1>
          <p className="mt-3 text-sm text-muted">Last updated {document.lastUpdated}</p>
          <p className="mt-6 text-lg leading-relaxed text-muted">{document.intro}</p>
          <p className="mt-6 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
            Academic prototype notice. This document describes the current demo only and is not a commercial
            policy.
          </p>
        </header>

        <div className="mt-14 grid gap-12 border-t border-line pt-12 lg:grid-cols-[220px_1fr] lg:gap-16">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-sm font-semibold text-ink">On this page</p>
              <ul className="mt-4 space-y-2.5 border-l border-line">
                {document.sections.map((s) =>
                <li key={s.id}>
                    <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l border-transparent pl-4 text-sm text-muted transition-colors duration-150 ease-out hover:border-ink hover:text-ink">
                    
                      {s.heading}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </nav>

          <article className="max-w-3xl space-y-10">
            {document.sections.map((s) =>
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`}>
                <h2 id={`${s.id}-heading`} className="text-xl font-semibold tracking-tight text-ink">
                  {s.heading}
                </h2>
                {s.paragraphs.map((p) =>
              <p key={p} className="mt-3 leading-relaxed text-muted">
                    {p}
                  </p>
              )}
                {s.bullets &&
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-line">
                    {s.bullets.map((b) =>
                <li key={b}>{b}</li>
                )}
                  </ul>
              }
              </section>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4">
              <FileTextIcon className="h-5 w-5 shrink-0 text-accent-ink" aria-hidden="true" />
              <p className="text-sm text-muted">
                Also see our{' '}
                <Link to={related.to} className="font-medium text-accent-ink underline-offset-4 hover:underline">
                  {related.label}
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </div>
    </main>);

}