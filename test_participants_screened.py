"""
Automated tests for the "Participants Screened" calculation.

Grounded in Participations_EDA.ipynb and Screenings_EDA.ipynb
---------------------------------------------------------------
Why SQLite instead of a live Supabase/Postgres connection
-----------------------------------------------------------
This sandbox has no network access and no running Postgres instance, so
these tests build an in-memory SQLite database with the same grain
(screenings -> participations -> employees) and the same query logic as
002_participants_screened_calculation.sql (query A). SQLite 3.25+ supports
the FILTER clause used in the production SQL, so the query text below is a
faithful, directly-portable translation -- only the parameter placeholder
style differs (:named here vs $1..$4 in the pg client). Before merging,
re-run the same fixtures/assertions against a real Postgres/Supabase
instance (e.g. with psycopg2 or a CI Postgres service) as a final check.

Run with:  python3 test_participants_screened.py
"""

import sqlite3
import unittest

SCHEMA = """
create table employees (
    employee_id      text primary key,
    organisation_id  text not null,
    branch_id        text,
    department_id    text
);

create table participations (
    participation_id text primary key,
    employee_id       text not null,
    programme_id      text not null
);

create table screenings (
    screening_id         text primary key,
    participation_id     text not null,
    programme_service_id text,
    practitioner_id      text,
    status               text not null,
    screened_at          text not null
);

create view analytics_screening_facts as
select
    s.screening_id,
    s.participation_id,
    s.programme_service_id,
    s.practitioner_id,
    s.status as screening_status,
    s.screened_at,
    p.employee_id,
    p.programme_id,
    e.organisation_id,
    e.branch_id,
    e.department_id
from screenings s
join participations p
  on p.participation_id = s.participation_id
join employees e
  on e.employee_id = p.employee_id;
"""

# Same logic as 002_participants_screened_calculation.sql, query A.
# ACCEPTED STATUS ASSUMPTION: 'completed' is the only status value the
# Screenings EDA confirmed present in the real data (100% of 144 rows).
# Postgres $1/$2/$3/$4 positional params -> SQLite :org/:programme/:period_start/:period_end
PARTICIPANTS_SCREENED_QUERY = """
select count(distinct f.employee_id) as participants_screened
from analytics_screening_facts f
where f.organisation_id = :org
  and (:programme is null or f.programme_id = :programme)
  and lower(f.screening_status) in ('completed')
  and (:period_start is null or f.screened_at >= :period_start)
  and (:period_end   is null or f.screened_at <  :period_end)
"""


def participants_screened(conn, organisation_id, programme_id=None,
                           period_start=None, period_end=None):
    cur = conn.execute(
        PARTICIPANTS_SCREENED_QUERY,
        {
            "org": organisation_id,
            "programme": programme_id,
            "period_start": period_start,
            "period_end": period_end,
        },
    )
    return cur.fetchone()[0]


def build_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript(SCHEMA)
    return conn


def seed(conn, employees, participations, screenings):
    conn.executemany("insert into employees values (?, ?, ?, ?)", employees)
    conn.executemany("insert into participations values (?, ?, ?)", participations)
    conn.executemany(
        "insert into screenings values (?, ?, ?, ?, ?, ?)", screenings
    )
    conn.commit()


