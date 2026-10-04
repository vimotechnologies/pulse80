import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { UserService } from "./user.service.js";

function inviteClient(options: { users?: { id: string; email: string }[]; existingMembership?: boolean } = {}) {
  const calls: { table: string; operation: string; value?: unknown }[] = [];
  const users = options.users ?? [];
  const invitedUser = { id: "new-user", email: "new@example.com" };
  const db = {
    auth: { admin: {
      listUsers: async () => ({ data: { users }, error: null }),
      inviteUserByEmail: async (email: string, options_: unknown) => {
        calls.push({ table: "auth", operation: "invite", value: { email, options: options_ } });
        return { data: { user: invitedUser }, error: null };
      },
    } },
    from(table: string) {
      const query = {
        select() { return query; },
        eq() { return query; },
        single: async () => ({ data: { id: "organisation" }, error: null }),
        maybeSingle: async () => ({ data: options.existingMembership ? { id: "membership" } : null, error: null }),
        upsert: async (value: unknown) => { calls.push({ table, operation: "upsert", value }); return { error: null }; },
        insert: async (value: unknown) => { calls.push({ table, operation: "insert", value }); return { error: null }; },
      };
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { service: new UserService(db), calls, invitedUser };
}

test("re-inviting an existing member succeeds without changing their role", async () => {
  const { service, calls } = inviteClient({
    users: [{ id: "existing-user", email: "client@example.com" }],
    existingMembership: true,
  });
  await service.invite({ organisationId: "organisation", email: "client@example.com", fullName: "Client User", role: "client_admin" }, "https://example.com/auth/setup");
  assert.equal(calls.length, 0);
});

test("inviting a new client sends setup email and creates its profile and membership", async () => {
  const { service, calls, invitedUser } = inviteClient();
  await service.invite({ organisationId: "organisation", email: "new@example.com", fullName: "New User", role: "executive" }, "https://example.com/auth/setup");
  assert.deepEqual(calls.map(({ table, operation }) => [table, operation]), [
    ["auth", "invite"],
    ["profiles", "upsert"],
    ["organisation_memberships", "insert"],
  ]);
  assert.deepEqual(calls[2]?.value, { organisation_id: "organisation", profile_id: invitedUser.id, role: "executive" });
});