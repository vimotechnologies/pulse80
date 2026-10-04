"""Tests for sql/002_participants_screened_calculation.sql.

Default: synthetic fixtures on SQLite, with only parameter syntax and casts
adapted. PostgreSQL mode uses the same fixtures and the production SQL unchanged
in an isolated PGlite process, plus UUID and timezone tests. Neither mode reads
live data or validates Supabase RLS policies.

Run from the repository root:
    python3 data-analytics/tests/test_participants_screened.py
    PARTICIPANTS_TEST_ENGINE=postgres python3 data-analytics/tests/test_participants_screened.py

PostgreSQL mode requires Node.js and the declared backend dependencies:
    npm ci --prefix pulse80-backend
"""

from pathlib import Path
import atexit
import os
import re
import sqlite3
import unittest
from uuid import UUID


TEST_ENGINE = os.environ.get("PARTICIPANTS_TEST_ENGINE", "sqlite")
if TEST_ENGINE not in ("sqlite", "postgres"):
    raise ValueError("PARTICIPANTS_TEST_ENGINE must be sqlite or postgres")


_postgres_db = None


SQL_PATH = (
    Path(__file__).resolve().parents[1]
    / "sql"
    / "002_participants_screened_calculation.sql"
)
PRODUCTION_QUERY = SQL_PATH.read_text(encoding="utf-8")
# SQLite named parameters retain the production query's repeated $1..$4 bindings.
PARTICIPANTS_SCREENED_QUERY = re.sub(
    r"\$(\d+)(?:::(?:uuid|timestamptz))?",
    r":p\1",
    PRODUCTION_QUERY,
)

SCHEMA = """
CREATE TABLE public.activations (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL,
    programme_id TEXT NOT NULL
);
CREATE TABLE public.screenings (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL,
    activation_id TEXT REFERENCES activations(id),
    participant_reference TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('Draft', 'Under Review', 'Completed', 'Needs Correction')
    ),
    captured_at TEXT NOT NULL
);
"""

ORG_A, ORG_B, UNKNOWN_ORG = (str(UUID(int=n)) for n in (1, 2, 3))
PROGRAMME_A, PROGRAMME_B, PROGRAMME_C, UNKNOWN_PROGRAMME = (
    str(UUID(int=n)) for n in (11, 12, 13, 14)
)
ACTIVATION_A, ACTIVATION_REPEAT, ACTIVATION_B, ACTIVATION_C = (
    str(UUID(int=n)) for n in (21, 22, 23, 24)
)


def participants_screened(conn, organisation_id, programme_id=None,
                          period_start=None, period_end=None):
    if TEST_ENGINE == "postgres":
        # Retain PostgreSQL's $1..$4 parameters and uuid/timestamptz casts.
        return int(conn.query(PRODUCTION_QUERY, [
            organisation_id, programme_id, period_start, period_end,
        ]).fetchone()[0])
    return conn.execute(
        PARTICIPANTS_SCREENED_QUERY,
        {"p1": organisation_id, "p2": programme_id,
         "p3": period_start, "p4": period_end},
    ).fetchone()[0]


def build_db():
    if TEST_ENGINE == "postgres":
        global _postgres_db
        if _postgres_db is None:
            from helpers.participants_postgres import PostgresDatabase
            _postgres_db = PostgresDatabase()
            atexit.register(_postgres_db.close)
        # This engine exists only in this test process and has no live data.
        _postgres_db.executescript(
            "DROP TABLE IF EXISTS public.screenings;"
            "DROP TABLE IF EXISTS public.activations;"
            + (Path(__file__).parent / "sql" / "participants_screened_test_schema.sql").read_text(encoding="utf-8")
        )
        return _postgres_db
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    # Preserve the public.* table names used by the production SQL.
    conn.execute("ATTACH DATABASE ':memory:' AS public")
    conn.executescript(SCHEMA)
    return conn


