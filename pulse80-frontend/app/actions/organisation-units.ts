"use server";
import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";
export type OrganisationUnit = { id: string; organisationId: string; parentId: string | null; kind: "branch" | "department"; name: string; location: string; employees: number; status: string };
export async function loadOrganisationUnits(organisationId: string) {
  return (await graphqlRequest<{ adminOrganisationUnits: OrganisationUnit[] }>(`query Units($organisationId: ID!) { adminOrganisationUnits(organisationId: $organisationId) { id organisationId parentId kind name location employees status } }`, { variables: { organisationId } })).adminOrganisationUnits;
}
export async function saveOrganisationUnit(id: string | null, input: Omit<OrganisationUnit, "id">) {
  try { await graphqlRequest(`mutation SaveUnit($id: ID, $input: OrganisationUnitInput!) { saveOrganisationUnit(id: $id, input: $input) }`, { variables: { id, input } }); revalidatePath(`/admin/organizations/${input.organisationId}`); return { ok: true as const }; }
  catch { return { ok: false as const, error: "The branch or department could not be saved." }; }
}
