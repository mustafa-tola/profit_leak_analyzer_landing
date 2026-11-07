# PLA Migration — Phase 1 Checkpoint

Date: 2026-11-06
Status: **Checkpoint reached — core financial engine ported and verified**
Scope delivered: financial test migration + engine foundations (validation, normalization, matching, reconciliation, exceptions, KPIs, classification).

## 1. Repository audit

| Expected | Actual finding |
|---|---|
| Next.js + TypeScript website | **Vite 5 + React 18 + TypeScript** (`src/`, `index.html`, `vite.config.ts`) |
| Next.js API routes | None exist |
| PostgreSQL + Prisma | Not installed or configured |
| Authentication / rate limiting | No backend or auth exists |
| Vitest | Not installed; added in this phase |
| Zod | Not installed yet; planned for the ingestion/API phase |
| Four n8n workflows | Financial Engine, Upload & Analyze, Dashboard & Reports, Staleness Detection are in `reference/` |
| Engine Test Suite export | **Not present in the repository or reference folder** |

The financial engine was therefore made framework-agnostic under `src/engine/`. It can run in the current Vite app, in a future Next.js route handler, in a background worker, or in tests without changes.

## 2. Reference logic used

- `reference/PLA - Financial Engine(1).json`
  - `Validate & Normalize Rows` (engine v1.2.0)
  - `Match, Reconcile & Report` (engine v1.2.0)
- `n8n/sample-data/PLA_Realistic_Mixed_Stress/` regression pack
  - 437 source rows
  - `expected_scenarios.csv`, `control_counts.json`
- `reference/PLA - Upload & Analyze(3).json` → `Verify Persisted Counts`
  - `CLEAN` / `PARTIAL_DATA` / `NO_VALID_SETTLEMENTS` classification rule

The original Engine Test Suite JSON could not be located. The 25-test Vitest suite in this repo is a **reconstruction** from the engine code and checked-in regression oracle. It is not the original export.

## 3. Delivered code

| File | Responsibility |
|---|---|
| `src/engine/money.ts` | Strict decimal parsing, integer **bigint paisa**, PKR formatting, exact aggregation |
| `src/engine/dates.ts` | ISO calendar validation and settlement-date arithmetic |
| `src/engine/types.ts` | Canonical engine contracts and source/exception types |
| `src/engine/normalize.ts` | Stage 1 validation, seller isolation, sign rules, duplicate handling, status normalization, input rules/coverage |
| `src/engine/reconcile.ts` | Stage 2 exact matching, allocations, settlement reconciliation, due-date logic, exceptions, KPIs, deterministic hash |
| `src/engine/analyze.ts` | Orchestration, analysis classification, bigint-safe serialization |
| `src/engine/index.ts` | Public engine boundary |
| `src/engine/__tests__/` | 25 Vitest tests + regression fixtures |

No UI component was modified. No API or database code was added yet.

## 4. Regression evidence

Executed with `npm test` on Windows / Node 24.19.0 / Vitest 2.1.9.

```
Test Files  3 passed (3)
Tests       25 passed (25)
```

| Metric | Baseline | Actual |
|---|---:|---:|
| Source rows | 437 | **437** (117 orders, 116 shipments, 105 settlements, 99 allocations) |
| Expected receivables | PKR 556,960 | **PKR 556,960.00** |
| Verified payments | PKR 488,285 | **PKR 488,285.00** |
| Outstanding | PKR 68,675 | **PKR 68,675.00** |
| Exceptions | 87 | **87** |
| Validation errors | 5 | **5** |
| Analysis quality | PARTIAL_DATA (invalid source rows present) | **PARTIAL_DATA** |

Exception breakdown (87 total):

| Type | Count |
|---|---:|
| DUE_DATE_UNKNOWN | 29 |
| PARTIAL_SETTLEMENT | 17 |
| UNSETTLED_SHIPMENT | 12 |
| UNALLOCATED_SETTLEMENT | 6 |
| FEE_DISCREPANCY | 5 |
| INVALID_ROW | 5 |
| RTO_COST | 5 |
| UNMATCHED_SHIPMENT | 4 |
| ADJUSTMENT_PRESENT | 2 |
| COD_MISMATCH | 2 |

Additional verified invariants:

- Settlement completeness: SETTLED 82, PARTIALLY_SETTLED 17, UNSETTLED 12, NOT_APPLICABLE 5.
- RTO operational cost is PKR 600 and is kept outside receivables.
- Verified fee discrepancy is PKR 250 and is not added to outstanding.
- Adjustments reconcile: total PKR 15 = allocated PKR 0 + unallocated PKR 15.
- Repeated runs produce the same output hash.
- Cross-seller rows and conflicting duplicates are excluded, not resolved silently.
- Blank money stays `null`; it is never coerced to zero.
- `npx tsc --noEmit` passes.

Note: fixture scenario labels are not engine completeness states. The five fee-overcharge rows are `PARTIALLY_SETTLED` because PKR 50 per row remains outstanding, and the excluded duplicate order adds one extra `UNMATCHED_SHIPMENT`. This is expected and documented by the fixture README.

## 5. Decisions needed before Phase 2

1. **Frontend target:** keep the existing Vite app and add a separate API service, or migrate the site to Next.js? The requested Next.js App Router does not exist today.
2. **Database:** confirm PostgreSQL + Prisma is still required, and whether the existing SQLite/`PHASE1_APPROVED_PLAN.md` Python plan is superseded.
3. **Authentication:** provider and seller-identity source for API requests.
4. **File mapping:** confirm the canonical CSV layouts in the stress pack are the initial production contract.
5. **Zod:** confirm it should replace or wrap the current hand-written row validation while preserving identical error codes and totals.

## 6. Next phase (proposed)

**Phase 2 — Ingestion boundary and persistence-ready contracts**

- Add a strict CSV parser + header mapping with the same error codes as Stage 1.
- Add Zod schemas for upload/analyze requests and normalized engine input.
- Define versioned persistence contracts (run, source rows, results, exceptions, validation errors) with bigint-safe serialization.
- Add Prisma schema and migrations once the database decision is approved.
- Add authentication, seller scoping, file limits/type checks, and rate limiting at the API boundary.
- Add API integration tests proving persisted counts equal engine output counts.

Do not start the Next.js migration or database work until the decisions in section 5 are confirmed.
