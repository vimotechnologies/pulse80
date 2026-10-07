"use server";
import { cookies } from "next/headers";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import type { Programme } from "@/types/programme";
import type { ProgrammeInterimReport } from "@/app/actions/programme-roster";

const programmeFields = "id organisationId organisationName name description status startsOn endsOn serviceNames targetParticipants activationCount createdAt updatedAt";
export async function loadAdminOrganisationProgrammeReports(organisationId: string) {
  const data = await graphqlRequest<{ adminOrganisationProgrammes: Programme[] }>(`query($organisationId: ID!) { adminOrganisationProgrammes(organisationId: $organisationId) { ${programmeFields} } }`, { variables: { organisationId } });
  const reports = await Promise.all(data.adminOrganisationProgrammes.map(programme => loadReport(programme.id)));
  return { programmes: data.adminOrganisationProgrammes, reports };
}
export async function loadClientProgrammeReports() {
  const organisationId = (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
  const data = await graphqlRequest<{ organisationProgrammes: Programme[] }>(`query { organisationProgrammes { ${programmeFields} } }`, { organisationId });
  const reports = await Promise.all(data.organisationProgrammes.map(programme => loadReport(programme.id, organisationId)));
  return { programmes: data.organisationProgrammes, reports };
}
async function loadReport(programmeId: string, organisationId?: string | null) {
  const data = await graphqlRequest<{ programmeInterimReport: ProgrammeInterimReport }>(`query($programmeId: ID!) {
    programmeInterimReport(programmeId: $programmeId) {
      reportType generatedAt programmeId programmeName programmeStatus startsOn endsOn organisationId organisationName organisationLogoUrl
      location activationStatus registeredParticipants participantsScreened participationRate screeningsCaptured completedScreenings
      serviceActivity { service screeningsCaptured completedScreenings participantsScreened }
      riskDistribution { riskCategory screeningCount } referralsRequired escalationsRequired disclaimer
    }
  }`, { variables: { programmeId }, ...(organisationId ? { organisationId } : {}) });
  return data.programmeInterimReport;
}
