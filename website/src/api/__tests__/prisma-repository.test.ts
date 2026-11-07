import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PrismaAnalysisRepository } from '../prisma-repository';
import type { PersistedAnalysisRun } from '../persistence';
import {
  SAMPLE_OUTPUT_HASH,
  SAMPLE_RUN_ID,
  sampleRun,
} from './fixtures/persistence-run';

function prismaRecord(run: PersistedAnalysisRun) {
  return {
    id: run.run_id,
    sellerId: run.seller_id,
    persistenceVersion: run.persistence_version,
    createdAt: new Date(run.created_at),
    asOfDate: new Date(`${run.as_of_date}T00:00:00.000Z`),
    engineVersion: run.engine_version,
    schemaVersion: run.schema_version,
    mappingVersion: run.mapping_version,
    inputFingerprint: run.input_fingerprint,
    analysisQuality: run.result.analysis_quality,
    outputHash: run.result.output_hash,
    rules: run.rules,
    coverage: run.coverage,
    result: run.result,
    counts: run.counts,
    verification: run.verification,
    sourceFiles: run.source_files.map((file, index) => ({
      id: `source-file-${index}`,
      runId: run.run_id,
      ...file,
      sizeBytes: file.size_bytes,
      rowCount: file.row_count,
      schemaVersion: file.schema_version,
      mappingVersion: file.mapping_version,
    })),
    sourceRows: run.source_rows.orders.map((data, rowIndex) => ({
      id: BigInt(rowIndex + 1),
      runId: run.run_id,
      source: 'orders',
      rowIndex,
      data,
    })),
  };
}

function fakeClient(run: PersistedAnalysisRun) {
  const calls: {
    create?: unknown;
    findFirst?: unknown;
    findMany?: unknown;
    sourceFiles?: unknown[];
    sourceRows?: unknown[];
  } = {};
  const record = prismaRecord(run);

  const transactionClient = {
    analysisRun: {
      create: async (args: unknown) => {
        calls.create = args;
        return record;
      },
      findFirst: async (args: unknown) => {
        calls.findFirst = args;
        return record;
      },
      findMany: async (args: unknown) => {
        calls.findMany = args;
        return [record];
      },
    },
    sourceFile: {
      createMany: async (args: { data: unknown[] }) => {
        calls.sourceFiles = args.data;
        return { count: args.data.length };
      },
    },
    sourceRow: {
      createMany: async (args: { data: unknown[] }) => {
        calls.sourceRows = [...(calls.sourceRows ?? []), ...args.data];
        return { count: args.data.length };
      },
    },
  };

  const client = {
    ...transactionClient,
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient),
  } as unknown as PrismaClient;

  return { client, calls, record };
}

describe('PrismaAnalysisRepository', () => {
  it('writes seller-scoped runs with source rows', async () => {
    const run = sampleRun();
    const { client, calls } = fakeClient(run);
    const repository = new PrismaAnalysisRepository(client);

    await repository.save(run);

    const create = calls.create as {
      data: {
        sellerId: string;
        id: string;
      };
    };
    expect(create.data.sellerId).toBe('SELLER-DEMO');
    expect(create.data.id).toBe(SAMPLE_RUN_ID);
    expect(calls.sourceRows).toHaveLength(1);
    expect(calls.sourceFiles).toHaveLength(1);
  });

  it('reads a run back with source rows and seller scoping', async () => {
    const run = sampleRun();
    const { client, calls } = fakeClient(run);
    const repository = new PrismaAnalysisRepository(client);

    const stored = await repository.findById('SELLER-DEMO', SAMPLE_RUN_ID);

    expect(calls.findFirst).toMatchObject({
      where: { id: SAMPLE_RUN_ID, sellerId: 'SELLER-DEMO' },
    });
    expect(stored).not.toBeNull();
    expect(stored?.seller_id).toBe('SELLER-DEMO');
    expect(stored?.as_of_date).toBe('2026-10-30');
    expect(stored?.source_rows.orders).toEqual([{ order_id: 'O-1', seller_id: 'SELLER-DEMO' }]);
    expect(stored?.result.output_hash).toBe(SAMPLE_OUTPUT_HASH);
  });

  it('lists only the requested seller', async () => {
    const run = sampleRun();
    const { client, calls } = fakeClient(run);
    const repository = new PrismaAnalysisRepository(client);

    const runs = await repository.list('SELLER-DEMO');

    expect(calls.findMany).toMatchObject({
      where: { sellerId: 'SELLER-DEMO' },
    });
    expect(runs).toHaveLength(1);
    expect(runs[0].seller_id).toBe('SELLER-DEMO');
  });

  it('lists lightweight summaries without source rows', async () => {
    const run = sampleRun();
    const { client, calls } = fakeClient(run);
    const repository = new PrismaAnalysisRepository(client);

    const summaries = await repository.listSummaries('SELLER-DEMO');

    expect(calls.findMany).toMatchObject({
      where: { sellerId: 'SELLER-DEMO' },
    });
    const query = calls.findMany as { select: Record<string, boolean> };
    expect(query.select.analysisQuality).toBe(true);
    expect(query.select.sourceRows).toBeUndefined();
    expect(summaries[0]).not.toHaveProperty('source_rows');
    expect(summaries[0]).not.toHaveProperty('result');
    expect(summaries[0].analysis_quality).toBe('CLEAN');
  });
});
