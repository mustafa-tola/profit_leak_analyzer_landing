import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

interface HelpArticle {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const articles: HelpArticle[] = [
  {
    title: 'Getting Started with Codvera',
    description: 'Learn how to upload COD files, run reconciliation, and review results.',
    icon: <LayoutIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: 'Understanding Exceptions',
    description: 'How to interpret and act on flagged discrepancies and mismatches.',
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: 'File Format Requirements',
    description: 'CSV column layouts for orders, shipments, and settlements exports.',
    icon: <FileText className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: 'Seller Isolation & Security',
    description: 'How your data is kept separate from other seller accounts.',
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: 'Provisional vs Confirmed Findings',
    description: 'Why discrepancy amounts are estimates until verified against evidence.',
    icon: <AlertIcon className="h-4 w-4" aria-hidden="true" />,
  },
];

export function HelpView() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:gap-6">
      <div className="space-y-5">
        <div className="rounded-lg border border-line bg-surface shadow-soft p-5 sm:p-6">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Help & Support</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Find answers to common questions about Codvera, COD reconciliation, and using the workspace effectively.
          </p>
        </div>

        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Knowledge Base</h2>
        <div className="space-y-3">
          {articles.map((article, i) => (
            <ArticleCard key={i} {...article} />
          ))}
        </div>

        <Card>
          <CardBody className="pb-4">
            <h3 className="font-display text-base font-semibold text-ink sm:text-lg">Still need help?</h3>
            <p className="mt-1 text-sm text-muted">Contact our support team for assistance with your workspace.</p>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="primary" size="sm" leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}>
                Contact Support
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<FileText className="h-4 w-4" aria-hidden="true" />}>
                Documentation
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <aside className="space-y-5">
        <Card>
          <CardBody>
            <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <QuickAction label="Upload & Analyze" hint="Start a new reconciliation run" icon={<LayoutIcon className="h-4 w-4" aria-hidden="true" />} />
              <QuickAction label="View Run History" hint="Browse previous analyses" icon={<HistoryIcon className="h-4 w-4" aria-hidden="true" />} />
              <QuickAction label="Export Report" hint="Download financial reports" icon={<DownloadIcon className="h-4 w-4" aria-hidden="true" />} />
              <QuickAction label="Settings" hint="Configure workspace preferences" icon={<SettingsIcon className="h-4 w-4" aria-hidden="true" />} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Platform Status</h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0A4236]" aria-hidden="true" />
              <span className="text-xs font-medium text-ink">All systems operational</span>
            </div>
            <p className="mt-2 text-xs text-muted">Last checked: 07 Nov 2026, 02:14 PM</p>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

function ArticleCard({ title, description, icon }: HelpArticle) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 hover:bg-[#F5F8F7] transition">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FBF7] text-[#0A4236]">{icon}</div>
      <div>
        <h4 className="font-semibold text-ink">{title}</h4>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      <button type="button" className="text-[#B8CBD4] hover:text-[#0A4236] transition" aria-label={`Read ${title}`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

function QuickAction({ label, hint, icon }: { label: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 hover:bg-[#F5F8F7] transition cursor-pointer">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FBF7] text-[#0A4236]">{icon}</div>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </div>
  );
}

function LayoutIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="3" /></svg>;
}

function HistoryIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function DownloadIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /></svg>;
}

function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-.33l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-1-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1 1.51z" /></svg>;
}

function MessageCircle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.5 8.5 0 0 1-8.5-8.5 8.38 8.38 0 0 1 4-7.3" /></svg>;
}

function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 29.6H7.2c-2.6 0-3.9-2-3.9-4.8V9.6c0-2.8 1.3-4.8 3.9-4.8h2.8c2.6 0 3.9 2 3.9 4.8v15.2c0 2.8-1.3 4.8-3.9 4.8z" /><path d="M12 13v6" /><path d="M12 17v.01" /></svg>;
}
