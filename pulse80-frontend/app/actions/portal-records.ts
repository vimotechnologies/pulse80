"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import type { PortalRecord, RecordInput, RecordKind, RecordWorkspace } from "@/types/portal-record";
const fields = `id kind organisationId organisationName organisationLogoUrl practitionerUserId practitionerName title description status amount currency dueOn createdAt updatedAt`;

export async function loadRecordWorkspace(kind: RecordKind): Promise<RecordWorkspace> {
  const data = await graphqlRequest<{ adminRecordWorkspace: RecordWorkspace }>(
    `query RecordWorkspace($kind: String!) { adminRecordWorkspace(kind: $kind) { records { ${fields} } organisations { id name } practitioners { id name } canManage } }`,
    { variables: { kind } },
  );
  return data.adminRecordWorkspace;
}
export async function loadOrganisationRecords(kind: "report" | "recommendation") {
  const data = await graphqlRequest<{ organisationRecords: PortalRecord[] }>(
    `query OrganisationRecords($kind: String!) { organisationRecords(kind: $kind) { ${fields} } }`,
    { variables: { kind }, organisationId: (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null },
  );
  return data.organisationRecords;
}
export async function loadPractitionerPayments() {
  const data = await graphqlRequest<{ practitionerPayments: PortalRecord[] }>(`query PractitionerPayments { practitionerPayments { ${fields} } }`);
  return data.practitionerPayments;
}
export async function savePortalRecord(kind: RecordKind, id: string | null, input: RecordInput) {
  try {
    const data = await graphqlRequest<{ savePortalRecord: PortalRecord }>(
      `mutation SaveRecord($kind: String!, $id: ID, $input: SavePortalRecordInput!) { savePortalRecord(kind: $kind, id: $id, input: $input) { ${fields} } }`,
      { variables: { kind, id, input } },
    );
    for (const path of ["/admin/billing", "/admin/payments", "/admin/requests", "/admin/recommendations", "/admin/reports", "/client/reports", "/client/recommendations", "/practitioner/payments"]) revalidatePath(path);
    return { ok: true as const, record: data.savePortalRecord };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "The record could not be saved." };
  }
}

export async function loadOrganisationOperations(organisationId: string) {
  return graphqlRequest<{
    adminOrganisationActivations: { id: string; title: string; location: string; startsAt: string; status: string }[];
    adminOrganisationRecords: PortalRecord[];
  }>(`query OrganisationOperations($organisationId: ID!) {
    adminOrganisationActivations(organisationId: $organisationId) { id title location startsAt status }
    adminOrganisationRecords(kind: "report", organisationId: $organisationId) { ${fields} }
  }`, { variables: { organisationId } });
}
