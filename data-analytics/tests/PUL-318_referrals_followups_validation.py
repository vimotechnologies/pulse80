#!/usr/bin/env python3
"""
PUL-318  Validate Referrals & Follow Ups metrics
Validation harness for PUL-318_referrals_followups_validation.sql

What it does
------------
1. Loads the .sql file that sits next to this script and parses its
   "-- @view", "-- @query" and "-- @check" sections.
2. Builds an in-memory SQLite database that mirrors the production table
   shapes (screenings, screening_outcomes, referrals, referral_follow_ups)
   and fills it with the Pulse80 EDA sample:
       144 screenings, 37 requiring referral, 12 referrals, 8 follow-ups.
3. Runs every view, KPI query and check from the .sql file and asserts the
   results against the baselines in analytics-reconciliation-tests.md.
4. Re-runs the coverage query after adding a second referral to one
   screening, to prove the KPIs do not fan out on 1:many referrals.

Limits (read before submitting)
-------------------------------
* The 12 referrals and 8 follow-ups are the real EDA sample rows. The other 132
  screenings and the choice of which 25 required screenings have no referral are
  placeholders chosen to reproduce the EDA totals (37 required, 107 not).
* completed_at is not in the EDA CSV. It is set to the follow-up date of each
  completed referral, as a stand-in for the production column.
* One status is stored as "Issued " (capital I, trailing space) on purpose, to
  prove the status normalisation works.
* SQLite is used because it needs no setup. The SQL file is PostgreSQL. This
  harness runs the same text, minus the Postgres-only
  "with (security_invoker = true)" clause. Run the .sql file against Supabase to
  validate the real data.

Usage
-----
    python3 PUL-318_referrals_followups_validation.py

Exit code 0 means every assertion passed, 1 means at least one failed.
"""

import re
import sqlite3
import sys
from pathlib import Path

SQL_FILE = Path(__file__).with_name("PUL-318_referrals_followups_validation.sql")

PARAMS = {
    "org_id": "ORG1",
    "from_ts": "2026-01-01T00:00:00Z",
    "to_ts": "2027-01-01T00:00:00Z",
    "as_of": "2026-10-02T00:00:00Z",
}

# (referral no, screening no, status, urgency, referred_at, due_at, completed_at)
REFERRALS = [
    (1, 8, "completed", "priority", "2026-06-19T09:00:00Z", "2026-07-03T09:00:00Z", "2026-07-02T10:00:00Z"),
    (2, 9, "completed", "priority", "2026-06-20T09:00:00Z", "2026-07-04T09:00:00Z", "2026-07-03T10:00:00Z"),
    (3, 11, "completed", "priority", "2026-06-21T09:00:00Z", "2026-07-05T09:00:00Z", "2026-07-04T10:00:00Z"),
    (4, 25, "completed", "priority", "2026-06-19T09:00:00Z", "2026-07-03T09:00:00Z", "2026-07-05T10:00:00Z"),
    (5, 27, "completed", "priority", "2026-06-20T09:00:00Z", "2026-07-04T09:00:00Z", "2026-07-06T10:00:00Z"),
    (6, 31, "completed", "urgent", "2026-06-21T09:00:00Z", "2026-06-22T09:00:00Z", "2026-07-07T10:00:00Z"),
    (7, 32, "completed", "priority", "2026-06-19T09:00:00Z", "2026-07-03T09:00:00Z", "2026-07-08T10:00:00Z"),
    (8, 33, "completed", "priority", "2026-06-20T09:00:00Z", "2026-07-04T09:00:00Z", "2026-07-09T10:00:00Z"),
    (9, 39, "scheduled", "priority", "2026-06-21T09:00:00Z", "2026-07-05T09:00:00Z", None),
    (10, 41, "scheduled", "priority", "2026-06-19T09:00:00Z", "2026-07-03T09:00:00Z", None),
    (11, 42, "Issued ", "priority", "2026-06-20T09:00:00Z", "2026-07-04T09:00:00Z", None),  # dirty on purpose
    (12, 43, "issued", "priority", "2026-06-21T09:00:00Z", "2026-07-05T09:00:00Z", None),
]

