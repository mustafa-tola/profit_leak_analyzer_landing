# Codvera — Software Requirements Specification

**Profit Leak Analyzer**  
*Every COD rupee, accounted for.*

**Version:** 3.0 — revised draft  
**Date:** 14 November 2026  
**Audience:** Product, engineering, QA and academic reviewers  
**Product scope:** COD reconciliation and financial intelligence  
**Market:** Pakistan | e-commerce merchants  
**Delivery:** Custom-coded web application

Revision basis: original October 2026 SRS, subsequent core-engine decisions, n8n regression results and November custom-code migration. This is a reconstructed requirements baseline, not an audit of the current repository.

## 01 / Introduction & scope

### 1.1 Purpose

Codvera shall help merchants reconcile cash-on-delivery (COD) orders, courier shipments and remittances, identify actionable discrepancies, understand return costs and trace each finding to uploaded evidence. It shall distinguish money awaiting settlement from confirmed discrepancies rather than treating all outstanding amounts as losses.

### 1.2 Business objectives

Reduce manual spreadsheet reconciliation; improve visibility of expected and received cash; identify missing, partial or inconsistent remittances and courier charges; provide auditable evidence for operational follow-up.

### 1.3 MVP scope

Authenticated seller workspace; CSV import and normalization; exact-reference matching; deterministic financial engine; settlement and exception classification; dashboard, evidence review, CSV exports and saved analysis runs. Support at least two courier layouts through explicit mappings and a canonical schema.

### 1.4 Out of scope

Live courier APIs, payment initiation, automated claims or refunds, accounting replacement, predictive fraud scoring, mobile applications and automated recovery. AI explanation is a later, separately gated feature; it is not a dependency of the core MVP.

### 1.5 Users and dependencies

Seller/merchant: uploads data and reviews own results. Authorized merchant reviewer: reviews findings where role support is enabled. System operator: maintains supported mappings and service health without unrestricted access to merchant files. Accurate analysis depends on source quality, unique references, agreed settlement terms and available fee evidence.

### 1.6 Implementation direction

Use the existing Next.js/TypeScript website, server-side API routes and a pure TypeScript deterministic financial engine. Retain the n8n exports as behavioral specifications and regression fixtures, not a production runtime. Persistence technology and hosting configuration remain subject to architecture approval.

## 02 / Functional requirements

All FR requirements in sections 02–03 are MVP requirements unless explicitly marked otherwise. Each “shall” defines required behavior.

**FR-01 | Authentication and seller ownership** — Require authenticated access and verify seller identity and authorization server-side for each upload, run, result and export. Never trust a client-supplied seller ID alone.

**FR-02 | Data import** — Accept CSV orders, shipments, settlements and explicit settlement allocations. Require orders and shipments; allow missing settlement evidence only for an explicitly incomplete analysis.

**FR-03 | Mapping and normalization** — Map at least two courier CSV layouts into a versioned canonical schema. Preserve original values and row references; normalize currency, dates and statuses without guessing ambiguous fields.

**FR-04 | Validation** — Validate required fields, types, currency precision, identities and references. Reject invalid rows with actionable messages; reject unusable files; report excluded rows and their effect on completeness.

**FR-05 | Duplicate handling** — Detect duplicate records and conflicting keys; prevent double counting. Re-upload of the same content within the same seller and analysis configuration shall be idempotent.

**FR-06 | Matching** — Match only verified, exact identifiers within the seller scope. Use explicit allocation records for batch remittances; ambiguous or unmatched items shall remain unresolved.

**FR-07 | Financial reconciliation** — Compute expected receivable, verified remittance, outstanding balance, overpayment and signed adjustments using integer paisa or equivalent exact arithmetic.

**FR-08 | Settlement classification** — Classify settlement evidence into fully settled, partially settled, not yet due, overdue, unknown due date or unresolved/disputed as appropriate; preserve separate fulfillment status.

## 03 / Functional requirements (cont.)

**FR-09 | Courier and return costs** — Calculate evidenced forward and return charges, fee variance and effective courier cost. Calculate RTO rate only for an eligible closed shipment cohort; flag missing fee evidence.

**FR-10 | Exception detection** — Generate rule-based findings with stable rule codes, severity or review priority, amounts where known, affected source rows, reason and evidence completeness.

**FR-11 | Dashboard** — Display expected COD, verified remittance, outstanding amount and potential exposure with explicit definitions. Provide settlement breakdown, courier performance and exception filters; disclose incomplete data.

**FR-12 | Evidence and review** — Allow authorized users to inspect matched records and exception details, record review status and notes, and distinguish a confirmed discrepancy from an unreviewed finding. Preserve the original engine output.

**FR-13 | Reports and export** — Export summary and exception CSVs, with run ID, currency, rule code and source references. Provide settlement-level evidence export where available. Apply seller authorization and CSV formula-injection protection.

**FR-14 | Run lifecycle** — Persist versioned import and analysis runs with pending/running/completed/failed states, timestamps, input checksums and engine version. Surface recoverable failures and prevent partial results from appearing complete.

