import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { OrganisationService } from "./organisation.service.js";

function brandingService(options: { fail?: boolean } = {}) {
  const requests: URL[] = [];
  const row = { name: "Client One", logo_path: "client-one/logo.png" };
  const client = createClient<Database>("https://test.supabase.co", "test-key", {
    realtime: { transport: WebSocket as unknown as NonNullable<NonNullable<Parameters<typeof createClient>[2]>["realtime"]>["transport"] },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        requests.push(url);
        assert.equal(url.pathname, "/rest/v1/organisations");
        if (url.searchParams.get("select")?.includes("organisation_contacts")) {
          return Response.json({ code: "42501", message: "permission denied for table organisation_contacts" }, { status: 403 });
        }
        if (options.fail) return Response.json({ message: "Database unavailable" }, { status: 500 });
        assert.equal(url.searchParams.get("select"), "name,logo_path");
        return Response.json(url.searchParams.has("id") ? row : [row]);
      },
    },
  });
  return { service: new OrganisationService(client), requests, row };
}

test("client branding succeeds when contacts cannot be read, and remains scoped to the client", async () => {
  const { service, requests, row } = brandingService();
  await assert.rejects(service.getById("client-one"), /permission denied for table organisation_contacts/);
  assert.deepEqual(await service.getBrandingById("client-one"), row);
  assert.equal(requests.at(-1)?.searchParams.get("id"), "eq.client-one");
});

test("admin branding reads only names and logos", async () => {
  const { service, requests, row } = brandingService();
  assert.deepEqual(await service.listBranding(), [row]);
  assert.equal(requests.at(-1)?.searchParams.get("order"), "name.asc");
});

test("branding database failures are reported", async () => {
  const { service } = brandingService({ fail: true });
  await assert.rejects(service.getBrandingById("client-one"), /Database unavailable/);
});
