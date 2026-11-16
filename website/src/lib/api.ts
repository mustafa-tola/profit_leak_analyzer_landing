const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '');

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export interface PublicAnalysisSummary {
  persistence_version: string;
  run_id: string;
  seller_id: string;
  created_at: string;
  as_of_date: string | null;
  engine_version: string;
  schema_version: string;
  mapping_version: string;
  input_fingerprint: string;
  analysis_quality: string;
  quality_message: string;
  output_hash: string;
  counts: Record<string, number>;
  kpis_pkr: Record<string, string>;
  verification: { persisted_counts_match: boolean };
}

export interface PublicAnalysisRun extends PublicAnalysisSummary {
  rules: Array<{ courier: string; settlement_days: number }>;
  coverage: Array<{
    courier: string;
    covered_through: string;
    source: 'evidenced' | 'user_declaration';
    declared_by: string;
    declared_at: string;
  }>;
  source_files: Array<{ source: string; filename: string; size_bytes: number; row_count: number }>;
  result: Record<string, unknown>;
}

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, { ...init, headers });
      const json = (await res.json().catch(() => ({}))) as T & ApiErrorBody;

      // 401 means session expired — do not retry, surface to caller
      if (res.status === 401) {
        const err = new Error(json.error?.message ?? 'Session expired') as Error & {
          status?: number;
          code?: string;
          details?: unknown;
        };
        err.status = 401;
        err.code = json.error?.code;
        err.details = json.error?.details;
        throw err;
      }

      if (!res.ok) {
        // Retry on 5xx server errors only
        if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
          const err = new Error(json.error?.message ?? `Request failed (${res.status})`) as Error & {
            status?: number;
            code?: string;
            details?: unknown;
            retryable?: boolean;
          };
          err.status = res.status;
          err.code = json.error?.code;
          err.details = json.error?.details;
          err.retryable = true;
          lastError = err;
          await sleep(RETRY_BASE_MS * (attempt + 1));
          continue;
        }
        const err = new Error(json.error?.message ?? `Request failed (${res.status})`) as Error & {
          status?: number;
          code?: string;
          details?: unknown;
        };
        err.status = res.status;
        err.code = json.error?.code;
        err.details = json.error?.details;
        throw err;
      }
      return json;
    } catch (err) {
      const e = err as Error & { retryable?: boolean; status?: number };
      if (e.status === 401) throw err;
      if (!e.retryable && !(err as Error).message.includes('fetch')) throw err;
      lastError = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error('Request failed');
}

export async function listAnalyses(token: string): Promise<PublicAnalysisSummary[]> {
  const res = await request<{ data: PublicAnalysisSummary[] }>('/api/analyses', token);
  return res.data ?? [];
}

export async function getAnalysis(token: string, runId: string): Promise<PublicAnalysisRun> {
  const res = await request<{ data: PublicAnalysisRun }>(`/api/analyses/${encodeURIComponent(runId)}`, token);
  return res.data;
}

export async function uploadAnalysis(token: string, form: FormData): Promise<PublicAnalysisRun> {
  const res = await request<{ data: PublicAnalysisRun }>('/api/analyses', token, {
    method: 'POST',
    body: form,
  });
  return res.data;
}

export function apiUrl(): string {
  return API_URL;
}
