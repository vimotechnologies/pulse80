"""
Shared pytest fixtures for Pulse80 analytics tests.

These fixtures prepare controlled PostgreSQL data used to test
Pulse80 analytics views.

Important:
- Tests must use a dedicated test database.
- Tests must never run against production.
- Controlled test data is rolled back after each test.
"""

import os
import uuid

import psycopg
import pytest
from psycopg.rows import dict_row


@pytest.fixture(scope="session")
def db_connection():
    """
    Connect pytest to a dedicated PostgreSQL test database.
    """

    database_url = os.getenv("TEST_DATABASE_URL")

    if not database_url:
        pytest.skip(
            "TEST_DATABASE_URL is not configured. "
            "Analytics database tests cannot run."
        )

    connection = psycopg.connect(
        database_url,
        row_factory=dict_row,
    )

    try:
        yield connection
    finally:
        connection.close()


@pytest.fixture
def screening_completion_data(db_connection):
    """
    Controlled data for PUL-313.

    Required screenings:

    Participant A:
        BP
        BMI
        Glucose

    Participant B:
        BP
        BMI

    Expected required screenings = 5

    Results:

    Participant A:
        BP      -> Approved
        BMI     -> Approved
        Glucose -> Draft

    Participant B:
        BP      -> Needs Correction
        BMI     -> Approved

    Extra:
        Participant A Dental -> Approved
        but Dental is NOT required.

    Expected KPI:

        expected  = 5
        completed = 3
        rate      = 60.00%
    """

    connection = db_connection

    try:
        with connection.cursor() as cursor:

            # ====================================================
            # 1. Organisation
            # ====================================================

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


            # ====================================================
            # 2. Employees
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.employees (
                    organisation_id,
                    employee_number,
                    full_name
                )
                VALUES
                    (
                        %s,
                        'PUL313-EMP-001',
                        'Test Participant A'
                    ),
                    (
                        %s,
                        'PUL313-EMP-002',
                        'Test Participant B'
                    )
                RETURNING
                    id,
                    employee_number
                """,
                (
                    organisation_id,
                    organisation_id,
                ),
            )

            employees = cursor.fetchall()

            employee_a_id = next(
                row["id"]
                for row in employees
                if row["employee_number"] == "PUL313-EMP-001"
            )

            employee_b_id = next(
                row["id"]
                for row in employees
                if row["employee_number"] == "PUL313-EMP-002"
            )


            # ====================================================
            # 3. Canonical services
            # ====================================================

            cursor.execute(
                """
                SELECT
                    id,
                    code
                FROM public.services
                WHERE code IN (
                    'BP',
                    'BMI',
                    'GLUCOSE',
                    'DENTAL'
                )
                """
            )

            services = {
                row["code"]: row["id"]
                for row in cursor.fetchall()
            }

            required_codes = {
                "BP",
                "BMI",
                "GLUCOSE",
                "DENTAL",
            }

            missing_services = (
                required_codes - set(services.keys())
            )

            if missing_services:
                pytest.fail(
                    "Test database is missing canonical services: "
                    + ", ".join(sorted(missing_services))
                )

            bp_service_id = services["BP"]
            bmi_service_id = services["BMI"]
            glucose_service_id = services["GLUCOSE"]
            dental_service_id = services["DENTAL"]


            # ====================================================
            # 4. Programme
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.programmes (
                    organisation_id,
                    name,
                    starts_on,
                    ends_on
                )
                VALUES (
                    %s,
                    'PUL-313 Test Wellness Programme',
                    '2026-09-01',
                    '2026-09-30'
                )
                RETURNING id
                """,
                (organisation_id,),
            )

            programme_id = cursor.fetchone()["id"]


            # ====================================================
            # 5. Programme participants
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.programme_participants (
                    programme_id,
                    employee_id,
                    eligibility_status,
                    registration_status
                )
                VALUES
                    (
                        %s,
                        %s,
                        'Eligible',
                        'Registered'
                    ),
                    (
                        %s,
                        %s,
                        'Eligible',
                        'Registered'
                    )
                RETURNING
                    id,
                    employee_id
                """,
                (
                    programme_id,
                    employee_a_id,
                    programme_id,
                    employee_b_id,
                ),
            )

            participants = cursor.fetchall()

            participant_a_id = next(
                row["id"]
                for row in participants
                if row["employee_id"] == employee_a_id
            )

            participant_b_id = next(
                row["id"]
                for row in participants
                if row["employee_id"] == employee_b_id
            )


            # ====================================================
            # 6. Programme services
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.programme_services (
                    programme_id,
                    service_id
                )
                VALUES
                    (%s, %s),
                    (%s, %s),
                    (%s, %s),
                    (%s, %s)
                RETURNING
                    id,
                    service_id
                """,
                (
                    programme_id, bp_service_id,
                    programme_id, bmi_service_id,
                    programme_id, glucose_service_id,
                    programme_id, dental_service_id,
                ),
            )

            programme_services = {
                row["service_id"]: row["id"]
                for row in cursor.fetchall()
            }

            bp_programme_service_id = (
                programme_services[bp_service_id]
            )

            bmi_programme_service_id = (
                programme_services[bmi_service_id]
            )

            glucose_programme_service_id = (
                programme_services[glucose_service_id]
            )

            dental_programme_service_id = (
                programme_services[dental_service_id]
            )


            # ====================================================
            # 7. Required participant-service combinations
            # ====================================================
            #
            # A requires BP, BMI, Glucose.
            # B requires BP, BMI.
            #
            # Dental is deliberately NOT required.
            #
            # Denominator = 5.

            cursor.execute(
                """
                INSERT INTO public.programme_participant_services (
                    programme_participant_id,
                    programme_service_id
                )
                VALUES
                    (%s, %s),
                    (%s, %s),
                    (%s, %s),
                    (%s, %s),
                    (%s, %s)
                """,
                (
                    participant_a_id,
                    bp_programme_service_id,

                    participant_a_id,
                    bmi_programme_service_id,

                    participant_a_id,
                    glucose_programme_service_id,

                    participant_b_id,
                    bp_programme_service_id,

                    participant_b_id,
                    bmi_programme_service_id,
                ),
            )


            # ====================================================
            # 8. Activation
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.activations (
                    programme_id,
                    organisation_id,
                    title,
                    location,
                    starts_at,
                    ends_at
                )
                VALUES (
                    %s,
                    %s,
                    'PUL-313 Test Activation',
                    'Test Location',
                    '2026-09-15 08:00:00+02',
                    '2026-09-15 16:00:00+02'
                )
                RETURNING id
                """,
                (
                    programme_id,
                    organisation_id,
                ),
            )

            activation_id = cursor.fetchone()["id"]


            # ====================================================
            # 9. Test practitioner
            # ====================================================
            #
            # profiles.id references auth.users.id.
            #
            # The platform migration already has a trigger which
            # creates public.profiles after an auth.users insert.
            #
            # Therefore we create the temporary auth user first.

            practitioner_user_id = uuid.uuid4()

            cursor.execute(
                """
                INSERT INTO auth.users (
                    id,
                    instance_id,
                    aud,
                    role,
                    email,
                    encrypted_password,
                    email_confirmed_at,
                    raw_app_meta_data,
                    raw_user_meta_data,
                    created_at,
                    updated_at
                )
                VALUES (
                    %s,
                    '00000000-0000-0000-0000-000000000000',
                    'authenticated',
                    'authenticated',
                    'pul313-practitioner@example.test',
                    '',
                    now(),
                    '{}',
                    '{"full_name": "PUL-313 Test Practitioner"}',
                    now(),
                    now()
                )
                """,
                (practitioner_user_id,),
            )

            # Verify that the auth trigger created public.profiles.

            cursor.execute(
                """
                SELECT id
                FROM public.profiles
                WHERE id = %s
                """,
                (practitioner_user_id,),
            )

            if cursor.fetchone() is None:
                pytest.fail(
                    "Creating the test auth user did not create "
                    "the expected public.profiles record."
                )


            # ====================================================
            # 10. Practitioner professional profile
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.practitioner_profiles (
                    user_id,
                    professional_email,
                    profession
                )
                VALUES (
                    %s,
                    'pul313-practitioner@example.test',
                    'Nurse'
                )
                """,
                (practitioner_user_id,),
            )


            # ====================================================
            # 11. Practitioner assignment
            # ====================================================

            cursor.execute(
                """
                INSERT INTO public.practitioner_assignments (
                    practitioner_user_id,
                    organisation_id,
                    programme_name,
                    activity_name,
                    service_name,
                    location,
                    starts_at,
                    activation_id
                )
                VALUES (
                    %s,
                    %s,
                    'PUL-313 Test Wellness Programme',
                    'PUL-313 Test Activation',
                    'Health Screening',
                    'Test Location',
                    '2026-09-15 08:00:00+02',
                    %s
                )
                RETURNING id
                """,
                (
                    practitioner_user_id,
                    organisation_id,
                    activation_id,
                ),
            )

            assignment_id = cursor.fetchone()["id"]


            # ====================================================
            # 12. Required screening records
            # ====================================================
            #
            # Participant A:
            #
            # BP      -> Approved
            # BMI     -> Approved
            # Glucose -> Draft
            #
            # Participant B:
            #
            # BP      -> Needs Correction
            # BMI     -> Approved
            #
            # Only Approved counts.
            #
            # Numerator = 3.

            cursor.execute(
                """
                INSERT INTO public.screenings (
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    programme_participant_id,
                    participant_reference,
                    consent_confirmed,
                    status,
                    reviewed_at,
                    service_id
                )
                VALUES

                    -- Participant A: BP -> completed
                    (
                        %s, %s, %s, %s, %s,
                        'PUL313-EMP-001',
                        TRUE,
                        'Approved',
                        now(),
                        %s
                    ),

                    -- Participant A: BMI -> completed
                    (
                        %s, %s, %s, %s, %s,
                        'PUL313-EMP-001',
                        TRUE,
                        'Approved',
                        now(),
                        %s
                    ),

                    -- Participant A: Glucose -> incomplete
                    (
                        %s, %s, %s, %s, %s,
                        'PUL313-EMP-001',
                        FALSE,
                        'Draft',
                        NULL,
                        %s
                    ),

                    -- Participant B: BP -> correction required
                    (
                        %s, %s, %s, %s, %s,
                        'PUL313-EMP-002',
                        TRUE,
                        'Needs Correction',
                        now(),
                        %s
                    ),

                    -- Participant B: BMI -> completed
                    (
                        %s, %s, %s, %s, %s,
                        'PUL313-EMP-002',
                        TRUE,
                        'Approved',
                        now(),
                        %s
                    )
                """,
                (
                    # Participant A — BP
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_a_id,
                    bp_service_id,

                    # Participant A — BMI
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_a_id,
                    bmi_service_id,

                    # Participant A — Glucose
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_a_id,
                    glucose_service_id,

                    # Participant B — BP
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_b_id,
                    bp_service_id,

                    # Participant B — BMI
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_b_id,
                    bmi_service_id,
                ),
            )


            # ====================================================
            # 13. Non-required Approved screening
            # ====================================================
            #
            # Participant A receives an Approved Dental screening.
            #
            # Dental belongs to the programme, but it is NOT in
            # programme_participant_services for Participant A.
            #
            # Therefore this record must NOT change the KPI.

            cursor.execute(
                """
                INSERT INTO public.screenings (
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    programme_participant_id,
                    participant_reference,
                    consent_confirmed,
                    status,
                    reviewed_at,
                    service_id
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    'PUL313-EMP-001',
                    TRUE,
                    'Approved',
                    now(),
                    %s
                )
                """,
                (
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_a_id,
                    dental_service_id,
                ),
            )


            # ====================================================
            # 14. Duplicate Approved screening
            # ====================================================
            #
            # Participant A already has an Approved BP screening.
            #
            # Add another one.
            #
            # The KPI must still count A/BP only once because
            # the analytics view uses EXISTS.

            cursor.execute(
                """
                INSERT INTO public.screenings (
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    programme_participant_id,
                    participant_reference,
                    consent_confirmed,
                    status,
                    reviewed_at,
                    service_id
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    'PUL313-EMP-001',
                    TRUE,
                    'Approved',
                    now(),
                    %s
                )
                """,
                (
                    organisation_id,
                    activation_id,
                    assignment_id,
                    practitioner_user_id,
                    participant_a_id,
                    bp_service_id,
                ),
            )


        # ========================================================
        # Give IDs to pytest
        # ========================================================

        yield {
            "organisation_a": organisation_id,
            "programme_a": programme_id,
            "activation_a": activation_id,

            "employee_a": employee_a_id,
            "employee_b": employee_b_id,

            "participant_a": participant_a_id,
            "participant_b": participant_b_id,

            "practitioner": practitioner_user_id,
            "assignment": assignment_id,

            "bp_service": bp_service_id,
            "bmi_service": bmi_service_id,
            "glucose_service": glucose_service_id,
            "dental_service": dental_service_id,

            "bp_programme_service":
                bp_programme_service_id,

            "bmi_programme_service":
                bmi_programme_service_id,

            "glucose_programme_service":
                glucose_programme_service_id,

            "dental_programme_service":
                dental_programme_service_id,
        }

    finally:
        # Everything above is part of this transaction.
        # Remove all controlled data after the test.
        connection.rollback()