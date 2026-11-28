# Marginovia

An academic prototype of a financial analytics product for Pakistani cash-on-delivery sellers. It presents a static marketing site and a sample reconciliation dashboard that illustrate how hidden courier costs, RTO losses and settlement gaps could be traced back to source rows.

The React and Vite workspace uses a separate Node API with Clerk bearer-token authentication, strict CSV ingestion, the TypeScript reconciliation engine, and seller-scoped PostgreSQL persistence through Prisma.

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

## Staging and production checklist

1. Use separate staging and production configuration and PostgreSQL databases. Build the Vite frontend with the environment's Clerk publishable key and HTTPS API URL. Set the matching Clerk secret and database URL only on the API host. Keep secrets in the hosting platform's secret store and out of frontend variables, artifacts, and logs.
2. Run the API with `NODE_ENV=production` and `PLA_REPOSITORY=prisma`. Set `CLERK_AUTHORIZED_PARTIES` and `PLA_CORS_ORIGINS` to explicit HTTPS frontend origins. Configure Clerk's allowed origins and sign-in and sign-out redirects for that environment. Leave development header authentication disabled.
3. Select `CLERK_SELLER_CLAIM=org_id` for organization accounts or `sub` for personal accounts. The normalized verified claim must match the seller ID in the CSV and persisted records. For existing slug-keyed data, approve and verify a tenant mapping and migration before production cutover. Switching the setting alone will not move historical runs.
4. Back up the target database, run the existing migration deployment step, and confirm the API account has the required database privileges. Configure TLS, a request timeout, and a gateway body limit no greater than the API's 40 MiB multipart limit. Deny direct public access to the API origin when using a gateway. The application limiter uses the socket peer and is per instance; configure client-aware throttling at the gateway and validate the aggregate limit for shared proxy connections.
5. Probe `GET /health` for process liveness. Use a separate database connectivity check and an authenticated synthetic seller workflow for readiness. Monitor 5xx/429 responses, latency, database health and backup age. Keep uploaded records, tokens and financial data out of operational logs. Configure retention and practice restoring a backup before accepting live seller data.
6. In staging, use two real Clerk tenants and check uploads, list and detail isolation, organization switching, exports, redirects, and restart durability. Run the opt-in PostgreSQL integration test against a disposable database with `PLA_TEST_DATABASE=1`. Confirm retry behavior before enabling gateway retries on analysis POST requests. Deliberate repeat uploads still create separate runs.

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

- The public marketing dashboard uses fictional sample data. The signed-in workspace displays the seller's uploaded runs.
- The demo request form validates entries in the browser only. It does not transmit or store anything.
- The API stores source rows as audit evidence in PostgreSQL. A retention/deletion policy is still pending.
- A potential discrepancy in the dashboard is not a confirmed loss.
- The theme toggle applies to the current session and resets on reload.

Review the in-app Privacy Policy and Terms of Service for the full prototype disclosures.
