# Pulse80 Join Validation Contract

## Purpose

This is the implementation gate between EDA and dashboard analytics. It defines which joins are allowed, what cardinality is expected, and what must fail validation before a KPI is trusted.

## Canonical analytics path

`Organisation -> Employee -> Participation -> Screening -> Risk Assessment -> Referral -> Follow Up`

Service context:

`Programme -> Programme Service -> Screening`

Delivery context:

`Provider -> Practitioner -> Screening`

Measurement context:

`Screening -> Measurement`

## Required joins

| Parent | Child | Join | Expected relationship | Validation rule |
|---|---|---|---|---|
| Organisation | Employee | `organisation_id` | 1:many | every employee organisation must exist |
| Branch | Employee | `branch_id` | 1:many | every populated employee branch must exist and belong to same organisation |
| Department | Employee | `department_id` | 1:many | every populated employee department must exist and belong to same organisation |
| Organisation | Programme | `organisation_id` | 1:many | every programme organisation must exist |
| Employee | Participation | `employee_id` | 1:many over time | every participation employee must exist |
| Programme | Participation | `programme_id` | 1:many | every participation programme must exist |
| Programme | Programme Service | `programme_id` | 1:many | every programme-service programme must exist |
| Service | Programme Service | `service_id` | 1:many | every programme-service service must exist |
| Participation | Screening | `participation_id` | 1:many | every screening participation must exist |
| Programme Service | Screening | `programme_service_id` | 1:many | every screening programme service must exist |
| Practitioner | Screening | `practitioner_id` | 1:many | every populated screening practitioner must exist |
| Screening | Measurement | `screening_id` | 1:many | every measurement screening must exist; `(screening_id, metric_code)` should be unique at the current grain |
| Screening | Risk Assessment | `screening_id` | currently 1:1 | every risk screening must exist; current data expects at most one assessment per screening |
| Risk Assessment | Referral | `risk_assessment_id` | 1:0..1 in current data | every referral risk assessment must exist; referral absence is allowed only when referral is not required |
| Referral | Follow Up | `referral_id` | 1:many | every follow-up referral must exist |

## Cross-join consistency tests

A foreign key existing is not enough. The joined business context must also agree.

1. Employee branch and department must belong to the employee's organisation.
2. Participation's programme and employee must resolve to the same organisation.
3. Screening's programme service must belong to the same programme as the screening participation.
4. A risk assessment must resolve to exactly one screening at the current model grain.
5. A referral must point to a risk assessment where `requires_referral = true`.
6. A follow-up must point to a real referral.
7. Organisation-level KPI queries must resolve tenant scope before aggregation.

## Known current exception

The referral EDA found 37 risk assessments where `requires_referral = true`, but only 12 referral records. This leaves 25 required referrals without a referral record. This is a valid analytics finding but an operational/data-quality exception. It must not be hidden by inner joins.

Use a LEFT JOIN from required Risk Assessments to Referrals when calculating referral coverage.

## SQL validation pattern

The production table names may differ from CSV/analytics names. Apply this pattern using the mapped production names:

```sql
-- Orphan child records should return zero rows.
select child.foreign_key
from child
left join parent on parent.id = child.foreign_key
where parent.id is null;

-- Required referrals missing a referral should be visible, not dropped.
select rsk.risk_assessment_id
from risk_assessments rsk
left join referrals ref
  on ref.risk_assessment_id = rsk.risk_assessment_id
where rsk.requires_referral = true
  and ref.referral_id is null;
```

## Release gate

A dashboard KPI is production-ready only when:

- its required joins pass orphan checks;
- its cardinality matches this contract or an approved model change;
- cross-organisation mismatches are zero;
- the metric definition is in `dashboard-kpi-catalogue.md`;
- known exceptions are explicitly reported;
- tenant/RLS controls are applied before aggregate data leaves the database/backend.
