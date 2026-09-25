# Validate Risk Metrics: Completed Test Report

**Method:** the actual view definitions from `001_dashboard_analytics_views.sql`
were executed (unmodified in logic, see `06_analytics-views-sqlite-compatible.sql`
for the one syntax change required to run them) against the controlled test
dataset in `05_test-dataset-production-naming.sql`, using SQLite as the engine.
Results below are real query output, not estimates.

## 1. Core metric comparison

| Metric | Expected | Actual (from the real views) | Match? |
| --- | ---: | ---: | :---: |
| completed_screening_events (Org A) | 7 | **7** | ✅ |
| participants_screened (Org A) | 6 | **6** | ✅ |
| risk_distribution — low | 2 (33.3%) | **2** | ✅ |
| risk_distribution — moderate | 1 (16.7%) | **1** | ✅ |
| risk_distribution — high | 2 (33.3%) | **2** | ✅ |
| risk_distribution — critical | 1 (16.7%) | **1** | ✅ |
| high_risk_rate (derived: (high+critical)/assessed) | 50.0% | **50.0%** | ✅ |
| referral required (Org A) | 3 | **3** | ✅ |
| referral records created (Org A) | 2 | **2** | ✅ |
| missing required referrals (Org A) | 1 | **1** | ✅ |
| referral_creation_coverage_pct | 66.7% | **66.67%** | ✅ |
| referral_completion_rate (derived: completed/total issued) | 50.0% | **50.0%** (1 completed, 1 scheduled) | ✅ |
| data-quality exception row (scr-a5 visible, not dropped) | 1 row | **1 row** (`ra-a5` / `scr-a5`) | ✅ |
| Org B high_risk_rate (isolation control) | 100.0% | **100.0%** | ✅ |
| Org A→B leak probe | 0 rows | **0 rows** | ✅ |
| elevated_bp_rate | 75.0%* | **not implemented** | ⚠️ see gaps |
| follow_up_open_count | 1 | **1** (computed manually — not implemented) | ⚠️ see gaps |

**Every metric that the supplied views actually implement matches the manually
calculated expected value exactly.** The join logic, the LEFT JOIN for the
known-exception referral, the risk grouping, and the tenant grouping are all
correct against this test data.

## 2. Duplicate data test

- `scr-a1` and `scr-a1-dup` (same participant, same service, 2 minutes apart)
  were both counted in the raw `screening_events` figure (9, all statuses) and
  in `completed_screening_events` (7 of 9 completed) **as separate events,
  which is correct**, since they are genuinely two records.
- Critically, `participants_screened` correctly counted **6**, not 7, the
  view uses `count(distinct participation_id)`, so the duplicate did not
  inflate the participant-level figure.
- `risk_summary`'s `low` bucket for Org A came out as **2**, not 3, no risk
  assessment exists for `scr-a1-dup` in the test data, so it did not
  double-count.
- **Pass**, with a caveat: nothing in the view layer detects or flags the
  duplicate itself. It only happens not to distort these particular metrics
  in this test case.

## 3. Empty / invalid data test

- `scr-a5` (NULL measurement) and `scr-a6` (999 mmHg, invalid) both still
  appear correctly in `risk_summary`. A risk assessment is a property of the
  screening, not of the measurement, which is the right behaviour.
- Neither view supplied touches the `measurements` table at all, so there is
  currently no metric to break on invalid measurement data, but there's also
  no `elevated_bp_rate` metric to validate. See gap below.
- **Pass** for what exists; **not applicable** for what doesn't yet exist.

## 4. Organisation data isolation test

- Org A `high_risk_rate` = **50.0%**, Org B = **100.0%**. Computed
  independently, no cross-contamination.
- Leak probe (searching for Org B's screening ids inside an Org A–scoped
  query) returned **0 rows**.
- Isolation holds **structurally** in these views because every view groups
  by `organisation_id` derived through `employees.organisation_id`, so as
  long as the caller adds a `WHERE organisation_id = :org` filter (or Postgres
  RLS enforces it), cross-tenant leakage is not possible through these joins.
- **Pass**, but this confirms the *join logic* is sound, not that RLS is
  actually enabled in Supabase. That still needs to be checked at the
  database level per the contract's "tenant/RLS controls are applied before
  aggregate data leaves the database/backend" release-gate requirement.

## 5. Join integrity / orphan checks

| Check | Result |
| --- | --- |
| `analytics_data_quality_exceptions` shows the known missing-referral case, not hidden by an inner join | ✅ Pass — 1 row, exactly as expected |
| Referral coverage numerator/denominator reconcile (2 + 1 = 3) | ✅ Pass |
| Risk totals reconcile (2+1+2+1 = 6 = total assessed) | ✅ Pass |

## 6. Findings and gaps (not simple pass/fail, need your decision)

1. **Column-naming mismatch, needs confirming before deploy.** The views join
   on entity-specific primary keys (`screening_id`, `participation_id`,
   `employee_id`, `risk_assessment_id`, `referral_id`). The
   `Data_Model_Technical_Specification.pdf` schema catalogue instead gives
   every table a generic `id` primary key. If the live Supabase schema
   follows the spec literally, these views' joins (e.g.
   `p.participation_id = s.participation_id`) will fail outright or bind to
   nothing. This needs to be resolved against the real Supabase column names
   before these views are applied. I can't check that myself without DB
   access.
2. **`elevated_bp_rate` has no view.** It's listed in the Analytics Contract
   (§10 of the technical spec) as one of the first dashboard metrics, but
   none of the 6 supplied views touch `measurements` at all. Nothing to
   validate here yet, flagging so it isn't assumed done.
3. **`follow_up_open_count` has no view.** Same situation, defined in the
   contract, not implemented in this file. I computed it manually via a
   direct join for this report; the real dashboard has no source for it yet.
4. **No duplicate-screening detection anywhere in the view layer.** The spec
   calls for near-duplicate screening timestamps to be flagged. None of the
   6 views do this — duplicates currently only avoid distorting metrics by
   coincidence (no risk assessment happened to exist for the duplicate row in
   this test). Worth an explicit dedup/flagging view before this is trusted
   on messier real data.
5. **`screening_events` counts ALL screening statuses, not just completed**
   (9 vs. 7 in this test, pending and invalidated rows are included), while
   `completed_screening_events` is the completed-only figure. The
   reconciliation tests document doesn't specify which one "screening events"
   on the dashboard should mean. Confirm against `dashboard-kpi-catalogue.md`
   which of the two the frontend should bind to.

## 7. Sign-off

- [x] Risk metrics validated (for the 4 metrics that have views: risk
      distribution, high_risk_rate, referral coverage, referral status)
- [x] Expected and actual results recorded above; all match
- [ ] Differences explained or fixed, no numeric differences found; 5 gaps
      above need a decision, not a fix to this report
- [x] Organisation data isolation tested and passing
