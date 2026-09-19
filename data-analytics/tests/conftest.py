import os

import psycopg
import pytest
from psycopg.rows import dict_row


@pytest.fixture
def db_connection():
    """
    Connect to the dedicated PUL-313 PostgreSQL test database.

    Every test runs inside a transaction.
    The transaction is rolled back after the test so tests
    cannot contaminate each other.
    """

    database_url = os.getenv("TEST_DATABASE_URL")

    if not database_url:
        pytest.skip("TEST_DATABASE_URL is not configured")

    connection = psycopg.connect(
        database_url,
        row_factory=dict_row,
    )

    connection.autocommit = False

    try:
        yield connection
    finally:
        connection.rollback()
        connection.close()


@pytest.fixture
def screening_completion_data(db_connection):
    """
    Create controlled data for PUL-313.

    Participant A requires:
        BP
        BMI
        Glucose

    Participant B requires:
        BP
        BMI

    Expected required screenings = 5.

    Screening results:
        A + BP       = Approved
        A + BMI      = Approved
        A + Glucose  = Draft
        B + BP       = Needs Correction
        B + BMI      = Approved

    Completed required screenings = 3.

    Completion rate:

        3 / 5 * 100 = 60.00%

    Extra cases:
        - Participant A has an Approved Dental screening,
          but Dental is not required.
        - Participant A has a second Approved BP screening.
          The duplicate must not increase completion.
    """

    with db_connection.cursor() as cursor:

        # ----------------------------------------------------
        # Organisation
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO public.organisations (
                name,
                slug
            )
            VALUES (
                'PUL-313 Test Organisation',
                'pul-313-test-organisation'
            )
            RETURNING id
            """
        )

        organisation_id = cursor.fetchone()["id"]

        # ----------------------------------------------------
        # Employees
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO public.employees (
                organisation_id,
                employee_number,
                full_name,
                email,
                department
            )
            VALUES (
                %s,
                'PUL313-A',
                'Participant A',
                'participant-a@example.test',
                'Operations'
            )
            RETURNING id
            """,
            (organisation_id,),
        )

        employee_a_id = cursor.fetchone()["id"]

        cursor.execute(
            """
            INSERT INTO public.employees (
                organisation_id,
                employee_number,
                full_name,
                email,
                department
            )
            VALUES (
                %s,
                'PUL313-B',
                'Participant B',
                'participant-b@example.test',
                'Operations'
            )
            RETURNING id
            """,
            (organisation_id,),
        )

        employee_b_id = cursor.fetchone()["id"]

        # ----------------------------------------------------
        # Services
        # ----------------------------------------------------

        services = {}

        for code, name in [
            ("BP", "Blood Pressure"),
            ("BMI", "Body Mass Index"),
            ("GLUCOSE", "Glucose"),
            ("DENTAL", "Dental"),
        ]:
            cursor.execute(
                """
                INSERT INTO public.services (
                    code,
                    name
                )
                VALUES (
                    %s,
                    %s
                )
                RETURNING id
                """,
                (code, name),
            )

            services[code] = cursor.fetchone()["id"]

        # ----------------------------------------------------
        # Programme
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO public.programmes (
                organisation_id,
                name,
                description,
                status,
                starts_on,
                ends_on,
                target_participants
            )
            VALUES (
                %s,
                'PUL-313 Wellness Programme',
                'Controlled programme for PUL-313 tests',
                'Active',
                CURRENT_DATE,
                CURRENT_DATE + 30,
                2
            )
            RETURNING id
            """,
            (organisation_id,),
        )

        programme_id = cursor.fetchone()["id"]

        # ----------------------------------------------------
        # Programme participants
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO public.programme_participants (
                programme_id,
                employee_id,
                eligibility_status,
                registration_status
            )
            VALUES (
                %s,
                %s,
                'Eligible',
                'Registered'
            )
            RETURNING id
            """,
            (
                programme_id,
                employee_a_id,
            ),
        )

        participant_a_id = cursor.fetchone()["id"]

        cursor.execute(
            """
            INSERT INTO public.programme_participants (
                programme_id,
                employee_id,
                eligibility_status,
                registration_status
            )
            VALUES (
                %s,
                %s,
                'Eligible',
                'Registered'
            )
            RETURNING id
            """,
            (
                programme_id,
                employee_b_id,
            ),
        )

        participant_b_id = cursor.fetchone()["id"]

        # ----------------------------------------------------
        # Programme services
        # ----------------------------------------------------

        programme_services = {}

        for service_code in [
            "BP",
            "BMI",
            "GLUCOSE",
            "DENTAL",
        ]:
            cursor.execute(
                """
                INSERT INTO public.programme_services (
                    programme_id,
                    service_id
                )
                VALUES (
                    %s,
                    %s
                )
                RETURNING id
                """,
                (
                    programme_id,
                    services[service_code],
                ),
            )

            programme_services[service_code] = (
                cursor.fetchone()["id"]
            )

        # ----------------------------------------------------
        # Required participant-service combinations
        # ----------------------------------------------------
        #
        # Participant A:
        #   BP
        #   BMI
        #   Glucose
        #
        # Participant B:
        #   BP
        #   BMI
        #
        # Total expected = 5
        # ----------------------------------------------------

        required_services = [
            (
                participant_a_id,
                programme_services["BP"],
            ),
            (
                participant_a_id,
                programme_services["BMI"],
            ),
            (
                participant_a_id,
                programme_services["GLUCOSE"],
            ),
            (
                participant_b_id,
                programme_services["BP"],
            ),
            (
                participant_b_id,
                programme_services["BMI"],
            ),
        ]

        cursor.executemany(
            """
            INSERT INTO public.programme_participant_services (
                programme_participant_id,
                programme_service_id
            )
            VALUES (
                %s,
                %s
            )
            """,
            required_services,
        )

        # ----------------------------------------------------
        # Helper for screening inserts
        # ----------------------------------------------------

        def insert_screening(
            participant_id,
            participant_reference,
            service_id,
            status,
        ):
            reviewed_at = (
                "now()"
                if status in (
                    "Approved",
                    "Needs Correction",
                )
                else "NULL"
            )

            consent_confirmed = (
                status != "Draft"
            )

            cursor.execute(
                f"""
                INSERT INTO public.screenings (
                    organisation_id,
                    programme_participant_id,
                    service_id,
                    participant_reference,
                    status,
                    consent_confirmed,
                    reviewed_at
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    {reviewed_at}
                )
                RETURNING id
                """,
                (
                    organisation_id,
                    participant_id,
                    service_id,
                    participant_reference,
                    status,
                    consent_confirmed,
                ),
            )

            return cursor.fetchone()["id"]

        # ----------------------------------------------------
        # Required screening results
        # ----------------------------------------------------

        # Participant A + BP -> completed
        insert_screening(
            participant_a_id,
            "PUL313-A",
            services["BP"],
            "Approved",
        )

        # Participant A + BMI -> completed
        insert_screening(
            participant_a_id,
            "PUL313-A",
            services["BMI"],
            "Approved",
        )

        # Participant A + Glucose -> incomplete
        insert_screening(
            participant_a_id,
            "PUL313-A",
            services["GLUCOSE"],
            "Draft",
        )

        # Participant B + BP -> correction required
        insert_screening(
            participant_b_id,
            "PUL313-B",
            services["BP"],
            "Needs Correction",
        )

        # Participant B + BMI -> completed
        insert_screening(
            participant_b_id,
            "PUL313-B",
            services["BMI"],
            "Approved",
        )

        # ----------------------------------------------------
        # Edge case: non-required service
        # ----------------------------------------------------
        #
        # Dental exists in the programme but is NOT required
        # for Participant A.
        #
        # Even though this screening is Approved, it must not
        # affect the completion rate.
        # ----------------------------------------------------

        insert_screening(
            participant_a_id,
            "PUL313-A",
            services["DENTAL"],
            "Approved",
        )

        # ----------------------------------------------------
        # Edge case: duplicate Approved screening
        # ----------------------------------------------------
        #
        # Participant A already has an Approved BP screening.
        #
        # This second record must NOT cause BP to count twice.
        # ----------------------------------------------------

        insert_screening(
            participant_a_id,
            "PUL313-A",
            services["BP"],
            "Approved",
        )

    yield {
        "organisation_a": organisation_id,
        "programme": programme_id,
        "participant_a": participant_a_id,
        "participant_b": participant_b_id,
        "bp_service": services["BP"],
        "bmi_service": services["BMI"],
        "glucose_service": services["GLUCOSE"],
        "dental_service": services["DENTAL"],
    }