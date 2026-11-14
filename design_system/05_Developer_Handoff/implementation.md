# Next.js Implementation Handoff

## Scope
Apply brand and UI identity to the **existing** Next.js + TypeScript application; avoid replacing the working financial engine, API, authorization, storage, and verified calculations.

## Suggested rollout
1. Install token variables and fonts using existing styling conventions. Inspect any Tailwind/theme conflicts.
2. Add reusable `AppShell`, navigation, typography, buttons, form controls, cards, status badges and tables.
3. Refine `Upload & Analyze` with independent file slots (Orders/Shipments/Settlements required; Allocations optional), file-size/type feedback, seller-claim enforcement, and accessible validation.
4. Refine analysis dashboard: Expected, Verified, Outstanding, then **Provisional** Discrepancies; clear PARTIAL_DATA and rejected-row messaging.
5. Refine Exceptions: searchable/filterable, paginated table, evidence disclosure, and truthful statuses only (do not add resolution actions without backend state support).
6. Refine Reports and Run History: exports and historical charts only when backed by real persisted data.
7. Test keyboard, screen readers, responsiveness, security, and finances before release.

## Avoid design-driven logic errors
- A number on a generated image is *not* a test fixture or reliable assertion.
- Financial baseline to preserve **when using the existing 437-row fixture**: expected PKR 556,960, verified PKR 488,285, outstanding PKR 68,675, 87 exceptions, 5 validation errors.
- A `PARTIAL_DATA` run excludes rejected records and must not be displayed as a clean analysis.
- Do not imply each exception amount adds to confirmed financial loss.
- Do not display example courier logos or fake historical series as real verified data.
- Never bypass seller isolation or expose privileged API tokens in browser code.

## Components / pages
- `/analyze`: upload, validate, progress and error states.
- `/dashboard`: run header, 4 KPIs, settlement breakdown, courier comparison, recent exceptions.
- `/exceptions`: filters, pagination, evidence, notes/resolution only if supported.
- `/reports`: export summaries, validation, exceptions, and real historical results.
- `/runs`: history with date, status, run ID, and quality.

## Responsive strategy
- Small mobile 375px: one column, cards stack, sticky simple navigation or mobile drawer, table via accessible horizontal region or list cards.
- Tablet 768px: two-card KPI grid; sidebar collapses; tables adapt.
- Desktop 1024–1440px: 4 KPI cards; 2- or 3-column supporting modules; exceptions full width.
- No page-level horizontal scrolling; avoid min-width that forces viewport overflow.