class ParticipantFixture(unittest.TestCase):
    def setUp(self):
        self.conn = build_db()
        if TEST_ENGINE == "sqlite":
            self.addCleanup(self.conn.close)
        self.conn.executemany(
            "INSERT INTO public.activations VALUES (?, ?, ?)",
            [
                (ACTIVATION_A, ORG_A, PROGRAMME_A),
                (ACTIVATION_REPEAT, ORG_A, PROGRAMME_A),
                (ACTIVATION_B, ORG_A, PROGRAMME_B),
                (ACTIVATION_C, ORG_B, PROGRAMME_C),
            ],
        )
        self.screening_number = 0
        # A has two completed records. B is incomplete. C has a correction
        # and a completion. D belongs to a different programme.
        self.add_screening("REF-A", at="2026-06-18T07:09:00Z")
        self.add_screening("REF-A", at="2026-06-18T07:13:00Z")
        self.add_screening("REF-B", status="Under Review", at="2026-06-18T07:18:00Z")
        self.add_screening("REF-C", status="Needs Correction", at="2026-06-18T07:22:00Z")
        self.add_screening("REF-C", at="2026-06-18T07:26:00Z")
        self.add_screening("REF-D", activation=ACTIVATION_B)
        # Another organization deliberately uses the same participant reference.
        self.add_screening("REF-A", organisation=ORG_B, activation=ACTIVATION_C)
        self.add_screening("REF-OTHER", organisation=ORG_B, activation=ACTIVATION_C)

    def add_screening(self, reference, *, organisation=ORG_A,
                      activation=ACTIVATION_A, status="Completed",
                      at="2026-06-18T07:30:00Z"):
        self.screening_number += 1
        self.conn.execute(
            "INSERT INTO public.screenings VALUES (?, ?, ?, ?, ?, ?)",
            (str(UUID(int=100 + self.screening_number)), organisation,
             activation, reference, status, at),
        )

class ParticipantsScreenedTests(ParticipantFixture):
    def test_multiple_completed_records_count_one_participant(self):
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A), 2)

    def test_all_incomplete_statuses_are_excluded(self):
        for status in ("Draft", "Under Review", "Needs Correction"):
            with self.subTest(status=status):
                self.add_screening("ONLY-" + status, status=status)
                self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A), 2)

    def test_correction_does_not_disqualify_a_completed_participant(self):
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-18T07:22:00Z", "2026-06-18T07:27:00Z",
        ), 1)

    def test_reference_is_deduplicated_across_activations(self):
        self.add_screening("REF-A", activation=ACTIVATION_REPEAT)
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A), 2)

    def test_distinct_reference_in_another_activation_is_included(self):
        self.add_screening("REF-NEW", activation=ACTIVATION_REPEAT)
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A), 3)

    def test_programme_filter_is_respected(self):
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A), 2)
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_B), 1)

    def test_no_programme_filter_includes_all_programmes(self):
        self.assertEqual(participants_screened(self.conn, ORG_A), 3)

    def test_reference_is_deduplicated_across_programmes(self):
        self.add_screening("REF-A", activation=ACTIVATION_B)
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_B), 2)
        self.assertEqual(participants_screened(self.conn, ORG_A), 3)

    def test_organisations_are_isolated_even_with_shared_references(self):
        self.assertEqual(participants_screened(self.conn, ORG_A), 3)
        self.assertEqual(participants_screened(self.conn, ORG_B), 2)
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_C), 0)

    def test_activation_organisation_must_match_screening_organisation(self):
        # Deliberately inconsistent data: the activation FK exists, but it
        # belongs to another organization. The join must reject this record.
        self.add_screening("REF-MISMATCH", activation=ACTIVATION_C)
        self.assertEqual(participants_screened(self.conn, ORG_A), 3)
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_C), 0)

    def test_screening_without_activation_is_excluded_by_inner_join(self):
        self.add_screening("REF-UNLINKED", activation=None)
        self.assertEqual(participants_screened(self.conn, ORG_A), 3)

    def test_period_start_is_inclusive(self):
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-18T07:09:00Z", "2026-06-18T07:10:00Z",
        ), 1)

    def test_period_end_is_exclusive(self):
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-18T00:00:00Z", "2026-06-18T07:09:00Z",
        ), 0)

    def test_start_only_period(self):
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A, period_start="2026-06-18T07:14:00Z",
        ), 1)

    def test_end_only_period(self):
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A, period_end="2026-06-18T07:14:00Z",
        ), 1)

    def test_no_period_bounds_includes_all_time(self):
        self.add_screening("REF-OLDER", at="2025-06-18T07:00:00Z")
        self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A), 3)

    def test_empty_or_reversed_period_returns_zero(self):
        for start, end in (("07:09:00", "07:09:00"), ("08:00:00", "07:00:00")):
            with self.subTest(start=start, end=end):
                self.assertEqual(participants_screened(
                    self.conn, ORG_A, PROGRAMME_A,
                    f"2026-06-18T{start}Z", f"2026-06-18T{end}Z",
                ), 0)

    def test_period_with_no_records_returns_integer_zero(self):
        result = participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2099-01-01T00:00:00Z", "2099-02-01T00:00:00Z",
        )
        self.assertEqual(result, 0)
        self.assertIsInstance(result, int)

    def test_unknown_organisation_returns_zero(self):
        self.assertEqual(participants_screened(self.conn, UNKNOWN_ORG), 0)

    def test_unknown_programme_returns_zero(self):
        self.assertEqual(participants_screened(self.conn, ORG_A, UNKNOWN_PROGRAMME), 0)

    def test_empty_screenings_table_returns_zero(self):
        self.conn.execute("DELETE FROM public.screenings")
        self.assertEqual(participants_screened(self.conn, ORG_A), 0)


