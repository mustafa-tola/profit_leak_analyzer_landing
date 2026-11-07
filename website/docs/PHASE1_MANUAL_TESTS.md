# Phase 1 — Minimal Manual Acceptance Test

**Purpose:** decide whether the financial engine is safe to build upon in Phase 2.
**Time:** about 5–7 minutes.
**Risk covered:** wrong financial totals, precision drift, broken classification, non-deterministic output, and damage to the existing UI build.

This is a **manual gate**, not a replacement for Phase 2 API/database testing.

---

## Before you start

1. Open PowerShell in the website folder:

   ```powershell
   cd "C:\Users\Focus Computer\Desktop\profit_leak_analyzer\website"
   ```

2. Confirm the fixture folder exists:

   ```powershell
   Test-Path "..\n8n\sample-data\PLA_Realistic_Mixed_Stress\orders.csv"
   ```

   Expected: `True`.

3. Stop immediately if any step below fails. Do not start Phase 2 on a red result.

---

## Step 1 — Install exactly from the lockfile

```powershell
npm.cmd ci
```

**Pass:** command exits with code `0`.
**Fail:** dependency, network, or lockfile error.

> Use `npm.cmd`, not `npm`, in this Windows environment. The PowerShell `npm.ps1` shim is blocked by execution policy.

---

## Step 2 — Run the automated regression suite

```powershell
npm.cmd test
```

**Pass — exact expected summary:**

```text
Test Files  3 passed (3)
     Tests  25 passed (25)
```

**Also confirm:** zero failed tests and no unhandled errors.

> These 25 tests are the reconstructed Vitest suite. The original exported n8n Engine Test Suite was not present in the repository. The financial baseline below is the authoritative regression oracle.

---

## Step 3 — Type-check the engine and existing app

```powershell
npx.cmd tsc --noEmit
```

**Pass:** no output and exit code `0`.
**Fail:** any TypeScript error.

---

## Step 4 — Confirm the existing UI still builds

```powershell
npm.cmd run build
```

**Pass:** output ends with `✓ built in ...` **and no chunk-size warning**.
**Expected:** the entry bundle stays below 500 kB; the dashboard preview and legal pages are emitted as separate lazy chunks.
**Fail:** build errors, missing modules, a failed exit code, or the `(!) Some chunks are larger than 500 kB` warning returning.

---

## Step 5 — Run the financial acceptance smoke check

```powershell
npm.cmd run test:manual
```

This is read-only. It loads the checked-in synthetic fixtures, runs the engine, and compares 53 values to the approved baseline.

**Pass — final lines must be exactly:**

```text
Summary: 53/53 checks passed
RESULT: PASS — Phase 1 manual acceptance is complete.
```

### Expected results by fixture

| Fixture | Quality | Validation / rejected | Exceptions | Expected receivable | Verified paid | Outstanding |
|---|---|---|---:|---:|---:|---:|
| `01_clean_settled` | CLEAN | 0 / 0 | 0 | PKR 3,400.00 | PKR 3,400.00 | PKR 0.00 |
| `02_mixed_exceptions` | CLEAN | 0 / 0 | 12 | PKR 8,500.00 | PKR 5,100.00 | PKR 3,400.00 |
| `03_validation_failures` | PARTIAL_DATA | 5 / 5 | 6 | PKR 800.00 | PKR 800.00 | PKR 0.00 |
| `04_adjustment_diagnostic` | CLEAN | 0 / 0 | 2 | PKR 2,300.00 | PKR 2,300.00 | PKR 0.00 |
| `PLA_Realistic_Mixed_Stress` | PARTIAL_DATA | 5 / 5 | **87** | **PKR 556,960.00** | **PKR 488,285.00** | **PKR 68,675.00** |

Additional values the script must confirm:

- Stress fixture has exactly **437 source rows**.
- Stress settlement counts: **SETTLED 82**, **PARTIALLY_SETTLED 17**, **UNSETTLED 12**.
- RTO operational cost is **PKR 600.00** and remains separate from receivables.
- Verified fee discrepancy is **PKR 250.00** and is not added to outstanding.
- Adjustments reconcile: **PKR 15.00 = PKR 0.00 allocated + PKR 15.00 unallocated**.
- `NO_VALID_SETTLEMENTS` is returned when settlements are submitted but all are rejected.
- Re-running the stress fixture produces the same output hash:

  ```text
  777fc406edee5d9eb3c6b271e0ba56122cff29dcbfe5652c1648351b55efb117
  ```

---

## Step 6 — Human review of the smoke output

Do not only look at the green summary. Confirm these five points in the printed table:

- [ ] No value shows `NaN`, `undefined`, `Infinity`, or a floating-point tail such as `.0000001`.
- [ ] Every PKR amount is printed with exactly two decimal places.
- [ ] `03_validation_failures` shows **PARTIAL_DATA**, not CLEAN.
- [ ] `01_clean_settled` shows **zero exceptions**.
- [ ] The stress fixture still shows **87 exceptions** and **PKR 68,675.00** outstanding.

If any box is unchecked, stop and record the failing fixture.

---

## Step 7 — Record the result

Copy this into the project log or your handoff notes:

```text
Phase 1 manual acceptance
Date:
Operator:
Node version:            (run: node --version)
npm version:             (run: npm.cmd --version)
Working tree/commit:     (run: git rev-parse HEAD ; git status --short)

npm ci:                  PASS / FAIL
npm test:                PASS / FAIL    (25/25)
tsc --noEmit:            PASS / FAIL
npm run build:           PASS / FAIL
npm run test:manual:     PASS / FAIL    (53/53)
Human review:            PASS / FAIL

Decision: GO to Phase 2 / STOP
Notes:
```

---

## Stop conditions

Stop before Phase 2 if any of the following occurs:

- Any test, type-check, build, or smoke check fails.
- The stress fixture differs from any baseline number.
- The repeated-run hash differs.
- A value is displayed as zero when the source amount was blank.
- You are tempted to edit a fixture or expected value to make the test pass.

A baseline change requires an explicitly documented defect correction, a new fixture, and a reviewed test update. Do not change verified financial behavior to force a green run.

---

## Not covered by this manual gate

These do not exist yet or belong to Phase 2:

- Browser upload flow.
- Next.js API route handlers.
- PostgreSQL/Prisma persistence.
- Authentication, seller-scoped API access, rate limiting.
- Duplicate file re-upload idempotency at database level.
- Dashboard/report integration against live analysis results.

Do not treat a passing Phase 1 manual test as acceptance of those features.
