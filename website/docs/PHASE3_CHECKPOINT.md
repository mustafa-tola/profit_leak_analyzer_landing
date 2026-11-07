# PLA Migration — Phase 3 Checkpoint

Date: 2026-11-07  
Status: **Core backend delivered — PostgreSQL persistence, Clerk authentication boundary, read API, and production API bundle verified**  
Scope: PostgreSQL/Prisma repository, Clerk token authentication, seller-scoped read endpoints, CORS, production API build, and deployment documentation.

## 1. Approved Phase 3 decisions

| Area | Decision |
|---|---|
| Frontend / API | Keep the existing Vite app and run the API as a separate Node service. |
| Persistence | PostgreSQL with Prisma. |
| Authentication | Clerk. The seller identity comes from a verified token claim, never from the upload form. |
| Verified local database | PostgreSQL 16 Alpine via `compose.yaml`. |
| API build | Bundle `scripts/api-server.ts` with esbuild; run `dist-api/server.mjs` with Node in production. |
| Engine | Unchanged. The Phase 1 regression baseline remains the source of truth. |

## 2. Delivered files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | `AnalysisRun`, `SourceFile`, and `SourceRow` models with seller indexes and cascade deletes. |
| `prisma/migrations/20261107000000_init/migration.sql` | Initial PostgreSQL migration. |
| `prisma/migrations/migration_lock.toml` | Prisma migration provider lock. |
| `src/db/prisma.ts` | Lazy Prisma client singleton and disconnect helper. |
| `src/db/env.ts` | Loads `.env` through `process.loadEnvFile()` when available. |
| `src/api/prisma-repository.ts` | Seller-scoped Prisma implementation of `AnalysisRepository`, transaction writes, chunked source-row inserts, lightweight list summaries. |
| `src/api/clerk-auth.ts` | `Authorization: Bearer <Clerk token>` authenticator with injectable verifier for tests. |
| `src/api/cors.ts` | Explicit-origin CORS helper with `Authorization` and `x-analysis-quality` support. |
| `src/api/http.ts` | `POST /api/analyses`, `GET /api/analyses`, `GET /api/analyses/:runId`, and health handlers. Source rows are excluded from responses. |
| `src/api/persistence.ts` | Persistence contract plus `PersistedAnalysisSummary` and in-memory implementation. |
| `src/api/service.ts` | Shared `normalizeSellerId()` used by writes and reads. |
| `scripts/api-server.ts` | Node HTTP adapter with Prisma/Clerk selection, CORS, read routes, graceful shutdown, and bounded dev fallback. |
| `scripts/build-api.mjs` | esbuild production bundle for the API. |
| `scripts/phase3-api-smoke.ts` | 17-check HTTP acceptance smoke for upload, reads, seller isolation, and CORS. |
| `compose.yaml` | Local PostgreSQL 16 service with a health check and persistent volume. |
| `.env.example` | Database, Clerk, CORS, host, and repository configuration template. |
| `src/api/__tests__/clerk-auth.test.ts` | 5 Clerk claim and rejection tests. |
| `src/api/__tests__/cors.test.ts` | 2 CORS allow/deny tests. |
| `src/api/__tests__/prisma-repository.test.ts` | 4 repository mapping and seller-scope tests. |
| `src/api/__tests__/prisma-repository.integration.test.ts` | PostgreSQL round-trip test, gated by `PLA_TEST_DATABASE=1`. |
| `src/api/__tests__/analysis-api.test.ts` | Upload, read, list, seller-isolation, auth, and method tests. |
| `src/api/__tests__/fixtures/persistence-run.ts` | Shared repository test fixture. |

## 3. Database model

PostgreSQL tables:

- `analysis_runs` — immutable run metadata, versions, fingerprint, quality, output hash, rules, coverage, bigint-safe result JSON, counts, and verification JSON.
- `source_files` — one row per uploaded file with filename, size, SHA-256, row count, mapped headers, and warnings.
- `source_rows` — raw normalised source rows stored as JSONB with `row_index` for audit order.

Important properties:

- Money is stored as the engine's bigint-safe JSON strings, never as PostgreSQL numeric money columns.
- Writes happen in one transaction.
- Source rows are inserted in chunks of 1,000 to avoid parameter-limit failures on large uploads.
- Source files/rows are deleted by cascade when a run is deleted.
- Every read query filters by `seller_id`; the same run is invisible to another seller.
- The list endpoint uses `listSummaries()` and does not load source rows or the full result.
- Duplicate uploads are allowed. Each upload creates a new run; the fingerprint is indexed for a future explicit idempotency policy.

## 4. Authentication and seller identity

Clerk session tokens are accepted only as:

```http
Authorization: Bearer <clerk-session-token>
```

The seller comes from a verified claim, configured with `CLERK_SELLER_CLAIM`:

- `org_slug` — default and recommended; a Clerk organisation slug can match the human seller code in the CSVs.
- `org_id` — use the Clerk organisation id.
- `sub` — use the Clerk user id for personal accounts.

The selected value is normalised to uppercase before engine execution and storage queries. The uploaded CSV `seller_id` must match the selected claim case-insensitively.

