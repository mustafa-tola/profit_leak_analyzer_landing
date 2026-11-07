# Profit Leak Analyzer — Manual Test Guide (Detailed)

**Scope:** Tasks 1–7 (Vite UI preserved; engine, ingestion/API, PostgreSQL/Prisma, Clerk auth, `/app` dashboard/reports MVP, security checks).  
**Date prepared:** 2026-11-07  
**Working directory:** `C:\Users\Focus Computer\Desktop\profit_leak_analyzer\website`  
**Platform notes:** Use `npm.cmd`/`npx.cmd` on Windows (PowerShell script policy may block `npm.ps1`). Run commands from `website/` unless stated otherwise.

> **Status legend used in this guide**
> - **Must pass now:** can be verified locally with the repo + Docker + (optionally) dev header auth.
> - **Requires real Clerk:** needs a Clerk application, publishable key, secret key, and an organization/user matching the CSV seller.
> - **Production-only:** deployment/infrastructure controls not fully implemented in this MVP.

---

## 1. Prerequisites

| Item | Requirement | How to verify |
|---|---|---|
| Node.js | 24+ recommended (project uses modern tooling) | `node -v` |
| npm | Works via `npm.cmd` | `npm.cmd -v` |
| Docker Desktop | Linux engine running | `docker version` (no daemon error) |
| Git | Optional for diff review | `git --version` |
| Browser | Chrome/Edge/Firefox current | Open DevTools (F12) |
| Clerk project | **Only for Clerk E2E** | Dashboard access; keys available |
| Ports free | `5173` (Vite), `8787` (API), `5432` (Postgres default) | `netstat -ano | findstr :5173 :8787 :5432` |

**Known baseline (from prior verification):** regression hash `777fc406edee5d9eb3c6b271e0ba56122cff29dcbfe5652c1648351b55efb117`, 437 rows, 87 exceptions, PKR 68,675.00 outstanding, `PARTIAL_DATA` (fixture-dependent). Automated suite: 61 passed, 1 skipped (DB integration skipped without `PLA_TEST_DATABASE=1`); with DB enabled, 62/62 expected per Phase 3 gate.

---

## 2. Test Data

Use the regression fixtures for deterministic checks:

| File | Path (from `website/`) | Purpose |
|---|---|---|
| Orders | `src/engine/__tests__/fixtures/regression/orders.csv` | Required upload |
| Shipments | `src/engine/__tests__/fixtures/regression/shipments.csv` | Required upload |
| Settlements | `src/engine/__tests__/fixtures/regression/settlements.csv` | Required upload |
| Allocations | `src/engine/__tests__/fixtures/regression/allocations.csv` | Optional upload |
| Expected scenarios | `src/engine/__tests__/fixtures/regression/expected_scenarios.csv` | Reference only (do not upload) |

**Seller identity rule:** the CSV `seller_id` (case-insensitively normalized) must match the verified seller identity used by the API.
- **Dev header mode:** set header `x-seller-id: SELLER-DEMO` (or the seller present in fixtures).
- **Clerk mode (`CLERK_SELLER_CLAIM=org_slug` recommended):** Clerk **active organization slug** must match the CSV seller (e.g., org slug `seller-demo` for `SELLER-DEMO`).

**Evidence to capture during tests:** screenshots of `/`, `/app`, upload success, dashboard, report details JSON (redact tokens/secrets), terminal output for smoke commands, and API JSON responses confirming **no raw source-row data** is exposed (i.e., no top-level `data.source_rows` array/object; `counts.source_rows` *count* and `verification` table labels are OK).

---

## 3. Clean Environment Setup

### 3.1 Install dependencies
```powershell
cd "C:\Users\Focus Computer\Desktop\profit_leak_analyzer\website"
npm.cmd install
npm.cmd run db:generate
```
**Expected:** install completes; Prisma client generated. A deprecation warning for `@clerk/clerk-react` may appear (known MVP choice).

