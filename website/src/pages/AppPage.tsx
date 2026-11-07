import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth, useOrganization, useUser } from '@clerk/clerk-react';
import { AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, FileUp, LoaderCircle, RefreshCw } from 'lucide-react';
import { DashboardPreview } from '../components/dashboard/DashboardPreview';
import { toDashboardData } from '../lib/analysis-adapter';
import {
  apiUrl,
  getAnalysis,
  listAnalyses,
  uploadAnalysis,
  type PublicAnalysisRun,
  type PublicAnalysisSummary,
} from '../lib/api';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppPage({ isDark }: { isDark: boolean }) {
  if (!clerkKey) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Live analysis</h1>
        <p className="mt-3 text-sm text-muted">
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> and <code>VITE_API_URL</code> in <code>website/.env</code>,
          then restart the Vite dev server. The backend must be running with Clerk authentication enabled.
        </p>
        <p className="mt-3 text-sm text-muted">
          API target: <code>{apiUrl()}</code>
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent-ink underline-offset-2 hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <SignedOut>
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-16 sm:px-6">
          <h1 className="text-2xl font-semibold text-ink">Sign in to analyze COD settlements</h1>
          <p className="mt-2 max-w-xl text-center text-sm text-muted">
            Use the Clerk organization that matches your CSV seller code (for example, org slug <code>seller-demo</code> for <code>SELLER-DEMO</code>).
          </p>
          <div className="mt-8">
            <SignIn
              routing="hash"
              signUpUrl="/app#/sign-up"
              forceRedirectUrl="/app"
              signUpForceRedirectUrl="/app"
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <LiveAnalysisApp isDark={isDark} />
      </SignedIn>
    </main>
  );
}

