import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { DashboardService } from "./dashboard.service.js";

type Screening = { id: string; participant_reference: string; organisation_id: string; status: string };

function service(rows: Screening[], fail = false, workforceSize = 10) {
  const client = createClient<Database>("https://test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const table = url.pathname.split("/").pop();
        if (table === "organisations") {
          return Response.json({ name: "Test organisation", workforce_size: workforceSize, wellness_risk_score: 20 });
        }
        if (table === "activations") {
          assert.equal(url.searchParams.get("organisation_id"), "eq.org-a");
          assert.equal(url.searchParams.get("status"), "in.(Scheduled,Planning)");
          assert.ok(url.searchParams.get("starts_at")?.startsWith("gte."));
          if (init?.method !== "HEAD") {
            assert.equal(url.searchParams.get("limit"), "5");
            assert.equal(url.searchParams.get("order"), "starts_at.asc,id.asc");
            return Response.json([{ id: "activity-1", title: "Screening day", starts_at: "2099-01-01T08:00:00Z", location: "Head office", status: "Scheduled" }]);
          }
          return new Response(null, { headers: { "content-range": "*/1" } });
        }
        assert.equal(table, "screenings");
        assert.equal(url.searchParams.get("organisation_id"), "eq.org-a");
        let matching = rows.filter(row => row.organisation_id === "org-a");
        const status = url.searchParams.get("status")?.slice(3);
        if (status) matching = matching.filter(row => row.status === status);
        if (init?.method === "HEAD") {
          return new Response(null, { headers: { "content-range": `*/${matching.length}` } });
        }
        assert.equal(status, "Approved");
        assert.equal(url.searchParams.get("select"), "id,participant_reference");
        if (fail) return Response.json({ message: "Query failed" }, { status: 400 });
        const afterId = url.searchParams.get("id")?.slice(3);
        matching = matching.sort((a, b) => a.id.localeCompare(b.id))
          .filter(row => !afterId || row.id > afterId);
        // Simulate a server row cap lower than the requested page size.
        return Response.json(matching.slice(0, 2).map(({ id, participant_reference }) => ({ id, participant_reference })));
      },
    },
  });
  return new DashboardService(client);
}

const row = (id: string, participant: string, status = "Approved", org = "org-a"): Screening =>
  ({ id, participant_reference: participant, status, organisation_id: org });

test("counts people once across services and pages, excluding other organisations and unapproved records", async () => {
  const stats = await service([
    row("01", "person-a"), row("02", "person-a"), row("03", "person-a"),
    row("04", "person-b"), row("05", "person-c", "Submitted"),
    row("06", "person-d", "Needs Correction"), row("07", "person-e", "Under Review"),
    row("08", "person-f", "Draft"), row("09", "person-g", "Approved", "org-b"),
  ]).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 2);
  assert.equal(stats.approvedScreenings, 4);
  assert.equal(stats.screeningParticipation, 20);
  assert.equal(stats.organisationName, "Test organisation");
  assert.equal(stats.upcomingActivations, 1);
  assert.deepEqual(stats.upcomingActivities, [{ id: "activity-1", title: "Screening day", startsAt: "2099-01-01T08:00:00Z", location: "Head office", status: "Scheduled" }]);
});

test("no qualifying screenings returns zero", async () => {
  const stats = await service([row("01", "person-a", "Submitted")]).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 0);
  assert.equal(stats.screeningParticipation, 0);
});

test("query failure is an error rather than a zero count", async () => {
  await assert.rejects(service([], true).getOrganisationStats("org-a"), /Query failed/);
});

test("missing workforce avoids division by zero", async () => {
  const stats = await service([row("01", "person-a")], false, 0).getOrganisationStats("org-a");
  assert.equal(stats.screeningParticipation, 0);
  assert.equal(stats.workforceSize, 0);
});
