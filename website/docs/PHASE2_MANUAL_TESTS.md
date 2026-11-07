# PLA Phase 2 — Minimal Manual Acceptance Gate

**Purpose:** confirm the ingestion/API boundary is safe to build Phase 3 on.  
**Scope:** strict CSV ingestion, Zod request contract, seller-scoped persistence
contract, and the Web handler. This is not a production deployment test.

Run every command from the `website` folder on this Windows machine. Use
`npm.cmd` because `npm.ps1` is blocked.

## 0. Stop conditions

Do not start Phase 3 if any of these happen:

- any unit/integration test fails;
- TypeScript reports an error;
- the production build warns about a chunk over the configured limit;
- the stress upload does not return the expected baseline;
- `persisted_counts_match` is false;
- the same run id is visible to a different seller;
- source rows are exposed in the public API response.

## 1. Automated gates

```powershell
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd run test:manual
```

Expected:

- `47/47` tests pass across `5` test files.
- Type-check prints nothing.
- Vite build succeeds without a chunk-size warning.
- The Phase 1 manual gate reports `53/53` checks passed.

## 2. Start the development API

Terminal 1:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
npm.cmd run api:dev
```

Expected start-up line:

```text
PLA development API listening on http://127.0.0.1:8787
```

## 3. Health check

Terminal 2:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8787/health
```

Expected: `status : ok`.

## 4. Repeatable upload smoke check

```powershell
npm.cmd run api:smoke
```

Expected summary:

```text
Summary: 10/10 checks passed
RESULT: PASS
```

It checks:

- health status;
- unauthenticated request returns `401`;
- stress upload returns `201`;
- quality is `PARTIAL_DATA`;
- source row count is `437`;
- exception count is `87`;
- outstanding receivable is `PKR 68,675.00`;
- persisted counts match;
- result and exception row counts match the persisted counts.

The smoke check uses the checked-in 437-row regression fixture.

## 5. Manual negative checks

With the API still running:

### Missing authentication

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" `
  -F "orders_file=@src/engine/__tests__/fixtures/regression/orders.csv;type=text/csv" `
  http://127.0.0.1:8787/api/analyses
```

Expected: `401`.

### Missing required file

Use the smoke-check form fields but omit `settlements_file`. Expected: `400` with
error code `VALIDATION_ERROR` and a detail pointing at `settlements_file`.

### Missing required column

Upload an orders CSV without `cod_amount_pkr`. Expected: `422` with error code
`MISSING_REQUIRED_COLUMN` and a detail naming `cod_amount_pkr`.

### Wrong method

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" http://127.0.0.1:8787/api/analyses
```

Expected: `405` and `Allow: POST`.

## 6. Seller isolation spot check

The integration suite proves this programmatically:

- the run can be read back as `SELLER-DEMO`;
- the same run is `null` for `OTHER-SELLER`;
- `list('OTHER-SELLER')` is empty.

There is intentionally no public endpoint for reading runs yet; that belongs to
Phase 3 with real authentication and PostgreSQL.

## 7. Expected Phase 2 limitations

These are accepted, not failures:

- repository data disappears when the development API restarts;
- `x-seller-id` is a development-only identity adapter;
- no PostgreSQL/Prisma migration exists yet;
- no upload UI is wired to the API yet;
- no rate limiter or production streaming body limit exists yet.

## 8. Sign-off

- [x] Automated gates pass.
- [x] Smoke check reports 10/10.
- [x] Baseline values match: 437 rows, 87 exceptions, PKR 68,675.00 outstanding.
- [x] Persisted counts match.
- [x] Negative checks return the expected status codes.
- [x] No source rows appear in the API response.

Decision: **GO to Phase 3** — minimal gate signed off by user on 2026-11-07.

If stopping, record the failing command and do not alter the Phase 1 baseline.
