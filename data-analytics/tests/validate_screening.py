"""
Validate Screening Participation & Completion
====================================================
Expected values come from dashboard-kpi-catalogue.md (approved 14 Sep 2026)

  Screening Events           = COUNT(DISTINCT screening id)
  Completed Screening Events = distinct screening id where status = 'Completed'
  Participants Screened      = distinct PEOPLE (employee) with >= 1 Completed screening

Runs the ORIGINAL analytics_screening_summary (from 001_dashboard_analytics_views.sql)
and join-contract integrity checks.

Run:  python3 validate_screening_v2.py
"""
import sqlite3
import sys

SCHEMA = """
create table employees      (employee_id integer primary key, organisation_id integer not null,
                             branch_id integer, department_id integer);
create table programmes     (programme_id integer primary key, organisation_id integer not null);
create table participations (participation_id integer primary key, employee_id integer not null,
                             programme_id integer not null);
create table screenings     (screening_id integer primary key, participation_id integer not null,
                             programme_service_id integer, practitioner_id integer,
                             status text, screened_at text);
"""

FACTS_VIEW = """
create view analytics_screening_facts as
select s.screening_id, s.participation_id, s.programme_service_id, s.practitioner_id,
       s.status as screening_status, s.screened_at,
       p.employee_id, p.programme_id, e.organisation_id, e.branch_id, e.department_id
from screenings s
join participations p on p.participation_id = s.participation_id
join employees e on e.employee_id = p.employee_id;
"""

# Verbatim from 001_dashboard_analytics_views.sql (view 2)
ORIGINAL_SUMMARY = """
create view analytics_screening_summary as
select organisation_id, programme_id,
    count(distinct screening_id) as screening_events,
    count(distinct participation_id) as participants_screened,
    count(distinct screening_id) filter (where lower(screening_status) = 'completed')
        as completed_screening_events
from analytics_screening_facts
group by organisation_id, programme_id;
"""

# Fix: participants_screened = distinct PEOPLE with >=1 Completed screening
FIXED_SUMMARY = """
create view analytics_screening_summary as
select organisation_id, programme_id,
    count(distinct screening_id) as screening_events,
    count(distinct employee_id) filter (where lower(screening_status) = 'completed')
        as participants_screened,
    count(distinct screening_id) filter (where lower(screening_status) = 'completed')
        as completed_screening_events
from analytics_screening_facts
group by organisation_id, programme_id;
"""

# ---------------- controlled test data ----------------
EMPLOYEES = [  # id, org, branch, dept        e1-e5 = org 1, e6 = org 2
    (1, 1, 1, 1), (2, 1, 1, 1), (3, 1, 2, 2), (4, 1, 2, 2), (5, 1, 1, 1), (6, 2, 3, 3)]
PROGRAMMES = [(101, 1), (102, 1), (201, 2)]
PARTICIPATIONS = [  # id, employee, programme
    (1, 1, 101),
    (2, 2, 101),
    (3, 2, 101),   # DUPLICATE participation: same person, same programme (spec says should not happen)
    (4, 3, 102),
    (5, 4, 102),
    (6, 6, 201),   # org 2
    (7, 5, 101),   # enrolled, zero screenings
]
SCREENINGS = [  # id, participation, service, practitioner, status, date
    (1, 1, 1, 1, "Completed",        "2026-01-05"),  # e1
    (2, 1, 2, 1, "Draft",            "2026-01-06"),  # e1, second service -> events, not people
    (3, 2, 1, 2, "Completed",        "2026-01-07"),  # e2
    (4, 3, 1, 2, "Completed",        "2026-01-08"),  # e2 again via duplicate participation
    (5, 3, 1, 2, "Completed",        "2026-01-08"),  # identical duplicate record
    (6, 2, 2, 2, None,               "2026-01-09"),  # NULL status
    (7, 4, 1, 3, "Needs Correction", "2026-02-01"),  # e3
    (8, 5, 1, 3, "Under Review",     "2026-02-02"),  # e4
    (9, 5, 2, 3, "Draft",            "2026-02-02"),  # e4
    (10, 6, 1, 4, "Completed",       "2026-02-03"),  # e6, org 2
]

# ---------------- expected, calculated BY HAND from the catalogue ----------------
# org1/101: screenings 1,2,3,4,5,6 -> 6 events; Completed = 1,3,4,5 -> 4;
#           people with a Completed screening = e1 (s1), e2 (s3,s4,s5) -> 2
#           (e5 has no screenings -> not counted)
# org1/102: screenings 7,8,9 -> 3 events; none Completed -> 0 completed, 0 people
# org2/201: screening 10 -> 1 event, 1 completed, 1 person (e6)
EXPECTED = {
    (1, 101): dict(screening_events=6, participants_screened=2, completed_screening_events=4),
    (1, 102): dict(screening_events=3, participants_screened=0, completed_screening_events=0),
    (2, 201): dict(screening_events=1, participants_screened=1, completed_screening_events=1),
}


