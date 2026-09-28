import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { DashboardService } from "./dashboard.service.js";

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
