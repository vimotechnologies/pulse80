import assert from "node:assert/strict";
import test from "node:test";
import type { GraphQLContext } from "../../graphql/context.js";
import { analyticsResolvers, resolveAnalyticsFilters } from "./analytics.resolver.js";

function context(organisationId = "11111111-1111-4111-8111-111111111111") {
  return {
    user: { id: "user-a" },
    supabase: {},
    adminSupabase: {},
    identity: { organisationId, organisationRole: "client_admin", platformRole: null },
  } as unknown as GraphQLContext;
}

test("tenant context supplies the organisation and rejects an override", () => {
  const tenant = context();
  assert.equal(resolveAnalyticsFilters(tenant, {}).organisationId, tenant.identity.organisationId);
  assert.throws(
    () => resolveAnalyticsFilters(tenant, { organisationId: "22222222-2222-4222-8222-222222222222" }),
    /do not have access/,
  );
});

test("view columns map to GraphQL response fields", () => {
  const participant = { organisation_id: "org-a", programme_id: "programme-a", screening_events: 8, participants_screened: 5, completed_screening_events: 6 };
  const participantResolvers = analyticsResolvers.ParticipantsScreenedAnalytics;
  assert.equal(participantResolvers.organisationId(participant), "org-a");
  assert.equal(participantResolvers.programmeId(participant), "programme-a");
  assert.equal(participantResolvers.screeningEvents(participant), 8);
  assert.equal(participantResolvers.participantsScreened(participant), 5);
  assert.equal(participantResolvers.completedScreeningEvents(participant), 6);

  const completionResolvers = analyticsResolvers.ScreeningCompletionAnalytics;
  const completion = { organisation_id: "org-a", expected_required_screenings: 10, completed_required_screenings: 7, screening_completion_rate: 70 };
  assert.equal(completionResolvers.expectedRequiredScreenings(completion), 10);
  assert.equal(completionResolvers.completedRequiredScreenings(completion), 7);
  assert.equal(completionResolvers.screeningCompletionRate(completion), 70);
});

test("platform analytics retain the selected organisation context", () => {
  const platform = context();
  platform.identity.platformRole = "super_admin" as GraphQLContext["identity"]["platformRole"];
  assert.equal(resolveAnalyticsFilters(platform, {}).organisationId, platform.identity.organisationId);
  assert.equal(resolveAnalyticsFilters(platform, { organisationId: "other-org" }).organisationId, "other-org");
});

test("participation maps the deployed view columns without recalculating", () => {
  const row = { organisation_id: "org-a", eligible_participant_count: 12, screened_participant_count: 5, screening_participation_rate_pct: 41.67 };
  const resolver = analyticsResolvers.ScreeningParticipationAnalytics;
  assert.equal(resolver.eligibleParticipantCount(row), 12);
  assert.equal(resolver.participantsScreened(row), 5);
  assert.equal(resolver.participationRate(row), 41.67);
});
