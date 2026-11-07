# PLA Phase 3 — Manual Acceptance Gate

Use this before treating the Phase 3 backend as accepted. The automated suite and the
PostgreSQL smoke have already been executed; this gate is the reproducible sign-off.

Do not mark the Clerk end-to-end item as passed without a real Clerk project and a
real session token.

## 1. Prerequisites

- Node.js 24+
- Docker Desktop with the Linux engine running
- `npm.cmd` on Windows because `npm.ps1` is blocked on this machine

## 2. Start PostgreSQL

From `website/`:

```powershell
docker compose up -d
docker compose ps
```

Expected: the `postgres` service is `healthy`.

## 3. Configure the environment

```powershell
Copy-Item .env.example .env
```

For the local development gate, keep the compose `DATABASE_URL` and leave Clerk
blank. Use the opt-in development identity adapter:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
```

For a real Clerk check, set:

```powershell
$env:CLERK_SECRET_KEY = "sk_test_..."
$env:CLERK_AUTHORIZED_PARTIES = "http://localhost:5173"
$env:CLERK_SELLER_CLAIM = "org_slug"
```

## 4. Apply the migration and generate the client

```powershell
npm.cmd run db:deploy
npm.cmd run db:generate
```

Expected: migration `20261107000000_init` is applied and the Prisma client is generated.

## 5. Automated gates

```powershell
$env:PLA_TEST_DATABASE = "1"
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:manual
```

Expected:

| Command | Expected |
|---|---|
| `npm.cmd test` | **62/62 tests passed** across 9 files |
| `npx.cmd tsc --noEmit` | Clean |
| `npm.cmd run lint` | 0 errors, 5 pre-existing engine warnings |
| `npm.cmd run test:manual` | **53/53 Phase 1 checks passed** |

Without `PLA_TEST_DATABASE=1`, the PostgreSQL integration test is skipped:
**61 passed, 1 skipped**.

## 6. Build both deliverables

```powershell
npm.cmd run build:all
```

Expected:

- Vite frontend build succeeds in `dist/`;
- API bundle succeeds at `dist-api/server.mjs`.

## 7. Start the built API against PostgreSQL

Terminal 1:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
$env:PLA_REPOSITORY = "prisma"
npm.cmd run api:start
```

Expected log lines include `Persistence: PostgreSQL via Prisma` and
`Authentication: development x-seller-id adapter`.

## 8. Phase 3 HTTP smoke

Terminal 2:

```powershell
npm.cmd run api:smoke:phase3
```

Expected: **17/17 checks passed**, including:

- upload returns `201`;
- `PARTIAL_DATA`;
- 437 source rows;
- 87 exceptions;
- **PKR 68,675.00** outstanding;
- persisted counts match;
- detail endpoint returns the run and hides `source_rows`;
- list endpoint contains the run;
- another seller gets `404` for detail and an empty list;
- CORS preflight returns `204` with the configured origin.

The Phase 2 regression smoke also remains expected to pass:

```powershell
npm.cmd run api:smoke
```

Expected: **10/10 checks passed**.

## 9. Restart persistence check

Stop the API in Terminal 1, start it again with the same environment, then read the
run the smoke printed:

```powershell
curl.exe -s -H "x-seller-id: SELLER-DEMO" `
  "http://127.0.0.1:8787/api/analyses/<RUN_ID>"
```

Expected: `200`, same `run_id`, `analysis_quality: "PARTIAL_DATA"`, and
`outstanding_receivable_pkr: "PKR 68,675.00"`.

Database spot check:

```powershell
docker compose exec -T postgres psql -U postgres -d profit_leak_analyzer `
  -c "SELECT count(*) FROM analysis_runs;" `
  -c "SELECT source, count(*) FROM source_rows GROUP BY source ORDER BY source;"
```

Expected after a single Phase 3 smoke run:

- 1 analysis run;
- 4 source files;
- 437 source rows: 117 orders, 116 shipments, 105 settlements, 99 allocations.

Each upload creates a new immutable run. If you also ran the Phase 2 smoke,
expect 2 runs, 8 source files, and 874 source rows (234 orders, 232 shipments,
210 settlements, 198 allocations). To keep the one-run check, run the database
spot check before the Phase 2 smoke.

## 10. Real Clerk end-to-end check — pending credentials

This item cannot be marked passed until a real Clerk project is configured.

1. Create a Clerk application and organisation.
2. Set the organisation slug to the seller code used in the CSV, for example
   `seller-demo`.
3. Set `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, and
   `CLERK_SELLER_CLAIM=org_slug`.
4. Start the API without `PLA_DEV_HEADER_AUTH`.
5. Obtain a session token from the Clerk frontend SDK.
6. Call `POST /api/analyses` with `Authorization: Bearer <token>`.
7. Confirm the stored `seller_id` is the verified organisation slug and that a token
   for another organisation cannot read the run.

Expected: `201` for the correct organisation; `401`/`404` isolation for another.

## 11. Sign-off

- [ ] PostgreSQL container is healthy.
- [ ] Migration applied.
- [ ] Automated gates pass.
- [ ] Frontend and API builds succeed.
- [ ] Phase 3 smoke reports 17/17.
- [ ] Phase 2 smoke reports 10/10.
- [ ] Restart persistence check passes.
- [ ] Real Clerk end-to-end check completed (requires real keys).
- [ ] No source rows appear in any API response.

Decision: **GO / STOP**
