# Validation Report v2: Screening Participation & Completion

**Supersedes v1.** v1 calculated expected values from the view's own logic and reported "no differences". This version uses `dashboard-kpi-catalogue.md` (approved 14 Sep 2026) as the source of truth.

## Definitions used (from the catalogue)
- Screening Events = distinct screenings
- Completed Screening Events = distinct screenings with status `Completed` (workflow: Draft, Under Review, Completed, Needs Correction)
- Participants Screened = distinct **people** with at least one **Completed** screening

## Test data (`validate_screening_v2.py`)
6 employees (5 in org 1, 1 in org 2), 3 programmes, 7 participations, 10 screenings. Includes: a person with several screenings, a deliberate duplicate participation, an identical duplicate screening record, a NULL status, statuses that are not Completed, a participation with zero screenings, and a second organisation.

## Expected vs actual

| org / programme | metric | expected | original view | fixed view |
|---|---|---|---|---|
| 1 / 101 | screening_events | 6 | 6 | 6 |
| 1 / 101 | participants_screened | 2 | **3** | 2 |
| 1 / 101 | completed_screening_events | 4 | 4 | 4 |
| 1 / 102 | screening_events | 3 | 3 | 3 |
| 1 / 102 | participants_screened | 0 | **2** | 0 |
| 1 / 102 | completed_screening_events | 0 | 0 | 0 |
| 2 / 201 | screening_events | 1 | 1 | 1 |
| 2 / 201 | participants_screened | 1 | 1 | 1 |
| 2 / 201 | completed_screening_events | 1 | 1 | 1 |

Hand-calculated expected values were cross-checked against an independent plain-Python implementation of the catalogue definitions (they match).

## Differences found and fixed
1. **Participants Screened counted non-completed screenings.** Programme 102 has only Needs Correction / Under Review / Draft screenings, so the correct value is 0; the original view returned 2.
2. **Participants Screened counted participations, not people.** Employee 2 has two participation rows in programme 101; the original view counted them as 2 participants (total 3 instead of 2).

Fix: `002_fix_participants_screened.sql`. Fixed view passes all 9 metric checks.

## Other checks (all pass on the fixed view)
- **Duplicates:** identical duplicate screening records both count as events (per "individual screening records"); the person is counted once.
- **Empty data:** a participation with zero screenings does not appear in the views. A programme with screenings but none Completed appears with `participants_screened = 0`.
- **NULL status:** no error; not counted as completed.
- **Organisation isolation (in the view's grouping):** org 1 and org 2 rows are separate and org 2 data never appears in org 1 figures.
- **Join-contract integrity queries:** zero orphans, zero cross-org mismatches on the test data; the duplicate-participation query flags the one deliberately planted case; the cross-org detector was proven by planting a bad row.

## Not yet validated (open items)
| Acceptance criterion | Status |
|---|---|
| Screening Participation | **No view exists.** Catalogue defines Participation Rate = attended eligible / eligible programme participants, sourced from `programme_participants`. Needs that migration/schema. |
| Screening Completion (rate) | Catalogue's Screening Completion Rate needs "required participant-service combinations", which implementation must still establish. Only the *count* (Completed Screening Events) is validated. |
| Production schema | Tests run on the analytics-dataset naming. Production uses UUIDs and different status values and table names; needs mapping and re-run on Supabase. |
| RLS isolation | Not testable in SQLite. Needs a run as an authenticated org-1 user on Supabase; check whether views need `security_invoker`. |
| Risk / referral metrics | Separate views, out of scope for this ticket. |

## Note on conflicting status values
The Data Model Technical Specification (v1.7) lists screening status as `pending | completed | invalidated`; the approved KPI catalogue and production use `Draft | Under Review | Completed | Needs Correction`. I followed the catalogue. The spec should be updated or this confirmed.
