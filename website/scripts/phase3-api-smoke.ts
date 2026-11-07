/**
 * Phase 3 API smoke check. Requires the API server to be running with
 * PLA_DEV_HEADER_AUTH=1 (or a valid Clerk bearer token configuration).
 *
 * Terminal 1:
 *   $env:PLA_DEV_HEADER_AUTH = "1"
 *   $env:PLA_REPOSITORY = "memory"   # or "prisma" with DATABASE_URL
 *   npm.cmd run api:dev
 *
 * Terminal 2:
 *   npm.cmd run api:smoke:phase3
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseUrl = process.env.PLA_API_URL ?? 'http://127.0.0.1:8787';
const frontendOrigin = process.env.PLA_SMOKE_ORIGIN ?? 'http://localhost:5173';
const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'engine',
  '__tests__',
  'fixtures',
  'regression',
);

const checks: Array<{ name: string; expected: string; actual: string; pass: boolean }> = [];

function check(name: string, expected: string, actual: string): void {
  checks.push({ name, expected, actual, pass: expected === actual });
}

async function loadForm(): Promise<FormData> {
  const files: Array<[string, string]> = [
    ['orders_file', 'orders.csv'],
    ['shipments_file', 'shipments.csv'],
    ['settlements_file', 'settlements.csv'],
    ['allocations_file', 'allocations.csv'],
  ];
  const form = new FormData();
  for (const [field, filename] of files) {
    const bytes = await readFile(join(fixtureDir, filename));
    form.set(field, new File([bytes], filename, { type: 'text/csv' }));
  }
  form.set('as_of_date', '2026-10-30');
  return form;
}

function sellerHeaders(seller: string): HeadersInit {
  return { 'x-seller-id': seller };
}

async function main(): Promise<void> {
  console.log(`Phase 3 API smoke check against ${baseUrl}`);

  const health = await fetch(`${baseUrl}/health`);
  check('health endpoint status', '200', String(health.status));

  const unauthorized = await fetch(`${baseUrl}/api/analyses`, {
    method: 'POST',
    body: new FormData(),
  });
  check('unauthenticated request', '401', String(unauthorized.status));

  const upload = await fetch(`${baseUrl}/api/analyses`, {
    method: 'POST',
    headers: sellerHeaders('SELLER-DEMO'),
    body: await loadForm(),
  });
  const uploadBody = (await upload.json()) as {
    data?: {
      run_id: string;
      analysis_quality: string;
      counts: { source_rows: number; exceptions: number };
      kpis_pkr: Record<string, string>;
      verification: { persisted_counts_match: boolean };
    };
    error?: { code: string; message: string };
  };

  if (!uploadBody.data) {
    console.log(`FAIL  upload response: ${JSON.stringify(uploadBody.error ?? uploadBody)}`);
    process.exitCode = 1;
    return;
  }

  const runId = uploadBody.data.run_id;
  check('upload status', '201', String(upload.status));
  check('analysis quality', 'PARTIAL_DATA', uploadBody.data.analysis_quality);
  check('source rows', '437', String(uploadBody.data.counts.source_rows));
  check('exceptions', '87', String(uploadBody.data.counts.exceptions));
  check(
    'outstanding receivable',
    'PKR 68,675.00',
    uploadBody.data.kpis_pkr.outstanding_receivable_pkr,
  );
  check(
    'persisted counts match',
    'true',
    String(uploadBody.data.verification.persisted_counts_match),
  );

  const detail = await fetch(`${baseUrl}/api/analyses/${runId}`, {
    headers: sellerHeaders('SELLER-DEMO'),
  });
  const detailBody = (await detail.json()) as {
    data?: { run_id: string; analysis_quality: string };
    error?: { code: string };
  };
  check('detail status', '200', String(detail.status));
  check('detail run id', runId, detailBody.data?.run_id ?? '');
  check('detail hides source rows', 'absent', 'source_rows' in (detailBody.data ?? {}) ? 'present' : 'absent');

  const list = await fetch(`${baseUrl}/api/analyses`, {
    headers: sellerHeaders('SELLER-DEMO'),
  });
  const listBody = (await list.json()) as {
    data?: Array<{ run_id: string }>;
    error?: { code: string };
  };
  check('list status', '200', String(list.status));
  check('list contains run', 'true', String(listBody.data?.some((run) => run.run_id === runId) ?? false));

  const otherDetail = await fetch(`${baseUrl}/api/analyses/${runId}`, {
    headers: sellerHeaders('OTHER-SELLER'),
  });
  check('other seller detail', '404', String(otherDetail.status));

  const otherList = await fetch(`${baseUrl}/api/analyses`, {
    headers: sellerHeaders('OTHER-SELLER'),
  });
  const otherListBody = (await otherList.json()) as { data?: unknown[] };
  check('other seller list empty', '0', String(otherListBody.data?.length ?? -1));

  const preflight = await fetch(`${baseUrl}/api/analyses`, {
    method: 'OPTIONS',
    headers: {
      origin: frontendOrigin,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'authorization,content-type',
    },
  });
  check('cors preflight status', '204', String(preflight.status));
  check(
    'cors allow origin',
    frontendOrigin,
    preflight.headers.get('access-control-allow-origin') ?? '',
  );

  const width = Math.max(...checks.map((item) => item.name.length));
  checks.forEach((item) => {
    console.log(
      `${item.pass ? 'PASS' : 'FAIL'}  ${item.name.padEnd(width)}  expected=${item.expected}  actual=${item.actual}`,
    );
  });

  const failures = checks.filter((item) => !item.pass);
  console.log('');
  console.log(`Summary: ${checks.length - failures.length}/${checks.length} checks passed`);
  if (failures.length > 0) {
    console.log('RESULT: FAIL');
    process.exitCode = 1;
    return;
  }
  console.log(`RESULT: PASS — run ${runId}`);
}

await main();
