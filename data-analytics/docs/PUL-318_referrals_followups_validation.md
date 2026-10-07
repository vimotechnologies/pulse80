# PUL-318: Validate Referrals & Follow Ups metrics

**Deliverables**

| File | Purpose |
|---|---|
| `PUL-318_referrals_followups_validation.md` | This report |
| `PUL-318_referrals_followups_validation.sql` | Corrected views, canonical KPI queries, verification checks (PostgreSQL) |
| `PUL-318_referrals_followups_validation.py` | Harness that runs the `.sql` file against the EDA sample and asserts the baselines |

**Definitions used:** `dashboard-kpi-catalogue.md` (including the 14 Sept 2026 product decisions). Slide 10 of the data model deck was excluded by instruction.

**Inputs reviewed:** KPI catalogue, API contract, dashboard contract, join validation contract, reconciliation tests, EDA consolidation summary, data relationship map (MD and DBML), technical specification, `referalseda.ipynb`, `followupseda.ipynb`, `001_dashboard_analytics_views.sql`, and Supabase screenshots of `referrals` and `referral_follow_ups`.

---

## 1. Execution summary

The referral arithmetic is valid. The referral and follow-up key integrity is clean, and the reconciliation baselines (37 + 107 = 144, 12 + 25 = 37, 32.43%, 8 + 2 + 2 = 12) all hold. The metric **definitions and the existing SQL are not yet release-ready**:

- The existing views join referrals through `risk_assessment_id`. Production `referrals` links through `screening_id`, so the views cannot run as written.
- The views omit three approved catalogue KPIs: SLA Compliance, Follow-up Coverage, and a zero-filled status funnel.
- The views would bypass Supabase RLS (no `security_invoker`).
- Two definitions the catalogue leaves open ("applicable" referrals) change the results materially.

The corrected `.sql` file fixes the technical issues. Sign-off on the open definitions (section 5) is needed before the ticket is closed.

---

## 2. Validation report

### Referrals metrics

| Check | Result | Notes |
|---|---|---|
| Referral key integrity (EDA) | PASS | 12 rows, unique `referral_id`, no nulls or duplicates |
| Referrals Required = 37 | PASS (conditional) | 37 + 107 = 144. NULL `requires_referral` would sit in neither bucket, so the new queries report it |
| Referral Records Created = 12 | PASS (conditional) | Created is counted only against required screenings. The claim that all 12 map to a required outcome needs the production check |
| Missing Required Referrals = 25 | PASS | LEFT JOIN pattern is correct and kept visible as a data-quality exception |
| Referral Creation Coverage = 32.43% | PASS | 12 / 37 = 32.4324% |
| Referral Status Funnel | PASS after fix | Raw `status` grouping could split buckets; normalised and zero-filled in the new query |
| Referral SLA Compliance | FAIL before fix | The EDA notebook used `follow_up_date` and dropped referrals with no follow-up. Production has `completed_at` and `due_at`, so the catalogue formula is now implementable |
| Date range boundaries | FAIL before fix | Undefined `from` / `to` semantics. Now `>= from AND < to` on the screening's `screened_at` |
| Time zones | PASS in production | `referred_at`, `due_at`, `completed_at`, `followed_up_at` are all `timestamptz` |

### Follow-ups metrics

| Check | Result | Notes |
|---|---|---|
| Follow-up key integrity | PASS | 8 rows, unique ids, no orphans |
| Follow-up Coverage | FAIL before fix | No view existed, and "applicable" is undefined. Interim rule implemented and flagged |
| Multiple follow-ups per referral | RISK | The DBML says `follow_ups.referral_id` is unique. The catalogue says a referral can have several follow-ups. The queries use `EXISTS`, so they are safe either way |
| Status vs outcome | FAIL (exception) | REF-007 and REF-008 are `completed` but their latest follow-up is `contacted` with a pending next action. Reported as `COMPLETED_REFERRAL_FOLLOWUP_OPEN` |

---

## 3. Discrepancies and flaws found

**Blocking or high**

1. **Join key mismatch.** The SQL file joins `referrals.risk_assessment_id`. Production has `referrals.screening_id`. All referral views need the remap done in the new `.sql`.
2. **RLS bypass.** Postgres views run with the owner's rights by default. The new views use `with (security_invoker = true)` (PostgreSQL 15+).
3. **Missing KPIs.** The existing file has no SLA Compliance or Follow-up Coverage view.
4. **Cardinality conflict.** The technical specification says risk assessment to referral is 1:many, while the EDA, DBML and join contract say 1:0..1. Counting at screening-outcome grain with `EXISTS` is correct under both. The `.py` harness proves this by adding a second referral to one screening.
5. **Status vs outcome contradiction (REF-007, REF-008).** Surfaced as an exception. Product must decide whether such a referral counts as closed.

**Medium**