### 3.2 Configure environment
```powershell
Copy-Item .env.example .env -ErrorAction SilentlyContinue
```
Edit `website/.env` as needed.

**Minimum for local full stack (dev header, no Clerk UI auth required for API smoke):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/profit_leak_analyzer?schema=public"
HOST=127.0.0.1
PORT=8787
PLA_CORS_ORIGINS="http://localhost:5173"
PLA_DEV_HEADER_AUTH="1"
VITE_API_URL="http://127.0.0.1:8787"
# VITE_CLERK_PUBLISHABLE_KEY can be blank for dev-header API tests; /app will show config message without it
```

**For Clerk-authenticated UI + API (Task 6 E2E):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/profit_leak_analyzer?schema=public"
CLERK_SECRET_KEY="sk_test_..."
CLERK_AUTHORIZED_PARTIES="http://localhost:5173"
CLERK_SELLER_CLAIM="org_slug"
HOST=127.0.0.1
PORT=8787
PLA_CORS_ORIGINS="http://localhost:5173"
# PLA_DEV_HEADER_AUTH must be unset or "0" for real Clerk API mode
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_API_URL="http://127.0.0.1:8787"
```
**Security check:** never commit `.env`. Confirm `.gitignore` ignores it.

### 3.3 Start PostgreSQL
```powershell
docker compose up -d
docker compose ps
```
**Expected:** `postgres` service is `healthy`.

### 3.4 Apply migrations
```powershell
npm.cmd run db:deploy
```
**Expected:** migration `20261107000000_init` applied (or already applied).

---

## 4. Automated Pre-flight (Must Pass Now)

Run in `website/`:
```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd test
npm.cmd run build:all
```

| Check | Expected | Result / notes |
|---|---|---|
| TypeScript | No output/errors | [ ] |
| Lint | Clean (0 errors) | [ ] |
| Vitest (default) | 61 passed, 1 skipped | [ ] |
| Frontend build | `dist/` created | [ ] |
| API bundle | `dist-api/server.mjs` created | [ ] |

**Optional stronger DB gate:**
```powershell
$env:PLA_TEST_DATABASE = "1"
npm.cmd test
```
**Expected:** 62/62 passed (if DB reachable and configured).

**Engine regression baseline (recommended):**
```powershell
npm.cmd run test:manual
```
**Expected:** 53/53 Phase 1 checks passed, unchanged baseline behavior.

---

## 5. Backend/API Manual Tests

Choose **one** mode per test run. Do not enable `PLA_DEV_HEADER_AUTH` in Clerk production mode.

### 5A. Dev-header mode (fast local gate)
**Terminal 1 — start API:**
```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
$env:PLA_REPOSITORY = "prisma"
npm.cmd run api:start
```
**Expected log hints:** persistence via PostgreSQL/Prisma; authentication uses development `x-seller-id` adapter.

**Terminal 2 — smoke tests:**
```powershell
npm.cmd run api:smoke:phase3
npm.cmd run api:smoke
```
**Expected:** Phase 3 smoke **17/17**; Phase 2 smoke **10/10** (see existing `PHASE3_MANUAL_TESTS.md` for exact assertions).

**Manual curl checks (replace `<RUN_ID>` from smoke output if needed):**
```powershell
curl.exe -i http://127.0.0.1:8787/health
```
**Expected:** `200` with health JSON.

```powershell
curl.exe -s -H "x-seller-id: SELLER-DEMO" http://127.0.0.1:8787/api/analyses
```
**Expected:** `200`, `{"data":[...]}` containing the seller's runs only.

```powershell
curl.exe -s -H "x-seller-id: SELLER-OTHER" http://127.0.0.1:8787/api/analyses/<RUN_ID>
```
**Expected:** `404` (seller isolation; do not leak existence).

**`source_rows` privacy check (raw data must NOT be exposed):**
> `counts.source_rows` (a number) and verification table labels may legitimately contain `source_rows`. The check must confirm there is **no top-level `data.source_rows` property** containing raw row data.

