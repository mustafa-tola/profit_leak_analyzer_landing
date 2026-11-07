/**
 * Phase 2 API smoke check. Requires the development server to be running with
 * PLA_DEV_HEADER_AUTH=1.
 *
 * Terminal 1:
 *   $env:PLA_DEV_HEADER_AUTH = "1"
 *   npm.cmd run api:dev
 *
 * Terminal 2:
 *   npm.cmd run api:smoke
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseUrl = process.env.PLA_API_URL ?? 'http://127.0.0.1:8787';
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

async function main(): Promise<void> {
  console.log(`Phase 2 API smoke check against ${baseUrl}`);

  const health = await fetch(`${baseUrl}/health`);
  check('health endpoint status', '200', String(health.status));

  const unauthorized = await fetch(`${baseUrl}/api/analyses`, {
    method: 'POST',
    body: new FormData(),
  });
  check('unauthenticated request', '401', String(unauthorized.status));

  const response = await fetch(`${baseUrl}/api/analyses`, {
    method: 'POST',
    headers: { 'x-seller-id': 'SELLER-DEMO' },
    body: await loadForm(),
  });
  const body = (await response.json()) as {
    data?: {
      run_id: string;
      analysis_quality: string;
      counts: { source_rows: number; exceptions: number; results: number };
      kpis_pkr: Record<string, string>;
      verification: { persisted_counts_match: boolean };
      result: { results: unknown[]; exceptions: unknown[] };
    };
    error?: { code: string; message: string };
  };

  if (!body.data) {
    console.log(`FAIL  upload response: ${JSON.stringify(body.error ?? body)}`);
    process.exitCode = 1;
    return;
  }

  check('upload status', '201', String(response.status));
  check('analysis quality', 'PARTIAL_DATA', body.data.analysis_quality);
  check('source rows', '437', String(body.data.counts.source_rows));
  check('exceptions', '87', String(body.data.counts.exceptions));
  check(
    'outstanding receivable',
    'PKR 68,675.00',
    body.data.kpis_pkr.outstanding_receivable_pkr,
  );
  check(
    'persisted counts match',
    'true',
    String(body.data.verification.persisted_counts_match),
  );
  check('result row count', String(body.data.result.results.length), String(body.data.counts.results));
  check(
    'exception row count',
    String(body.data.result.exceptions.length),
    String(body.data.counts.exceptions),
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
  console.log(`RESULT: PASS — run ${body.data.run_id}`);
}

main().catch((error: unknown) => {
  console.error(error);
  console.error(
    'Is the API running? Start it with PLA_DEV_HEADER_AUTH=1 and npm.cmd run api:dev.',
  );
  process.exitCode = 1;
});
