import React, { useState } from 'react';
import { FileSpreadsheet, Play, RefreshCw, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CardBody } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';

interface UploadViewProps {
  onUpload?: (files: FileList) => void;
}

interface FileItem {
  name: string;
  size: string;
  records: string;
  status: 'ready' | 'error';
  error?: string;
}

const FILE_ITEMS: FileItem[] = [
  { name: 'orders.csv', size: '1.2 MB', records: '25,430 records', status: 'ready' },
  { name: 'shipments.csv', size: '3.8 MB', records: '25,410 records', status: 'ready' },
  { name: 'settlements.csv', size: '1.1 MB', records: '25,398 records', status: 'ready' },
];

const RECENT_UPLOADS = [
  { name: 'COD_Files_07Nov.csv', date: '07 Nov 2026, 02:14 PM', status: 'Completed', badgeColor: 'bg-[#DDF5EA]', textColor: 'text-[#0A4236]' },
  { name: 'COD_Files_06Nov.csv', date: '06 Nov 2026, 11:32 AM', status: 'Completed', badgeColor: 'bg-[#DDF5EA]', textColor: 'text-[#0A4236]' },
  { name: 'COD_Files_05Nov.csv', date: '05 Nov 2026, 04:20 PM', status: 'Partial Data', badgeColor: 'bg-[#FDF2E3]', textColor: 'text-[#92400E]' },
];

export function UploadView({ onUpload }: UploadViewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setSelectedFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles) return;
    setIsUploading(true);
    onUpload?.(selectedFiles);
    setTimeout(() => setIsUploading(false), 2000);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:gap-6">
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex flex-col gap-1 border-b border-line pb-4">
          <ol className="flex items-center gap-8 text-xs font-medium text-muted">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A4236] text-white">1</span>
              <span className="text-[#0A4236] font-bold">Upload</span>
            </li>
            <span className="h-[1px] w-8 bg-[#DCE7E3]" aria-hidden="true" />
            <li className="flex items-center gap-2 opacity-50">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#DCE7E3] text-muted">2</span>
              <span>Validate</span>
            </li>
            <span className="h-[1px] w-8 bg-[#DCE7E3]" aria-hidden="true" />
            <li className="flex items-center gap-2 opacity-50">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#DCE7E3] text-muted">3</span>
              <span>Analyze</span>
            </li>
          </ol>
          <p className="mt-2 text-sm font-medium text-ink">Add required CSV files</p>
        </div>

        {/* File requirements banner */}
        <Alert variant="warn" title="File requirements">
          Uploaded files must contain a seller_id that matches your verified account.
        </Alert>

        {/* Upload zone */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <section
            className={`rounded-lg border-2 border-dashed ${dragOver ? 'border-[#0A4236]/50 bg-[#F0FBF7]' : 'border-[#0A4236]/30 bg-[#F0FBF7]'} p-6 sm:p-8 text-center`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>); }}
            aria-label="Drop files here or click to browse"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DDF5EA] mx-auto mb-3">
              <Upload className="h-6 w-6 text-[#0A4236]" aria-hidden="true" />
            </div>
            <p className="font-semibold text-ink">Drag & drop files here</p>
            <p className="mt-1 text-sm text-muted">or click to browse from your device</p>
            <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0A4236] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0B4A3D] transition">
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Choose Files
            </button>
            <input type="file" multiple accept=".csv,text/csv" onChange={handleFileSelect} className="sr-only" aria-label="CSV files" />
          </section>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">📄 Supported formats: CSV (.csv)</span>
            <span className="flex items-center gap-1">✓ Required: Orders, Shipments, Settlements</span>
            <span className="flex items-center gap-1 text-[#B8CBD4]">· Optional: Allocations</span>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Selected Files ({selectedFiles?.length ?? 0})</h3>
              <button type="button" className="text-xs font-medium text-[#B8CBD4] hover:text-ink underline">Clear All</button>
            </div>
            <div className="space-y-2">
              {selectedFiles ? Array.from(selectedFiles).map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-[#F7F9F8] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DDF5EA]">
                    <FileSpreadsheet className="h-4 w-4 text-[#0A4236]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{f.name}</p>
                    <p className="text-xs text-muted">{f.size} · {FILE_ITEMS[i]?.records ?? '—'}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#E7A65B] bg-[#FFF4E5] px-2 py-0.5 text-[11px] font-semibold text-[#92400E]">Ready</span>
                  <button type="button" className="text-[#B8CBD4] hover:text-[#B42318] transition" aria-label={`Remove ${f.name}`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )) : (
                <div className="flex items-center justify-center py-4 text-sm text-muted">No files selected</div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button variant="primary" size="lg" isLoading={isUploading} disabled={!selectedFiles || selectedFiles.length === 0} leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}>
              {isUploading ? 'Analyzing…' : 'Validate & Analyze'}
            </Button>
            <Button variant="ghost" size="lg" leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      <aside className="space-y-5">
        <Card>
          <CardBody>
            <h2 className="font-display text-base font-semibold text-ink sm:text-lg">How it works</h2>
            <div className="mt-4 space-y-4">
              <StepItem number={1} title="Upload" description="Add orders, shipments, and settlements CSV files." />
              <StepItem number={2} title="Validate" description="We check file format, required fields, and data quality." />
              <StepItem number={3} title="Analyze" description="Run reconciliation to find outstanding amounts and exceptions." />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Recent Uploads</h2>
              <a href="#" className="text-xs font-semibold text-[#0A4236] hover:underline">View All →</a>
            </div>
            <div className="space-y-3">
              {RECENT_UPLOADS.map((item) => (
                <UploadHistoryRow key={item.name} {...item} />
              ))}
            </div>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

function StepItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-xs font-bold text-muted ${number === 1 ? 'border-[#0A4236] bg-[#DDF5EA] text-[#0A4236]' : ''}`}>{number}</div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

function UploadHistoryRow({ name, date, status, badgeColor, textColor }: { name: string; date: string; status: string; badgeColor: string; textColor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 hover:bg-[#F5F8F7] transition">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink truncate">{name}</p>
        <p className="text-xs text-muted">{date}</p>
      </div>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColor} ${textColor}`}>{status}</span>
    </div>
  );
}
