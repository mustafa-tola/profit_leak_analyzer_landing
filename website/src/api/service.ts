import { analyze, toSerializable, type AnalysisResult } from '../engine/analyze';
import type { EngineInput, EngineRow, SourceName } from '../engine/types';
import { ingestCsvFile, sha256Hex, type IngestedFile } from '../ingestion/csv';
import { MAPPING_VERSION, SCHEMA_VERSION } from '../ingestion/spec';
import {
  REQUIRED_FILE_SOURCES,
  UPLOAD_SOURCES,
  type AnalyzeOptions,
} from './contracts';
import { ApiError, RequestValidationError } from './errors';
import {
  PERSISTENCE_VERSION,
  verifyPersistedCounts,
  type AnalysisRepository,
  type PersistedAnalysisRun,
  type PersistedSourceFile,
} from './persistence';
import type { Jsonified } from './serialization';

export type UploadFiles = Partial<Record<SourceName, File>>;

export interface AnalyzeUploadInput {
  sellerId: string;
  options: AnalyzeOptions;
  files: UploadFiles;
}

export interface AnalysisServiceDeps {
  repository: AnalysisRepository;
  now?: () => Date;
  idFactory?: () => string;
  maxFileBytes?: number;
}

export interface AnalyzeUploadResult {
  run: PersistedAnalysisRun;
  stored: PersistedAnalysisRun;
}

/**
 * Seller ids are case-insensitive business codes. Authentication preserves the
 * provider's raw id; every seller-scoped storage query must use this form.
 */
export function normalizeSellerId(value: string): string {
  return value.trim().toUpperCase();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(',')}}`;
}

function toSourceFile(file: IngestedFile): PersistedSourceFile {
  return {
    source: file.source,
    filename: file.filename,
    size_bytes: file.size_bytes,
    sha256: file.sha256,
    row_count: file.row_count,
    schema_version: file.schema_version,
    mapping_version: file.mapping_version,
    headers: file.headers,
    warnings: file.warnings,
  };
}

export class AnalysisService {
  private readonly repository: AnalysisRepository;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly maxFileBytes?: number;

  constructor(deps: AnalysisServiceDeps) {
    this.repository = deps.repository;
    this.now = deps.now ?? (() => new Date());
    this.idFactory = deps.idFactory ?? (() => globalThis.crypto.randomUUID());
    this.maxFileBytes = deps.maxFileBytes;
  }

  async analyzeUpload(input: AnalyzeUploadInput): Promise<AnalyzeUploadResult> {
    const sellerId = normalizeSellerId(input.sellerId);
    if (sellerId === '') {
      throw new RequestValidationError('seller_id is required');
    }

    const missing = REQUIRED_FILE_SOURCES.filter((source) => !input.files[source]);
    if (missing.length > 0) {
      throw new RequestValidationError(
        `Missing required file${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
        missing.map((source) => ({
          path: `${source}_file`,
          message: `Upload the ${source} CSV`,
        })),
      );
    }

    const ingested: IngestedFile[] = [];
    for (const source of UPLOAD_SOURCES) {
      const file = input.files[source];
      if (!file) continue;
      ingested.push(
        await ingestCsvFile(source, file, {
          maxFileBytes: this.maxFileBytes,
        }),
      );
    }

    const bySource = new Map(ingested.map((file) => [file.source, file]));
    const sourceRows: Record<SourceName, EngineRow[]> = {
      orders: bySource.get('orders')?.rows ?? [],
      shipments: bySource.get('shipments')?.rows ?? [],
      settlements: bySource.get('settlements')?.rows ?? [],
      allocations: bySource.get('allocations')?.rows ?? [],
    };

    const inputFingerprint = await sha256Hex(
      new TextEncoder().encode(
        stableStringify({
          seller_id: sellerId,
          as_of_date: input.options.asOfDate ?? null,
          courier_rules: input.options.courierRules,
          settlement_coverage: input.options.coverage,
          files: ingested.map((file) => ({
            source: file.source,
            sha256: file.sha256,
            schema_version: file.schema_version,
            mapping_version: file.mapping_version,
          })),
        }),
      ),
    );

    const runId = this.idFactory();
    const engineInput: EngineInput = {
      seller_id: sellerId,
      run_id: runId,
      as_of_date: input.options.asOfDate,
      courier_rules: input.options.courierRules,
      settlement_coverage: input.options.coverage,
      orders: sourceRows.orders,
      shipments: sourceRows.shipments,
      settlements: sourceRows.settlements,
      allocations: sourceRows.allocations,
    };

    const analysis = analyze(engineInput);
    const result = toSerializable(analysis) as unknown as Jsonified<AnalysisResult>;

    const counts = {
      source_rows: ingested.reduce((total, file) => total + file.row_count, 0),
      orders: sourceRows.orders?.length ?? 0,
      shipments: sourceRows.shipments?.length ?? 0,
      settlements: sourceRows.settlements?.length ?? 0,
      allocations: sourceRows.allocations?.length ?? 0,
      results: result.results.length,
      exceptions: result.exceptions.length,
      validation_errors: result.validation_errors.length,
      settlement_summary: result.settlement_summary.length,
    };

    const run: PersistedAnalysisRun = {
      persistence_version: PERSISTENCE_VERSION,
      run_id: runId,
      seller_id: sellerId,
      created_at: this.now().toISOString(),
      as_of_date: result.as_of_date,
      engine_version: result.engine_version,
      schema_version: SCHEMA_VERSION,
      mapping_version: MAPPING_VERSION,
      input_fingerprint: inputFingerprint,
      rules: result.courier_rules_used,
      coverage: result.coverage_used,
      source_files: ingested.map(toSourceFile),
      source_rows: sourceRows,
      result,
      counts,
      verification: {
        persisted_counts_match: false,
        checks: [],
      },
    };

    run.verification = verifyPersistedCounts(run);
    await this.repository.save(run);

    const stored = await this.repository.findById(sellerId, runId);
    if (!stored) {
      throw new ApiError(500, 'PERSISTENCE_READ_FAILED', 'The analysis run could not be read back');
    }

    const verification = verifyPersistedCounts(stored);
    const hashMatches = stored.result.output_hash === run.result.output_hash;
    if (!verification.persisted_counts_match || !hashMatches) {
      throw new ApiError(
        500,
        'PERSISTENCE_VERIFICATION_FAILED',
        'Stored analysis did not match the engine output',
        { verification, hash_matches: hashMatches },
      );
    }

    return { run, stored };
  }
}
