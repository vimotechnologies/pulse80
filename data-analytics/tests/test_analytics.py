from decimal import Decimal
from uuid import uuid4
import psycopg
from psycopg import sql
import pytest


def insert(db, table, **values):
    row_id = values.setdefault('id', uuid4())
    db.execute(sql.SQL('INSERT INTO public.{} ({}) VALUES ({})').format(
        sql.Identifier(table), sql.SQL(',').join(map(sql.Identifier, values)),
        sql.SQL(',').join(sql.Placeholder() for _ in values)), list(values.values()))
    return row_id


def organisation(db):
    return insert(db, 'organisations', name='Synthetic Test Company', slug='test-' + uuid4().hex)


def programme(db, org):
    return insert(db, 'programmes', organisation_id=org, name='Test programme',
                  starts_on='2026-09-01', ends_on='2026-09-30')


@pytest.fixture
def sample(db):
    org = organisation(db)
    prog = programme(db, org)
    activation = insert(db, 'activations', organisation_id=org, programme_id=prog,
                        title='Test activation', location='Test site',
                        starts_at='2026-09-14T08:00Z', ends_at='2026-09-14T12:00Z')
    user = uuid4()
    db.execute('INSERT INTO auth.users (id,email) VALUES (%s,%s)', (user, 'synthetic@example.test'))
    db.execute("INSERT INTO practitioner_profiles(user_id,professional_email,profession) VALUES (%s,%s,'Nurse')",
               (user, 'synthetic@example.test'))
    assignment = insert(db, 'practitioner_assignments', practitioner_user_id=user,
                        organisation_id=org, activation_id=activation, programme_name='Test programme',
                        activity_name='Test activation', service_name='Blood Pressure Screening',
                        location='Test site', starts_at='2026-09-14T08:00Z')
    ids = []
    for ref, status in [('P1','Approved'), ('P1','Approved'), ('P2','Approved'),
                        ('P3','Approved'), ('P4','Approved'), ('P5','Draft')]:
        ids.append(insert(db, 'screenings', organisation_id=org, activation_id=activation,
                          assignment_id=assignment, practitioner_user_id=user,
                          participant_reference=ref, status=status, consent_confirmed=True,
                          reviewed_at='2026-09-14T13:00Z' if status == 'Approved' else None))
    employees = []
    for i in range(10):
        employee = insert(db, 'employees', organisation_id=org, employee_number=f'E{i}',
                          full_name='Synthetic Employee')
        employees.append(employee)
        insert(db, 'programme_participants', programme_id=prog, employee_id=employee,
               attendance_status='Attended' if i < 6 else 'Not Attended')
    for screening in ids[:3]:
        db.execute("INSERT INTO screening_outcomes(screening_id,referral_required,reporting_risk_category) VALUES (%s,true,'High')", (screening,))
    referrals = [insert(db, 'referrals', screening_id=s, status=status)
                 for s,status in zip(ids[:2], ['Completed','Scheduled'])]
    for _ in range(2):
        insert(db, 'referral_follow_ups', referral_id=referrals[0], outcome='Synthetic follow-up')
    return dict(org=org, prog=prog, activation=activation, user=user, assignment=assignment,
                screenings=ids, employees=employees, referrals=referrals)


def test_people_and_events(db, sample):
    assert db.execute('SELECT screening_events,completed_screening_events,participants_screened FROM analytics.screening_summary WHERE organisation_id=%s', (sample['org'],)).fetchone() == (6,5,4)


@pytest.mark.parametrize('status', ['Draft','Under Review','Needs Correction'])
def test_unapproved_records_do_not_count(db, sample, status):
    db.execute('UPDATE screenings SET status=%s WHERE id=%s', (status,sample['screenings'][0]))
    assert db.execute('SELECT completed_screening_events,participants_screened FROM analytics.screening_summary WHERE organisation_id=%s', (sample['org'],)).fetchone() == (4,4)


