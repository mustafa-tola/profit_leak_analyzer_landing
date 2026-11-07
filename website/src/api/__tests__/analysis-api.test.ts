import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SourceName } from '../../engine/types';
import { UPLOAD_SOURCES } from '../contracts';
import {
  createAnalyzeHandler,
  createGetAnalysisHandler,
  createListAnalysesHandler,
} from '../http';
import { InMemoryAnalysisRepository } from '../persistence';
import { AnalysisService } from '../service';
import type { Authenticator } from '../auth';

const FIXTURE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'engine',
  '__tests__',
  'fixtures',
  'regression',
);

const FIXTURE_FILES: Record<SourceName, string> = {
  orders: 'orders.csv',
  shipments: 'shipments.csv',
  settlements: 'settlements.csv',
  allocations: 'allocations.csv',
};

async function fixtureFile(source: SourceName): Promise<File> {
  const bytes = await readFile(join(FIXTURE_DIR, FIXTURE_FILES[source]));
  return new File([bytes], FIXTURE_FILES[source], { type: 'text/csv' });
}

const authenticator: Authenticator = async (request) => {
  const seller = request.headers.get('x-seller-id')?.trim();
  return seller ? { seller_id: seller } : null;
};

function setup(options: { maxTotalBytes?: number; idFactory?: () => string } = {}) {
  let counter = 0;
  const repository = new InMemoryAnalysisRepository();
  const service = new AnalysisService({
    repository,
    now: () => new Date('2026-11-07T00:00:00.000Z'),
    idFactory:
      options.idFactory ??
      (() => {
        counter += 1;
        return `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`;
      }),
  });
  const handler = createAnalyzeHandler({
    authenticator,
    service,
    maxTotalBytes: options.maxTotalBytes,
  });
  const getHandler = createGetAnalysisHandler({ authenticator, repository });
  const listHandler = createListAnalysesHandler({ authenticator, repository });
  return { repository, service, handler, getHandler, listHandler };
}

async function fixtureForm(overrides: Partial<Record<SourceName, File>> = {}): Promise<FormData> {
  const form = new FormData();
  for (const source of UPLOAD_SOURCES) {
    form.set(`${source}_file`, overrides[source] ?? (await fixtureFile(source)));
  }
  form.set('as_of_date', '2026-10-30');
  form.set('courier_rules', JSON.stringify([{ courier: 'TCS', settlement_days: 7 }]));
  return form;
}

function analyzeRequest(form: FormData, seller: string | null = 'SELLER-DEMO'): Request {
  const headers = new Headers();
  if (seller !== null) headers.set('x-seller-id', seller);
  return new Request('http://localhost/api/analyses', {
    method: 'POST',
    headers,
    body: form,
  });
}

function readRequest(seller: string | null = 'SELLER-DEMO'): Request {
  const headers = new Headers();
  if (seller !== null) headers.set('x-seller-id', seller);
  return new Request('http://localhost/api/analyses', {
    method: 'GET',
    headers,
  });
}

