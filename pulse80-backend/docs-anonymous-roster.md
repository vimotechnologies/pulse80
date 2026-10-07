# Anonymous programme roster foundation

## Migration and production baseline

Read-only inspection confirmed that production requires `employee_id`, lacks
`screening_reference` and the participant-link trigger, and does not have the
legacy capture/correction RPCs used by the backend.

`20261005103157_anonymous_programme_roster.sql` targets that production baseline. It does not populate rosters,
backfill screenings, repair assignments, or redefine analytics views.

**Do not run a blanket `supabase db push` against production.** Earlier pending
migrations, especially `20261003224654_repair_screening_relationships.sql`, contain
historical backfills outside this scope. Review/reconcile migration history and
approve this standalone migration separately. No production migration was run.

## User flow

Admin → Programmes → Participant roster supports adding anonymous participants,
previewing/importing a roster, editing statuses and paging through existing entries.
Codes are immutable once assigned. No names or contact details are required.

The API restricts roster access to programme managers. Platform managers can
select any programme. Tenant managers are scoped by authenticated organisation
context; no organisation ID supplied in mutation input can override it.
An optional employee must belong to the programme's organisation. Deleting that
employee preserves a code-bearing roster participant.

## Roster import format

Required columns:

```csv
screening_reference,eligibility_status,registration_status
```

Optional: `employee_id`, containing an existing same-organisation employee UUID.
The programme is selected on the page, not supplied per row. Names, results and
other columns are rejected. CSV, XLS and XLSX are supported (one sheet, maximum
500 rows and 2 MB). Format Excel codes as text to preserve leading zeros.
Codes are trimmed, case-sensitive, 2–80 characters and unique within a programme.

Eligibility: `Eligible` or `Not Eligible`.
Registration: `Invited`, `Registered`, `Declined` or `Withdrawn`.

Imports are atomic inserts: a duplicate/invalid row rolls back the entire batch.
They never silently overwrite existing participants. Use Edit status for updates.
Roster import is separate from screening-results import.

## New GraphQL operations

- `programmeRoster(programmeId, offset)` — total and up to 100 participants.
- `createProgrammeParticipant(programmeId, input)` — one roster entry.
- `importProgrammeParticipants(programmeId, rows)` — atomic batch; returns IDs.
- `updateProgrammeParticipantStatus(programmeId, id, input)` — status changes.

## Screening linkage

Both services call `resolve_programme_screening_participant` with the assignment,
authenticated practitioner and code. SQL validates assignment → activation →
programme and organisation agreement, then resolves one exact roster code. The
assignment must be Confirmed/In Progress; the participant must be Eligible and
Registered. Invalid, ambiguous or wrong-programme codes fail explicitly.

The screening insert trigger repeats validation in the write transaction and sets
`programme_participant_id`. `participant_reference` remains for traceability.
Multiple services/screenings can link to the same roster participant. A service
must be assigned and active, and its catalogue name or code must match an
unambiguous entry in both the programme and activation service_names lists
(case-insensitive, surrounding whitespace ignored). No fuzzy matching, service
backfill, or dependency on exact_service_id is used. If legacy capture cannot
identify exactly one assigned service, it rejects the capture; use flexible
capture to select the service explicitly.

Existing unlinked screenings stay unlinked, including after new roster imports.
Status-only reviews are unaffected. Changing a historical unlinked screening's
identity requires a separate reviewed correction and is rejected by this trigger.

## Remaining rollout prerequisites

- Review and test the standalone migration on staging before production approval.
- Confirm actual anonymous codes and roster statuses with the organisation; do not
  infer them from completed screening references.
- Ensure assignments have explicit activation/programme links. This migration
  rejects missing links and does not backfill them.
- Required-service configuration for Screening Completion remains separate. This
  import does not invent participant service requirements.
- Deploy schema before backend/frontend changes; regenerate complete database
  types from the approved migrated schema during rollout.

## Local tests

```sh
cd pulse80-backend
npm run build
node --test test/programme-roster.test.mjs test/roster-import.test.mjs
```

Tests use in-memory PostgreSQL and in-memory spreadsheet fixtures only.

## Exact release migration manifest

Apply ONLY `20261005103157_anonymous_programme_roster.sql` to a staging schema
matching the inspected production baseline. It contains the roster expansion,
permissions, forward assignment writer/guard, service validation, and legacy
capture/correction RPCs. No other pending migration is a prerequisite.

Do not include these files in the release:

- `20260924210000_add_pending_corrections_view.sql`
- `20260925120000_add_risk_metrics_view.sql`
- `20260925123000_add_referral_analytics.sql`
- `20260925123100_add_followup_analytics.sql`
- `20260928012624_pul316_screening_analytics_views.sql`
- `20260928035527_link_screenings_by_programme_code.sql`
- `20261003224654_repair_screening_relationships.sql`

The full repair changes analytics to require employees; this roster migration
intentionally does not repair or redefine those analytics. A staging database
that previously applied the full repair is not a faithful production baseline.
Reconcile migration identities separately; never mark unapplied SQL as applied
just to make a blanket push succeed.

## Assignment creation and permissions

`save_linked_practitioner_assignment` retains the backend's existing signature.
It derives programme, event, location and service labels from canonical records,
checks event dates, tenant agreement and every selected service, and inserts the
assignment and service links atomically. Existing linked assignment updates retain
alerts and refuse identity/service changes affecting existing screenings.
Historical assignments with no activation cannot be edited through this writer.
The insert/link-update trigger also rejects missing or cross-tenant activations.
No assignment is updated during migration installation. The assignment service
picker uses the same two text configurations and catalogue ambiguity rules; it
does not depend on programme_services being populated.

PUBLIC, anon and authenticated lose all direct roster table privileges, including
TRUNCATE, REFERENCES and TRIGGER. RLS remains enabled. The backend service_role
retains SELECT/INSERT/UPDATE/DELETE and private RPC execution. Roster status RPCs
write the existing updated_at timestamp.

## Safe application rollback

Keep the expanded database schema and its integrity/permission protections.
Never restore employee_id NOT NULL, drop screening_reference, delete anonymous
participants, fabricate employees, or restore the cascading employee foreign key.

Before a release, choose and test a rollback application build that understands
nullable employees and programme codes. Older capture UIs may continue only when
they supply valid roster codes and linked assignments; strict validation remains.
If the old build cannot do that, disable capture/assignment editing during rollback
and retain read/review access until a compatible build is restored. Do not drop
validation triggers to make invalid writes succeed. Historical reference changes
remain a separate reviewed correction. No automatic down migration is supplied.

## Staging acceptance gate

After separate deployment approval, test through real GraphQL/PostgREST and the
browser: roster create/import/status, new assignment creation, both capture paths,
role isolation and rollback. Compare historical row snapshots and analytics view
definitions before/after. Local PGlite tests execute SQL but simulate PostgREST
transport; they do not replace this acceptance gate. Provision only authorised
future roster/assignment data; the four historical assignments remain untouched.
