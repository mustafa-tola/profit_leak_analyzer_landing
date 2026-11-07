# PLA Migration — Phase 2 Checkpoint

Date: 2026-11-07  
Status: **Checkpoint reached — ingestion boundary and persistence-ready API core delivered**  
Scope: strict CSV ingestion + Zod contracts + seller-scoped analysis service + persistence contract + portable HTTP handler.

## 1. Scope decision

The working website is still **Vite 5 + React 18 + TypeScript**, not Next.js. Rewriting
it during this phase would have put the verified UI and engine at unnecessary risk.
Phase 2 therefore keeps the UI untouched and adds a framework-agnostic backend core:

| Area | Phase 2 decision |
|---|---|
| Frontend | Keep the existing Vite app. Do not migrate to Next.js yet. |
| API shape | Standard Web `Request` / `Response` handler. It can be mounted in a Vite/Node adapter now or a Next.js route handler later. |
| Persistence | Repository interface plus an in-memory implementation. PostgreSQL + Prisma remains Phase 3. |
| Authentication | Injected `Authenticator` interface. The dev header adapter is opt-in and development-only. |
| CSV contract | Canonical columns plus the n8n synonym map, versioned as `pla-schema-1` / `pla-map-1`. |
| Validation | Zod 4 schemas at the API boundary; the financial engine remains the source of truth. |

This deliberately does **not** claim that PostgreSQL, production authentication, rate
limiting, or the Next.js migration are complete.

## 2. Delivered files

| File | Purpose |
|---|---|
| `src/ingestion/spec.ts` | Canonical columns, n8n-compatible aliases, schema/mapping versions, limits, header normalisation. |
| `src/ingestion/csv.ts` | Strict RFC 4180 parser, UTF-8 validation, BOM/CRLF support, header mapping, SHA-256 fingerprints, source evidence. |
| `src/ingestion/errors.ts` | Typed ingestion error codes. |
| `src/api/contracts.ts` | Zod upload-option schemas and multipart field contract. |
| `src/api/errors.ts` | Request-validation and API error types. |
| `src/api/service.ts` | Ingestion → engine → serialization → persistence orchestration. |
| `src/api/persistence.ts` | `pla-persistence-v1` record contract, seller-scoped repository, count verification. |
| `src/api/http.ts` | `POST /api/analyses` handler and health handler. |
| `src/api/auth.ts` | Authenticator interface and opt-in development header adapter. |
| `src/api/serialization.ts` | Bigint-safe JSON type representation. |
| `scripts/api-server.ts` | Development-only Node HTTP adapter. |
| `scripts/phase2-api-smoke.ts` | Repeatable API acceptance smoke check. |
| `src/ingestion/__tests__/ingestion.test.ts` | 10 ingestion tests. |
| `src/api/__tests__/analysis-api.test.ts` | 12 API/service/persistence tests. |

## 3. Ingestion contract

Required uploads:

- `orders_file`
- `shipments_file`
- `settlements_file`

Optional upload:

- `allocations_file`

Rules:

- Extension must be `.csv`.
- File must be valid UTF-8; a BOM is accepted.
- CRLF, quoted commas, escaped quotes, and newlines inside quoted fields are supported.
- Header names are normalised before alias matching.
- Two source headers that map to the same canonical field are rejected.
- Missing mandatory canonical fields are rejected.
- Rows with a different column count from the header are rejected.
- Unknown columns are preserved in the row's `_raw` evidence and returned as
  `UNMAPPED_COLUMN` warnings.
- Per-file limit: 10 MiB. Combined request limit: 40 MiB.
- Source rows are kept in the persisted run as evidence. They are not returned in
  the public API response.

Structural error codes:

`UNSUPPORTED_FILE_TYPE`, `EMPTY_FILE`, `FILE_TOO_LARGE`, `INVALID_ENCODING`,
`CSV_UNCLOSED_QUOTE`, `CSV_UNEXPECTED_QUOTE`, `CSV_NO_HEADER`, `EMPTY_HEADER`,
`DUPLICATE_HEADER`, `CSV_ROW_LENGTH_MISMATCH`, `MISSING_REQUIRED_COLUMN`,
`AMBIGUOUS_COLUMN_MAPPING`.

The engine's existing row-level validation codes remain unchanged.

## 4. API contract

### `POST /api/analyses`

Authenticated multipart request.

Identity comes from the **authenticator**, not from the form. A `seller_id` form
field is intentionally not trusted. The seller is normalised to uppercase before
the engine runs.

Text fields:

| Field | Required | Format |
|---|---|---|
| `as_of_date` | No | `YYYY-MM-DD` |
| `courier_rules` | No | JSON array, e.g. `[{"courier":"TCS","settlement_days":7}]` |
| `settlement_coverage` | No | JSON array of coverage declarations |

Success: `201 Created`

```json
{
  "data": {
    "persistence_version": "pla-persistence-v1",
    "run_id": "…",
    "seller_id": "SELLER-DEMO",
    "created_at": "…",
    "engine_version": "pla-engine-1.2.0",
    "schema_version": "pla-schema-1",
    "mapping_version": "pla-map-1",
    "input_fingerprint": "…",
    "analysis_quality": "PARTIAL_DATA",
    "quality_message": "…",
    "output_hash": "…",
    "input_counts": {},
    "valid_counts": {},
    "kpis_pkr": {},
    "counts": {},
    "verification": {
      "persisted_counts_match": true,
      "checks": []
    },
    "source_files": [],
    "result": {}
  }
}
```

Response headers include `x-analysis-quality` and `cache-control: no-store`.

Error responses use one envelope:

```json
{
  "error": {
    "code": "MISSING_REQUIRED_COLUMN",
    "message": "Missing required column: cod_amount_pkr",
    "details": []
  }
}
```

Status mapping:

| Status | Meaning |
|---|---|
| `400` | Invalid options/form data or missing required file |
| `401` | No authenticated seller |
| `405` | Wrong method |
| `413` | Per-file or combined size limit exceeded |
| `415` | Wrong media type or unsupported file type |
| `422` | Structurally invalid CSV |
| `500` | Unexpected or persistence-verification failure |

### Persistence contract

`pla-persistence-v1` stores:

- seller id and run id;
- creation timestamp, as-of date, engine/schema/mapping versions;
- deterministic SHA-256 input fingerprint;
- normalised courier rules and coverage;
- source-file metadata and mapping evidence;
- source rows for audit;
- bigint-safe serialized analysis result;
- row counts and a verification record comparing stored counts to the result arrays.

The in-memory repository is seller-scoped: a run saved for seller A cannot be read
or listed by seller B. The same interface is the Phase 3 Prisma repository boundary.

## 5. Verification evidence

Executed on 2026-11-07:

| Check | Result |
|---|---|
| `npm.cmd test` | **47/47 tests passed** across 5 files |
| `npx.cmd tsc --noEmit` | **Clean** |
| `npm.cmd run build` | **Success**; entry 332.68 kB, dashboard chunk 386.15 kB, no chunk-size warning |
| `npm.cmd run test:manual` | **53/53 Phase 1 checks passed** |
| Real Node adapter, `POST /api/analyses` with stress fixture | **201**, `PARTIAL_DATA`, 437 source rows, 87 exceptions, PKR 68,675.00 outstanding, persisted counts match |
| `npm.cmd run api:smoke` | **10/10 checks passed** |

The real adapter was exercised with the checked-in 437-row regression fixture, not
only with a mocked handler.

## 6. How to run the development adapter

Terminal 1:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
npm.cmd run api:dev
```

Terminal 2:

```powershell
npm.cmd run api:smoke
```

The dev adapter uses an in-memory repository. Restarting it intentionally discards
runs. `x-seller-id` is a development-only identity mechanism and is secure only
because it is explicitly enabled by the environment variable; it is not a
production authentication design.

## 7. Intentionally not delivered in Phase 2

- PostgreSQL schema, migrations, and Prisma client.
- Production authentication, seller/team membership, RBAC.
- Rate limiting and production request-body streaming limits.
- Database-level duplicate-file/source-batch idempotency.
- Next.js migration or mounting the handler in a Next.js route.
- Frontend upload flow and report screens wired to the API.
- CSV export/report generation, staleness detection, scheduling.
- Hardening for PII masking in downloaded/API evidence.

## 8. Phase 3 prerequisites and recommendation

Recommended next phase: **database + auth + first production API mount**.

Decisions still required before Phase 3 code:

1. **Frontend target:** keep Vite and deploy the API separately, or migrate to Next.js
   and mount `createAnalyzeHandler` in `app/api/analyses/route.ts`.
2. **Database:** PostgreSQL + Prisma is the recommended target. Confirm local Docker
   or a managed PostgreSQL connection string.
3. **Authentication provider:** choose one, and define how a seller id is derived
   from a verified session/token. Never accept seller identity from an upload field.
4. **Retention policy:** how long source rows and result evidence are retained, and
   what PII must be redacted.
5. **File-level idempotency:** whether a repeat upload creates a new audit run but
   reuses source batches (recommended), or is rejected.

The current `AnalysisRepository`, `Authenticator`, and Web handler boundary are
designed so those choices can be implemented without changing the financial engine.
