"""Integration tests for the PUL-314 Screening Participation view."""

from decimal import Decimal


def get_participation_result(db_connection, organisation_id):
    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                eligible_participant_count,
                screened_participant_count,
                screening_participation_rate_pct
            FROM public.analytics_screening_participation
            WHERE organisation_id = %s
            """,
            (organisation_id,),
        )
        return cursor.fetchone()


def test_counts_each_programme_participant_once(
    db_connection,
    screening_completion_data,
):
    """Multiple screenings by one person count as one screened person."""
    organisation_id = screening_completion_data["organisation_a"]
    programme_id = screening_completion_data["programme"]

    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO public.employees (
                organisation_id, employee_number, full_name
            )
            VALUES (%s, 'PUL314-C', 'Participant C')
            RETURNING id
            """,
            (organisation_id,),
        )
        employee_id = cursor.fetchone()["id"]

        cursor.execute(
            """
            INSERT INTO public.programme_participants (
                programme_id, employee_id, eligibility_status, registration_status
            )
            VALUES (%s, %s, 'Eligible', 'Registered')
            """,
            (programme_id, employee_id),
        )

    result = get_participation_result(db_connection, organisation_id)

    assert result is not None
    assert result["eligible_participant_count"] == 3
    assert result["screened_participant_count"] == 2
    assert result["screening_participation_rate_pct"] == Decimal("66.67")


def test_organisation_with_no_eligible_participants_returns_zero(
    db_connection,
):
    with db_connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO public.organisations (name, slug)
            VALUES ('PUL-314 Empty Organisation', 'pul-314-empty-organisation')
            RETURNING id
            """
        )
        organisation_id = cursor.fetchone()["id"]

    result = get_participation_result(db_connection, organisation_id)

    assert result is not None
    assert result["eligible_participant_count"] == 0
    assert result["screened_participant_count"] == 0
    assert result["screening_participation_rate_pct"] == Decimal("0")