**CMD (recommended):**
```cmd
curl.exe -s -H "x-seller-id: SELLER-DEMO" "http://127.0.0.1:8787/api/analyses/<RUN_ID>" > run.json
powershell -NoProfile -Command "$j=Get-Content -Raw run.json | ConvertFrom-Json; $has=($j.data.PSObject.Properties.Name -contains 'source_rows'); if ($has) { 'FAIL: top-level data.source_rows present' } else { 'PASS: no raw source_rows data property (counts.source_rows=' + $j.data.counts.source_rows + ')' }"
```

**PowerShell:**
```powershell
$j = curl.exe -s -H "x-seller-id: SELLER-DEMO" "http://127.0.0.1:8787/api/analyses/<RUN_ID>" | ConvertFrom-Json
($j.data.PSObject.Properties.Name -contains 'source_rows')  # Expected: False
$j.data.counts.source_rows                                   # Expected: 437 (count is OK)
```
**Expected:** `False` / **PASS**. `counts.source_rows` = 437 is acceptable; a top-level `data.source_rows` array/object with row contents is **not**.

### 5B. Clerk-authenticated API mode (Requires real Clerk)
**Terminal 1:**
```powershell
# Ensure PLA_DEV_HEADER_AUTH is NOT set
Remove-Item Env:PLA_DEV_HEADER_AUTH -ErrorAction SilentlyContinue
$env:PLA_REPOSITORY = "prisma"
npm.cmd run api:start
```
**Expected:** server fails fast if `CLERK_SECRET_KEY` missing in Clerk mode (good). With valid config, starts in Clerk auth mode.

**Get a session token** from the signed-in Clerk frontend (browser DevTools after sign-in on `/app`, or a temporary test page used previously — delete any temporary token helper after use).

```powershell
$env:CLERK_TOKEN = "<paste-session-token>"
curl.exe -i -X POST "http://127.0.0.1:8787/api/analyses" ^
  -H "Authorization: Bearer %CLERK_TOKEN%" ^
  -F "orders_file=@src/engine/__tests__/fixtures/regression/orders.csv" ^
  -F "shipments_file=@src/engine/__tests__/fixtures/regression/shipments.csv" ^
  -F "settlements_file=@src/engine/__tests__/fixtures/regression/settlements.csv" ^
  -F "allocations_file=@src/engine/__tests__/fixtures/regression/allocations.csv"
```
**Expected:** `201`, JSON `data` includes `run_id`, `seller_id` matching verified Clerk claim (normalized), `analysis_quality`, `kpis_pkr`, `counts`, `verification`, `output_hash`; **no top-level `data.source_rows` raw data property** (`counts.source_rows` numeric count is OK).

**Negative auth checks:**
```powershell
curl.exe -i http://127.0.0.1:8787/api/analyses
```
**Expected:** `401`/unauthorized (no token).

Use a token from a different Clerk org/seller claim (if available): `GET /api/analyses/<RUN_ID>` **Expected:** `404`.

---

## 6. Frontend Manual Tests (Task 6 MVP)

### 6.1 Marketing site preservation (no regression)
**Terminal 2 (with API running or not):**
```powershell
npm.cmd run dev
```
Open `http://localhost:5173/`.

| Step | Action | Expected |
|---|---|---|
| 1 | Load home page | Existing marketing UI renders; no console errors blocking render |
| 2 | Navigate Features/How It Works/Demo/Pricing/FAQs | Section navigation works as before |
| 3 | Click **Analyze** in navbar | Routes to `/app` |
| 4 | Visit `/privacy`, `/terms` | Legal pages load |
| 5 | Toggle theme (if present) | UI remains usable |
| 6 | Demo dashboard on home | Shows **sample data** (not live) unless intentionally changed |