class GrainAssumptionTests(unittest.TestCase):
    """
    Replays the grain-integrity checks the EDAs already ran against the real
    extracts, on the fixture data used below, so a broken fixture (one that
    violates a confirmed real-world constraint) fails loudly here instead of
    silently invalidating the metric tests that build on top of it.
    """

    def setUp(self):
        self.conn = build_db()
        # Reuses the same base fixture as ParticipantsScreenedTests.setUp.
        employees = [
            ("EMP-001", "org-1", "branch-1", "dept-1"),
            ("EMP-002", "org-1", "branch-1", "dept-1"),
            ("EMP-003", "org-1", "branch-1", "dept-1"),
            ("EMP-004", "org-1", "branch-1", "dept-1"),
            ("EMP-005", "org-2", "branch-9", "dept-9"),
        ]
        participations = [
            ("PAR-001", "EMP-001", "PRG-001"),
            ("PAR-002", "EMP-002", "PRG-001"),
            ("PAR-003", "EMP-003", "PRG-001"),
            ("PAR-004", "EMP-004", "PRG-002"),
            ("PAR-005", "EMP-005", "PRG-001"),
        ]
        screenings = [
            ("SCR-0001", "PAR-001", "PS-001", "PRA-001", "completed", "2026-06-18T07:09:00"),
            ("SCR-0002", "PAR-001", "PS-002", "PRA-001", "completed", "2026-06-18T07:13:00"),
            ("SCR-0003", "PAR-002", "PS-001", "PRA-001", "pending",  "2026-06-18T07:18:00"),
            ("SCR-0004", "PAR-003", "PS-001", "PRA-001", "rejected", "2026-06-18T07:22:00"),
            ("SCR-0005", "PAR-003", "PS-002", "PRA-001", "completed", "2026-06-18T07:26:00"),
            ("SCR-0006", "PAR-004", "PS-001", "PRA-002", "completed", "2026-06-18T07:30:00"),
            ("SCR-0007", "PAR-005", "PS-001", "PRA-003", "completed", "2026-06-18T07:30:00"),
        ]
        seed(self.conn, employees, participations, screenings)

    def tearDown(self):
        self.conn.close()

    def test_screening_id_is_unique(self):
        # Mirrors Screenings_EDA.ipynb Section 1.
        rows = self.conn.execute("select screening_id from screenings").fetchall()
        ids = [r[0] for r in rows]
        self.assertEqual(len(ids), len(set(ids)))

    def test_participation_programme_service_is_unique(self):
        # Mirrors Screenings_EDA.ipynb Section 9 (composite natural key).
        rows = self.conn.execute(
            "select participation_id, programme_service_id, count(*) c "
            "from screenings group by 1, 2 having count(*) > 1"
        ).fetchall()
        self.assertEqual(rows, [])

    def test_employee_programme_is_unique(self):
        # Mirrors Participations_EDA.ipynb Section 2 (no re-enrolment).
        rows = self.conn.execute(
            "select employee_id, programme_id, count(*) c "
            "from participations group by 1, 2 having count(*) > 1"
        ).fetchall()
        self.assertEqual(rows, [])


