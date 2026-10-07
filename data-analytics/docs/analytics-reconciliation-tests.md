# Pulse80 Analytics Reconciliation Tests

## Purpose

These tests prove that dashboard numbers mean what Pulse80 says they mean. They are the final gate from source data to dashboard analytics.

## Baseline reconciliation for the current EDA sample

The current EDA provides the following known validation values:

| Check | Expected current sample |
|---|---:|
| Employee rows | 28 |
| Participation rows | 28 |
| Screening events | 144 |
| Measurement observations | 264 |
| Risk assessments | 144 |
| Risk assessments requiring referral | 37 |
| Risk assessments not requiring referral | 107 |
| Referral records | 12 |
| Missing required referrals | 25 |
| Referral creation coverage | 32.43% |
| Completed referrals | 8 |
| Scheduled referrals | 2 |
| Issued referrals | 2 |
| Follow-up records | 8 |

These are sample-validation baselines, not targets.

## Test 1: people are not screening events

Pass when:

- `screeningEvents` counts distinct `screening_id`;
- `participantsScreened` counts distinct qualifying `participation_id`;
- the two metrics are allowed to differ;
- frontend code does not substitute one for the other.

## Test 2: risk totals reconcile

Pass when:

`requires referral + does not require referral = total risk assessments`

Current sample:

`37 + 107 = 144`

## Test 3: referral coverage reconciles

Pass when:

`created required referrals + missing required referrals = required referrals`

Current sample:

`12 + 25 = 37`

and:

`12 / 37 * 100 = 32.43%`

## Test 4: referral funnel reconciles

Pass when referral statuses sum to total referrals.

Current sample:

`8 completed + 2 scheduled + 2 issued = 12 referrals`

## Test 5: follow-up integrity

Pass when:

- every follow-up points to an existing referral;
- completed-referral follow-up coverage matches the agreed business rule;
- missing follow-ups are reported rather than lost through joins.

Current EDA reports 8 follow-up records and all 8 completed referrals having a follow-up.

## Test 6: tenant isolation

For every organisation analytics request:

- querying organisation A must not include employees, participations, screenings, measurements, risks, referrals or follow-ups belonging to organisation B;
- unauthorised organisation access must fail, not return a misleading zero;
- branch and department filters must remain inside the authorised organisation.

## Test 7: join integrity

Run orphan checks defined in `join-validation-contract.md`. Required parent-child joins must return zero unexpected orphan records.

The known exception is not an orphan foreign key: it is a missing business record — 25 required referrals have no Referral row. That exception must remain visible.

## Test 8: API reconciliation

For a fixed organisation/programme/filter set:

1. run the canonical analytics query;
2. call the GraphQL analytics query;
3. compare every returned field;
4. fail when counts/percentages differ.

## Test 9: dashboard reconciliation

For the same fixed filter set:

1. capture the GraphQL response;
2. verify each card/chart displays the same value;
3. confirm only presentation formatting changes, not the calculation.

## Test 10: regression protection

When a KPI definition changes:

- update `dashboard-kpi-catalogue.md` first;
- update analytics SQL/query tests;
- update API tests;
- update dashboard expectations;
- record the definition/version change so historical reports are interpretable.

## Definition of done

The first analytics slice is done when:

`Source data -> validated joins -> analytics query -> GraphQL -> dashboard`

returns the same approved metric for the same scope, with tenant isolation and no hidden data-quality exceptions.