def test_participation(db, sample):
    assert db.execute('SELECT eligible_participants,attended_participants,participation_rate_pct FROM analytics.participation_summary WHERE programme_id=%s', (sample['prog'],)).fetchone() == (10,6,Decimal('60.00'))
    db.execute("UPDATE programme_participants SET eligibility_status='Not Eligible' WHERE employee_id=%s", (sample['employees'][0],))
    assert db.execute('SELECT eligible_participants,attended_participants,participation_rate_pct FROM analytics.participation_summary WHERE programme_id=%s', (sample['prog'],)).fetchone() == (9,5,Decimal('55.56'))


def test_referral_reconciliation(db, sample):
    assert db.execute('SELECT referral_required_count,referral_records_created,missing_required_referrals,referral_creation_coverage_pct FROM analytics.referral_coverage WHERE organisation_id=%s', (sample['org'],)).fetchone() == (3,2,1,Decimal('66.67'))
    assert db.execute('SELECT sum(referral_count),sum(referrals_with_follow_up) FROM analytics.referral_status_funnel WHERE organisation_id=%s', (sample['org'],)).fetchone() == (2,1)
    assert db.execute("SELECT count(*) FROM analytics.data_quality_exceptions WHERE organisation_id=%s AND exception_code='MISSING_REQUIRED_REFERRAL'", (sample['org'],)).fetchone() == (1,)
    assert db.execute('SELECT assessment_count,referral_required_count FROM analytics.risk_summary WHERE organisation_id=%s', (sample['org'],)).fetchone() == (3,3)


def test_empty_denominators(db, sample):
    prog = programme(db,sample['org'])
    assert db.execute('SELECT eligible_participants,attended_participants,participation_rate_pct FROM analytics.participation_summary WHERE programme_id=%s', (prog,)).fetchone() == (0,0,None)
    db.execute('DELETE FROM referrals')
    db.execute('UPDATE screening_outcomes SET referral_required=false')
    assert db.execute('SELECT referral_creation_coverage_pct FROM analytics.referral_coverage WHERE organisation_id=%s', (sample['org'],)).fetchone() == (None,)


def test_cross_organisation_participation_flagged(db, sample):
    other = organisation(db)
    employee = insert(db,'employees',organisation_id=other,employee_number='OTHER',full_name='Other Test')
    insert(db,'programme_participants',programme_id=sample['prog'],employee_id=employee,attendance_status='Attended')
    assert db.execute('SELECT eligible_participants FROM analytics.participation_summary WHERE programme_id=%s', (sample['prog'],)).fetchone() == (10,)
    assert db.execute("SELECT count(*) FROM analytics.data_quality_exceptions WHERE exception_code='PARTICIPATION_ORGANISATION_MISMATCH'").fetchone() == (1,)


def test_cross_organisation_screening_flagged(db, sample):
    other=organisation(db)
    db.execute('UPDATE screenings SET organisation_id=%s WHERE id=%s',(other,sample['screenings'][0]))
    assert db.execute('SELECT count(*) FROM analytics.screening_summary WHERE organisation_id=%s',(other,)).fetchone() == (0,)
    assert db.execute("SELECT count(*) FROM analytics.data_quality_exceptions WHERE exception_code='SCREENING_CONTEXT_MISMATCH'").fetchone() == (1,)


def test_separate_organisation_counts(db, sample):
    other=organisation(db)
    assignment=insert(db,'practitioner_assignments',practitioner_user_id=sample['user'],organisation_id=other,
                      programme_name='Other',activity_name='Other',service_name='BP',location='Other site',starts_at='2026-09-14T08:00Z')
    insert(db,'screenings',organisation_id=other,assignment_id=assignment,practitioner_user_id=sample['user'],
           participant_reference='P1',status='Approved',consent_confirmed=True,reviewed_at='2026-09-14T13:00Z')
    assert db.execute('SELECT participants_screened FROM analytics.screening_summary WHERE organisation_id=%s',(other,)).fetchone() == (1,)
    assert db.execute('SELECT participants_screened FROM analytics.screening_summary WHERE organisation_id=%s',(sample['org'],)).fetchone() == (4,)


