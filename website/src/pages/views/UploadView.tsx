import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Play, RefreshCw, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

interface UploadViewProps {
  onAnalyze: (form: FormData) => Promise<void>;
  uploading?: boolean;
}

type SlotKey = 'orders_file' | 'shipments_file' | 'settlements_file' | 'allocations_file';

const SLOTS: Array<{ key: SlotKey; label: string; required: boolean; hint: string }> = [
  { key: 'orders_file', label: 'Orders CSV', required: true, hint: 'Order-level records (seller_id must match your account).' },
  { key: 'shipments_file', label: 'Shipments CSV', required: true, hint: 'Courier/shipment records for the same seller.' },
  { key: 'settlements_file', label: 'Settlements CSV', required: true, hint: 'Courier settlement/payment records.' },
  { key: 'allocations_file', label: 'Allocations CSV (optional)', required: false, hint: 'Optional allocation evidence, if available.' },
];

export function UploadView({ onAnalyze, uploading = false }: UploadViewProps) {
  const [files, setFiles] = useState<Partial<Record<SlotKey, File>>>({});
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const inputs = {
    orders_file: useRef<HTMLInputElement>(null),
    shipments_file: useRef<HTMLInputElement>(null),
    settlements_file: useRef<HTMLInputElement>(null),
    allocations_file: useRef<HTMLInputElement>(null),
  } as const;

  const setFile = (key: SlotKey, file: File | undefined) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
    setError(null);
  };

  const reset = () => {
    setFiles({});
    setError(null);
    (Object.keys(inputs) as SlotKey[]).forEach((k) => {
      const el = inputs[k].current;
      if (el) el.value = '';
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || submitting.current) return;
    const missing = SLOTS.filter((s) => s.required && !files[s.key]).map((s) => s.label);
    if (missing.length) {
      setError(`Please select required file(s): ${missing.join(', ')}.`);
      return;
    }
    const form = new FormData();
    (Object.keys(files) as SlotKey[]).forEach((k) => {
      const f = files[k];
      if (f) form.set(k, f);
    });
    submitting.current = true;
    try {
      await onAnalyze(form);
      setFiles({});
      setError(null);
      (Object.keys(inputs) as SlotKey[]).forEach((k) => {
        const el = inputs[k].current;
        if (el) el.value = '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please check your files and try again.');
    } finally {
      submitting.current = false;
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-1 border-b border-line pb-4">
          <ol className="flex items-center gap-4 text-xs font-medium text-muted sm:gap-8">
            <li className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">1</span><span className="font-bold text-accent-ink">Upload</span></li>
            <span className="h-px w-8 bg-line" aria-hidden="true" />
            <li className="flex items-center gap-2 opacity-60"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line">2</span><span>Validate</span></li>
            <span className="h-px w-8 bg-line" aria-hidden="true" />
            <li className="flex items-center gap-2 opacity-60"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line">3</span><span>Analyze</span></li>
          </ol>
          <p className="mt-2 text-sm font-medium text-ink">Add required CSV files for reconciliation</p>
        </div>

        <Alert variant="warn" title="File requirements">
          Uploaded files must contain a <code className="font-mono">seller_id</code> that matches your verified account (case-insensitive). Required: Orders, Shipments, Settlements. Optional: Allocations.
        </Alert>

        {error && (
          <Alert variant="error" title="Upload error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {SLOTS.map((slot) => {
              const file = files[slot.key];
              return (
                <div key={slot.key} className="card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {slot.label}{' '}
                        {slot.required ? <span className="text-danger">*</span> : <span className="text-xs font-normal text-muted">(optional)</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{slot.hint}</p>
                      {file && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-ink">
                          <FileSpreadsheet className="h-4 w-4 text-accent-ink" aria-hidden="true" />
                          <span className="truncate font-medium">{file.name}</span>
                          <span className="shrink-0 text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <input
                        ref={inputs[slot.key]}
                        type="file"
                        accept=".csv,text/csv"
                        className="sr-only"
                        aria-label={slot.label}
                        onChange={(e) => setFile(slot.key, e.target.files?.[0])}
                      />
                      <Button type="button" variant="ghost" size="sm" leftIcon={<Upload className="h-4 w-4" aria-hidden="true" />} onClick={() => inputs[slot.key].current?.click()}>
                        {file ? 'Change file' : 'Choose file'}
                      </Button>
                      {file && (
                        <button type="button" className="text-sm font-medium text-muted hover:text-danger" onClick={() => setFile(slot.key, undefined)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" variant="primary" size="lg" isLoading={uploading} disabled={uploading} leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}>
              {uploading ? 'Analyzing…' : 'Validate & Analyze'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={reset} disabled={uploading} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      <aside className="space-y-5">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">How it works</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div><p className="font-medium text-ink">1. Upload</p><p className="text-muted">Provide orders, shipments, and settlements CSV files for the same seller.</p></div>
            <div><p className="font-medium text-ink">2. Validate</p><p className="text-muted">The engine checks required fields, formats, and data quality.</p></div>
            <div><p className="font-medium text-ink">3. Analyze</p><p className="text-muted">Reconciliation computes expected vs verified amounts, outstanding balances, and provisional exceptions.</p></div>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold text-ink">Need sample data?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Use the CSVs in <code className="rounded bg-subtle px-1 py-0.5 text-ink">n8n/sample-data/PLA_Realistic_Mixed_Stress/</code> for a realistic test run (upload orders, shipments, settlements, and allocations files).
          </p>
        </div>
      </aside>
    </div>
  );
}
