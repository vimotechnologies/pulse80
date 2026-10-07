# Screening relationship repair

Prepared on 4 October 2026 on `fix/screening-flow`. No live writes, migration application or deployment were performed.

## Live inspection: Pulse80

The repository CLI points to `pulse80-test`; the user confirmed that **Pulse80** (`iukqcnmnpkmrpsxvbvys`) is the investigation target. Do not use the CLI's linked project as an implicit production target.

Read-only catalogue and aggregate queries found:

| Item | Live state |
| --- | --- |
| Screenings | 214: 204 Completed, 10 Under Review |
| Screenings linked to participants | 0 |
| Programme participant roster | 0 rows |
| Participant code column / linking trigger | Missing |
| Participant required-services table | Already exists, but contains 0 rows |
| Programme services | 0 rows |
| Assignments | 4; all lack activation links, 1 lacks its primary service link |

This corrects the initial report that the required-services table was absent: it exists in Pulse80. The migration also supports environments where it is absent.

The read-only preflight identified **6 exact programme-service matches**: BMI and GLUCOSE codes across three programmes. Equality ignores case and surrounding whitespace only. The label `Blood pressure` has no exact catalogue name/code match and stays unresolved. No fuzzy aliases or catalogue entries are created.

None of the four assignments matches an activation on organisation, programme name, activity title, location, start and end time. All four activation links therefore remain unresolved. The missing assignment service labelled `Blood pressure` also stays unresolved. Existing screening activation values do not justify assigning the parent assignment to an event when their other context disagrees.

## Changes

- Fixed the backend build by typing the paginated user-directory arrays.
- Added an idempotent repair migration: `20261003224654_repair_screening_relationships.sql`.
- Added programme-scoped, case-sensitive participant codes, uniqueness, and a capture/correction trigger. Codes are trimmed on capture and matched only within the assignment's programme and organisation.
- Enforced participant/employee/programme organisation agreement and participant requirement/programme-service agreement. Parent relationship edits cannot move linked historical data into another organisation.
- Added `saveProgrammeParticipant`, restricted to platform users with `programme:manage`. It saves the approved participant code and explicit required-service IDs in one database transaction. It never invents roster entries from captured screenings or assigns every programme service to every participant.
- Programme saves accept exact catalogue names/codes and persist relational programme services transactionally. Referenced services cannot be silently removed.
- Assignment forms now select an existing activation and explicit service IDs from that event and the practitioner's approved capabilities. The new assignment RPC persists primary and additional service IDs plus the activation ID atomically, validates organisation and event dates, derives display names from the selected records, and preserves existing assignment alerts. The old RPC is revoked from `service_role` because it omits these links.
- Both capture paths fail clearly for assignments without an activation. Database capture validation checks the participant code, organisation, practitioner, activation, programme service and assigned service. Multi-service capture must identify the performed service; the legacy path may derive a service only when exactly one is assigned.
- Participation counts distinct linked eligible/registered programme participants with Completed screenings. Required completion counts distinct participant/service pairs, so repeated completed records do not inflate the rate. Completed-screening totals continue to count Completed records, including preserved historical records. The practitioner participant count now uses canonical participant IDs across events and services and excludes unresolved codes.

## Backfill and preservation

The migration adds only unique exact links. It fills a historical screening's missing fields only when the approved programme code, employee organisation, assignment practitioner/organisation, activation and service all agree. Existing non-null conflicting links remain untouched. Screenings are never deleted, recoded, or changed to another status by this repair.

Because the live participant roster is empty, **none of the 214 live screenings can currently receive an approved participant link**. Completed-screening counts remain available, but accurate participant participation and required-service completion need an approved roster and requirements. A zero linked-participant count must not be interpreted as proof that no screenings were performed.

The roster mutation deliberately does not retroactively relink historical screenings. A later backfill needs separate review once the approved roster and event mappings exist.

## Approval and rollout requirements

1. Review the migration and run `screening-relationships-preflight.sql` against the explicitly selected target using read-only access.
2. Obtain an approved roster mapping programme IDs, existing employee IDs, anonymous codes and per-participant required-service IDs. Do not infer these from employee numbers, medical results or generic workforce totals.
3. Resolve the `Blood pressure` label and the four unmatched assignments with an authorised owner. Do not create placeholder events or guess that the available preview activations are their events.
4. Approve migration application and a coordinated backend/frontend rollout separately. The new API calls require the new RPC; the old assignment writer is intentionally disabled by the migration. Do not run all pending migrations blindly: Pulse80 and the repository-linked test project's schemas differ; review their migration histories first.
5. After approved application, inspect preserved screening totals/statuses, exact link counts, RPC permissions and scoped analytics. Review unresolved links separately.

`saveProgrammeParticipant` input requires `programmeId`, `employeeId`, `screeningReference`, `requiredServiceIds`, `eligibilityStatus` and `registrationStatus`. An explicitly approved empty required-service list is allowed; it is not derived from programme membership.

## Verification

Tests execute migrations only inside isolated in-memory PostgreSQL (PGlite), never against either connected database. Coverage includes missing/already-existing required-service tables, safe repeat execution, preservation, exact and ambiguous backfills, multi-service participants, duplicates, non-completed statuses, invalid codes, wrong services, cross-programme and cross-organisation rejection, correction relinking, RPC permissions and GraphQL input/permission checks.

Run `npm test` in `pulse80-backend` for the backend build and all relevant tests. Frontend changes are also checked with TypeScript and targeted ESLint.

Final results: backend build passed; all **28 backend tests passed**. Frontend `tsc --noEmit`, targeted ESLint for the changed frontend files, and `git diff --check` passed. No live end-to-end write test was run because migration application and live writes are outside this task's authorised scope.
