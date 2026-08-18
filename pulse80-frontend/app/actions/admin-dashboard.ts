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