class ParticipantsScreenedTests(unittest.TestCase):
    """
    Fixture set (all tests share this data unless noted):

    Org "org-1", programme "PRG-001" (real IDs from the EDA sample):
      EMP-001 -> PAR-001 -> screening completed 2026-06-18T07:09, service PS-001
                          -> screening completed 2026-06-18T07:13, service PS-002
                (same person, two completed services from the confirmed
                6-station panel -> should count ONCE)
      EMP-002 -> PAR-002 -> screening "pending"  2026-06-18T07:18
                (SYNTHETIC — the real extract has no non-'completed' status;
                only an unapproved/incomplete screening -> should NOT count)
      EMP-003 -> PAR-003 -> screening "rejected" 2026-06-18T07:22
                          -> screening "completed" 2026-06-18T07:26
                (SYNTHETIC — one bad + one completed -> should count ONCE,
                via the good one)

    Org "org-1", programme "PRG-002":
      EMP-004 -> PAR-004 -> screening completed 2026-06-18T07:30
                (different programme, same org -> excluded when filtering PRG-001)

    Org "org-2", programme "PRG-001" (same programme id reused in a
    different org — SYNTHETIC, the sample extract only has one organisation):
      EMP-005 -> PAR-005 -> screening completed 2026-06-18T07:30
                (different organisation -> must never appear in org-1 results)
    """

    def setUp(self):
        self.conn = build_db()
        employees = [
            ("EMP-001", "org-1", "branch-1", "dept-1"),
            ("EMP-002", "org-1", "branch-1", "dept-1"),
            ("EMP-003", "org-1", "branch-1", "dept-1"),
            ("EMP-004", "org-1", "branch-1", "dept-1"),
            ("EMP-005", "org-2", "branch-9", "dept-9"),
        ]
        participations = [
            ("PAR-001", "EMP-001", "PRG-001"),
            ("PAR-002", "EMP-002", "PRG-001"),
            ("PAR-003", "EMP-003", "PRG-001"),
            ("PAR-004", "EMP-004", "PRG-002"),
            ("PAR-005", "EMP-005", "PRG-001"),
        ]
        screenings = [
            ("SCR-0001", "PAR-001", "PS-001", "PRA-001", "completed", "2026-06-18T07:09:00"),
            ("SCR-0002", "PAR-001", "PS-002", "PRA-001", "completed", "2026-06-18T07:13:00"),
            ("SCR-0003", "PAR-002", "PS-001", "PRA-001", "pending",  "2026-06-18T07:18:00"),
            ("SCR-0004", "PAR-003", "PS-001", "PRA-001", "rejected", "2026-06-18T07:22:00"),
            ("SCR-0005", "PAR-003", "PS-002", "PRA-001", "completed", "2026-06-18T07:26:00"),
            ("SCR-0006", "PAR-004", "PS-001", "PRA-002", "completed", "2026-06-18T07:30:00"),
            ("SCR-0007", "PAR-005", "PS-001", "PRA-003", "completed", "2026-06-18T07:30:00"),
        ]
        seed(self.conn, employees, participations, screenings)

    def tearDown(self):
        self.conn.close()

    def test_person_with_multiple_completed_services_counted_once(self):
        # EMP-001 has two completed screenings (PS-001, PS-002) in PRG-001,
        # matching the confirmed 6-station panel pattern from the EDA.
        # EMP-003 also contributes one completed screening (via PS-002).
        # Whole-period count for org-1/PRG-001 = EMP-001, EMP-003 = 2
        result = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T00:00:00", "2026-06-19T00:00:00",
        )
        self.assertEqual(result, 2)

    def test_unapproved_screenings_are_excluded(self):
        # EMP-002's only screening is "pending" -> must not be counted even
        # though a participation/screening row exists for them.
        result = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T07:15:00", "2026-06-18T07:20:00",
        )
        self.assertEqual(result, 0)

    def test_rejected_screening_does_not_block_the_completed_one(self):
        # EMP-003 has one rejected + one completed screening. The rejected
        # screening must not exclude them once the completed one exists.
        result = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T07:24:00", "2026-06-18T07:28:00",
        )
        self.assertEqual(result, 1)

    def test_no_matching_records_returns_zero_not_null(self):
        # Valid org/programme, but a period with no screenings at all.
        result = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2099-01-01T00:00:00", "2099-02-01T00:00:00",
        )
        self.assertEqual(result, 0)
        self.assertIsNotNone(result)

    def test_unknown_organisation_returns_zero(self):
        result = participants_screened(self.conn, "org-does-not-exist", "PRG-001")
        self.assertEqual(result, 0)

    def test_organisations_do_not_mix(self):
        # org-2 reuses the programme id "PRG-001" on purpose (synthetic;
        # the real extract only has one org). Its completed screening
        # (EMP-005) must never leak into org-1's count.
        org1_result = participants_screened(self.conn, "org-1", "PRG-001")
        org2_result = participants_screened(self.conn, "org-2", "PRG-001")
        self.assertEqual(org1_result, 2)   # EMP-001, EMP-003
        self.assertEqual(org2_result, 1)   # EMP-005 only

    def test_programme_filter_is_respected(self):
        # EMP-004 is completed but under PRG-002; must not appear under
        # PRG-001, and must appear under PRG-002.
        prog_1_result = participants_screened(self.conn, "org-1", "PRG-001")
        prog_2_result = participants_screened(self.conn, "org-1", "PRG-002")
        self.assertEqual(prog_2_result, 1)  # EMP-004 only
        self.assertNotIn("EMP-004", self._debug_members("org-1", "PRG-001"))

    def test_null_programme_means_all_programmes(self):
        # Passing programme_id = None should include both PRG-001 and
        # PRG-002 completed participants for org-1: EMP-001, EMP-003, EMP-004 = 3
        result = participants_screened(self.conn, "org-1", None)
        self.assertEqual(result, 3)

    def test_period_start_is_inclusive_period_end_is_exclusive(self):
        # SCR-0001 is exactly at 2026-06-18T07:09:00. Window narrowed to
        # 07:09-07:15 so EMP-003's later completed screening (07:26) can't
        # leak into this boundary check.
        inclusive = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T07:09:00", "2026-06-18T07:15:00",
        )
        self.assertEqual(inclusive, 1)  # EMP-001 included at the lower bound

        exclusive = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T00:00:00", "2026-06-18T07:09:00",
        )
        self.assertEqual(exclusive, 0)  # EMP-001 excluded at the upper bound

    def test_no_period_bounds_means_all_time(self):
        result = participants_screened(self.conn, "org-1", "PRG-001")
        self.assertEqual(result, 2)

    # -- helper used only inside tests, not part of the production query --
    def _debug_members(self, organisation_id, programme_id):
        cur = self.conn.execute(
            """
            select distinct f.employee_id
            from analytics_screening_facts f
            where f.organisation_id = :org
              and f.programme_id = :programme
              and lower(f.screening_status) in ('completed')
            """,
            {"org": organisation_id, "programme": programme_id},
        )
        return {row[0] for row in cur.fetchall()}


