import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { loadLocalEnv } from '../../db/env';
import { disconnectPrisma, getPrismaClient } from '../../db/prisma';
import { PrismaAnalysisRepository } from '../prisma-repository';
import { sampleRun } from './fixtures/persistence-run';

loadLocalEnv();

const enabled =
  process.env.PLA_TEST_DATABASE === '1' && Boolean(process.env.DATABASE_URL?.trim());
const dbDescribe = enabled ? describe : describe.skip;

const sellerId = `TEST-${randomUUID()}`;
const runId = randomUUID();
const run = sampleRun({ sellerId, runId });

dbDescribe('PrismaAnalysisRepository with PostgreSQL', () => {
  const client = getPrismaClient();
  const repository = new PrismaAnalysisRepository(client);

  afterAll(async () => {
    await client.analysisRun.deleteMany({ where: { sellerId } });
    await disconnectPrisma();
  });

  it('round-trips a run, source rows, and seller isolation', async () => {
    await repository.save(run);

    const stored = await repository.findById(sellerId, runId);
    expect(stored).not.toBeNull();
    expect(stored?.seller_id).toBe(sellerId);
    expect(stored?.as_of_date).toBe('2026-10-30');
    expect(stored?.source_rows.orders).toEqual([{ order_id: 'O-1', seller_id: sellerId }]);
    expect(stored?.source_files[0]?.filename).toBe('orders.csv');
    expect(stored?.result.output_hash).toBe(run.result.output_hash);

    expect(await repository.findById('OTHER-SELLER', runId)).toBeNull();

    const listed = await repository.list(sellerId);
    expect(listed).toHaveLength(1);
    expect(listed[0].run_id).toBe(runId);

    const summaries = await repository.listSummaries(sellerId);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].run_id).toBe(runId);
    expect(summaries[0]).not.toHaveProperty('source_rows');
  });
});
