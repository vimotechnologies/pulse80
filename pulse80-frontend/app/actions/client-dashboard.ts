"use server";

import { cookies } from "next/headers";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";

export type ClientDashboardStats = {
  workforceSize: number;
  wellnessRiskScore: number;
  wellnessRisk: string;
  approvedScreenings: number;
  screeningParticipation: number;
  upcomingActivations: number;
};

const clientDashboardStatsQuery = /* GraphQL */ `
  query OrganisationDashboardStats {
    organisationDashboardStats {
      workforceSize
      wellnessRiskScore
      wellnessRisk
      approvedScreenings
      screeningParticipation
      upcomingActivations
    }
  }
`;

async function selectedOrganisationId() {
  return (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
}

export async function loadClientDashboardStats() {
  const result = await graphqlRequest<{
    organisationDashboardStats: ClientDashboardStats;
  }>(clientDashboardStatsQuery, {
    organisationId: await selectedOrganisationId(),
  });

  return result.organisationDashboardStats;
}
