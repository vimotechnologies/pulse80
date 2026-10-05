"use server";
import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";
import type { ProgrammeRoster, RosterEntry } from "@/types/programme-roster";
const fields = "id programmeId employeeId screeningReference eligibilityStatus registrationStatus";
export async function loadProgrammeRoster(programmeId: string, offset = 0) {
  const result = await graphqlRequest<{ programmeRoster: ProgrammeRoster }>(`query($programmeId: ID!, $offset: Int!) {
    programmeRoster(programmeId: $programmeId, offset: $offset) { programmeId programmeName total participants { ${fields} } }
  }`, { variables: { programmeId, offset } });
  return result.programmeRoster;
}
async function save(query: string, variables: Record<string, unknown>, programmeId: string) {
  try {
    const result = await graphqlRequest(query, { variables });
    revalidatePath(`/admin/programmes/${programmeId}/roster`);
    return { ok: true as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save roster.";
    return { ok: false as const, error: message === "INTERNAL_SERVER_ERROR" ? "Could not save roster. Please try again or contact operations." : message };
  }
}
export async function createRosterParticipant(programmeId: string, input: RosterEntry) {
  return save(`mutation($programmeId: ID!, $input: RosterParticipantInput!) { createProgrammeParticipant(programmeId: $programmeId, input: $input) }`, { programmeId, input }, programmeId);
}
export async function importRosterParticipants(programmeId: string, rows: RosterEntry[]) {
  return save(`mutation($programmeId: ID!, $rows: [RosterParticipantInput!]!) { importProgrammeParticipants(programmeId: $programmeId, rows: $rows) }`, { programmeId, rows }, programmeId);
}
export async function updateRosterParticipantStatus(programmeId: string, id: string, input: Pick<RosterEntry, "eligibilityStatus" | "registrationStatus">) {
  return save(`mutation($programmeId: ID!, $id: ID!, $input: ParticipantStatusInput!) { updateProgrammeParticipantStatus(programmeId: $programmeId, id: $id, input: $input) { id } }`, { programmeId, id, input }, programmeId);
}
