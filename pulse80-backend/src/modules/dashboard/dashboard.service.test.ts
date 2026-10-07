import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { dashboardResolvers } from "./dashboard.resolver.js";
import type { GraphQLContext } from "../../graphql/context.js";
import { DashboardService } from "./dashboard.service.js";
import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { dashboardTypeDefs } from "./dashboard.schema.js";

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

// In-memory test fixtures only; this client never connects to a database.
type Screening = {
  organisation_id: string;
  participant_reference: string | null;
  status: string;
  activations: { organisation_id: string; programme_id: string } | null;
};

function screening(reference: string | null, overrides: Partial<Screening> = {}): Screening {
  return {
    organisation_id: "org-a", participant_reference: reference, status: "Completed",
    activations: { organisation_id: "org-a", programme_id: "programme-a" },
    ...overrides,
  };
}

function participantsResponse(url: URL, rows: Screening[], pageCap = 1000) {
  assert.equal(url.searchParams.get("select"), "organisation_id,participant_reference,activations!screenings_activation_id_fkey!inner(organisation_id,programme_id)");
  assert.equal(url.searchParams.get("status"), "ilike.completed");
  assert.equal(url.searchParams.get("order"), "id.asc");
  const tenant = url.searchParams.get("organisation_id")?.slice(3);
  assert.equal(url.searchParams.get("activations.organisation_id"), tenant ? `eq.${tenant}` : null);
  const matching = rows.filter(row =>
    row.status.toLowerCase() === "completed" && row.activations &&
    (!tenant || (row.organisation_id === tenant && row.activations.organisation_id === tenant)),
  );
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Math.min(Number(url.searchParams.get("limit")), pageCap);
  return Response.json(matching.slice(offset, offset + limit));
}

function client(options?: {
  screenings?: Screening[];
  pageCap?: number;
  failScreenings?: boolean;
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
          if (url.searchParams.get("select")?.includes("participant_reference")) {
            if (options?.failScreenings) return Response.json({ message: "Screenings query failed" }, { status: 400 });
            return participantsResponse(url, options?.screenings ?? [], options?.pageCap);
          }
          return new Response(null, { headers: { "content-range": "*/4" } });
        }
        if (resource === "analytics_screening_participation") {
          assert.ok(organisationId?.startsWith("eq.org-"));
          if (options?.failView === resource) {
            return Response.json({ message: "Participation view failed" }, { status: 400 });
          }
          return Response.json(options?.participation ? [options.participation] : []);
        }
        if (resource === "analytics_screening_completion") {
          assert.ok(organisationId?.startsWith("eq.org-"));
          if (options?.failView === resource) {
            return Response.json({ message: "Completion view failed" }, { status: 400 });
          }
          return Response.json(options?.completion ? [options.completion] : []);
        }

        assert.fail(`Unexpected Supabase resource: ${resource}`);
      },
    },
  });

  return client;
}

function service(options?: Parameters<typeof client>[0]) {
  return new DashboardService(client(options));
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
  const stats = await service({ participation, completion, screenings: [screening("REF-A"), screening("REF-A")] }).getOrganisationStats("org-a");

  assert.equal(stats.participantsScreened, 1);
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
          if (Number(url.searchParams.get("offset") ?? 0) > 0) return Response.json([]);
          return Response.json([
            { risk_category: "Low", participant_count: 7 },
            { risk_category: "High", participant_count: 3 },
            { risk_category: "Not Calculated", participant_count: 2 },
          ]);
        }
        if (resource === "screenings") {
          if (url.searchParams.get("select")?.includes("participant_reference")) {
            return participantsResponse(url, [
              screening("REF-A"), screening("REF-A"), screening("REF-B"),
              screening("REF-A", { organisation_id: "org-b", activations: { organisation_id: "org-b", programme_id: "programme-b" } }),
              screening("MISMATCH", { activations: { organisation_id: "org-b", programme_id: "programme-b" } }),
              screening("DRAFT", { status: "Draft" }),
              screening("UNLINKED", { activations: null }),
            ]);
          }
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

  assert.equal(analytics.participantsScreened, 3);
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


test("multiple Completed screenings for one participant count once across programmes", async () => {
  const stats = await service({ screenings: [
    screening("REF-A"), screening("REF-A"),
    screening("REF-A", { activations: { organisation_id: "org-a", programme_id: "programme-b" } }),
  ] }).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 1);
});

test("two distinct completed participant references count as two", async () => {
  const stats = await service({ screenings: [screening("REF-A"), screening("REF-B")] }).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 2);
});

test("non-Completed screenings are excluded", async () => {
  const stats = await service({ screenings: [
    screening("REF-A"),
    ...["Draft", "Under Review", "Needs Correction"].map(status => screening(status, { status })),
  ] }).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 1);
});

test("screenings and activations must belong to the authorised organisation", async () => {
  const dashboard = service({ screenings: [
    screening("REF-A"),
    screening("REF-A", { organisation_id: "org-b", activations: { organisation_id: "org-b", programme_id: "programme-b" } }),
    screening("REF-B", { organisation_id: "org-b", activations: { organisation_id: "org-b", programme_id: "programme-b" } }),
    screening("MISMATCH", { activations: { organisation_id: "org-b", programme_id: "programme-b" } }),
    screening("UNLINKED", { activations: null }),
  ] });
  assert.equal((await dashboard.getOrganisationStats("org-a")).participantsScreened, 1);
  assert.equal((await dashboard.getOrganisationStats("org-b")).participantsScreened, 2);
  assert.equal((await dashboard.getOrganisationStats("org-empty")).participantsScreened, 0);
});

