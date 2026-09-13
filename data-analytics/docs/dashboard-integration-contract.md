# Pulse80 Dashboard Integration Contract

## Purpose

This is the handoff from analytics/backend to the Pulse80 dashboard. It defines what the UI may display and how each number must be interpreted.

## First dashboard metrics

| UI label | API field | Meaning | Do not confuse with |
|---|---|---|---|
| Registered Employees | `registeredEmployees` | distinct employees represented in scope | workforce estimate from organisation profile |
| Programme Participants | `programmeParticipants` | distinct employees with participation records | screening events |
| Participants Screened | `participantsScreened` | distinct participants with qualifying screening activity | number of service/station screening rows |
| Screening Events | `screeningEvents` | distinct screening service/station events | people screened |
| Completed Screening Events | `completedScreeningEvents` | completed screening events | programme completion rate |
| Referrals Required | `referrals.required` | risk assessments requiring referral | referral records created |
| Referrals Created | `referrals.created` | actual referral records | risks requiring referral |
| Missing Required Referrals | `referrals.missingRequired` | required referrals with no referral record | pending referral status |
| Referral Coverage | `referrals.creationCoveragePercent` | created required referrals / all required referrals | follow-up completion |

## Display rules

1. The frontend displays API values; it does not recalculate canonical KPIs.
2. `Participants Screened` and `Screening Events` must remain separate labels.
3. Percentages should display the API result and the UI may format it, e.g. `32.43%` to `32.4%`.
4. Filters sent to the API must be visible to the user so the scope of the number is clear.
5. If no data exists, show a neutral zero/empty state. If the API fails, show an error state rather than zero.
6. Do not expose employee-level health information in client aggregate dashboards.
7. Known operational exceptions such as missing required referrals should be visible to authorised operational/admin users rather than silently excluded.

## Reconciliation rule

Before release, every dashboard card/chart must be checked against the API response, and every API response must be checked against the canonical analytics query.

Example reconciliation chain:

```text
Source data
  -> analytics_screening_facts
  -> analytics_screening_summary
  -> organisationAnalytics GraphQL query
  -> dashboard card
```

If `participantsScreened = 28` at the analytics layer, the API and dashboard must both show 28 for the same filters.

## Existing dashboard caution

The current backend `getOrganisationStats()` derives `screeningParticipation` from total screening rows divided by workforce size. Because a participant can have several service-level screening rows, that can overstate participation and is not the approved KPI definition.

The dashboard should migrate to the canonical analytics API before treating participation as a decision-grade metric.

## Release acceptance

A dashboard metric is accepted when:

- the label matches the KPI catalogue;
- the API field matches the analytics definition;
- organisation/tenant scope is enforced;
- filters produce the same scope in query, API and UI;
- zero-data and error states are different;
- source-to-dashboard reconciliation passes;
- no employee-level health detail is leaked into aggregate client views.
