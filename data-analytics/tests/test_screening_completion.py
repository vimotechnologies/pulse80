"""
Integration tests for the Screening Completion Analytics view.

Jira: PUL-313

These tests verify that public.analytics_screening_completion
implements the approved Pulse80 Screening Completion Rate rules.

Formula:

    completed required screenings
    ----------------------------- x 100
     expected required screenings

Business rules:

1. Only Eligible participants are included.
2. Only Registered participants are included.
3. Expected screenings come from participant-specific required services.
4. Only Approved screenings count as completed.
5. Draft, Submitted and Needs Correction do not count as completed.
6. Multiple Approved records for the same requirement count once.
7. Approved screenings for non-required services do not count.
8. Results are separated by organisation.
"""

from decimal import Decimal

# import pytest

# ============================================================
# Helpers
# ============================================================

def get_completion_result(
    db_connection,
    organisation_id,
):
    """
    Return the Screening Completion result for one organisation.
    """

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                organisation_id,
                expected_required_screenings,
                completed_required_screenings,
                screening_completion_rate
            FROM public.analytics_screening_completion
            WHERE organisation_id = %s
            """,
            (organisation_id,),
        )

        return cursor.fetchone()


def get_required_screenings(
    db_connection,
    organisation_id,
):
    """
    Return the participant-service requirements used by the
    denominator.

    This mirrors the relationship used by the analytics view,
    but it does NOT calculate the completion rate.
    """

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                pp.id AS programme_participant_id,
                ps.service_id
            FROM public.programme_participant_services pps

            JOIN public.programme_participants pp
                ON pp.id = pps.programme_participant_id

            JOIN public.programme_services ps
                ON ps.id = pps.programme_service_id
                AND ps.programme_id = pp.programme_id

            JOIN public.programmes p
                ON p.id = pp.programme_id

            WHERE p.organisation_id = %s
              AND pp.eligibility_status = 'Eligible'
              AND pp.registration_status = 'Registered'

            ORDER BY
                pp.id,
                ps.service_id
            """,
            (organisation_id,),
        )

        return cursor.fetchall()


# ============================================================
# Main calculation
# ============================================================

def test_screening_completion_rate(
    db_connection,
    screening_completion_data,
):
    """
    Main controlled scenario:

        Required = 5
        Approved = 3

        3 / 5 * 100 = 60.00%
    """

    organisation_id = (
        screening_completion_data["organisation_a"]
    )

    result = get_completion_result(
        db_connection,
        organisation_id,
    )

    assert result is not None

    assert (
        result["expected_required_screenings"]
        == 5
    )

    assert (
        result["completed_required_screenings"]
        == 3
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("60.00")
    )


# ============================================================
# Required participant-service combinations
# ============================================================

def test_required_screenings_are_identified_correctly(
    db_connection,
    screening_completion_data,
):
    """
    Participant A requires:
        BP
        BMI
        Glucose

    Participant B requires:
        BP
        BMI

    Therefore exactly five requirements must exist.
    """

    organisation_id = (
        screening_completion_data["organisation_a"]
    )

    rows = get_required_screenings(
        db_connection,
        organisation_id,
    )

    actual = {
        (
            row["programme_participant_id"],
            row["service_id"],
        )
        for row in rows
    }

    expected = {
        (
            screening_completion_data["participant_a"],
            screening_completion_data["bp_service"],
        ),
        (
            screening_completion_data["participant_a"],
            screening_completion_data["bmi_service"],
        ),
        (
            screening_completion_data["participant_a"],
            screening_completion_data["glucose_service"],
        ),
        (
            screening_completion_data["participant_b"],
            screening_completion_data["bp_service"],
        ),
        (
            screening_completion_data["participant_b"],
            screening_completion_data["bmi_service"],
        ),
    }

    assert actual == expected
    assert len(actual) == 5


# ============================================================
# Approved status
# ============================================================

def test_only_approved_screenings_count_as_completed(
    db_connection,
    screening_completion_data,
):
    """
    Controlled screening statuses:

        Approved         -> count
        Approved         -> count
        Draft            -> do not count
        Needs Correction -> do not count
        Approved         -> count

    Therefore completed = 3.
    """

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    assert (
        result["completed_required_screenings"]
        == 3
    )


# ============================================================
# Draft does not count
# ============================================================