The development `x-seller-id` adapter remains opt-in only:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
```

`scripts/api-server.ts` fails fast when neither the development adapter nor `CLERK_SECRET_KEY` is configured.

## 5. API surface

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/health` | Liveness check. |
| `POST` | `/api/analyses` | Authenticated multipart CSV upload; returns `201` and the public run. |
| `GET` | `/api/analyses` | Seller-scoped lightweight run summaries. |
| `GET` | `/api/analyses/:runId` | Seller-scoped public run detail; `404` for another seller or malformed id. |
| `OPTIONS` | `/api/analyses*` | CORS preflight for configured origins. |

Public responses deliberately omit `source_rows`. Source files, counts, verification, KPIs, and the serialized engine result remain available.

CORS defaults to `http://localhost:5173` and can be configured with `PLA_CORS_ORIGINS`.

## 6. Local setup

### 6.1 PostgreSQL

```powershell
docker compose up -d
```

### 6.2 Environment

```powershell
Copy-Item .env.example .env
```

Set a real `CLERK_SECRET_KEY` for Clerk mode, or use `PLA_DEV_HEADER_AUTH=1` for local development. `DATABASE_URL` should match `compose.yaml`.

### 6.3 Migration and client

```powershell
npm.cmd run db:deploy
npm.cmd run db:generate
```

### 6.4 Run the API

Development:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
npm.cmd run api:dev
```

Production bundle:

```powershell
npm.cmd run build:all
$env:PLA_DEV_HEADER_AUTH = "1"   # only for the local smoke check
npm.cmd run api:start
```

The API loads `.env` at startup. `HOST` defaults to `127.0.0.1`; set `HOST=0.0.0.0` inside a container or reverse-proxy deployment.

## 7. Verification evidence

Executed on 2026-11-07:

| Check | Result |
|---|---|
| `PLA_TEST_DATABASE=1 npm.cmd test` | **62/62 tests passed** across 9 files, including the PostgreSQL integration test. |
| `npm.cmd test` without a test database | **61 passed, 1 skipped**; only the explicit PostgreSQL integration test is skipped. |
| `npx.cmd tsc --noEmit` | **Clean.** |
| `npm.cmd run lint` | **0 errors, 5 pre-existing warnings** in engine files. |
| `npm.cmd run test:manual` | **53/53 Phase 1 checks passed.** |
| `npm.cmd run build:all` | **Frontend and API bundle succeeded.** |
| `npm.cmd run api:smoke` against the built API bundle | **10/10 checks passed.** |
| `npm.cmd run api:smoke:phase3` against the built API bundle + PostgreSQL | **17/17 checks passed.** |
| PostgreSQL restart persistence | Run `bb379ad2-96cf-4edf-b654-25e7a6b60d15` was readable after restarting the API: `PARTIAL_DATA`, outstanding **PKR 68,675.00**, list count **1**. |
| Database row verification | **1 run**, **4 source files**, **437 source rows** = 117 orders + 116 shipments + 105 settlements + 99 allocations. |

The smoke fixture is the checked-in 437-row `PLA_Realistic_Mixed_Stress` regression fixture. The financial result remains:

- 437 source rows;
- 87 exceptions;
- **PKR 68,675.00** outstanding receivable;
- `PARTIAL_DATA`;
- persisted counts match.

The Phase 1 output hash remains:

```text
777fc406edee5d9eb3c6b271e0ba56122cff29dcbfe5652c1648351b55efb117
```

## 8. Explicit limitations

These are accepted Phase 3 boundaries, not claims of production completeness:

- Real Clerk token verification is not end-to-end verified because no Clerk project keys were available. The authenticator is unit-tested with an injected verifier; the live `verifyToken()` path still needs a Clerk project test.
- The Vite UI is not wired to Clerk or the API yet. There is no upload screen or run-history screen.
- No rate limiting, streaming request-body limit, or abuse protection is implemented. Existing per-file and combined upload limits apply after multipart parsing.
- No PostgreSQL row-level security. Seller isolation is enforced in repository queries.
- No retention/deletion policy for source rows, which may contain order-level personal data.
- No file-level idempotency policy. Duplicate uploads create new runs.
- No pagination on `GET /api/analyses`.
- No API container image, TLS termination, reverse-proxy configuration, or managed PostgreSQL setup.
- No real deployment or load testing has been performed.
- CORS is explicit-origin, but production security headers still need review.
- `npm audit --omit=dev` reports 6 high advisories: `react-router-dom@6.30.2` has a patch fix at `6.30.6`, and Prisma 6 tooling depends on an affected `deepmerge-ts`; the Prisma fix requires the intentionally deferred Prisma 7 upgrade. Dependencies were left unchanged to avoid unapproved frontend/tooling churn. Both should be resolved before production.

## 9. Recommended next phase

1. Wire the Vite frontend to Clerk and the API.
2. Add upload and run-history screens without changing the engine.
3. Add rate limiting, streaming limits, and security headers.
4. Define retention and deletion for source rows.
5. Add explicit idempotency and pagination.
6. Add an API container image and deploy against managed PostgreSQL.
7. Run a real Clerk sign-in/token/upload test.