**FR-15 | Auditability** — Record security-sensitive actions, uploads, analysis executions, exports and review changes; retain enough metadata to reproduce results under the same rules and inputs.

**FR-16 | AI investigation (post-MVP)** — Provide optional read-only explanations grounded in referenced engine findings. Do not recalculate balances, invent evidence, autonomously change records or present uncertain findings as confirmed losses.

## 04 / Data requirements

Logical contract; field names are illustrative and must be reconciled with the existing core-engine specification before implementation. All records are seller-scoped.

### Orders

order_id, seller_id, order_date, COD amount, order status; optional tracking reference. Unique order identity within a seller.

### Shipments

shipment_id or tracking reference, order reference, courier, shipment status, relevant dates, COD amount where supplied, forward/return charges where supplied.

### Settlements

settlement_id, courier, remittance date, signed amount, settlement reference and optional shipment reference. A batch may lack shipment-level attribution.

### Allocations

allocation_id or stable composite key, settlement reference, shipment reference, signed allocated amount. Validate references and reject or quarantine inconsistent allocation totals.

### Configuration / rate evidence

Courier mappings, settlement SLA/calendar, applicable rate schedule and effective date where known. Do not infer a contractual fee or due date without evidence.

### Analysis and findings

run_id, seller_id, status, input hashes, mapping and engine versions; result totals, rule code, source IDs/row numbers, evidence completeness, review state and timestamps.

### 4.1 Data integrity

Preserve raw input or an authorized retained evidence snapshot. Normalize without overwriting source values. Use stable row identities and deterministic sorting; never attach one seller’s rows to another seller’s records. Treat missing fields as unknown, not zero. Store PKR amounts as signed integer paisa with validated bounds.

## 05 / Financial business rules

**BR-01 | Expected receivable** — Derive collectible COD from eligible shipments and authoritative order evidence; deduct only charges when the applicable settlement contract explicitly requires netting. Flag COD mismatches; do not silently choose conflicting amounts.

**BR-02 | Verified remittance** — Sum uniquely matched or explicitly allocated signed remittance movements. Unallocated batch amounts remain separately visible; do not assign them proportionally or count them as shipment-level verified cash.

**BR-03 | Outstanding and overpayment** — For each eligible reconciled obligation, outstanding = max(expected minus verified, 0); overpayment = max(verified minus expected, 0). Aggregate separately so overpayments cannot conceal another shipment’s shortfall. Retain signed net variance.

**BR-04 | Settlement timing** — Use evidenced courier-specific terms and relevant dates to establish due dates. Classify unreceived amounts by due status; unknown due dates shall not be assumed overdue.

**BR-05 | Adjustments and reversals** — Preserve signed adjustments, reversal references and allocation evidence. Do not double count or assume an unallocated adjustment belongs to a shipment; show it separately until attributable.

**BR-06 | RTO and courier costs** — RTO rate = returned shipments / eligible closed shipment cohort × 100. Return cost includes evidenced forward and return charges where applicable. Avoid double counting; show unavailable when denominator or evidence is absent.

**BR-07 | Exposure versus loss** — Outstanding, fee variance and return costs are different measures. Potential exposure must use documented non-overlapping rules; do not label exposure as confirmed loss. Confirmation requires sufficient evidence and review.

**BR-08 | Determinism** — Identical normalized data, configuration and engine version shall produce identical financial totals and findings. No AI-generated arithmetic or fuzzy matching may alter authoritative results.

## 06 / Exceptions & user workflow

### 6.1 Exception taxonomy

Initial rule codes retained from engine validation: DUE_DATE_UNKNOWN, PARTIAL_SETTLEMENT, UNSETTLED_SHIPMENT, UNALLOCATED_SETTLEMENT, FEE_DISCREPANCY, RTO_COST, INVALID_ROW, UNMATCHED_SHIPMENT, ADJUSTMENT_PRESENT, COD_MISMATCH. Include duplicate/conflict findings under stable codes agreed with the engine specification.

Each finding shall contain the rule ID, reason, evidence references, affected entity, amount (or unknown), completeness and review state. Findings may overlap; counts are not unique shipment counts and amounts are not automatically additive.

### 6.2 Primary user journey

1. Sign in and enter authorized seller workspace.
2. Select CSV files and courier mapping; provide settlement terms where available.
3. Validate files and show rejected or ambiguous records.
4. Start analysis; persist run and execute deterministic engine.
5. Display completion or failure with data-quality disclosures.
6. Inspect KPIs, courier breakdown and exceptions.
7. Review findings, export evidence and revisit saved runs.

### 6.3 Failure and alternative flows

Unauthorized seller: deny without revealing whether another seller exists. Invalid CSV: return field/row guidance. Missing settlement evidence: allow incomplete run but do not present verified receipts as zero by assumption. Unmatched or ambiguous references: isolate and flag. Failed execution: retain diagnostic state; retry safely without duplicate financial records.

### 6.4 Interface requirements

