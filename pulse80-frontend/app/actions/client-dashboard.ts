"use server";

import { cookies } from "next/headers";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";

export type ClientDashboardStats = {
  workforceSize: number;
  wellnessRiskScore: number;
  wellnessRisk: string;
  completedScreenings: number;
  screeningParticipation: number;
  eligibleParticipants: number;
  participantsScreened: number;
  expectedRequiredScreenings: number;
  completedRequiredScreenings: number;
  screeningCompletionRate: number;
  upcomingActivations: number;
};

const clientDashboardStatsQuery = /* GraphQL */ `
  query OrganisationDashboardStats {
    organisationDashboardStats {
      workforceSize
      wellnessRiskScore
      wellnessRisk
      completedScreenings
      screeningParticipation
      eligibleParticipants
      participantsScreened
      expectedRequiredScreenings
      completedRequiredScreenings
      screeningCompletionRate
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
