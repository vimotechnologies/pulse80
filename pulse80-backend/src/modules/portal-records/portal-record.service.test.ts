import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import type { GraphQLContext } from "../../graphql/context.js";
import { PortalRecordService } from "./portal-record.service.js";
import { portalRecordResolvers } from "./portal-record.resolver.js";
const organisation = "00000000-0000-4000-8000-000000000001";
const practitioner = "00000000-0000-4000-8000-000000000002";
const row = { id: organisation, kind: "report", organisation_id: organisation, practitioner_user_id: null, title: "Quarterly report", description: "Staff review", status: "Published", amount: null, currency: "BWP", due_on: null, created_by: practitioner, updated_by: practitioner, created_at: "2026-09-30T00:00:00Z", updated_at: "2026-09-30T00:00:00Z", organisations: { name: "Test client", logo_path: "test/logo.png" }, practitioner_profiles: null };
function client(fetch: typeof globalThis.fetch) {
  return createClient<Database>("https://example.supabase.co", "test", { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket as never }, global: { fetch } });
}
function context(db: ReturnType<typeof client>, role: GraphQLContext["identity"]["platformRole"] = null): GraphQLContext {
  return { user: { id: practitioner }, supabase: db, adminSupabase: db, identity: { platformRole: role, organisationId: organisation, organisationRole: "executive" } } as GraphQLContext;
}
test("client reports restrict organisation and publication status and use admin-managed branding", async () => {
  const db = client(async input => { const url = new URL(String(input)); assert.equal(url.searchParams.get("organisation_id"), `eq.${organisation}`); assert.equal(url.searchParams.get("status"), "in.(Published)"); assert.equal(url.searchParams.get("kind"), "eq.report"); return Response.json([row]); });
  const records = await portalRecordResolvers.Query.organisationRecords(null, { kind: "report" }, context(db));
  assert.equal(records[0]?.organisationName, "Test client");
  assert.match(records[0]!.organisationLogoUrl!, /organisation-logos\/test\/logo.png$/);
});
test("practitioners see only payments belonging to their authenticated user", async () => {
  const db = client(async input => { const url = new URL(String(input)); assert.equal(url.searchParams.get("practitioner_user_id"), `eq.${practitioner}`); assert.equal(url.searchParams.get("kind"), "eq.payment"); return Response.json([]); });
  assert.deepEqual(await portalRecordResolvers.Query.practitionerPayments(null, null, context(db)), []);
});
test("financial records cannot be read through client report query", async () => {
  const db = client(async () => { assert.fail("must reject before querying"); });
  await assert.rejects(() => portalRecordResolvers.Query.organisationRecords(null, { kind: "invoice" }, context(db)), /Invalid option/);
});
test("operations cannot write financial records and unauthenticated users cannot read payments", async () => {
  const db = client(async () => { assert.fail("must reject before querying"); });
  await assert.rejects(() => portalRecordResolvers.Mutation.savePortalRecord(null, { kind: "invoice", input: {} }, context(db, "operations")), /permission/);
  await assert.rejects(() => portalRecordResolvers.Query.practitionerPayments(null, null, { ...context(db), user: null }), /Authentication/);
});
test("finance validation rejects negative amounts and missing payment recipients", async () => {
  const db = client(async () => { assert.fail("invalid input must never write"); });
  const input = { organisationId: organisation, title: "Payment", description: "", status: "Pending", currency: "BWP", amount: -1 };
  await assert.rejects(() => portalRecordResolvers.Mutation.savePortalRecord(null, { kind: "payment", input }, context(db, "finance")));
  await assert.rejects(() => portalRecordResolvers.Mutation.savePortalRecord(null, { kind: "payment", input: { ...input, amount: 10 } }, context(db, "finance")), /require/);
});
test("record updates are constrained by kind and id", async () => {
  const db = client(async (input, init) => { const url = new URL(String(input)); assert.equal(init?.method, "PATCH"); assert.equal(url.searchParams.get("id"), `eq.${organisation}`); assert.equal(url.searchParams.get("kind"), "eq.report"); const body = JSON.parse(String(init?.body)); assert.equal(body.updated_by, practitioner); return Response.json(row); });
  await new PortalRecordService(db).save("report", organisation, { organisationId: organisation, title: row.title, description: row.description, status: "Published", currency: "BWP" }, practitioner);
});
test("record listings paginate instead of silently truncating", async () => {
  let calls = 0;
  const db = client(async input => { const url = new URL(String(input)); const offset = Number(url.searchParams.get("offset")); assert.equal(offset, calls * 500); calls++; return Response.json(offset === 0 ? Array.from({ length: 500 }, () => row) : [row]); });
  assert.equal((await new PortalRecordService(db).list("report")).length, 501); assert.equal(calls, 2);
});
test("database failures are errors, not empty successful lists", async () => {
  const db = client(async () => Response.json({ message: "Database unavailable" }, { status: 400 }));
  await assert.rejects(() => new PortalRecordService(db).list("report"), /Database unavailable/);
});