@pytest.mark.parametrize('role',['anon','authenticated'])
def test_client_roles_cannot_read_internal_views(db,sample,role):
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with db.transaction():
            db.execute(sql.SQL('SET LOCAL ROLE {}').format(sql.Identifier(role)))
            db.execute('SELECT * FROM analytics.screening_summary')


def test_backend_role_can_read(db,sample):
    db.execute('SET LOCAL ROLE service_role')
    assert db.execute('SELECT participants_screened FROM analytics.screening_summary WHERE organisation_id=%s',(sample['org'],)).fetchone() == (4,)
    assert db.execute('SELECT eligible_participants FROM analytics.participation_summary WHERE programme_id=%s',(sample['prog'],)).fetchone() == (10,)
    assert db.execute('SELECT referral_required_count FROM analytics.referral_coverage WHERE organisation_id=%s',(sample['org'],)).fetchone() == (3,)


def test_unrequired_referrals_remain_visible(db,sample):
    db.execute('UPDATE screening_outcomes SET referral_required=false WHERE screening_id=%s',(sample['screenings'][0],))
    assert db.execute('SELECT referral_required_count,referral_records_created FROM analytics.referral_coverage WHERE organisation_id=%s',(sample['org'],)).fetchone() == (2,1)
    assert db.execute('SELECT sum(referral_count) FROM analytics.referral_status_funnel WHERE organisation_id=%s',(sample['org'],)).fetchone() == (2,)
    assert db.execute("SELECT count(*) FROM analytics.data_quality_exceptions WHERE exception_code='REFERRAL_WITHOUT_REQUIRED_OUTCOME'").fetchone() == (1,)


def test_employee_status(db,sample):
    db.execute("UPDATE employees SET status='inactive' WHERE id=%s",(sample['employees'][0],))
    assert db.execute('SELECT registered_employees,active_employees FROM analytics.employee_summary WHERE organisation_id=%s',(sample['org'],)).fetchone() == (10,9)


def test_same_reference_in_another_activation_has_separate_scope(db, sample):
    activation = insert(db, 'activations', organisation_id=sample['org'], programme_id=sample['prog'],
                        title='Second activation', location='Second site',
                        starts_at='2026-09-15T08:00Z', ends_at='2026-09-15T12:00Z')
    assignment = insert(db, 'practitioner_assignments', practitioner_user_id=sample['user'],
                        organisation_id=sample['org'], activation_id=activation, programme_name='Test programme',
                        activity_name='Second activation', service_name='BP', location='Second site',
                        starts_at='2026-09-15T08:00Z')
    insert(db, 'screenings', organisation_id=sample['org'], activation_id=activation,
           assignment_id=assignment, practitioner_user_id=sample['user'], participant_reference='P1',
           status='Approved', consent_confirmed=True, reviewed_at='2026-09-15T13:00Z')
    assert db.execute('SELECT participants_screened FROM analytics.screening_summary WHERE organisation_id=%s AND activation_id=%s',
                      (sample['org'], activation)).fetchone() == (1,)
    assert db.execute('SELECT participants_screened FROM analytics.screening_summary WHERE organisation_id=%s AND activation_id=%s',
                      (sample['org'], sample['activation'])).fetchone() == (4,)


def test_unknown_activation_is_not_guessed_from_programme_name(db, sample):
    db.execute('UPDATE practitioner_assignments SET activation_id=NULL WHERE id=%s',(sample['assignment'],))
    db.execute('UPDATE screenings SET activation_id=NULL WHERE assignment_id=%s',(sample['assignment'],))
    assert db.execute('SELECT programme_id,activation_id,screening_events FROM analytics.screening_summary WHERE organisation_id=%s',
                      (sample['org'],)).fetchone() == (None,None,6)