class KnownDataQualityDefectTests(unittest.TestCase):
    """
    Reproduces the hour-rollover defect found in Screenings_EDA.ipynb
    Section 8 (screened_at exactly -60 minutes off for later stations in
    ~25% of visits) on a small fixture, to document its actual effect on
    this metric rather than leave it as an untested assumption.
    """

    def setUp(self):
        self.conn = build_db()
        employees = [("EMP-006", "org-1", "branch-1", "dept-1")]
        participations = [("PAR-006", "EMP-006", "PRG-001")]
        # Mirrors the real PAR-006 example from the EDA: PS-001 at 07:54,
        # then PS-003/PS-004 land an hour "early" (07:02, 07:06) instead of
        # the expected 08:02/08:06 due to the source-system bug.
        screenings = [
            ("SCR-0100", "PAR-006", "PS-001", "PRA-001", "completed", "2026-06-18T07:54:00"),
            ("SCR-0101", "PAR-006", "PS-003", "PRA-001", "completed", "2026-06-18T07:02:00"),  # defect: should be ~08:02
            ("SCR-0102", "PAR-006", "PS-004", "PRA-001", "completed", "2026-06-18T07:06:00"),  # defect: should be ~08:06
        ]
        seed(self.conn, employees, participations, screenings)

    def tearDown(self):
        self.conn.close()

    def test_person_is_still_counted_despite_the_timestamp_defect(self):
        # Whichever of the 3 timestamps you use, EMP-006 has an approved/
        # completed screening somewhere in this visit -> counted once.
        result = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T00:00:00", "2026-06-19T00:00:00",
        )
        self.assertEqual(result, 1)

    def test_narrow_period_window_can_miss_the_defective_row(self):
        # Documents the real risk: a caller who (reasonably) assumes the
        # visit runs 08:00-08:10 based on the un-corrupted PS-001 time plus
        # expected cadence will miss the two mis-timestamped rows if they
        # query only that narrow window and PS-001 is excluded. This is a
        # known limitation of the source data, not of this query — recorded
        # here so a future fix to the ingestion bug has a regression test to
        # flip from "documents the risk" to "confirms the fix".
        window_missing_defect_rows = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T08:00:00", "2026-06-18T08:10:00",
        )
        self.assertEqual(window_missing_defect_rows, 0)

        window_including_ps001 = participants_screened(
            self.conn, "org-1", "PRG-001",
            "2026-06-18T07:00:00", "2026-06-18T08:10:00",
        )
        self.assertEqual(window_including_ps001, 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