@unittest.skipUnless(TEST_ENGINE == "postgres", "Requires PostgreSQL types and timezone semantics")
class PostgresTypeTests(ParticipantFixture):
    def test_equivalent_period_offsets_produce_same_count(self):
        for start, end in (
            ("2026-06-18T07:09:00Z", "2026-06-18T07:14:00Z"),
            ("2026-06-18T09:09:00+02:00", "2026-06-18T09:14:00+02:00"),
            ("2026-06-18T02:09:00-05:00", "2026-06-18T02:14:00-05:00"),
        ):
            with self.subTest(start=start):
                self.assertEqual(participants_screened(self.conn, ORG_A, PROGRAMME_A, start, end), 1)

    def test_captured_timestamp_offsets_are_normalized(self):
        self.add_screening("REF-OFFSET", at="2026-06-18T09:10:00+02:00")
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-18T07:10:00Z", "2026-06-18T07:11:00Z",
        ), 1)

    def test_exclusive_end_applies_across_offsets(self):
        self.add_screening("REF-END", at="2026-06-18T09:10:00+02:00")
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-18T07:09:30Z", "2026-06-18T07:10:00Z",
        ), 0)

    def test_local_midnight_window_crosses_utc_date(self):
        self.add_screening("REF-MIDNIGHT", at="2026-06-18T00:00:00+02:00")
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-17T22:00:00Z", "2026-06-17T22:01:00Z",
        ), 1)

    def test_explicit_offsets_do_not_depend_on_session_timezone(self):
        for timezone in ("UTC", "Africa/Gaborone", "America/New_York"):
            with self.subTest(timezone=timezone):
                self.conn.query("SELECT set_config('TimeZone', $1, false)", [timezone])
                self.assertEqual(participants_screened(
                    self.conn, ORG_A, PROGRAMME_A,
                    "2026-06-18T09:09:00+02:00", "2026-06-18T09:14:00+02:00",
                ), 1)

    def test_microseconds_respect_exclusive_end(self):
        self.add_screening("REF-BEFORE", at="2026-06-18T08:00:00.999999Z")
        self.add_screening("REF-AT-END", at="2026-06-18T08:00:01Z")
        self.assertEqual(participants_screened(
            self.conn, ORG_A, PROGRAMME_A,
            "2026-06-18T08:00:00Z", "2026-06-18T08:00:01Z",
        ), 1)

    def test_invalid_uuid_parameters_are_rejected(self):
        from helpers.participants_postgres import PostgresError
        for organisation, programme in (("not-a-uuid", None), (ORG_A, "not-a-uuid")):
            with self.subTest(organisation=organisation, programme=programme):
                with self.assertRaises(PostgresError) as error:
                    participants_screened(self.conn, organisation, programme)
                self.assertEqual(error.exception.code, "22P02")

    def test_invalid_timestamp_parameter_is_rejected(self):
        from helpers.participants_postgres import PostgresError
        with self.assertRaises(PostgresError) as error:
            participants_screened(self.conn, ORG_A, period_start="not-a-timestamp")
        self.assertEqual(error.exception.code, "22007")


if __name__ == "__main__":
    unittest.main(verbosity=2)
