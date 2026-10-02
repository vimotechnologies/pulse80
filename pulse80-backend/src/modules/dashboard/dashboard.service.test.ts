import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { DashboardService } from "./dashboard.service.js";

type SupabaseClientOptions = NonNullable<Parameters<typeof createClient>[2]>;
type RealtimeTransport = NonNullable<NonNullable<SupabaseClientOptions["realtime"]>["transport"]>;
const websocketTransport = WebSocket as unknown as RealtimeTransport;

type Participation = {
  eligible_participant_count: number;
  screened_participant_count: number;
  screening_participation_rate_pct: number;
  organisation_id: string;
};

type Completion = {
  expected_required_screenings: number;
  completed_required_screenings: number;
  screening_completion_rate: number;
  organisation_id: string;
};

function service(options?: {
  participation?: Participation | null;
  completion?: Completion | null;
  failView?: string;
}) {
  const client = createClient<Database>("https://test.supabase.co", "test-key", {
    realtime: { transport: websocketTransport },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        const resource = url.pathname.split("/").pop();
        const organisationId = url.searchParams.get("organisation_id");

        if (resource === "organisations") {
          return Response.json({ workforce_size: 10, wellness_risk_score: 20 });
        }
        if (resource === "activations") {
          return new Response(null, { headers: { "content-range": "*/0" } });
        }
        if (resource === "screenings") {
          return new Response(null, { headers: { "content-range": "*/4" } });
        }
        if (resource === "analytics_screening_participation") {
          assert.equal(organisationId, "eq.org-a");
          if (options?.failView === resource) {
            return Response.json({ message: "Participation view failed" }, { status: 400 });
          }
          return Response.json(options?.participation ? [options.participation] : []);
        }
        if (resource === "analytics_screening_completion") {
          assert.equal(organisationId, "eq.org-a");
          if (options?.failView === resource) {
            return Response.json({ message: "Completion view failed" }, { status: 400 });
          }
          return Response.json(options?.completion ? [options.completion] : []);
        }

        assert.fail(`Unexpected Supabase resource: ${resource}`);
      },
    },
  });

  return new DashboardService(client);
}

const participation: Participation = {
  organisation_id: "org-a",
  eligible_participant_count: 10,
  screened_participant_count: 6,
  screening_participation_rate_pct: 60.25,
};

const completion: Completion = {
  organisation_id: "org-a",
  expected_required_screenings: 12,
  completed_required_screenings: 9,
  screening_completion_rate: 75,
};

test("uses the organisation's analytics view results", async () => {
  const stats = await service({ participation, completion }).getOrganisationStats("org-a");

  assert.equal(stats.participantsScreened, 6);
  assert.equal(stats.eligibleParticipants, 10);
  assert.equal(stats.screeningParticipation, 60.25);
  assert.equal(stats.expectedRequiredScreenings, 12);
  assert.equal(stats.completedRequiredScreenings, 9);
  assert.equal(stats.screeningCompletionRate, 75);
  assert.equal(stats.completedScreenings, 4);
});

test("returns zero values when a view has no row for the organisation", async () => {
  const stats = await service().getOrganisationStats("org-a");

  assert.equal(stats.participantsScreened, 0);
  assert.equal(stats.eligibleParticipants, 0);
  assert.equal(stats.screeningParticipation, 0);
  assert.equal(stats.expectedRequiredScreenings, 0);
  assert.equal(stats.completedRequiredScreenings, 0);
  assert.equal(stats.screeningCompletionRate, 0);
});

test("a view query failure is returned as an error, not as zero", async () => {
  await assert.rejects(
    service({ failView: "analytics_screening_participation" }).getOrganisationStats("org-a"),
    /Participation view failed/,
  );
});

test("admin portal analytics aggregates production view rows and counts", async () => {
  const client = createClient<Database>("https://test.supabase.co", "test-key", {
    realtime: { transport: websocketTransport },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        const resource = url.pathname.split("/").pop();

        if (resource === "analytics_screening_participation") {
          return Response.json([
            { eligible_participant_count: 10, screened_participant_count: 6 },
            { eligible_participant_count: 4, screened_participant_count: 2 },
          ]);
        }
        if (resource === "analytics_screening_completion") {
          return Response.json([
            { expected_required_screenings: 12, completed_required_screenings: 9 },
            { expected_required_screenings: 8, completed_required_screenings: 3 },
          ]);
        }
        if (resource === "analytics_risk_metrics") {
          return Response.json([
            { risk_category: "Low", participant_count: 7 },
            { risk_category: "High", participant_count: 3 },
            { risk_category: "Not Calculated", participant_count: 2 },
          ]);
        }
        if (resource === "screenings") {
          return new Response(null, { headers: { "content-range": "*/14" } });
        }
        if (resource === "analytics_referrals") {
          const missing = url.searchParams.get("referral_missing") === "eq.true";
          return new Response(null, { headers: { "content-range": `*/${missing ? 2 : 5}` } });
        }
        if (resource === "analytics_referral_followups") {
          const followedUp = url.searchParams.get("follow_up_completed") === "eq.true";
          return new Response(null, { headers: { "content-range": `*/${followedUp ? 3 : 4}` } });
        }

        assert.fail(`Unexpected Supabase resource: ${resource}`);
      },
    },
  });

  const analytics = await new DashboardService(client).getAdminPortalAnalytics();

  assert.equal(analytics.participantsScreened, 8);
  assert.equal(analytics.eligibleParticipants, 14);
  assert.equal(analytics.screeningParticipationRate, (8 / 14) * 100);
  assert.equal(analytics.completedScreenings, 14);
  assert.equal(analytics.expectedRequiredScreenings, 20);
  assert.equal(analytics.completedRequiredScreenings, 12);
  assert.equal(analytics.screeningCompletionRate, 60);
  assert.deepEqual(analytics.riskDistribution, [
    { riskCategory: "Low", participantCount: 7 },
    { riskCategory: "Moderate", participantCount: 0 },
    { riskCategory: "High", participantCount: 3 },
    { riskCategory: "Not Calculated", participantCount: 2 },
  ]);
  assert.equal(analytics.requiredReferralCount, 5);
  assert.equal(analytics.missingReferralCount, 2);
  assert.equal(analytics.followUpCount, 4);
  assert.equal(analytics.followedUpReferralCount, 3);
});