### 6.2 `/app` without Clerk frontend key
Temporarily unset `VITE_CLERK_PUBLISHABLE_KEY` in `.env` and restart Vite.
Open `/app`.
**Expected:** clear message asking to set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`; no crash. Restore key after.

### 6.3 `/app` Clerk E2E (Requires real Clerk)
**Preconditions:** Vite has `VITE_CLERK_PUBLISHABLE_KEY` + `VITE_API_URL`; API running in **Clerk mode** with matching `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES=http://localhost:5173`, `CLERK_SELLER_CLAIM=org_slug`; CORS allows `http://localhost:5173`; Clerk org slug matches fixture seller (e.g., `seller-demo` / `SELLER-DEMO` case-insensitive).

| Step | Action | Expected |
|---|---|---|
| 1 | Open `http://localhost:5173/app` signed out | Clerk sign-in UI appears |
| 2 | Sign in with a user in the correct organization | Redirects/stays on `/app`; shows signed-in email/id and org |
| 3 | Observe initial state | “No runs yet” or existing seller runs load; no auth error if token valid |
| 4 | Upload without required files | UI error: orders, shipments, settlements required |
| 5 | Select `orders.csv`, `shipments.csv`, `settlements.csv`, `allocations.csv` from fixtures; set as-of date if desired; click **Run analysis** | Button shows analyzing state; on success dashboard/report appears; run appears in “Previous runs” |
| 6 | Validate live dashboard | KPIs/quality/counts render; monthly trend labeled as sample/not available for single live run (MVP behavior); no raw `source_rows` data displayed |
| 7 | Expand **Report details** | JSON shows `run_id`, `seller_id`, `counts`, `kpis_pkr`, `verification`, `output_hash`, `source_files`; **no raw `source_rows` data** (`counts.source_rows` count is OK) |
| 8 | Click **Refresh runs** | List refreshes |
| 9 | Click a previous run | Detail loads; dashboard updates |
| 10 | Sign out via user button | Returns to signed-out state / after sign-out URL |
| 11 | CORS/auth failure simulation | Stop API or set wrong `VITE_API_URL`; retry action | User-visible error shown (not silent failure) |

**Cross-seller UI isolation (Requires real Clerk, second org/user):** sign in as different seller org; **Expected:** cannot see first seller’s runs; direct detail fetch for foreign run returns not found/error as surfaced by API.

---

## 7. Persistence & Restart (Must Pass Now)

1. Complete a successful upload (dev header or Clerk).
2. Note `run_id`.
3. Stop API (Ctrl+C in Terminal 1).
4. Start API again with the **same** DB/auth env.
5. Fetch the run again:
   ```powershell
   curl.exe -s -H "x-seller-id: SELLER-DEMO" "http://127.0.0.1:8787/api/analyses/<RUN_ID>"
   ```
   (Use `Authorization: Bearer ...` in Clerk mode.)
6. **Expected:** same run data persists; counts/KPIs/hash consistent.

**DB spot check (optional):**
```powershell
docker compose exec -T postgres psql -U postgres -d profit_leak_analyzer -c "SELECT count(*) FROM analysis_runs;" -c "SELECT source, count(*) FROM source_rows GROUP BY source ORDER BY source;"
```
**Expected:** counts increase by immutable run(s); fixture upload typically yields 437 source rows total (117 orders, 116 shipments, 105 settlements, 99 allocations) per run, depending on prior runs.

---

## 8. Security / Task 7 Checks

