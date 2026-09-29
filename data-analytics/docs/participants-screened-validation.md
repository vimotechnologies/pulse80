# Participants Screened validation

Validated on 29 September 2026 against
`sql/002_participants_screened_calculation.sql`.

## Results

| Engine | Passed | Skipped | Failed |
|---|---:|---:|---:|
| SQLite | 21 | 8 PostgreSQL-specific cases | 0 |
| PostgreSQL through PGlite 0.3.14 | 29 | 0 | 0 |

Both modes use the same synthetic fixtures and counting assertions. PostgreSQL
mode sends the SQL file unchanged, including its `$1`–`$4` bindings and
`uuid`/`timestamptz` casts. SQLite mode adapts only those parameters and casts.

The PostgreSQL engine runs in memory. Its test tables are recreated before each
case, and the engine closes at process exit. No production database is used.

## Coverage

- Only `Completed` screenings count.
- Multiple completed records for one reference count once, including across
  activations and programmes when the programme filter is omitted.
- Organisation and programme filters are enforced.
- The activation must belong to the screening's organisation.
- Start timestamps are inclusive; end timestamps are exclusive.
- Either time bound can be omitted. Empty and reversed windows return zero.
- Equivalent UTC, positive-offset, and negative-offset windows agree.
- Stored timestamp offsets, local midnight, session timezones, and microsecond
  boundaries preserve the expected count.
- PostgreSQL rejects malformed UUID and timestamp parameters.
- Missing organisations, programmes, and screening records return zero.

## Confirmed activation rule

Completed screenings without a linked activation are excluded, including from
organisation-wide totals. This was confirmed by the product owner during this
validation and is now explicit in the KPI catalogue and SQL comments. The query
itself did not need changing.

## Run locally

From the repository root:

```sh
# Standard-library Python tests; no database required.
python3 data-analytics/tests/test_participants_screened.py

# Install the already-declared PostgreSQL test engine dependency.
npm ci --prefix pulse80-backend

# Same tests on PostgreSQL, plus timezone and type checks.
PARTICIPANTS_TEST_ENGINE=postgres python3 data-analytics/tests/test_participants_screened.py
```

An unsupported engine name fails immediately, so a typo cannot silently run
SQLite instead of PostgreSQL.

## Limits and adjacent tests

This validates the calculation on a minimal production-shaped schema. It does
not validate Supabase authentication, RLS, the complete migration chain, or
production data quality. Organisation filtering here is query behavior, not an
RLS security test.

The adjacent participation and completion Python suites use
`programme_participants` and service requirements rather than the old EDA
`participations` model. Their standalone test schema still permits `Submitted`,
and the completion test documentation mentions it. The current production
status migration permits `Draft`, `Under Review`, `Completed`, and
`Needs Correction`. That separate test schema needs alignment before claiming
full production-schema parity. Those suites were inspected, not rerun as part
of this participant-count validation.
