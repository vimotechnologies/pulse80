# Participants Screened — API integration notes

## What changed after reviewing the EDAs

The first draft of this calculation filtered on `status = 'approved'`. That
value does not exist anywhere in the real data. `Participations_EDA.ipynb`
and `Screenings_EDA.ipynb` (run against the actual Screenings /
Participations / Measurements / Practitioners / Programmes extracts) found:

- `screenings.status` is **100% `'completed'`** across all 144 rows in the
  sample — no `'approved'`, `'pending'`, `'rejected'`, etc. was observed.
- The EDA calls this field "degenerate" in the sample and explicitly flags
  that any completion/approval-style metric is **untestable against this
  data alone** — the full status domain used in production isn't visible
  from this extract.

**Decision:** the calculation now filters on `status = 'completed'`, the
only value confirmed to exist, written as a single named list in the SQL so
it's a one-line change. **This is an assumption, not a confirmed mapping —
raise it with the product/analytics owner**: is "approved" in the ticket
the same concept as "completed", or a distinct status that doesn't appear
in this sample yet?

## What it counts

Distinct **people**, not screening events or participation records, who
have at least one screening with an accepted status (currently
`'completed'`) in the organisation, programme and period selected by the
caller.

## Tables / fields confirmed by the EDAs

- `screenings.status`, `screenings.screened_at`, `screenings.participation_id`,
  `screenings.programme_service_id` — confirmed shape and values.
- `participations.employee_id`, `participations.programme_id` — confirmed
  `(employee_id, programme_id)` is a **unique natural key** (no
  re-enrolment in a programme) and `participation_id` is a clean primary
  key.
- `employees.organisation_id` — **not** independently re-verified by these
  two EDAs (Employees.csv/Programmes.csv were loaded but never explored in
  the notebook cells). Still relied on via `analytics_screening_facts`
  (001); confirm with an Employees/Organisations EDA before this ships.
- Built on the existing `analytics_screening_facts` view so this metric
  stays consistent with every other view in that file.

## Calling it from the API

Use query **A** in `002_participants_screened_calculation.sql`, bound to 4
inputs:

| Param | Type | Required | Meaning |
|---|---|---|---|
| `organisation_id` | uuid | yes | Tenant scope — always pass the authenticated org context, never trust client input for this. |
| `programme_id` | uuid or null | no | Omit/pass null for "all programmes in this org." |
| `period_start` | timestamptz or null | no | Inclusive lower bound on `screened_at`. |
| `period_end` | timestamptz or null | no | Exclusive upper bound on `screened_at`. |

Returns a single integer, `participants_screened`. Never `null` — an
organisation/programme/period with no completed screenings returns `0`.

Wrapper **B** (`analytics_participants_screened(...)`) exposes the same
logic as a stable SQL function if the resolver layer prefers calling a
function over inlining SQL text.

## Period semantics

Half-open window: `screened_at >= period_start AND screened_at <
period_end`. A "June 2026" filter should pass
`period_start = 2026-06-01T00:00:00Z`, `period_end = 2026-07-01T00:00:00Z`.

## Known data-quality risk carried over from the EDA — read before using narrow periods

`Screenings_EDA.ipynb` (Section 8) found an **hour-rollover bug**: 18 of 144
`screened_at` timestamps (12.5%, across 6 of 24 visits) are exactly **-60
minutes** off, traced to a minute-rollover calculation that doesn't carry
into the hour. This doesn't change *who* gets counted (the person still has
a completed screening, just possibly at the wrong minute/hour), but a
period boundary drawn tightly around an affected hour can bucket a
screening into the wrong window. Not a correctness risk for day/week/month
periods; a real risk for hour-level reporting until the source bug is
fixed. `test_narrow_period_window_can_miss_the_defective_row` in the test
file reproduces this on a fixture so it's documented rather than assumed
away — flag with whoever owns check-in/screening ingestion.

## Edge cases the resolver can rely on (covered by tests)

- A person with several completed screening services in the window
  (confirmed real pattern: every participation has exactly 6 rows, one per
  `programme_service_id` station) is counted once.
- A person with only a non-accepted-status screening is not counted
  (**synthetic** — the real sample has no such row; see below).
- A person with one rejected and one completed screening is still counted
  once, via the completed one (**synthetic**).
- Organisation is a hard boundary — a programme id reused across two
  organisations never lets one org's people leak into another's count
  (**synthetic** — the real sample only has one organisation).
- An unknown/empty organisation or a period with no activity returns `0`,
  not `null` and not an error.
- The natural-key/grain assumptions the query depends on
  (`participation_id` unique, `(employee_id, programme_id)` unique,
  `(participation_id, programme_service_id)` unique) are re-asserted
  directly in `GrainAssumptionTests`, mirroring the EDA's own checks, so a
  broken fixture fails before it can mask a bug in the metric.

## What's synthetic vs. what's observed

Because the sampled extract has **zero variance** on `status`,
`organisation_id`, and `consent_status`, the exclusion and multi-org
isolation tests use fabricated fixture data (marked `SYNTHETIC` in the test
file's docstrings and comments) to validate the query's *logic*. They are
not evidence that these paths behave correctly against real multi-status,
multi-org production data — re-run against real data of that shape once it
exists, per the Data Analytics Handbook's "Transparent: distinguish
observed measurements... from modelled estimates" principle.

## Before merging

1. Confirm the `'approved'` vs `'completed'` question with product/analytics.
2. Re-verify `employees.organisation_id` (and branch/department) against a
   real Employees.csv extract — not covered by these two EDAs.
3. Re-run these fixtures against a real Postgres/Supabase instance (this
   sandbox has no network access and no Postgres available, so the tests
   run against SQLite with an equivalent query).
4. Raise the `screened_at` hour-rollover defect with the check-in/screening
   ingestion owner.
5. Confirm RLS/tenant policy restricts `organisation_id` to the caller's
   authorised organisations before this query is exposed through the API.
