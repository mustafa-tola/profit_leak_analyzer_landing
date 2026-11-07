# Profit Leak Analyzer

An academic prototype of a financial analytics product for Pakistani cash-on-delivery sellers. It presents a static marketing site and a sample reconciliation dashboard that illustrate how hidden courier costs, RTO losses and settlement gaps could be traced back to source rows.

The repository now also contains a Phase 3 backend core: strict CSV ingestion, the migrated financial engine, a seller-scoped PostgreSQL/Prisma repository, Clerk bearer-token authentication, and a read/write API. The Vite UI is not yet wired to that API.

## Run the website locally

1. `npm install`
2. `npm run dev`
3. Open the local URL printed by Vite.

To check the frontend production build, run `npm run build` followed by `npm run preview`.

## Run the API locally

Prerequisites: Node.js 24+, Docker Desktop, and a `.env` based on `.env.example`.

```powershell
docker compose up -d
Copy-Item .env.example .env
npm.cmd run db:deploy
npm.cmd run db:generate
```

Development identity adapter:

```powershell
$env:PLA_DEV_HEADER_AUTH = "1"
npm.cmd run api:dev
```

Clerk mode: set `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, and `CLERK_SELLER_CLAIM` in `.env`, then run `npm.cmd run api:dev` without `PLA_DEV_HEADER_AUTH`.

API routes:

- `GET /health`
- `POST /api/analyses` — multipart upload of `orders_file`, `shipments_file`, `settlements_file`, and optional `allocations_file`
- `GET /api/analyses` — seller-scoped run summaries
- `GET /api/analyses/:runId` — seller-scoped run detail

Production bundle:

```powershell
npm.cmd run build:all
npm.cmd run api:start
```

Phase 3 smoke checks:

```powershell
npm.cmd run api:smoke:phase3
npm.cmd run api:smoke
```

## Documentation

- [Phase 1 checkpoint](docs/PHASE1_CHECKPOINT.md)
- [Phase 2 checkpoint](docs/PHASE2_CHECKPOINT.md)
- [Phase 2 manual tests](docs/PHASE2_MANUAL_TESTS.md)
- [Phase 3 checkpoint](docs/PHASE3_CHECKPOINT.md)
- [Phase 3 manual tests](docs/PHASE3_MANUAL_TESTS.md)

## Prototype scope

- The marketing site and dashboard are still a React + TypeScript + Vite demonstration. They use fictional sample data.
- The backend API exists, but the current UI does not upload files, sign users in, or display live runs.
- The demo request form validates entries in the browser only. It does not transmit or store anything.
- The API stores source rows as audit evidence in PostgreSQL. A retention/deletion policy is still pending.
- A potential discrepancy in the dashboard is not a confirmed loss.
- The theme toggle applies to the current session and resets on reload.

Review the in-app Privacy Policy and Terms of Service for the full prototype disclosures.
