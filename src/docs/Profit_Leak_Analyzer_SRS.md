# Profit Leak Analyzer Software Requirements Specification

*SRS | MVP business rules and acceptance criteria | Version 1.0*

## 1 Introduction and Scope

This Software Requirements Specification defines a testable MVP for Profit Leak Analyzer, an upload-first application for Pakistani COD sellers. Its purpose is to normalize order/courier data, quantify delivery-related expenses, flag potential payout discrepancies and create transparent, evidence-backed reports. Financial classification must never silently convert unresolved receivables into confirmed losses.

### 1.1 Actors

| Actor | Responsibility |
| --- | --- |
| Merchant analyst/owner | Uploads exports, maps columns, reviews findings and downloads reports. |
| Merchant team member | May view authorized reports and mark exceptions reviewed. |
| System administrator | Supports operations without unbounded access to business records. |
| AI investigation agent | Read-only analysis tools with scoped access; provides explanations and recommendations. |
| n8n automation | Schedules alerts and reports; cannot change the underlying reconciliation math. |

### 1.2 In scope and out of scope

**MVP includes:** file upload, schema mapping for at least two courier layouts, validation, order matching, RTO and effective-cost calculations, COD settlement status, exception investigation, dashboard, source-row traceability and report export. **Excluded:** automatic courier claims, direct payment transfers, accounting ledger replacement, carrier contract optimization, live Shopify/courier APIs and predictive fraud scoring.

## 2 Business Rules and Definitions

- BR-01: Each record belongs to one merchant account and one upload batch. Re-uploading the same file does not create duplicate shipments or inflate metrics.

- BR-02: Matching prefers verified (merchant, courier, tracking number) relationships; external order IDs are used only when identifiers and uniqueness permit. Ambiguous many-to-many matches become review cases.

- BR-03: Shipment status is normalized to CREATED, IN_TRANSIT, DELIVERED, RETURN_INITIATED, RETURNED, CANCELLED_BEFORE_SHIPMENT or UNKNOWN; raw status is preserved.

- BR-04: RTO rate denominator is shipped parcels in a closed, explicitly selected cohort; pending/in-transit outcomes are separately disclosed. Never count pre-shipment cancellations as RTO.

- BR-05: Effective shipping cost per delivered parcel = total attributable shipping charges (including forward and additional return costs) / count of delivered parcels for the same cohort. If a denominator is zero or costs are incomplete, display N/A or estimate with labeled assumptions.

- BR-06: Settlement state is one of SETTLED, PARTIALLY_SETTLED, NOT_YET_DUE, OVERDUE, DISPUTED or UNMATCHED. A due date requires an actual settlement term or merchant-defined assumption; missing terms produce UNKNOWN_DUE_DATE rather than automatic overdue labeling.

- BR-07: A payout variance compares expected net remittance with actual remittance only after permitted deductions are included and documented. Unknown fees render the variance provisional.

- BR-08: All monetary results use decimal arithmetic and PKR precision; no binary floating-point arithmetic for accounting-critical calculations.

- BR-09: Every flagged finding has a rule ID, affected rows, amount or reason, data-completeness indicator and review state. Agent explanations are never authoritative numeric sources.

## 3 Functional Requirements

| ID | Name | Testable requirement |
| --- | --- | --- |
| FR-01 | Authentication and authorization | Users are authenticated; every file, run, finding and tool invocation is merchant-scoped. |
| FR-02 | CSV/XLSX ingestion | Accept supported tabular exports with size/format validation, file checksum and batch ID. |
| FR-03 | Column mapping | Map source columns to canonical order/shipment/settlement fields; persist parser version and mapping. |
| FR-04 | Quality report | Show duplicates, missing IDs, invalid money/dates, contradictory statuses and unmatched rows before analysis. |
| FR-05 | Record matching | Match orders and shipments with deterministic priorities and flag ambiguous relations without forced matches. |
| FR-06 | RTO metrics | Compute delivered, returned and pending counts by courier/city/product with documented cohort logic. |
| FR-07 | True courier cost | Calculate recorded charge totals and effective cost per delivered parcel, with completeness and fee assumptions. |
| FR-08 | Settlement reconciliation | Classify settlement states using due terms, remittances, adjustments and charge evidence. |
| FR-09 | Findings and review | Flag discrepancies with evidence; users can confirm, dismiss or annotate without overwriting source data. |
| FR-10 | Investigation agent | Invoke only allowlisted read-only tools and produce schema-validated findings and confidence limits. |
| FR-11 | Analytics dashboard | Provide filterable courier, city, product and payout metrics with cohort and missing-data warnings. |
| FR-12 | Report export | Generate downloadable CSV/PDF reports with data range, assumptions, record citations and provisional flags. |
| FR-13 | n8n workflows | Trigger batch-complete notifications and configurable alerts with idempotent job keys. |
| FR-14 | Auditability | Record uploads, mappings, parser versions, analysis versions, agent tool calls and review decisions. |

## 4 Nonfunctional Requirements

- NFR-01 Accuracy: deterministic decimal computations reproduce expected totals from controlled fixtures; all results identify relevant source rows and rules.

- NFR-02 Isolation and security: TLS, secure credentials, tenant-scoped queries, restricted upload/object access, role checks, audit logs and sanitized error output.

- NFR-03 Privacy: upload only necessary fields, mask customer PII where not needed, define retention/deletion and obtain consent or appropriate authority for real business data.

- NFR-04 Reliability: upload and analysis jobs are replayable and idempotent; each completed run has immutable input checksum, parser version and computation version.

- NFR-05 Performance targets (pilot hypotheses): 10,000 rows analyzed within 2 minutes on the benchmark environment; dashboard response p95 below 3 seconds for precomputed summaries.

- NFR-06 Explainability: AI output must cite a finding or tool result ID, use a JSON schema, abstain on uncertainty, and never invent missing remittances, return charges or settlement terms.

- NFR-07 Operability: health checks, redacted logs, job failures, dead-letter review queue, backups and restore test before commercial rollout.

## 5 Input Schemas and Assumptions

| Dataset | Minimum fields | Optional but useful |
| --- | --- | --- |
| Orders | merchant order ID; order date; order value; courier or tracking link | SKU/product, destination city, COD flag, product cost |
| Courier | tracking number; courier; shipment date; current status | forward freight, return freight, zones, surcharge, delivery date |
| Settlement (if separate) | tracking/order ref; remitted amount; date | expected COD, tax/adjustments, settlement batch ID, due date |

If a required metric lacks cost/status/remittance evidence, the system must explicitly label that metric incomplete or unavailable. Two-file capability depends on whether the courier export actually contains settlement details; an optional third settlement file is allowed.

## 6 User Journey and Acceptance

Create account -> upload files -> map columns -> resolve critical validation issues -> view reconciliation summary -> investigate flagged rows -> annotate/verify -> export report. Acceptance requires: at least two supported source schemas; reproducible courier-cost examples; correct distinction between overdue and not-yet-due; tenant-isolation tests passing; no unresolved high-severity financial miscalculations; agent tool restrictions proven.
