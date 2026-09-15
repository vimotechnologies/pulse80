# Pulse80 Analytics API Contract

> Production implementation update: use [production-database-mapping.md](production-database-mapping.md) and [analytics-testing.md](analytics-testing.md). CSV-era table names, counts and query paths below remain EDA/reference material; they do not override the approved KPI catalogue or the mapped production SQL. The internal views use the `analytics` schema. API/dashboard integration is still a separate acceptance gate.

## Purpose

This contract defines how approved analytics should move from the database/query layer into GraphQL and the dashboard. It prevents the frontend from creating its own definitions.

## Organisation analytics query

Recommended GraphQL shape:

```graphql
type OrganisationAnalytics {
  registeredEmployees: Int!
  programmeParticipants: Int!
  participantsScreened: Int!
  screeningEvents: Int!
  completedScreeningEvents: Int!
  riskLevels: [RiskLevelMetric!]!
  referrals: ReferralAnalytics!
}

type RiskLevelMetric {
  riskLevel: String!
  count: Int!
}

type ReferralAnalytics {
  required: Int!
  created: Int!
  missingRequired: Int!
  creationCoveragePercent: Float!
  statusFunnel: [ReferralStatusMetric!]!
}

type ReferralStatusMetric {
  status: String!
  count: Int!
}

extend type Query {
  organisationAnalytics(
    organisationId: ID!
    programmeId: ID
    branchId: ID
    departmentId: ID
    from: DateTime
    to: DateTime
  ): OrganisationAnalytics!
}
```

## Resolver/service rules

1. Resolve the authenticated user's organisation/permissions first.
2. Reject an `organisationId` the caller cannot access.
3. Apply organisation scope before aggregation.
4. Read canonical metrics from the analytics query layer/views.
5. Do not fetch employee-level health rows and aggregate them in the browser.
6. Do not calculate `participantsScreened` by counting screening rows.
7. Return both `participantsScreened` and `screeningEvents` because they answer different questions.
8. Keep missing required referrals visible in the response.

## Example response

```json
{
  "data": {
    "organisationAnalytics": {
      "registeredEmployees": 28,
      "programmeParticipants": 28,
      "participantsScreened": 28,
      "screeningEvents": 144,
      "completedScreeningEvents": 144,
      "riskLevels": [],
      "referrals": {
        "required": 37,
        "created": 12,
        "missingRequired": 25,
        "creationCoveragePercent": 32.43,
        "statusFunnel": [
          { "status": "completed", "count": 8 },
          { "status": "scheduled", "count": 2 },
          { "status": "issued", "count": 2 }
        ]
      }
    }
  }
}
```

The example uses current EDA validation baselines where supported. It is not a production promise and must be reconciled against the database after the analytics views are mapped to the production schema.

## Important existing-backend correction

The current organisation dashboard service calculates screening participation using:

`total screening rows / workforce size`

That mixes service-level screening events with people. Under the analytics contract, participation must use a distinct participant/person grain and an approved denominator. Until the denominator is agreed, the existing `screeningParticipation` value should not be treated as the canonical programme participation KPI.

## Error behaviour

- Unauthorised organisation: return an authorisation error, not zero analytics.
- Analytics query failure: return a backend error and log it; do not silently substitute zero.
- No data in an authorised scope: return valid zero counts/empty arrays.
- Broken required join: fail validation/release tests rather than hiding records.

## Ownership

- Data engineering owns KPI definitions and analytics query correctness.
- Backend engineering owns authorisation, API contract and reliable query execution.
- Frontend/product owns presentation and filtering UX, not metric formulas.