6. **No dimensions.** Existing views group only by organisation and programme, so the API's branch, department and date filters cannot be applied afterwards, and percentages cannot be re-aggregated. The new fact views keep `screened_at`. Branch, department and programme need adding once the production columns are confirmed.
7. **NULL `requires_referral`** is invisible in the old views. Now reported as `null_required_flag` and as an exception.
8. **Free-text status and urgency.** Production stores them as `text`. The spec lists 5 statuses and 3 urgencies, but nothing enforces them. Normalised in queries and checked by check E. Recommend a CHECK constraint or enum.
9. **Competing definitions.** `referral_required_count` appears in both `analytics_risk_summary` and `analytics_referral_coverage`. Keep one canonical source.

**Outside PUL-318 but found while reviewing the same file**

10. `analytics_screening_summary.participants_screened` counts distinct `participation_id` across **all** screening statuses. The catalogue requires `Completed` screenings only, and `participant_reference`.
11. `analytics_risk_summary` groups by `risk_level`. The catalogue requires `reporting_risk_category` from `screening_outcomes` and says legacy `risk_level` must not create a competing definition.

---

## 4. Results

The harness (`PUL-318_referrals_followups_validation.py`) runs the `.sql` file against the EDA sample. **26 of 26 assertions pass.**

| Check | Expected | Result |
|---|---|---|
| Referral rows / follow-up rows / risk-outcome rows | 12 / 8 / 144 | PASS |
| Required + not required = total | 37 + 107 = 144 | PASS |
| Required / created / missing | 37 / 12 / 25 | PASS |
| Referral Creation Coverage | 32.43% | PASS |
| Referrals on non-required screenings | 0 | PASS |
| Funnel (completed / scheduled / issued / accepted / declined) | 8 / 2 / 2 / 0 / 0, sums to 12 | PASS |
| SLA at as-of 2026-10-02 | 12 due, 3 met, 4 open past due, 5 late, 25.0% | PASS |
| Follow-up coverage | 8 applicable, 8 with follow-up, 2 overdue chains, 100% | PASS |
| Exceptions | 25 missing required referrals, 2 open follow-up chains | PASS |
| Verification checks A to H | 0 rows | PASS |
| Fan-out guard (second referral on one screening) | Required-with-referral stays 12, records 13, coverage 32.43% | PASS |

**What this does and does not prove**

- The 12 referrals and 8 follow-ups are the real EDA rows. The remaining 132 screenings, and which 25 required screenings have no referral, are placeholders built to match the EDA totals.
- `completed_at` is not in the EDA CSV. The harness sets it to the follow-up date of each completed referral. The SLA figure of 25.0% is therefore a logic check, not a production result.
- The harness runs on SQLite. The `.sql` file is PostgreSQL. The tested text is identical except for the Postgres-only `security_invoker` clause. **It has not been executed on Supabase.**

---

## 5. Open items for sign-off

1. **[D1] SLA denominator.** "Applicable due referrals" is implemented as: `due_at` set, `due_at <= :as_of`, status not `declined`. Confirm, or state whether declined referrals stay in.
2. **[D2] Follow-up Coverage applicability.** Implemented as status `completed` (as observed in the EDA). Confirm, or widen to `accepted` / `scheduled`.
3. **[D3] Referral Records Created card.** It shows either `referral_records_created` (all referral rows) or `required_with_referral` (required screenings with at least one referral). They differ only if one screening has several referrals.
4. **Status vs outcome (REF-007, REF-008).** Is a `completed` referral with a `contacted` follow-up closed?
5. **Assumptions A1 to A3 in the `.sql` header.** Confirm the `screenings` timestamp and `organisation_id`, the `screening_outcomes` key, and whether `referrals.screening_id` is unique.
6. **Production run.** Run the `.sql` queries and checks on Supabase and compare to 37 / 12 / 25 / 32.43%.
7. **Schema alignment.** Update the DBML and technical specification to match production: `referral_follow_ups`, `followed_up_at`, `next_follow_up_at`, `due_at`, `completed_at`, and non-unique `referral_id` on follow-ups.

---

## 6. Release checklist

- [ ] `.sql` assumptions A1 to A3 confirmed and applied on the `analytics` branch
- [ ] Open items D1 to D3 and the status/outcome decision recorded in `dashboard-kpi-catalogue.md`
- [ ] Verification checks A to G return 0 rows on production data
- [ ] KPI queries return values matching the baselines (or differences are explained)
- [ ] Tenant isolation test (reconciliation Test 6) passes with `security_invoker` views
- [ ] API and dashboard match the canonical queries for the same filters (Tests 8 and 9)
- [ ] Small-cohort suppression (denominator of at least 10 participants for segmented client metrics) confirmed for any segmented referral view
- [ ] DBML and technical specification updated

---

## 7. How to run

```bash
# Harness (no dependencies beyond Python 3 standard library)
python3 PUL-318_referrals_followups_validation.py

# Production (Supabase SQL editor or psql)
# 1. Review assumptions A1-A3 at the top of the .sql file.
# 2. Run section 1 (views), then the section 2 queries with your parameters
#    (:org_id, :from_ts, :to_ts, :as_of) and the section 3 checks.
```
