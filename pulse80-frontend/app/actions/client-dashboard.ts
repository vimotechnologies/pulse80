"use server";

import { cookies } from "next/headers";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";

export type DashboardPeriod = "ALL_TIME" | "THIS_YEAR" | "THIS_QUARTER";
export type ParticipationPoint = { month: string; participants: number };
export type ClientDashboardStats = {
  monthlyParticipation: ParticipationPoint[];
  departmentParticipation: {
    department: string;
    participants: number;
    months: ParticipationPoint[];
  }[];
  organisationName: string;
  refreshedAt: string;
  upcomingActivities: {
    id: string;
    title: string;
    startsAt: string;
    location: string;
    status: string;
  }[];
  workforceSize: number;
  wellnessRiskScore: number;
  wellnessRisk: string;
  approvedScreenings: number;
  participantsScreened: number;
  screeningParticipation: number;
  upcomingActivations: number;
};

const clientDashboardStatsQuery = /* GraphQL */ `
  query OrganisationDashboardStats($period: DashboardPeriod!) {
    organisationDashboardStats(period: $period) {
      monthlyParticipation {
        month
        participants
      }
      departmentParticipation {
        department
        participants
        months {
          month
          participants
        }
      }
      organisationName
      refreshedAt
      upcomingActivities {
        id
        title
        startsAt
        location
        status
      }
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

export async function loadClientDashboardStats(
  period: DashboardPeriod = "ALL_TIME",
) {
  const result = await graphqlRequest<{
    organisationDashboardStats: ClientDashboardStats;
  }>(clientDashboardStatsQuery, {
    organisationId: await selectedOrganisationId(),
    variables: { period },
  });

  return result.organisationDashboardStats;
}