# (follow-up no, referral no, followed_up_at, outcome, next_follow_up_at)
FOLLOW_UPS = [
    (1, 1, "2026-07-02T10:00:00Z", "completed", None),
    (2, 2, "2026-07-03T10:00:00Z", "completed", None),
    (3, 3, "2026-07-04T10:00:00Z", "completed", None),
    (4, 4, "2026-07-05T10:00:00Z", "completed", None),
    (5, 5, "2026-07-06T10:00:00Z", "completed", None),
    (6, 6, "2026-07-07T10:00:00Z", "completed", None),
    (7, 7, "2026-07-08T10:00:00Z", "contacted", "2026-07-18T10:00:00Z"),
    (8, 8, "2026-07-09T10:00:00Z", "contacted", "2026-07-19T10:00:00Z"),
]

SCHEMA = """
create table screenings(id text primary key, organisation_id text, screened_at text, status text);
create table screening_outcomes(screening_id text primary key, referral_required int);
create table referrals(id text primary key, screening_id text, status text, urgency text,
                       referred_at text, due_at text, completed_at text);
create table referral_follow_ups(id text primary key, referral_id text, followed_up_at text,
                                 outcome text, next_follow_up_at text);
"""


def parse_sql(path):
    """Split the .sql file into {'view': [(name, sql)], 'query': {...}, 'check': {...}}."""
    text = path.read_text(encoding="utf-8")
    marker = re.compile(r"^-- @(view|query|check)\s+(\S+)\s*$", re.M)
    hits = list(marker.finditer(text))
    out = {"view": [], "query": {}, "check": {}}
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(text)
        body = text[m.end():end]
        # stop at the next banner comment block so section headers are not part of the SQL
        body = re.split(r"\n-- ={10,}", body)[0].strip()
        body = body.rstrip().rstrip(";").strip()
        kind, name = m.group(1), m.group(2)
        if kind == "view":
            out["view"].append((name, body))
        else:
            out[kind][name] = body
    return out


def to_sqlite_view(sql):
    sql = re.sub(r"create or replace view", "create view", sql, flags=re.I)
    sql = re.sub(r"with\s*\(\s*security_invoker\s*=\s*true\s*\)\s*as", "as", sql, flags=re.I)
    return sql


def build_db(sections, extra_referral=False):
    con = sqlite3.connect(":memory:")
    cur = con.cursor()
    cur.executescript(SCHEMA)

    with_referral = {r[1] for r in REFERRALS}
    others = [i for i in range(1, 145) if i not in with_referral][:25]
    required = with_referral | set(others)  # 12 referred + 25 missing = 37

    for i in range(1, 145):
        cur.execute("insert into screenings values (?,?,?,?)",
                    (f"S{i}", "ORG1", "2026-06-18T08:00:00Z", "Completed"))
        cur.execute("insert into screening_outcomes values (?,?)",
                    (f"S{i}", 1 if i in required else 0))
    for r in REFERRALS:
        cur.execute("insert into referrals values (?,?,?,?,?,?,?)",
                    (f"R{r[0]}", f"S{r[1]}") + r[2:])
    for f in FOLLOW_UPS:
        cur.execute("insert into referral_follow_ups values (?,?,?,?,?)",
                    (f"F{f[0]}", f"R{f[1]}") + f[2:])
    if extra_referral:  # second referral on a required screening
        cur.execute("insert into referrals values (?,?,?,?,?,?,?)",
                    ("R13", "S8", "issued", "priority",
                     "2026-06-22T09:00:00Z", "2026-07-06T09:00:00Z", None))
    for _name, sql in sections["view"]:
        cur.execute(to_sqlite_view(sql))
    return con


class Report:
    def __init__(self):
        self.failures = 0
        self.total = 0

    def check(self, label, actual, expected):
        self.total += 1
        ok = actual == expected
        if not ok:
            self.failures += 1
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}")
        if not ok:
            print(f"         expected: {expected}")
            print(f"         actual:   {actual}")


def run(con, sql):
    return con.execute(sql, PARAMS).fetchall()