def test_draft_screening_does_not_count_as_completed(
    db_connection,
    screening_completion_data,
):
    """
    Participant A's Glucose requirement is Draft.

    Change it to Approved.

    Completion should move:

        3 -> 4

    Rate should move:

        60% -> 80%

    This proves the original Draft record was not counted.
    """

    participant_id = (
        screening_completion_data["participant_a"]
    )

    glucose_service_id = (
        screening_completion_data["glucose_service"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE public.screenings

            SET
                status = 'Approved',
                consent_confirmed = TRUE,
                reviewed_at = now()

            WHERE programme_participant_id = %s
              AND service_id = %s
              AND status = 'Draft'
            """,
            (
                participant_id,
                glucose_service_id,
            ),
        )

        assert cursor.rowcount == 1

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    assert (
        result["expected_required_screenings"]
        == 5
    )

    assert (
        result["completed_required_screenings"]
        == 4
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("80.00")
    )


# ============================================================
# Needs Correction does not count
# ============================================================

def test_needs_correction_does_not_count_as_completed(
    db_connection,
    screening_completion_data,
):
    """
    Participant B's BP screening is Needs Correction.

    Change it to Approved.

    Completion should move:

        3 -> 4

    This proves Needs Correction was previously excluded.
    """

    participant_id = (
        screening_completion_data["participant_b"]
    )

    bp_service_id = (
        screening_completion_data["bp_service"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE public.screenings

            SET
                status = 'Approved',
                consent_confirmed = TRUE,
                reviewed_at = now()

            WHERE programme_participant_id = %s
              AND service_id = %s
              AND status = 'Needs Correction'
            """,
            (
                participant_id,
                bp_service_id,
            ),
        )

        assert cursor.rowcount == 1

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    assert (
        result["completed_required_screenings"]
        == 4
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("80.00")
    )


# ============================================================
# Non-required service
# ============================================================

def test_non_required_service_does_not_affect_completion(
    db_connection,
    screening_completion_data,
):
    """
    Participant A has an Approved Dental screening.

    Dental belongs to the programme but is NOT required for
    Participant A.

    Therefore Dental must not increase either the denominator
    or numerator.
    """

    participant_id = (
        screening_completion_data["participant_a"]
    )

    dental_service_id = (
        screening_completion_data["dental_service"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM public.screenings
            WHERE programme_participant_id = %s
              AND service_id = %s
              AND status = 'Approved'
            """,
            (
                participant_id,
                dental_service_id,
            ),
        )

        dental_result = cursor.fetchone()

    # Prove that the Approved Dental screening really exists.
    assert dental_result["count"] == 1

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    # It must still be 5 / 3 / 60%.
    assert (
        result["expected_required_screenings"]
        == 5
    )

    assert (
        result["completed_required_screenings"]
        == 3
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("60.00")
    )


# ============================================================
# Duplicate Approved screening
# ============================================================

def test_duplicate_approved_screening_counts_once(
    db_connection,
    screening_completion_data,
):
    """
    Participant A has two Approved BP screening records.

    BP is only one requirement.

    Therefore the two records must contribute only one
    completed requirement.
    """

    participant_id = (
        screening_completion_data["participant_a"]
    )

    bp_service_id = (
        screening_completion_data["bp_service"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM public.screenings
            WHERE programme_participant_id = %s
              AND service_id = %s
              AND status = 'Approved'
            """,
            (
                participant_id,
                bp_service_id,
            ),
        )

        duplicate_result = cursor.fetchone()

    # Prove that there really are two Approved BP records.
    assert duplicate_result["count"] == 2

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    # They must still contribute only one completion.
    assert (
        result["completed_required_screenings"]
        == 3
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("60.00")
    )


# ============================================================
# Multiple services per participant
# ============================================================

def test_participant_can_have_multiple_required_services(
    db_connection,
    screening_completion_data,
):
    """
    Participant A has three requirements.

    This verifies that the model does not assume one service
    per participant.
    """

    participant_id = (
        screening_completion_data["participant_a"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*) AS count

            FROM public.programme_participant_services pps

            JOIN public.programme_services ps
                ON ps.id = pps.programme_service_id

            WHERE pps.programme_participant_id = %s
            """,
            (participant_id,),
        )

        result = cursor.fetchone()

    assert result["count"] == 3


# ============================================================
# Eligible participant rule
# ============================================================

def test_not_eligible_participant_is_excluded(
    db_connection,
    screening_completion_data,
):
    """
    Change Participant B from Eligible to Not Eligible.

    Participant B has two required services.

    Original denominator:
        5

    New denominator:
        3

    Only Participant A should remain.
    """

    participant_b_id = (
        screening_completion_data["participant_b"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE public.programme_participants

            SET eligibility_status = 'Not Eligible'

            WHERE id = %s
            """,
            (participant_b_id,),
        )

        assert cursor.rowcount == 1

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    assert (
        result["expected_required_screenings"]
        == 3
    )

    # Participant A has BP and BMI Approved.
    # Glucose is Draft.
    assert (
        result["completed_required_screenings"]
        == 2
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("66.67")
    )


# ============================================================
# Registered participant rule
# ============================================================

def test_non_registered_participant_is_excluded(
    db_connection,
    screening_completion_data,
):
    """
    Change Participant B from Registered to Declined.

    Participant B's requirements must leave the denominator.

    Expected:

        required  = 3
        completed = 2
        rate      = 66.67%
    """

    participant_b_id = (
        screening_completion_data["participant_b"]
    )

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE public.programme_participants

            SET registration_status = 'Declined'

            WHERE id = %s
            """,
            (participant_b_id,),
        )

        assert cursor.rowcount == 1

    result = get_completion_result(
        db_connection,
        screening_completion_data["organisation_a"],
    )

    assert (
        result["expected_required_screenings"]
        == 3
    )

    assert (
        result["completed_required_screenings"]
        == 2
    )

    assert (
        result["screening_completion_rate"]
        == Decimal("66.67")
    )


# ============================================================
# Organisation filtering
# ============================================================

def test_results_are_filtered_by_organisation(
    db_connection,
    screening_completion_data,
):
    """
    Querying Organisation A must return Organisation A only.

    This verifies that the analytics result can safely be
    filtered by organisation_id.
    """

    organisation_id = (
        screening_completion_data["organisation_a"]
    )

    result = get_completion_result(
        db_connection,
        organisation_id,
    )

    assert result is not None

    assert (
        result["organisation_id"]
        == organisation_id
    )

    assert (
        result["expected_required_screenings"]
        == 5
    )

    assert (
        result["completed_required_screenings"]
        == 3
    )


# ============================================================
# Unknown organisation
# ============================================================

def test_unknown_organisation_returns_no_result(
    db_connection,
    screening_completion_data,
):
    """
    An organisation with no required screening data should not
    appear in the current analytics view.
    """

    unknown_organisation_id = (
        "00000000-0000-0000-0000-000000000001"
    )

    result = get_completion_result(
        db_connection,
        unknown_organisation_id,
    )

    assert result is None