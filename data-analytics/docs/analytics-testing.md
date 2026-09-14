# Run the analytics calculation tests

## What this tests

The suite creates a disposable PostgreSQL database, replays every backend migration in date order, applies the mapped SQL twice, inserts synthetic data and checks expected results. Each test rolls back its records. No Supabase account, Docker, cloud credentials or production data is required.

Use Python 3.12 on Linux or macOS, as a normal non-root user. The pinned `pgserver` package supplies PostgreSQL binaries. Windows users can run this in WSL. The GitHub workflow runs the same suite on Ubuntu.

From the repository root:

```bash
python3 -m venv .venv-analytics-tests
source .venv-analytics-tests/bin/activate
python -m pip install -r data-analytics/requirements-test.txt
python -m pytest data-analytics/tests -v
```

Expected: every test passes. A migration error is a setup failure, not a successful calculation test. A failed assertion shows the expected and actual result.

## Expected sample answers

| Scenario | Expected |
|---|---|
| Six screening rows; five Approved; four distinct Approved references | 6 events, 5 completed events, 4 participants screened |
| First duplicate service becomes Draft, Under Review or Needs Correction | 4 completed events, still 4 participants |
| Ten eligible people; six attended | 60.00% |
| One attendee becomes ineligible | 5 / 9 = 55.56% |
| Three required referrals; two created | 66.67% coverage; one missing |
| Two follow-ups for the same referral | One referral with follow-up |
| Empty programme | Zero eligible/attended; null percentage |
| Same reference in a second organisation | Independently scoped counts |
| Cross-organisation participation or screening context | Exception recorded; excluded from valid KPI counts |
| Referral exists without a required outcome | Funnel retains it; exception raised; required coverage excludes it |
| Client role reads internal analytics | Permission denied |
| Service role reads explicitly scoped analytics | Correct values |

## Test boundaries

`supabase_test_shim.sql` supplies only the Auth and Storage objects needed to compile the application migrations. The application tables and constraints come from the actual migration files. This does not validate Supabase Auth, Storage, API permissions, GraphQL or UI behaviour. The tests do validate PostgreSQL grants on the internal analytics schema.

The CSV EDA sample counts (28 employees, 144 events, etc.) are a separate historical baseline. They are not the expected values for this synthetic fixture, and copying CSVs directly into production tables is not part of these tests.

An optional `--local-test-dsn postgresql://...@127.0.0.1:PORT/DATABASE` targets an already running disposable local PostgreSQL instead. It refuses non-loopback hosts and databases containing application/Auth/Storage tables. Never point it at a tunnel to a live database. Default automatic isolation is preferred.

## Review record

Jabu should record the branch commit, command, PostgreSQL version, pass/fail counts and any discrepancy in the PR. Automated results supplied with this change are not a substitute for claiming that Jabu personally verified them.
