import { Prisma, type PrismaClient } from '@prisma/client';
import type { AnalysisResult } from '../engine/analyze';
import type { EngineRow, SourceName } from '../engine/types';
import type { IngestionWarning, MappedHeader } from '../ingestion/csv';
import { UPLOAD_SOURCES } from './contracts';
import {
  PERSISTENCE_VERSION,
  type AnalysisRepository,
  type PersistedAnalysisCounts,
  type PersistedAnalysisRun,
  type PersistedAnalysisSummary,
  type PersistedCountVerification,
  type PersistedSourceFile,
} from './persistence';
import type { Jsonified } from './serialization';

const RUN_INCLUDE = {
  sourceFiles: true,
  sourceRows: { orderBy: { rowIndex: 'asc' } },
} as const satisfies Prisma.AnalysisRunInclude;

type RunRecord = Prisma.AnalysisRunGetPayload<{ include: typeof RUN_INCLUDE }>;

const SUMMARY_SELECT = {
  id: true,
  sellerId: true,
  persistenceVersion: true,
  createdAt: true,
  asOfDate: true,
  engineVersion: true,
  schemaVersion: true,
  mappingVersion: true,
  inputFingerprint: true,
  analysisQuality: true,
  outputHash: true,
  result: true,
  counts: true,
  verification: true,
} as const satisfies Prisma.AnalysisRunSelect;

type SummaryRecord = Prisma.AnalysisRunGetPayload<{ select: typeof SUMMARY_SELECT }>;

const SOURCE_ORDER = new Map(UPLOAD_SOURCES.map((source, index) => [source, index]));

function isSourceName(value: string): value is SourceName {
  return (UPLOAD_SOURCES as string[]).includes(value);
}

function sourceName(value: string): SourceName {
  if (!isSourceName(value)) {
    throw new Error(`Stored analysis contains an unknown source: ${value}`);
  }
  return value;
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function asEngineRow(value: Prisma.JsonValue): EngineRow {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Stored source row is not a JSON object');
  }
  return value as EngineRow;
}

function asIsoDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toPersistedSourceFile(record: RunRecord['sourceFiles'][number]): PersistedSourceFile {
  return {
    source: sourceName(record.source),
    filename: record.filename,
    size_bytes: record.sizeBytes,
    sha256: record.sha256,
    row_count: record.rowCount,
    schema_version: record.schemaVersion,
    mapping_version: record.mappingVersion,
    headers: record.headers as unknown as MappedHeader[],
    warnings: record.warnings as unknown as IngestionWarning[],
  };
}

function groupSourceRows(records: RunRecord['sourceRows']): Record<SourceName, EngineRow[]> {
  const grouped: Record<SourceName, EngineRow[]> = {
    orders: [],
    shipments: [],
    settlements: [],
    allocations: [],
  };

  for (const record of records) {
    grouped[sourceName(record.source)].push(asEngineRow(record.data));
  }
  return grouped;
}

function toPersistedSummary(record: SummaryRecord): PersistedAnalysisSummary {
  if (record.persistenceVersion !== PERSISTENCE_VERSION) {
    throw new Error(
      `Stored analysis ${record.id} uses unsupported persistence version ${record.persistenceVersion}`,
    );
  }

  const result = record.result as unknown as Jsonified<AnalysisResult>;
  if (record.analysisQuality !== result.analysis_quality) {
    throw new Error(`Stored analysis ${record.id} has an inconsistent analysis quality`);
  }
  if (record.outputHash !== result.output_hash) {
    throw new Error(`Stored analysis ${record.id} has an inconsistent output hash`);
  }

  return {
    persistence_version: PERSISTENCE_VERSION,
    run_id: record.id,
    seller_id: record.sellerId,
    created_at: record.createdAt.toISOString(),
    as_of_date: asIsoDate(record.asOfDate),
    engine_version: record.engineVersion,
    schema_version: record.schemaVersion,
    mapping_version: record.mappingVersion,
    input_fingerprint: record.inputFingerprint,
    analysis_quality: result.analysis_quality,
    quality_message: result.quality_message,
    output_hash: result.output_hash,
    counts: record.counts as unknown as PersistedAnalysisCounts,
    kpis_pkr: result.kpis_pkr,
    verification: record.verification as unknown as PersistedCountVerification,
  };
}

