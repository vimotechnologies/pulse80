"use server";

import { cookies } from "next/headers";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";

export type ClientDashboardStats = {
  organisationName: string;
  refreshedAt: string;
  upcomingActivities: { id: string; title: string; startsAt: string; location: string; status: string }[];
  workforceSize: number;
  wellnessRiskScore: number;
  wellnessRisk: string;
  approvedScreenings: number;
  participantsScreened: number;
  screeningParticipation: number;
  upcomingActivations: number;
};

const clientDashboardStatsQuery = /* GraphQL */ `
  query OrganisationDashboardStats {
    organisationDashboardStats {
      organisationName
      refreshedAt
      upcomingActivities { id title startsAt location status }
      workforceSize
      wellnessRiskScore
      wellnessRisk
      approvedScreenings
      participantsScreened
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
