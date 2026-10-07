import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";

export class UserService {
  constructor(private readonly db: SupabaseClient<Database>) {}
  private async authUsers() {
    const users: User[] = [];
    for (let page = 1; ; page++) {
      const { data, error } = await this.db.auth.admin.listUsers({ page, perPage: 500 });
      if (error) throw new Error(error.message);
      users.push(...data.users);
      if (data.users.length < 500) return users;
    }
  }
  async directory() {
    const users = await this.authUsers();
    const profiles: { id: string; full_name: string | null }[] = [];
    const memberships: { id: string; profile_id: string; organisation_id: string; role: string; organisations: { name: string } | null }[] = [];
    const staff: { user_id: string; role: string }[] = [];
    const organisations: { id: string; name: string }[] = [];
    for (let offset = 0; ; offset += 500) {
      const result = await this.db.from("profiles").select("id,full_name").order("id").range(offset, offset + 499);
      if (result.error) throw new Error(result.error.message);
      profiles.push(...result.data); if (result.data.length < 500) break;
    }
    for (let offset = 0; ; offset += 500) {
      const result = await this.db.from("organisation_memberships").select("id,profile_id,organisation_id,role,organisations(name)").order("id").range(offset, offset + 499);
      if (result.error) throw new Error(result.error.message);
      memberships.push(...result.data); if (result.data.length < 500) break;
    }
    for (let offset = 0; ; offset += 500) {
      const result = await this.db.from("platform_staff_memberships").select("user_id,role").order("user_id").range(offset, offset + 499);
      if (result.error) throw new Error(result.error.message);
      staff.push(...result.data); if (result.data.length < 500) break;
    }
    for (let offset = 0; ; offset += 500) {
      const result = await this.db.from("organisations").select("id,name").order("id").range(offset, offset + 499);
      if (result.error) throw new Error(result.error.message);
      organisations.push(...result.data); if (result.data.length < 500) break;
    }
    return { organisations, users: users.map(user => ({
      id: user.id, email: user.email ?? null, fullName: profiles.find(profile => profile.id === user.id)?.full_name ?? user.email ?? "User",
      platformRole: staff.find(item => item.user_id === user.id)?.role ?? null,
      confirmed: Boolean(user.email_confirmed_at), lastSignInAt: user.last_sign_in_at ?? null,
      memberships: memberships.filter(item => item.profile_id === user.id).map(item => ({ id: item.id, organisationId: item.organisation_id, organisationName: item.organisations?.name ?? "Organisation", role: item.role })),
    })) };
  }
  async invite(input: { organisationId: string; email: string; fullName: string; role: string }, redirectTo: string) {
    const org = await this.db.from("organisations").select("id,name").eq("id", input.organisationId).single();
    if (org.error) throw new Error(org.error.message);
    const existing = (await this.authUsers()).find(user => user.email?.toLowerCase() === input.email);
    let userId = existing?.id;
    if (!userId) {
      const firstName = input.fullName.trim().split(/\\s+/)[0] || "there";
      const result = await this.db.auth.admin.inviteUserByEmail(input.email, {
        redirectTo,
        data: {
          full_name: input.fullName,
          first_name: firstName,
          organisation_name: org.data.name,
        },
      });
      if (result.error) throw new Error(result.error.message);
      userId = result.data.user.id;
    }
    // Do not overwrite an existing member's role while inviting them again.
    const member = await this.db.from("organisation_memberships").select("id").eq("organisation_id", input.organisationId).eq("profile_id", userId).maybeSingle();
    if (member.error) throw new Error(member.error.message);
    if (member.data) return;
    const profile = await this.db.from("profiles").upsert({ id: userId, full_name: input.fullName }, { onConflict: "id", ignoreDuplicates: true });
    if (profile.error) throw new Error(profile.error.message);
    const membership = await this.db.from("organisation_memberships").insert({ organisation_id: input.organisationId, profile_id: userId, role: input.role });
    if (membership.error) throw new Error(membership.error.message);
  }
  async updateMember(id: string, role: string) {
    const result = await this.db.from("organisation_memberships").update({ role }).eq("id", id).not("role", "in", "(owner,practitioner)").select("id").single();
    if (result.error) throw new Error(result.error.message);
  }
  async removeMember(id: string, actorId: string) {
    const result = await this.db.from("organisation_memberships").delete().eq("id", id).neq("profile_id", actorId).not("role", "in", "(owner,practitioner)").select("id").single();
    if (result.error) throw new Error(result.error.message);
  }
  async updatePlatformRole(userId: string, role: string) {
    // Existing super admins cannot be demoted here, preventing removal of the last one.
    const result = await this.db.from("platform_staff_memberships").update({ role }).eq("user_id", userId).neq("role", "super_admin").select("user_id").single();
    if (result.error) throw new Error(result.error.message);
  }
}
