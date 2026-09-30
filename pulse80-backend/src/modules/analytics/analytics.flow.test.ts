import assert from "node:assert/strict";
import test from "node:test";
import { execute, parse } from "graphql";
import type { GraphQLContext } from "../../graphql/context.js";

test("analytics view row flows through service and resolver into camelCase GraphQL data", async () => {
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  process.env.SUPABASE_SECRET_KEY = "test-secret-key";
  const { schema } = await import("../../graphql/schema.js");
  const calls: Array<{ column: string; value: string }> = [];
  const adminSupabase = {
    from(view: string) {
      assert.ok(["analytics_screening_completion", "analytics_screening_participation"].includes(view));
      const query = {
        select() { return query; },
        eq(column: string, value: string) { calls.push({ column, value }); return query; },
        gte() { return query; },
        lte() { return query; },
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve({
            data: view === "analytics_screening_participation"
              ? [{ organisation_id: "11111111-1111-4111-8111-111111111111", eligible_participant_count: 12, screened_participant_count: 5, screening_participation_rate_pct: 41.67 }]
              : [{ organisation_id: "11111111-1111-4111-8111-111111111111", expected_required_screenings: 10, completed_required_screenings: 8, screening_completion_rate: 80 }],
            error: null,
          }).then(resolve);
        },
      };
      return query;
    },
  };
  const context = {
    user: { id: "user-a" },
    supabase: {},
    adminSupabase,
    identity: {
      organisationId: "11111111-1111-4111-8111-111111111111",
      organisationRole: "client_admin",
      platformRole: null,
    },
  } as unknown as GraphQLContext;

  const result = await execute({
    schema,
    document: parse(`query { screeningCompletionAnalytics { organisationId expectedRequiredScreenings completedRequiredScreenings screeningCompletionRate } }`),
    contextValue: context,
  });

  assert.equal(result.errors, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(result.data)), {
    screeningCompletionAnalytics: [{
      organisationId: "11111111-1111-4111-8111-111111111111",
      expectedRequiredScreenings: 10,
      completedRequiredScreenings: 8,
      screeningCompletionRate: 80,
    }],
  });
  assert.deepEqual(calls, [{ column: "organisation_id", value: "11111111-1111-4111-8111-111111111111" }]);

  context.identity.platformRole = "super_admin";
  const participation = await execute({
    schema,
    document: parse(`query { screeningParticipationAnalytics { eligibleParticipantCount participantsScreened participationRate } }`),
    contextValue: context,
  });
  assert.equal(participation.errors, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(participation.data)), {
    screeningParticipationAnalytics: [{ eligibleParticipantCount: 12, participantsScreened: 5, participationRate: 41.67 }],
  });
  assert.deepEqual(calls[1], { column: "organisation_id", value: context.identity.organisationId });
});
