import type { AnalysisResult } from '../engine/analyze';
import type { EngineRow, SourceName } from '../engine/types';
import type { MappedHeader, IngestionWarning } from '../ingestion/csv';
import type { Jsonified } from './serialization';

export const PERSISTENCE_VERSION = 'pla-persistence-v1';

export interface PersistedSourceFile {
  source: SourceName;
  filename: string;
  size_bytes: number;
  sha256: string;
  row_count: number;
  schema_version: string;
  mapping_version: string;
  headers: MappedHeader[];
  warnings: IngestionWarning[];
}

export interface PersistedAnalysisCounts {
  source_rows: number;
  orders: number;
  shipments: number;
  settlements: number;
  allocations: number;
  results: number;
  exceptions: number;
  validation_errors: number;
  settlement_summary: number;
}

export interface PersistedCountVerification {
  persisted_counts_match: boolean;
  checks: Array<{
    table: string;
    expected: number;
    persisted: number;
    ok: boolean;
  }>;
}

export interface PersistedAnalysisRun {
  persistence_version: typeof PERSISTENCE_VERSION;
  run_id: string;
  seller_id: string;
  created_at: string;
  as_of_date: string | null;
  engine_version: string;
  schema_version: string;
  mapping_version: string;
  input_fingerprint: string;
  rules: Array<{ courier: string; settlement_days: number }>;
  coverage: Array<{
    courier: string;
    covered_through: string;
    source: 'evidenced' | 'user_declaration';
    declared_by: string;
    declared_at: string;
  }>;
  source_files: PersistedSourceFile[];
  source_rows: Record<SourceName, EngineRow[]>;
  result: Jsonified<AnalysisResult>;
  counts: PersistedAnalysisCounts;
  verification: PersistedCountVerification;
}

/**
 * Lightweight list representation. It deliberately excludes rules, coverage,
 * source rows, and the full result so listing runs stays cheap.
 */
export interface PersistedAnalysisSummary {
  persistence_version: typeof PERSISTENCE_VERSION;
  run_id: string;
  seller_id: string;
  created_at: string;
  as_of_date: string | null;
  engine_version: string;
  schema_version: string;
  mapping_version: string;
  input_fingerprint: string;
  analysis_quality: AnalysisResult['analysis_quality'];
  quality_message: string;
  output_hash: string;
  counts: PersistedAnalysisCounts;
  kpis_pkr: Jsonified<AnalysisResult>['kpis_pkr'];
  verification: PersistedCountVerification;
}

export function summarizeRun(run: PersistedAnalysisRun): PersistedAnalysisSummary {
  return {
    persistence_version: run.persistence_version,
    run_id: run.run_id,
    seller_id: run.seller_id,
    created_at: run.created_at,
    as_of_date: run.as_of_date,
    engine_version: run.engine_version,
    schema_version: run.schema_version,
    mapping_version: run.mapping_version,
    input_fingerprint: run.input_fingerprint,
    analysis_quality: run.result.analysis_quality,
    quality_message: run.result.quality_message,
    output_hash: run.result.output_hash,
    counts: run.counts,
    kpis_pkr: run.result.kpis_pkr,
    verification: run.verification,
  };
}

export interface AnalysisRepository {
  save(run: PersistedAnalysisRun): Promise<void>;
  findById(sellerId: string, runId: string): Promise<PersistedAnalysisRun | null>;
  list(sellerId: string): Promise<PersistedAnalysisRun[]>;
  listSummaries(sellerId: string): Promise<PersistedAnalysisSummary[]>;
}

/**
 * Phase 2 repository. It enforces seller scoping and immutability in-process.
 * Phase 3 can implement the same interface with Prisma/PostgreSQL.
 */
export class InMemoryAnalysisRepository implements AnalysisRepository {
  private readonly bySeller = new Map<string, Map<string, PersistedAnalysisRun>>();

  async save(run: PersistedAnalysisRun): Promise<void> {
    let sellerRuns = this.bySeller.get(run.seller_id);
    if (!sellerRuns) {
      sellerRuns = new Map();
      this.bySeller.set(run.seller_id, sellerRuns);
    }
    if (sellerRuns.has(run.run_id)) {
      throw new Error(`Analysis run ${run.run_id} already exists`);
    }
    sellerRuns.set(run.run_id, structuredClone(run));
  }

  async findById(sellerId: string, runId: string): Promise<PersistedAnalysisRun | null> {
    const run = this.bySeller.get(sellerId)?.get(runId);
    return run ? structuredClone(run) : null;
  }

  async list(sellerId: string): Promise<PersistedAnalysisRun[]> {
    return Array.from(this.bySeller.get(sellerId)?.values() ?? []).map((run) =>
      structuredClone(run),
    );
  }

  async listSummaries(sellerId: string): Promise<PersistedAnalysisSummary[]> {
    return (await this.list(sellerId)).map(summarizeRun);
  }
}

export function verifyPersistedCounts(run: PersistedAnalysisRun): PersistedCountVerification {
  const checks = [
    { table: 'results', expected: run.result.results.length, persisted: run.counts.results },
    { table: 'exceptions', expected: run.result.exceptions.length, persisted: run.counts.exceptions },
    {
      table: 'validation_errors',
      expected: run.result.validation_errors.length,
      persisted: run.counts.validation_errors,
    },
    {
      table: 'settlement_summary',
      expected: run.result.settlement_summary.length,
      persisted: run.counts.settlement_summary,
    },
    {
      table: 'source_rows',
      expected:
        run.source_rows.orders.length +
        run.source_rows.shipments.length +
        run.source_rows.settlements.length +
        run.source_rows.allocations.length,
      persisted: run.counts.source_rows,
    },
  ].map((check) => ({ ...check, ok: check.expected === check.persisted }));

  return {
    persisted_counts_match: checks.every((check) => check.ok),
    checks,
  };
}