| ID | Check | How | Expected | Status |
|---|---|---|---|---|
| S1 | No raw `source_rows` data in API | Inspect upload/list/detail JSON; confirm no top-level `data.source_rows` property | `data.source_rows` absent; `counts.source_rows` count OK | [ ] |
| S2 | Seller isolation | Other seller token/header reads foreign run | `404` / empty list | [ ] |
| S3 | Auth required (Clerk mode) | Call protected endpoints without token | `401`/auth error | [ ] |
| S4 | Dev header disabled by default risk | Confirm `PLA_DEV_HEADER_AUTH` not used in prod config | Never enabled in production | [ ] |
| S5 | CORS explicit | Browser call from allowed origin works; disallowed origin blocked by browser/preflight behavior | Only configured origins allowed | [ ] |
| S6 | Secrets not committed | `git status`; inspect `.env` not tracked | `.env` ignored | [ ] |
| S7 | Upload validation | Missing required files / invalid request | Clear `4xx` error; no crash | [ ] |
| S8 | Dependency advisories | `npm.cmd audit --omit=dev` | Known: `react-router-dom` patch available; Prisma 6 tooling advisory tied to deferred Prisma 7 — review before prod | [ ] |
| S9 | Rate limiting / body limits / headers / TLS | Code/infra review | **Production-only; not fully implemented** | [ ] |
| S10 | `source_rows` retention/PII policy | Product/security decision | **Pending** | [ ] |

---

## 9. Known MVP Limitations (Do Not Treat as Failures)

- Monthly expense trend in live view uses sample trend with explicit labeling (single-run data does not contain historical monthly series).
- Some live dashboard aggregations (courier/findings/settlement presentation) are simplified mappings from engine/API data.
- No live report export (PDF/CSV), pagination/filtering, or full org-switcher UX polish.
- Next.js migration deferred; Vite app is intentional.
- `@clerk/clerk-react` installed (deprecated in favor of `@clerk/react`) — functional for MVP.

---

## 10. Sign-off Checklist

**Environment**
- [ ] Docker/PostgreSQL healthy
- [ ] Migration applied
- [ ] `.env` configured correctly for chosen mode (dev header **or** Clerk)

**Automated**
- [ ] `tsc --noEmit` clean
- [ ] `lint` clean
- [ ] `vitest` expected pass count
- [ ] `build:all` succeeds
- [ ] (Optional) `test:manual` 53/53
- [ ] (Optional) Phase 3 smoke 17/17, Phase 2 smoke 10/10

**Functional**
- [ ] `/` marketing UI preserved
- [ ] `/app` loads; Clerk flow works (or config message shown when key absent)
- [ ] CSV upload creates run and renders live dashboard/report
- [ ] Run history and run detail work
- [ ] Restart persistence verified

**Security**
- [ ] No raw `source_rows` data exposed (top-level `data.source_rows` absent)
- [ ] Seller isolation verified
- [ ] Auth enforced in Clerk mode
- [ ] No secrets committed

**Requires real credentials / production follow-up**
- [ ] Full Clerk E2E with real org/keys completed
- [ ] Cross-seller isolation tested with two real seller contexts
- [ ] Rate limiting, security headers, TLS/proxy, retention, idempotency/pagination, managed DB/monitoring addressed

**Decision:** `GO` / `NO-GO` for local MVP acceptance: ____________  
**Tester:** ____________  **Date:** ____________  **Build/commit:** ____________  **Notes/evidence links:** ____________

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/app` says set `VITE_CLERK_PUBLISHABLE_KEY` | Missing Vite env | Set in `.env`, restart `npm.cmd run dev` |
| `401`/auth errors on upload | Missing/expired token; wrong Clerk mode; org claim mismatch | Re-sign in; verify `CLERK_*` vars; confirm org slug matches CSV `seller_id`; ensure `PLA_DEV_HEADER_AUTH` off in Clerk mode |
| CORS error in browser | `PLA_CORS_ORIGINS` / `CLERK_AUTHORIZED_PARTIES` mismatch | Include `http://localhost:5173` exactly |
| `404` on run detail for same user | Wrong run ID or seller mismatch | Check `seller_id` normalization and active org |
| DB connection errors | Docker not running or wrong `DATABASE_URL` | `docker compose ps`; verify port 5432 |
| `npm.ps1` blocked | Windows execution policy | Use `npm.cmd` / `npx.cmd` |
| Upload returns validation error | CSV headers/rows/seller mismatch | Verify fixture files and seller ID; inspect API error `details` |