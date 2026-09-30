import assert from "node:assert/strict";
import test from "node:test";
import { AnalyticsService } from "./analytics.service.js";

type Call = { operation: string; column?: string; value?: string };

function client(data: unknown[] = [], error: string | null = null) {
  const calls: Call[] = [];
  const db = {
    from(view: string) {
      calls.push({ operation: "from", value: view });
      const query = {
        select(value: string) { calls.push({ operation: "select", value }); return query; },
        eq(column: string, value: string) { calls.push({ operation: "eq", column, value }); return query; },
        gte(column: string, value: string) { calls.push({ operation: "gte", column, value }); return query; },
        lte(column: string, value: string) { calls.push({ operation: "lte", column, value }); return query; },
        then(resolve: (value: unknown) => unknown) { return Promise.resolve({ data, error: error ? { message: error } : null }).then(resolve); },
      };
      return query;
    },
  };
  return { service: new AnalyticsService(db as never), calls };
}

test("participants screened applies organisation and programme filters", async () => {
  const { service, calls } = client([]);
  assert.deepEqual(await service.getParticipantsScreened({ organisationId: "org-a", programmeId: "programme-a" }), []);
  assert.ok(calls.some((call) => call.operation === "eq" && call.column === "organisation_id" && call.value === "org-a"));
  assert.ok(calls.some((call) => call.operation === "eq" && call.column === "programme_id" && call.value === "programme-a"));
});

test("referrals apply organisation and inclusive date-range filters", async () => {
  const { service, calls } = client([]);
  await service.getReferrals({ organisationId: "org-a", from: "2026-09-01T00:00:00.000Z", to: "2026-09-30T23:59:59.999Z" });
  assert.ok(calls.some((call) => call.operation === "eq" && call.column === "organisation_id"));
  assert.ok(calls.some((call) => call.operation === "gte" && call.column === "screening_date" && call.value?.startsWith("2026-09-01")));
  assert.ok(calls.some((call) => call.operation === "lte" && call.column === "screening_date" && call.value?.startsWith("2026-09-30")));
});

test("empty database results remain an empty response", async () => {
  const { service } = client([]);
  assert.deepEqual(await service.getRiskMetrics({ organisationId: "org-a" }), []);
});

test("database errors are propagated", async () => {
  const { service } = client([], "analytics view unavailable");
  await assert.rejects(service.getScreeningCompletion({ organisationId: "org-a" }), /analytics view unavailable/);
});

test("participation selects only deployed columns and scopes the organisation", async () => {
  const row = { organisation_id: "org-a", eligible_participant_count: 12, screened_participant_count: 5, screening_participation_rate_pct: 41.67 };
  const { service, calls } = client([row]);
  assert.deepEqual(await service.getScreeningParticipation({ organisationId: "org-a" }), [row]);
  assert.deepEqual(calls, [
    { operation: "from", value: "analytics_screening_participation" },
    { operation: "select", value: "organisation_id, eligible_participant_count, screened_participant_count, screening_participation_rate_pct" },
    { operation: "eq", column: "organisation_id", value: "org-a" },
  ]);
});

test("participation rejects unsupported filters instead of returning unfiltered data", async () => {
  const { service, calls } = client();
  for (const key of ["programmeId", "branch", "department", "from", "to"]) {
    await assert.rejects(service.getScreeningParticipation({ [key]: "selected" }), /organisation filtering only/);
  }
  assert.deepEqual(calls, []);
});

test("participation preserves empty results and database errors", async () => {
  assert.deepEqual(await client().service.getScreeningParticipation({ organisationId: "org-a" }), []);
  await assert.rejects(client([], "view unavailable").service.getScreeningParticipation({ organisationId: "org-a" }), /view unavailable/);
});
