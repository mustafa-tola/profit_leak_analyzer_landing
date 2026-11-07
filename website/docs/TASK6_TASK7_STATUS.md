# Tasks 6 & 7 — Status (2026-11-07)

## Scope

This pass followed the requested sequence, skipping completed work:

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Inspect current project and preserve existing UI | Done (earlier) | Project is Vite + React 18, not Next.js. Existing UI preserved; Next.js conversion deferred (not urgent). |
| 2 | Migrate 25 financial regression tests to Vitest | Done (earlier) | 13 regression tests + related engine tests pass under Vitest; Phase 1 manual 53/53 preserved. |
| 3 | Port financial reconciliation engine to TypeScript | Done (earlier) | Engine under `src/engine/`; bigint/paisa precision preserved; regression hash unchanged. |
| 4 | Implement CSV upload and analysis APIs | Done (earlier) | `POST /api/analyses`, analysis service, strict ingestion, seller-scoped persistence. |
| 5 | Integrate PostgreSQL and Prisma | Done (earlier) | Prisma 6.19.3, PostgreSQL schema/migration, repository, read APIs. |
| 6 | Connect existing dashboard and reports | **MVP delivered** | See below. |
| 7 | End-to-end security and deployment validation | **Partially validated** | See below. |

## Task 6 — Dashboard and reports connected (MVP)

Delivered:

- `@clerk/clerk-react` added for frontend auth (note: package warns it is superseded by `@clerk/react`; kept as-is to avoid churn during this pass).
- Conditional `ClerkProvider` in `src/index.tsx` when `VITE_CLERK_PUBLISHABLE_KEY` is set; marketing site still works without Clerk config.
- New authenticated route: `GET /app` (`src/pages/AppPage.tsx`).
  - Clerk sign-in UI.
  - CSV upload form (`orders_file`, `shipments_file`, `settlements_file`, optional `allocations_file`, optional `as_of_date`).
  - Run list from `GET /api/analyses`.
  - Run detail from `GET /api/analyses/:runId`.
  - Live dashboard/report view using the existing dashboard component structure.
- Frontend API client: `src/lib/api.ts`.
- Live adapter: `src/lib/analysis-adapter.ts` maps public API run data to dashboard shapes (KPIs, settlement summary, findings/exceptions, courier aggregation from result rows). Monthly expense trend is not available from a single run and is explicitly labeled as sample trend when viewing live data.
- Dashboard components refactored to accept optional live data with sample defaults, preserving the home-page demo.
- Navbar includes an `Analyze` link to `/app`.
- `.env.example` includes `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`.

Known MVP limits:

- Not full visual parity with every sample metric (some live aggregations are derived/simplified).
- No PDF/CSV export from the live report.
- No full production Clerk UI/organization-switcher UX polish.
- No pagination/filtering UI for run history.
- Adapter assumes current engine/API field names; field drift should be covered by typed contracts in a follow-up.

## Task 7 — Security and deployment validation

Validated in this pass:

- `npm.cmd test` (default): **61 passed, 1 skipped**.
- `npx.cmd tsc --noEmit`: clean.
- `npm.cmd run lint`: clean (prior 5 engine warnings fixed earlier).
- `npm.cmd run build:all`: frontend + API bundle succeed.
- Static checks:
  - API responses do not include `source_rows` (enforced by public serialization; covered by tests/smokes).
  - CORS uses explicit origins (`PLA_CORS_ORIGINS` / `CLERK_AUTHORIZED_PARTIES` context), not wildcard-with-auth.
  - Seller scoping is enforced in repository queries and auth claim mapping (unit/integration/API tests).
  - Clerk dev header adapter is opt-in only (`PLA_DEV_HEADER_AUTH=1`); server fails fast without Clerk key in Clerk mode.
  - `.env` is gitignored; `.env.example` uses placeholders.
- Real Clerk E2E upload/read was reported working by the user (manual step 11); automated E2E with real keys is not repeatable in CI without credentials.

Still required before production:

- Run full E2E with **real Clerk keys** in a clean environment: sign-in, active org `seller-demo`/matching CSV seller, upload, list, detail, cross-seller 404, token expiry behavior.
- Add **rate limiting**, **streaming/request body hardening**, **security headers**, and **TLS/reverse-proxy** configuration.
- Define **retention/deletion** for `source_rows` (audit/PII).
- Define **file-level idempotency** and **pagination**.
- Provision **managed PostgreSQL**, backups, migrations deployment process, and monitoring.
- Review dependency advisories: `react-router-dom` patch available (`6.30.6`); Prisma 6 tooling advisories require the deferred Prisma 7 upgrade decision.
- Production CSV layout approval with real exports.
- Commit/review the accumulated uncommitted work and run CI in a clean checkout.

## How to run the MVP locally

```powershell
cd website
Copy-Item .env.example .env
# set VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL, DATABASE_URL, CLERK_SECRET_KEY, CLERK_AUTHORIZED_PARTIES, CLERK_SELLER_CLAIM
docker compose up -d
npm.cmd run db:deploy
npm.cmd run api:start   # Terminal 1, without PLA_DEV_HEADER_AUTH for Clerk mode
npm.cmd run dev         # Terminal 2
# open http://localhost:5173/app
```