test("empty screenings return zero even when participation reports screened participants", async () => {
  const stats = await service({ participation }).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 0);
  assert.equal(stats.screeningParticipation, participation.screening_participation_rate_pct);
});

test("deduplicates across server-capped pages without truncating the count", async () => {
  const stats = await service({ pageCap: 1, screenings: [
    screening("REF-A"), screening("REF-A"), screening("REF-B"), screening(null),
  ] }).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 2);
});

test("matches SQL case-insensitive Completed status without normalising references", async () => {
  const stats = await service({ screenings: [
    screening("REF-A", { status: "completed" }), screening("ref-a", { status: "COMPLETED" }),
  ] }).getOrganisationStats("org-a");
  assert.equal(stats.participantsScreened, 2);
});

test("Participants Screened query errors are not reported as zero", async () => {
  await assert.rejects(service({ failScreenings: true }).getOrganisationStats("org-a"), /Screenings query failed/);
});

function context(): GraphQLContext {
  const supabase = client({ screenings: [screening("REF-A")] });
  return {
    user: { id: "user-a", email: null }, supabase, adminSupabase: supabase,
    identity: { organisationId: "org-a", organisationRole: "client_admin", platformRole: null },
  } as GraphQLContext;
}

test("organisation resolver ignores frontend tenant IDs and uses authenticated context", async () => {
  const stats = await dashboardResolvers.Query.organisationDashboardStats(null, { organisationId: "org-b" }, context());
  assert.equal(stats.participantsScreened, 1);
});

test("unauthenticated callers and callers without tenant access are rejected", async () => {
  const anonymous = context();
  anonymous.user = null;
  await assert.rejects(dashboardResolvers.Query.organisationDashboardStats(null, {}, anonymous), /Authentication required/);
  const unauthorised = context();
  unauthorised.identity.organisationRole = null;
  await assert.rejects(dashboardResolvers.Query.organisationDashboardStats(null, {}, unauthorised), /do not have access/);
  await assert.rejects(dashboardResolvers.Query.adminPortalAnalytics(null, {}, context()), /do not have permission/);
});

test("risk GraphQL queries isolate organisations, aggregate all admin pages and expose empty categories", async () => {
  const rows = [
    { organisation_id: "org-a", risk_category: "High", participant_count: 2 },
    { organisation_id: "org-a", risk_category: "Not Calculated", participant_count: 3 },
    { organisation_id: "org-b", risk_category: "High", participant_count: 7 },
    { organisation_id: "org-b", risk_category: "Low", participant_count: 1 },
  ];
  const supabase = createClient<Database>("https://test.supabase.co", "test-key", {
    realtime: { transport: websocketTransport },
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      const url = new URL(String(input));
      assert.ok(url.pathname.endsWith("/analytics_risk_metrics"));
      const tenant = url.searchParams.get("organisation_id")?.slice(3);
      const matching = rows.filter(row => !tenant || row.organisation_id === tenant);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      return Response.json(matching.slice(offset, offset + 1));
    } },
  });
  const schema = makeExecutableSchema({ typeDefs: ["type Query { _empty: Boolean }", dashboardTypeDefs], resolvers: dashboardResolvers });
  const run = (contextValue: GraphQLContext, admin = false) => graphql({ schema, contextValue,
    source: `{ ${admin ? "adminRiskDistribution" : "organisationRiskDistribution"} { riskCategory participantCount } }`,
  });
  const ctx = context(); ctx.adminSupabase = supabase;
  const a = await run(ctx);
  assert.equal(a.errors, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(a.data)), { organisationRiskDistribution: [
    { riskCategory: "Low", participantCount: 0 }, { riskCategory: "Moderate", participantCount: 0 },
    { riskCategory: "High", participantCount: 2 }, { riskCategory: "Not Calculated", participantCount: 3 },
  ] });
  ctx.identity.organisationId = "org-b";
  const b = await run(ctx);
  assert.equal((b.data?.organisationRiskDistribution as { participantCount: number }[])[2]?.participantCount, 7);
  ctx.identity.organisationId = "org-empty";
  const empty = await run(ctx);
  assert.ok((empty.data?.organisationRiskDistribution as { participantCount: number }[]).every(row => row.participantCount === 0));
  assert.equal((await run(ctx, true)).errors?.[0]?.extensions.code, "FORBIDDEN");
  ctx.identity.platformRole = "super_admin";
  const admin = await run(ctx, true);
  assert.equal((admin.data?.adminRiskDistribution as { participantCount: number }[])[2]?.participantCount, 9);
  ctx.user = null;
  assert.equal((await run(ctx)).errors?.[0]?.extensions.code, "UNAUTHENTICATED");
});

test("risk database errors propagate rather than reporting zero risk", async () => {
  const supabase = createClient<Database>("https://test.supabase.co", "test-key", {
    realtime: { transport: websocketTransport }, auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => Response.json({ message: "Risk view unavailable" }, { status: 500 }) },
  });
  await assert.rejects(new DashboardService(supabase).getRiskDistribution("org-a"), /Risk view unavailable/);
});