def main():
    sections = parse_sql(SQL_FILE)
    rep = Report()

    print("== Parse ==")
    rep.check("views found", [n for n, _ in sections["view"]],
              ["analytics_referral_outcome_facts", "analytics_referral_facts",
               "analytics_referral_data_quality_exceptions"])
    rep.check("queries found", sorted(sections["query"]),
              ["kpi_followup_coverage", "kpi_referral_coverage",
               "kpi_referral_sla_compliance", "kpi_referral_status_funnel"])
    rep.check("checks found", len(sections["check"]), 8)

    con = build_db(sections)

    print("\n== Raw baselines (analytics-reconciliation-tests.md) ==")
    rep.check("referral rows", con.execute("select count(*) from referrals").fetchone()[0], 12)
    rep.check("follow-up rows", con.execute("select count(*) from referral_follow_ups").fetchone()[0], 8)
    rep.check("outcome rows (risk assessments)",
              con.execute("select count(*) from screening_outcomes").fetchone()[0], 144)
    rep.check("required + not required = total (37 + 107 = 144)",
              con.execute("""select sum(referral_required = 1), sum(referral_required = 0), count(*)
                             from screening_outcomes""").fetchone(), (37, 107, 144))

    print("\n== Test 2/3: referral coverage reconciles ==")
    cov = run(con, sections["query"]["kpi_referral_coverage"])[0]
    keys = ["required", "required_with_referral", "missing", "records", "coverage_pct",
            "referrals_on_non_required", "null_flag"]
    d = dict(zip(keys, cov))
    rep.check("required / created / missing / records / coverage / non-required / null",
              cov, (37, 12, 25, 12, 32.43, 0, 0))
    rep.check("created + missing = required (12 + 25 = 37)",
              d["required_with_referral"] + d["missing"], d["required"])

    print("\n== Test 4: referral funnel reconciles ==")
    fun = dict(run(con, sections["query"]["kpi_referral_status_funnel"]))
    rep.check("funnel buckets (incl. normalised 'Issued ')", fun,
              {"accepted": 0, "completed": 8, "declined": 0, "issued": 2, "scheduled": 2})
    rep.check("funnel sums to total referrals", sum(fun.values()), 12)

    print("\n== SLA compliance (catalogue: completed_at <= due_at) ==")
    sla = run(con, sections["query"]["kpi_referral_sla_compliance"])[0]
    rep.check("due / met / open past due / completed late / pct", sla, (12, 3, 4, 5, 25.0))
    rep.check("met + open past due + late = due", sla[1] + sla[2] + sla[3], sla[0])

    print("\n== Test 5: follow-up coverage ==")
    fu = run(con, sections["query"]["kpi_followup_coverage"])[0]
    rep.check("applicable / with follow-up / overdue chains / pct", fu, (8, 8, 2, 100.0))

    print("\n== Data-quality exceptions stay visible ==")
    exc = dict(run(con, """select exception_code, count(*)
                           from analytics_referral_data_quality_exceptions
                           group by exception_code"""))
    rep.check("exception counts", exc,
              {"MISSING_REQUIRED_REFERRAL": 25, "COMPLETED_REFERRAL_FOLLOWUP_OPEN": 2})
    open_ids = sorted(r[0] for r in run(con, """
        select record_id from analytics_referral_data_quality_exceptions
        where exception_code = 'COMPLETED_REFERRAL_FOLLOWUP_OPEN'"""))
    rep.check("open-chain referrals are REF-007 and REF-008", open_ids, ["R7", "R8"])

    print("\n== Test 7: join integrity / verification checks ==")
    for name, sql in sorted(sections["check"].items()):
        rows = run(con, sql)
        rep.check(f"check {name} returns 0 rows", len(rows), 0)

    print("\n== Fan-out guard: second referral on one required screening ==")
    con2 = build_db(sections, extra_referral=True)
    cov2 = run(con2, sections["query"]["kpi_referral_coverage"])[0]
    rep.check("required / created / missing / records / coverage unchanged except records",
              cov2, (37, 12, 25, 13, 32.43, 0, 0))
    multi = run(con2, sections["check"]["H_multiple_referrals_per_screening"])
    rep.check("check H flags the screening with two referrals", multi, [("S8", 2)])

    print(f"\n{rep.total - rep.failures}/{rep.total} assertions passed")
    return 1 if rep.failures else 0


if __name__ == "__main__":
    sys.exit(main())
