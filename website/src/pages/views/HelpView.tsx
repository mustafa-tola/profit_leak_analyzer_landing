import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Download, FileText, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

interface HelpViewProps {
  onViewChange: (id: string) => void;
  onExport: () => void;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string[];
  icon: ReactNode;
}

const articles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Marginovia',
    description: 'Learn how to upload COD files, run reconciliation, and review results.',
    icon: <Upload className="h-4 w-4" aria-hidden="true" />,
    content: [
      'Open Upload & Analyze and choose Orders, Shipments and Settlements CSVs. Allocations are optional and are used only when a batch remittance needs shipment-level attribution.',
      'Every row must carry a seller_id matching your verified organization claim. The engine normalizes and validates rows before reconciliation; rejected rows are reported and excluded from totals.',
      'Open the resulting run from Dashboard or Previous Runs. Financial totals come from matched evidence; exceptions are provisional findings that need review.',
      'Download summary, exception or settlement CSVs from the Reports screen or the Export button in the header.',
    ],
  },
  {
    id: 'exceptions',
    title: 'Understanding Exceptions',
    description: 'How to interpret and act on flagged discrepancies and mismatches.',
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
    content: [
      'Exceptions are rule-generated findings such as partial settlement, unallocated settlement, fee discrepancy or unknown due date. Each finding keeps its rule code, amount and evidence fields.',
      'A finding is not a confirmed loss. Verify it against courier statements and settlement records before taking action.',
      'An outstanding balance can simply mean a remittance is not yet due. Unknown due dates are never treated as overdue without evidenced terms.',
    ],
  },
  {
    id: 'formats',
    title: 'File Format Requirements',
    description: 'CSV column layouts for orders, shipments, and settlements exports.',
    icon: <FileText className="h-4 w-4" aria-hidden="true" />,
    content: [
      'Orders: seller_id, order_id, order_date, cod_amount_pkr and order_status are required; customer_ref and notes are optional.',
      'Shipments: seller_id, shipment_id, order_id, tracking_number, courier, booked_date and status are required. Dates, collected COD and contracted fees may be supplied when available.',
      'Settlements: seller_id, settlement_id, courier, settlement_date, entry_type, gross_cod_pkr, delivery_fees_pkr, rto_fees_pkr, other_deductions_pkr and net_paid_pkr are required.',
      'Allocations: seller_id, allocation_id, settlement_id, tracking_number and allocated_net_pkr are required. Common header aliases are accepted by the configured mapping.',
    ],
  },
  {
    id: 'isolation',
    title: 'Seller Isolation & Security',
    description: 'How your data is kept separate from other seller accounts.',
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
    content: [
      'The seller identity is taken from a verified Clerk session token, not from the upload form or client-supplied IDs.',
      'Every run, read and export is scoped to that identity in the API and database. A run belonging to another seller is not discoverable even when its ID is known.',
      'Raw source rows retained as audit evidence are never returned by the read API.',
    ],
  },
  {
    id: 'findings',
    title: 'Provisional vs Confirmed Findings',
    description: 'Why discrepancy amounts are estimates until verified against evidence.',
    icon: <FileText className="h-4 w-4" aria-hidden="true" />,
    content: [
      'The financial engine only uses exact references and explicit allocations. Unmatched or ambiguous items remain unresolved instead of being assigned heuristically.',
      'Overpayments are reported separately and cannot hide another shipment’s shortfall; signed adjustments are preserved as submitted.',
      'Confirmation requires sufficient evidence and human review. The export includes the run ID and output hash so results can be reproduced.',
    ],
  },
];

export function HelpView({ onViewChange, onExport }: HelpViewProps) {
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const openFormats = () => {
    setOpenArticle('formats');
    document.getElementById('help-formats')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:gap-6">
      <div className="space-y-5">
        <div className="rounded-lg border border-line bg-surface shadow-soft p-5 sm:p-6">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Help &amp; Support</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Find answers to common questions about Marginovia, COD reconciliation, and using the workspace effectively.
          </p>
        </div>

        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">Knowledge Base</h2>
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              open={openArticle === article.id}
              onToggle={() => setOpenArticle((current) => (current === article.id ? null : article.id))}
            />
          ))}
        </div>

        <Card>
          <CardBody className="pb-4">
            <h3 className="font-display text-base font-semibold text-ink sm:text-lg">Still need help?</h3>
            <p className="mt-1 text-sm text-muted">
              Review the prototype’s privacy and terms, or open the CSV format guide above. No live support channel is published for this academic prototype.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/privacy"
                className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                Privacy &amp; terms
              </Link>
              <Button variant="ghost" size="sm" onClick={openFormats}>
                File format guide
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
              <QuickAction label="Upload & Analyze" hint="Start a new reconciliation run" icon={<Upload className="h-4 w-4" aria-hidden="true" />} onClick={() => onViewChange('upload')} />
              <QuickAction label="View Run History" hint="Browse previous analyses" icon={<FileText className="h-4 w-4" aria-hidden="true" />} onClick={() => onViewChange('history')} />
              <QuickAction label="Export Report" hint="Download the selected run as CSV" icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={onExport} />
              <QuickAction label="Settings" hint="Review account and API configuration" icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} onClick={() => onViewChange('settings')} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Platform Status</h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0B1F44]" aria-hidden="true" />
              <span className="text-xs font-medium text-ink">Prototype workspace</span>
            </div>
            <p className="mt-2 text-xs text-muted">Live results are produced by the deterministic engine for each selected run. No scheduled analysis or alerting service is running.</p>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

function ArticleCard({
  article,
  open,
  onToggle,
}: {
  article: HelpArticle;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div id={`help-${article.id}`} className="rounded-lg border border-line bg-surface p-3 transition hover:bg-[#F1F5F9]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E2E8F0] text-[#0B1F44]">{article.icon}</div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-ink">{article.title}</h4>
          <p className="mt-0.5 text-sm text-muted">{article.description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1 text-[#B8CBD4] transition hover:text-[#0B1F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label={`${open ? 'Close' : 'Read'} ${article.title}`}
          aria-expanded={open}
          aria-controls={`help-content-${article.id}`}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
      </div>
      {open ? (
        <ul id={`help-content-${article.id}`} className="mt-3 list-disc space-y-2 border-t border-line pt-3 pl-8 text-sm leading-relaxed text-muted">
          {article.content.map((line) => <li key={line}>{line}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function QuickAction({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E2E8F0] text-[#0B1F44]">{icon}</div>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </button>
  );
}
