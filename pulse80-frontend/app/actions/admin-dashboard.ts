"use server";

import {
  Building2,
  CalendarCheck,
  Stethoscope,
  UsersRound,
} from "@/components/icons/IconsaxIcons";
import type { PortalMetric } from "@/data/portal-phase-two";
import { graphqlRequest } from "@/lib/graphql/client";

type AdminDashboardStats = {
  totalOrganisations: number;
  representedEmployees: number;
  verifiedPractitioners: number;
  upcomingAssignments: number;
};

export type AdminPortalAnalytics = {
  participantsScreened: number;
  eligibleParticipants: number;
  screeningParticipationRate: number | null;
  completedScreenings: number;
  expectedRequiredScreenings: number;
  completedRequiredScreenings: number;
  screeningCompletionRate: number | null;
  riskDistribution: { riskCategory: string; participantCount: number }[];
  requiredReferralCount: number;
  missingReferralCount: number;
  followUpCount: number;
  followedUpReferralCount: number;
};

const adminDashboardStatsQuery = /* GraphQL */ `
  query AdminDashboardStats {
    adminDashboardStats {
      totalOrganisations
      representedEmployees
      verifiedPractitioners
      upcomingAssignments
    }
  }
`;

const adminPortalAnalyticsQuery = /* GraphQL */ `
  query AdminPortalAnalytics {
    adminPortalAnalytics {
      participantsScreened
      eligibleParticipants
      screeningParticipationRate
      completedScreenings
      expectedRequiredScreenings
      completedRequiredScreenings
      screeningCompletionRate
      riskDistribution { riskCategory participantCount }
      requiredReferralCount
      missingReferralCount
      followUpCount
      followedUpReferralCount
    }
  }
`;

const numberFormatter = new Intl.NumberFormat("en-BW");

export async function loadAdminDashboardMetrics(): Promise<PortalMetric[]> {
  const { adminDashboardStats: stats } = await graphqlRequest<{
    adminDashboardStats: AdminDashboardStats;
  }>(adminDashboardStatsQuery);

  return [
    {
      label: "Organisations",
      value: numberFormatter.format(stats.totalOrganisations),
      detail: "Customer organisations on Pulse80",
      tone: "primary",
      icon: Building2,
    },
    {
      label: "Represented Workforce",
      value: numberFormatter.format(stats.representedEmployees),
      detail: "Employees across all organisations",
      tone: "primary",
      icon: UsersRound,
    },
    {
      label: "Verified Practitioners",
      value: numberFormatter.format(stats.verifiedPractitioners),
      detail: "Active and verified professionals",
      tone: "success",
      icon: Stethoscope,
    },
    {
      label: "Upcoming Assignments",
      value: numberFormatter.format(stats.upcomingAssignments),
      detail: "Scheduled or confirmed assignments",
      tone: "primary",
      icon: CalendarCheck,
    },
  ];
}

export async function loadAdminPortalAnalytics(): Promise<AdminPortalAnalytics> {
  const { adminPortalAnalytics } = await graphqlRequest<{
    adminPortalAnalytics: AdminPortalAnalytics;
  }>(adminPortalAnalyticsQuery);

  return adminPortalAnalytics;
}

export async function loadAdminDashboardActivations() {
  const { adminActivations } = await graphqlRequest<{
    adminActivations: Pick<import("@/types/programme").Activation,
      "id" | "organisationName" | "title" | "location" | "startsAt" |
      "expectedParticipants" | "status" | "readinessScore">[];
  }>(`query AdminDashboardActivations {
    adminActivations {
      id organisationName title location startsAt expectedParticipants status readinessScore
    }
  }`);
  return adminActivations;
}