Responsive Next.js interface with keyboard-operable controls, readable tables, visible focus, accessible field labels and clear loading, empty, error and incomplete states. Use the light Codvera brand identity; charts must have textual equivalents. No upload or analysis control should imply functionality that is not implemented.

## 07 / Non-functional requirements

**NFR-01 | Security** — Require TLS in deployed environments, secure session handling, server-side authorization, least privilege, protected credentials and restricted evidence storage. Validate uploads and prohibit executable content.

**NFR-02 | Tenant isolation** — Scope all persistence queries, file access, background execution and exports to authorized seller identity. Cross-tenant tests must demonstrate denial even with guessed IDs.

**NFR-03 | Privacy** — Minimize personal information, mask where unnecessary, sanitize logs and avoid transmitting raw customer data to AI services. Define retention and deletion policies before production.

**NFR-04 | Financial accuracy** — Use exact monetary arithmetic; prevent duplicate counting and retain signed adjustments. All approved regression fixtures must match expected results exactly.

**NFR-05 | Reliability** — Use durable run states and atomic result publication, safe retry and idempotent imports. Failed runs shall not overwrite previously completed results.

**NFR-06 | Performance** — Proposed initial target: process 10,000 total CSV rows within 60 seconds in a documented reference environment; benchmark and approve before treating it as a release SLA.

**NFR-07 | Accessibility** — Target WCAG 2.2 AA for primary workflows; verify keyboard navigation, contrast, labels, accessible errors and responsive layout.

**NFR-08 | Maintainability** — Separate pure engine, adapters, persistence and UI. Version mappings and rules; automate unit, integration and end-to-end tests; document setup and migration.

**NFR-09 | Observability and recovery** — Track run failures, durations and stale jobs without logging sensitive payloads. Define and test backup/restore and retention procedures before production.

## 08 / Acceptance & release gates

### 8.1 Regression baseline

The previous n8n implementation reported 25/25 passing regression tests. The custom TypeScript engine must independently rerun and pass the same fixtures; historical success is not evidence of custom implementation success.

| 437-row mixed scenario | Historical expected result |
|---|---|
| Expected receivable | PKR 556,960 |
| Verified remittance | PKR 488,285 |
| Outstanding | PKR 68,675 |
| Validation errors | 5 |
| Exception findings | 89 initially; 87 after later fixes |

Use the exact versioned fixture and rule set to resolve the 89/87 exception-count difference. Potential exposure of PKR 116,200 was previously shown in dashboard planning; its formula must be validated before it becomes an acceptance baseline.

### 8.2 Required acceptance tests

-
- AC-01 (FR-01, NFR-01/02): cross-seller upload, read and export denied.
- AC-02 (FR-02–06): supported layouts normalize; malformed and duplicate records cannot inflate totals.
- AC-03 (FR-07–10): full, partial, overdue, unknown due date, overpayment, batch and adjustment scenarios match approved fixtures.
- AC-04 (FR-11–15): dashboard and exports agree with persisted engine results; review and rerun remain traceable.
- AC-05 (NFR-05–09): retry, failure recovery, benchmark, accessibility and audit checks documented.

### 8.3 Release approval

Release requires approved fixture parity, tenant-isolation tests, end-to-end import-to-export verification, no unresolved critical defects, and documented limitations. AI is excluded from the MVP release gate.

## 09 / Open decisions & traceability

### 9.1 Decisions requiring approval

Confirm the canonical CSV headers and mapping versions against the engine exports; finalize courier-specific due-date and gross/net settlement policies; resolve potential-exposure formula and exact regression fixture versions; choose database and hosting configuration; approve file limits, retention, role matrix, performance targets and operational recovery objectives.

### 9.2 Requirements traceability

Ingestion: FR-02–06 / AC-02. Financial correctness: FR-07–10, BR-01–08 / AC-03. User experience and reporting: FR-11–15 / AC-04. Security and reliability: FR-01, FR-14–15, NFR-01–09 / AC-01, AC-05. AI: FR-16 / separate future safety and grounding acceptance suite.

### 9.3 Glossary

COD: Cash on delivery. RTO: Return to origin. Allocation: Explicit association of a remittance amount with a shipment. Outstanding: Remaining receivable, not necessarily overdue. Verified: Supported by matched settlement evidence, not independent bank confirmation. Exception: A rule-generated finding requiring attention. Run: Versioned execution against a defined input set.

### 9.4 Revision history

v2.0 | 18 October 2026 | Original Profit Leak Analyzer SRS. v3.0 | 14 November 2026 | Codvera branding; custom Next.js/TypeScript direction; explicit allocation, run persistence, deterministic regression gates and post-MVP AI boundary.

### 9.5 Source basis and limitations

Reconstructed from the prior Profit Leak Analyzer SRS v2.0, SDA, MVP architecture and subsequent project discussions. Exact original source text, current implementation and regression exports were not independently inspected for this revision. The document defines desired behavior, not a claim of implemented features. Proposed targets and unresolved policies require stakeholder approval.