function toPersistedRun(record: RunRecord): PersistedAnalysisRun {
  const result = record.result as unknown as Jsonified<AnalysisResult>;
  const sourceFiles = [...record.sourceFiles].sort(
    (left, right) =>
      (SOURCE_ORDER.get(sourceName(left.source)) ?? 0) -
      (SOURCE_ORDER.get(sourceName(right.source)) ?? 0),
  );

  return {
    ...toPersistedSummary(record),
    rules: record.rules as unknown as PersistedAnalysisRun['rules'],
    coverage: record.coverage as unknown as PersistedAnalysisRun['coverage'],
    source_files: sourceFiles.map(toPersistedSourceFile),
    source_rows: groupSourceRows(record.sourceRows),
    result,
  };
}

/**
 * PostgreSQL/Prisma implementation of the Phase 2 persistence contract.
 * Seller scoping is enforced in every query, not only at write time.
 */
export class PrismaAnalysisRepository implements AnalysisRepository {
  constructor(private readonly client: PrismaClient) {}

  async save(run: PersistedAnalysisRun): Promise<void> {
    const sourceFiles: Prisma.SourceFileCreateManyInput[] = run.source_files.map((file) => ({
      runId: run.run_id,
      source: file.source,
      filename: file.filename,
      sizeBytes: file.size_bytes,
      sha256: file.sha256,
      rowCount: file.row_count,
      schemaVersion: file.schema_version,
      mappingVersion: file.mapping_version,
      headers: jsonInput(file.headers),
      warnings: jsonInput(file.warnings),
    }));

    const sourceRows: Prisma.SourceRowCreateManyInput[] = UPLOAD_SOURCES.flatMap((source) =>
      run.source_rows[source].map((row, rowIndex) => ({
        runId: run.run_id,
        source,
        rowIndex,
        data: jsonInput(row),
      })),
    );

    await this.client.$transaction(async (tx) => {
      await tx.analysisRun.create({
        data: {
          id: run.run_id,
          sellerId: run.seller_id,
          persistenceVersion: run.persistence_version,
          createdAt: new Date(run.created_at),
          asOfDate: run.as_of_date ? new Date(`${run.as_of_date}T00:00:00.000Z`) : null,
          engineVersion: run.engine_version,
          schemaVersion: run.schema_version,
          mappingVersion: run.mapping_version,
          inputFingerprint: run.input_fingerprint,
          analysisQuality: run.result.analysis_quality,
          outputHash: run.result.output_hash,
          rules: jsonInput(run.rules),
          coverage: jsonInput(run.coverage),
          result: jsonInput(run.result),
          counts: jsonInput(run.counts),
          verification: jsonInput(run.verification),
        },
      });

      if (sourceFiles.length > 0) {
        await tx.sourceFile.createMany({ data: sourceFiles });
      }

      const chunkSize = 1000;
      for (let index = 0; index < sourceRows.length; index += chunkSize) {
        await tx.sourceRow.createMany({
          data: sourceRows.slice(index, index + chunkSize),
        });
      }
    });
  }

  async findById(sellerId: string, runId: string): Promise<PersistedAnalysisRun | null> {
    const record = await this.client.analysisRun.findFirst({
      where: { id: runId, sellerId },
      include: RUN_INCLUDE,
    });
    return record ? toPersistedRun(record) : null;
  }

  async list(sellerId: string): Promise<PersistedAnalysisRun[]> {
    const records = await this.client.analysisRun.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: RUN_INCLUDE,
    });
    return records.map(toPersistedRun);
  }

  async listSummaries(sellerId: string): Promise<PersistedAnalysisSummary[]> {
    const records = await this.client.analysisRun.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      select: SUMMARY_SELECT,
    });
    return records.map(toPersistedSummary);
  }
}