def reference_impl():
    """Independent plain-Python calc of the catalogue definitions, to cross-check my hand numbers."""
    part = {p[0]: p for p in PARTICIPATIONS}
    emp = {e[0]: e for e in EMPLOYEES}
    out = {}
    for sid, pid, _, _, status, _ in SCREENINGS:
        _, eid, prog = part[pid]
        key = (emp[eid][1], prog)
        d = out.setdefault(key, dict(events=set(), done=set(), people=set()))
        d["events"].add(sid)
        if status == "Completed":
            d["done"].add(sid)
            d["people"].add(eid)
    return {k: dict(screening_events=len(v["events"]), participants_screened=len(v["people"]),
                    completed_screening_events=len(v["done"])) for k, v in out.items()}


def build(summary_sql, extra_participations=()):
    c = sqlite3.connect(":memory:")
    c.executescript(SCHEMA)
    c.executemany("insert into employees values (?,?,?,?)", EMPLOYEES)
    c.executemany("insert into programmes values (?,?)", PROGRAMMES)
    c.executemany("insert into participations values (?,?,?)", list(PARTICIPATIONS) + list(extra_participations))
    c.executemany("insert into screenings values (?,?,?,?,?,?)", SCREENINGS)
    c.executescript(FACTS_VIEW + summary_sql)
    return c


def summary(c):
    rows = c.execute("select organisation_id, programme_id, screening_events, participants_screened, "
                     "completed_screening_events from analytics_screening_summary").fetchall()
    return {(r[0], r[1]): dict(screening_events=r[2], participants_screened=r[3],
                               completed_screening_events=r[4]) for r in rows}


# ---------------- join-contract integrity queries (zero rows = clean) ----------------
INTEGRITY = {
    "orphan participation -> employee":
        "select p.participation_id from participations p left join employees e on e.employee_id=p.employee_id where e.employee_id is null",
    "orphan participation -> programme":
        "select p.participation_id from participations p left join programmes g on g.programme_id=p.programme_id where g.programme_id is null",
    "orphan screening -> participation":
        "select s.screening_id from screenings s left join participations p on p.participation_id=s.participation_id where p.participation_id is null",
    "cross-org: participation programme org != employee org":
        "select p.participation_id from participations p join employees e on e.employee_id=p.employee_id "
        "join programmes g on g.programme_id=p.programme_id where e.organisation_id <> g.organisation_id",
    "duplicate participation (same employee + programme)":
        "select employee_id, programme_id from participations group by employee_id, programme_id having count(*)>1",
}


def main():
    ok_fixed = True
    print("=" * 76)
    print("Cross-check: hand-calculated expected == independent reference implementation")
    ref = reference_impl()
    print("  ", "MATCH" if ref == EXPECTED else f"MISMATCH ref={ref}")
    if ref != EXPECTED:
        sys.exit("Hand calculation and reference implementation disagree - fix the test first.")

    for label, sql in (("ORIGINAL view (001_dashboard_analytics_views.sql)", ORIGINAL_SUMMARY),
                       ("FIXED view (002_fix_participants_screened.sql)", FIXED_SUMMARY)):
        print("\n" + "=" * 76 + f"\n{label}\n" + "=" * 76)
        act = summary(build(sql))
        fails = 0
        for key in sorted(set(EXPECTED) | set(act)):
            for metric in ("screening_events", "participants_screened", "completed_screening_events"):
                e = EXPECTED.get(key, {}).get(metric)
                a = act.get(key, {}).get(metric)
                flag = "PASS" if e == a else "FAIL"
                fails += flag == "FAIL"
                print(f"  org={key[0]} prog={key[1]:<4} {metric:<28} expected={e!s:<3} actual={a!s:<3} {flag}")
        print(f"  -> {fails} difference(s)")
        if label.startswith("FIXED"):
            ok_fixed = fails == 0

        # isolation: org 2's only employee (e6) must never influence org 1 rows
        orgs = {k[0] for k in act}
        print(f"  isolation: org1 rows={[k for k in act if k[0]==1]} org2 rows={[k for k in act if k[0]==2]}")

    print("\n" + "=" * 76 + "\nJOIN-CONTRACT INTEGRITY CHECKS on the main test data\n" + "=" * 76)
    c = build(FIXED_SUMMARY)
    expected_rows = {"duplicate participation (same employee + programme)": 1}  # planted on purpose (e2/101)
    for name, q in INTEGRITY.items():
        n = len(c.execute(q).fetchall())
        exp = expected_rows.get(name, 0)
        flag = "PASS" if n == exp else "FAIL"
        ok_fixed &= flag == "PASS"
        note = "  (planted on purpose)" if exp else ""
        print(f"  {name:<58} rows={n} expected={exp} {flag}{note}")

    print("\nDetector test: plant a cross-org participation (org-1 employee in org-2 programme)")
    c2 = build(FIXED_SUMMARY, extra_participations=[(8, 1, 201)])
    n = len(c2.execute(INTEGRITY["cross-org: participation programme org != employee org"]).fetchall())
    print(f"  cross-org detector found {n} row(s), expected 1 ->", "PASS" if n == 1 else "FAIL")
    ok_fixed &= n == 1

    print("\nOVERALL (fixed view + integrity):", "ALL PASS" if ok_fixed else "FAILURES")
    sys.exit(0 if ok_fixed else 1)


if __name__ == "__main__":
    main()