describe('POST /api/analyses', () => {
  it('returns 201 and persists counts that match the engine output', async () => {
    const { handler, repository } = setup();
    const response = await handler(analyzeRequest(await fixtureForm()));
    const body = (await response.json()) as {
      data: {
        run_id: string;
        analysis_quality: string;
        counts: { source_rows: number; results: number; exceptions: number };
        verification: { persisted_counts_match: boolean };
        result: {
          results: unknown[];
          exceptions: unknown[];
          kpis_pkr: Record<string, string>;
        };
      };
    };

    expect(response.status).toBe(201);
    expect(response.headers.get('x-analysis-quality')).toBe('PARTIAL_DATA');
    expect(body.data.analysis_quality).toBe('PARTIAL_DATA');
    expect(body.data.counts.source_rows).toBe(437);
    expect(body.data.result.kpis_pkr.outstanding_receivable_pkr).toBe('PKR 68,675.00');
    expect(body.data.verification.persisted_counts_match).toBe(true);
    expect(body.data).not.toHaveProperty('source_rows');

    const stored = await repository.findById('SELLER-DEMO', body.data.run_id);
    expect(stored).not.toBeNull();
    expect(stored?.counts.results).toBe(body.data.result.results.length);
    expect(stored?.counts.exceptions).toBe(body.data.result.exceptions.length);
    expect(stored?.seller_id).toBe('SELLER-DEMO');
  });

  it('keeps runs isolated by seller', async () => {
    const { handler, repository } = setup();
    const response = await handler(analyzeRequest(await fixtureForm()));
    const body = (await response.json()) as { data: { run_id: string } };

    expect(await repository.findById('SELLER-DEMO', body.data.run_id)).not.toBeNull();
    expect(await repository.findById('OTHER-SELLER', body.data.run_id)).toBeNull();
    expect(await repository.list('OTHER-SELLER')).toEqual([]);
  });

  it('ignores a seller_id form field and uses the authenticated seller', async () => {
    const { handler } = setup();
    const form = await fixtureForm();
    form.set('seller_id', 'OTHER-SELLER');
    const response = await handler(analyzeRequest(form));
    const body = (await response.json()) as { data: { seller_id: string } };

    expect(response.status).toBe(201);
    expect(body.data.seller_id).toBe('SELLER-DEMO');
  });

  it('returns 401 without an authenticated seller', async () => {
    const { handler } = setup();
    const response = await handler(analyzeRequest(await fixtureForm(), null));

    expect(response.status).toBe(401);
    expect((await response.json()) as { error: { code: string } }).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('returns 415 for non-multipart requests', async () => {
    const { handler } = setup();
    const response = await handler(
      new Request('http://localhost/api/analyses', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-seller-id': 'SELLER-DEMO' },
        body: '{}',
      }),
    );

    expect(response.status).toBe(415);
  });

  it('returns 400 when a required file is missing', async () => {
    const { handler } = setup();
    const form = await fixtureForm();
    form.delete('settlements_file');
    const response = await handler(analyzeRequest(form));
    const body = (await response.json()) as {
      error: { code: string; details: Array<{ path: string }> };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.map((issue) => issue.path)).toContain('settlements_file');
  });

  it('returns 422 when a required CSV column is missing', async () => {
    const { handler } = setup();
    const form = await fixtureForm({
      orders: new File(
        [
          'seller_id,order_id,order_date,order_status\n' +
            'SELLER-DEMO,ORD-1,2026-10-01,confirmed\n',
        ],
        'orders.csv',
        { type: 'text/csv' },
      ),
    });
    const response = await handler(analyzeRequest(form));
    const body = (await response.json()) as {
      error: { code: string; details: Array<{ column: string }> };
    };

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('MISSING_REQUIRED_COLUMN');
    expect(body.error.details.some((detail) => detail.column === 'cod_amount_pkr')).toBe(true);
  });

  it('returns 400 for an invalid as_of_date', async () => {
    const { handler } = setup();
    const form = await fixtureForm();
    form.set('as_of_date', '2026-02-30');
    const response = await handler(analyzeRequest(form));

    expect(response.status).toBe(400);
    expect((await response.json()) as { error: { code: string } }).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('returns 413 when the combined upload limit is exceeded', async () => {
    const { handler } = setup({ maxTotalBytes: 10 });
    const response = await handler(analyzeRequest(await fixtureForm()));

    expect(response.status).toBe(413);
    expect((await response.json()) as { error: { code: string } }).toMatchObject({
      error: { code: 'UPLOAD_TOO_LARGE' },
    });
  });

  it('returns NO_VALID_SETTLEMENTS when every settlement row is rejected', async () => {
    const { handler } = setup();
    const form = new FormData();
    form.set(
      'orders_file',
      new File(
        [
          'seller_id,order_id,order_date,cod_amount_pkr,order_status\n' +
            'SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed\n',
        ],
        'orders.csv',
        { type: 'text/csv' },
      ),
    );
    form.set(
      'shipments_file',
      new File(
        [
          'seller_id,shipment_id,order_id,tracking_number,courier,booked_date,status,cod_collected_pkr,contracted_delivery_fee_pkr,contracted_rto_fee_pkr\n' +
            'SELLER-DEMO,SHP-1,ORD-1,TRK-1,TCS,2026-10-02,delivered,1000.00,100.00,0.00\n',
        ],
        'shipments.csv',
        { type: 'text/csv' },
      ),
    );
    form.set(
      'settlements_file',
      new File(
        [
          'seller_id,settlement_id,courier,settlement_date,entry_type,gross_cod_pkr,delivery_fees_pkr,rto_fees_pkr,other_deductions_pkr,net_paid_pkr\n' +
            'SELLER-DEMO,SET-1,TCS,2026-10-20,PAYMENT,1000.00,100.00,0.00,0.00,INVALID\n',
        ],
        'settlements.csv',
        { type: 'text/csv' },
      ),
    );
    form.set('as_of_date', '2026-10-30');

    const response = await handler(analyzeRequest(form));
    const body = (await response.json()) as {
      data: {
        analysis_quality: string;
        valid_counts: { settlements: number };
        verification: { persisted_counts_match: boolean };
      };
    };

    expect(response.status).toBe(201);
    expect(body.data.analysis_quality).toBe('NO_VALID_SETTLEMENTS');
    expect(body.data.valid_counts.settlements).toBe(0);
    expect(body.data.verification.persisted_counts_match).toBe(true);
  });

  it('uses a stable input fingerprint and creates a new run for a repeat upload', async () => {
    const { handler } = setup();
    const first = (await (
      await handler(analyzeRequest(await fixtureForm()))
    ).json()) as { data: { run_id: string; input_fingerprint: string; output_hash: string } };
    const second = (await (
      await handler(analyzeRequest(await fixtureForm()))
    ).json()) as { data: { run_id: string; input_fingerprint: string; output_hash: string } };

    expect(first.data.run_id).not.toBe(second.data.run_id);
    expect(first.data.input_fingerprint).toBe(second.data.input_fingerprint);
    expect(first.data.output_hash).toBe(second.data.output_hash);
  });

  it('returns 405 for non-POST methods', async () => {
    const { handler } = setup();
    const response = await handler(new Request('http://localhost/api/analyses'));

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });
});

describe('GET /api/analyses', () => {
  it('returns public runs without source rows and enforces seller isolation', async () => {
    const { handler, getHandler, listHandler } = setup();
    const upload = await handler(analyzeRequest(await fixtureForm()));
    const uploadBody = (await upload.json()) as { data: { run_id: string } };
    const runId = uploadBody.data.run_id;

    const detail = await getHandler(readRequest('SELLER-DEMO'), runId);
    const detailBody = (await detail.json()) as {
      data: { run_id: string; counts: { source_rows: number } };
    };

    expect(detail.status).toBe(200);
    expect(detail.headers.get('x-analysis-quality')).toBe('PARTIAL_DATA');
    expect(detailBody.data.run_id).toBe(runId);
    expect(detailBody.data).not.toHaveProperty('source_rows');

    const otherDetail = await getHandler(readRequest('OTHER-SELLER'), runId);
    expect(otherDetail.status).toBe(404);

    const list = await listHandler(readRequest('SELLER-DEMO'));
    const listBody = (await list.json()) as {
      data: Array<{ run_id: string; counts: { source_rows: number } }>;
    };
    expect(list.status).toBe(200);
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].run_id).toBe(runId);
    expect(listBody.data[0]).not.toHaveProperty('source_rows');

    const otherList = await listHandler(readRequest('OTHER-SELLER'));
    expect((await otherList.json()) as { data: unknown[] }).toEqual({ data: [] });
  });

  it('returns 404 for malformed run ids', async () => {
    const { getHandler } = setup();
    const response = await getHandler(readRequest(), 'not-a-uuid');

    expect(response.status).toBe(404);
  });

  it('returns 401 without auth and 405 for POST', async () => {
    const { getHandler, listHandler } = setup();
    const unauthenticated = await getHandler(readRequest(null), '11111111-1111-4111-8111-111111111111');
    expect(unauthenticated.status).toBe(401);

    const wrongMethod = await listHandler(
      new Request('http://localhost/api/analyses', {
        method: 'POST',
        headers: { 'x-seller-id': 'SELLER-DEMO' },
      }),
    );
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get('allow')).toBe('GET');
  });
});
