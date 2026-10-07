"use server";

import { cookies } from "next/headers";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import type { Activation } from "@/types/programme";
import type { RiskDistributionEntry } from "@/components/dashboard/RiskDistribution";

export type ClientDashboardStats = {
  riskDistribution: RiskDistributionEntry[];
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
    organisationRiskDistribution { riskCategory participantCount }
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
    organisationRiskDistribution: RiskDistributionEntry[];
    organisationDashboardStats: ClientDashboardStats;
  }>(clientDashboardStatsQuery, {
    organisationId: await selectedOrganisationId(),
  });

  return { ...result.organisationDashboardStats, riskDistribution: result.organisationRiskDistribution };
}

export async function loadClientActivations(): Promise<Activation[]> {
  const result = await graphqlRequest<{ organisationActivations: Activation[] }>(
    `query OrganisationActivations {
      organisationActivations {
        id programmeId programmeName organisationId organisationName title description
        location startsAt endsAt expectedParticipants serviceNames status readinessScore
        readinessItems { id label completed completedAt } practitionerCount createdAt updatedAt
      }
    }`,
    { organisationId: await selectedOrganisationId() },
  );

  return result.organisationActivations;
}