function LiveAnalysisApp({ isDark }: { isDark: boolean }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [runs, setRuns] = useState<PublicAnalysisSummary[]>([]);
  const [selected, setSelected] = useState<PublicAnalysisRun | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({
    orders_file: null,
    shipments_file: null,
    settlements_file: null,
    allocations_file: null,
  });
  const [asOfDate, setAsOfDate] = useState('');

  const token = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error('No Clerk session token is available. Sign in again.');
    return t;
  }, [getToken]);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await listAnalyses(await token());
      setRuns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analyses');
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openRun = useCallback(async (runId: string) => {
    setLoadingRun(true);
    setError(null);
    try {
      const data = await getAnalysis(await token(), runId);
      setSelected(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analysis');
    } finally {
      setLoadingRun(false);
    }
  }, [token]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!files.orders_file || !files.shipments_file || !files.settlements_file) {
      setError('Orders, shipments, and settlements CSV files are required.');
      return;
    }
    const form = new FormData();
    form.set('orders_file', files.orders_file);
    form.set('shipments_file', files.shipments_file);
    form.set('settlements_file', files.settlements_file);
    if (files.allocations_file) form.set('allocations_file', files.allocations_file);
    if (asOfDate) form.set('as_of_date', asOfDate);

    setUploading(true);
    try {
      const run = await uploadAnalysis(await token(), form);
      setSelected(run);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const dashboardData = useMemo(() => (selected ? toDashboardData(selected) : null), [selected]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Live COD analysis</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as <span className="font-medium text-ink">{user?.primaryEmailAddress?.emailAddress ?? user?.id}</span>
            {organization ? (
              <span> · Org <span className="font-medium text-ink">{organization.slug ?? organization.id}</span></span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300"> · No active organization selected</span>
            )}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            API: <code className="rounded bg-subtle px-1 py-0.5 text-xs text-ink sm:text-[13px]">{apiUrl()}</code> · Uploaded CSV{' '}
            <code className="rounded bg-subtle px-1 py-0.5 text-xs text-ink sm:text-[13px]">seller_id</code> must match your verified Clerk claim.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loadingList}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-subtle disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      ) : null}

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-6">
          <section className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <FileUp className="h-4 w-4 text-accent-ink" /> Upload CSVs
              </h2>
              <span className="text-xs text-muted">* required</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Select the exported order, shipment, and settlement files. Allocations are optional.
            </p>
            <form className="mt-4 space-y-3" onSubmit={onUpload}>
              <FileField label="Orders" required file={files.orders_file} onChange={(f) => setFiles((s) => ({ ...s, orders_file: f }))} />
              <FileField label="Shipments" required file={files.shipments_file} onChange={(f) => setFiles((s) => ({ ...s, shipments_file: f }))} />
              <FileField label="Settlements" required file={files.settlements_file} onChange={(f) => setFiles((s) => ({ ...s, settlements_file: f }))} />
              <FileField label="Allocations" file={files.allocations_file} onChange={(f) => setFiles((s) => ({ ...s, allocations_file: f }))} />
              <label className="block">
                <span className="text-sm font-medium text-muted">As-of date <span className="font-normal">(optional)</span></span>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </label>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {uploading ? 'Analyzing…' : 'Run analysis'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Previous runs</h2>
              {loadingList ? <LoaderCircle className="h-4 w-4 animate-spin text-muted" /> : null}
            </div>
            <ul className="mt-3 max-h-[min(50vh,420px)] space-y-2 overflow-auto pr-1">
              {runs.length === 0 && !loadingList ? (
                <li className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-muted">No runs yet. Upload CSVs to create your first analysis.</li>
              ) : null}
              {runs.map((run) => (
                <li key={run.run_id}>
                  <button
                    type="button"
                    onClick={() => void openRun(run.run_id)}
                    className={`group w-full rounded-lg border px-3 py-3 text-left transition ${
                      selected?.run_id === run.run_id
                        ? 'border-accent bg-accent/10 ring-1 ring-accent/20'
                        : 'border-line bg-canvas hover:border-accent/40 hover:bg-subtle'
                    }`}
                    aria-current={selected?.run_id === run.run_id ? 'true' : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <QualityPill quality={run.analysis_quality} />
                          <span className="text-xs text-muted">As of {run.as_of_date ?? '—'}</span>
                        </div>
                        <div className="mt-1.5 text-sm font-semibold tabular-nums text-ink [overflow-wrap:anywhere]" title={run.kpis_pkr.outstanding_receivable_pkr}>
                          <span className="font-medium text-muted">Outstanding: </span>
                          {run.kpis_pkr.outstanding_receivable_pkr ?? '—'}
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-muted">
                          {new Date(run.created_at).toLocaleString()} · <span className="font-mono">{run.run_id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 text-muted transition ${selected?.run_id === run.run_id ? 'text-accent' : 'group-hover:text-ink'}`} aria-hidden="true" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="min-w-0" aria-live="polite">
          {loadingRun ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-8 text-sm text-muted shadow-sm">
              <LoaderCircle className="h-5 w-5 animate-spin text-accent" /> Loading analysis details…
            </div>
          ) : dashboardData ? (
            <div className="min-w-0 space-y-4">
              <DashboardPreview isDark={isDark} data={dashboardData} embedded />
              <details className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
                <summary className="cursor-pointer list-none font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex flex-wrap items-center gap-2">Report details <span className="text-xs font-normal text-muted">(metadata only; no raw source rows)</span></span>
                </summary>
                <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-line">
                  {JSON.stringify({
                    run_id: selected?.run_id,
                    seller_id: selected?.seller_id,
                    analysis_quality: selected?.analysis_quality,
                    quality_message: selected?.quality_message,
                    counts: selected?.counts,
                    kpis_pkr: selected?.kpis_pkr,
                    verification: selected?.verification,
                    output_hash: selected?.output_hash,
                    source_files: selected?.source_files,
                  }, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center shadow-sm">
              <FileSpreadsheet className="h-10 w-10 text-muted/60" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-ink">No analysis selected</h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
                Upload the required CSV files or choose a previous run to view KPIs, settlement status, exceptions, and report metadata.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function QualityPill({ quality }: { quality: string }) {
  const cls =
    quality === 'CLEAN'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
      : quality === 'PARTIAL_DATA'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
        : quality === 'NO_VALID_SETTLEMENTS'
          ? 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300'
          : 'border-line bg-subtle text-muted';
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${cls}`}>
      {quality}
    </span>
  );
}

function FileField({
  label,
  required,
  file,
  onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const selected = Boolean(file);
  return (
    <div className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">
          {label}{' '}
          {required ? (
            <span className="text-red-600 dark:text-red-400" aria-label="required">*</span>
          ) : (
            <span className="font-normal">(optional)</span>
          )}
        </span>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Selected
          </span>
        ) : null}
      </div>
      <label
        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 transition ${
          selected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-line bg-canvas hover:border-accent/40 hover:bg-subtle/50'
        }`}
      >
        <FileSpreadsheet className={`h-4 w-4 shrink-0 ${selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`} />
        <span className="min-w-0 flex-1 truncate text-sm text-ink" title={file?.name}>
          {file?.name ?? 'Choose .csv file…'}
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          required={required}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>
    </div>
  );
}
