"use server";
import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";
export type Directory = {
  canManagePlatform: boolean; organisations: { id: string; name: string }[];
  users: { id: string; fullName: string; email: string | null; platformRole: string | null; confirmed: boolean; lastSignInAt: string | null;
    memberships: { id: string; organisationId: string; organisationName: string; role: string }[] }[];
};
export async function loadUserDirectory() {
  return (await graphqlRequest<{ adminUserDirectory: Directory }>(`query Users { adminUserDirectory { canManagePlatform organisations { id name } users { id fullName email platformRole confirmed lastSignInAt memberships { id organisationId organisationName role } } } }`)).adminUserDirectory;
}
async function mutate(query: string, variables: Record<string, unknown>) {
  try {
    await graphqlRequest(query, { variables });
    revalidatePath("/admin/users"); revalidatePath("/admin/organizations", "layout");
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Could not save user access." }; }
}
export async function inviteOrganisationUser(input: { organisationId: string; email: string; fullName: string; role: string }) {
  return mutate(`mutation Invite($organisationId: ID!, $email: String!, $fullName: String!, $role: String!) { inviteOrganisationUser(organisationId: $organisationId, email: $email, fullName: $fullName, role: $role) }`, input);
}
export async function updateMemberRole(id: string, role: string) {
  return mutate(`mutation MemberRole($id: ID!, $role: String!) { updateOrganisationMemberRole(id: $id, role: $role) }`, { id, role });
}
export async function removeMember(id: string) {
  return mutate(`mutation RemoveMember($id: ID!) { removeOrganisationMember(id: $id) }`, { id });
}
export async function updatePlatformRole(userId: string, role: string) {
  return mutate(`mutation PlatformRole($userId: ID!, $role: String!) { updatePlatformUserRole(userId: $userId, role: $role) }`, { userId, role });
}
