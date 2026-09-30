"use server";

import { cookies } from "next/headers";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import { graphqlRequest } from "@/lib/graphql/client";

export type ClientAnalytics = {
  hasData: boolean;
  participantsScreened: number;
  screeningParticipationRate: number;
  screeningCompletionRate: number;
  pendingCorrections: number;
  riskMetrics: Array<{ category: string; participantCount: number; totalParticipants: number; percentage: number | null }>;
  referrals: { total: number; missing: number; created: number };
  followUps: { total: number; completed: number };
};

export type AnalyticsFilters = {
  programmeId?: string;
  branch?: string;
  department?: string;
  from?: string;
  to?: string;
};

const query = /* GraphQL */ `
  query ClientAnalytics($filters: AnalyticsFiltersInput) {
    participantsScreenedAnalytics(filters: $filters) { participantsScreened }
    screeningParticipationAnalytics(filters: $filters) { participationRate }
    screeningCompletionAnalytics(filters: $filters) { screeningCompletionRate }
    pendingCorrectionsAnalytics(filters: $filters) { pendingCorrections }
    riskMetricsAnalytics(filters: $filters) { riskCategory participantCount totalParticipants percentage }
    referralAnalytics(filters: $filters) { referralCreated referralMissing }
    referralFollowupAnalytics(filters: $filters) { followUpCompleted }
  }
`;

type Response = {
  participantsScreenedAnalytics: Array<{ participantsScreened: number }>;
  screeningParticipationAnalytics: Array<{ participationRate: number }>;
  screeningCompletionAnalytics: Array<{ screeningCompletionRate: number }>;
  pendingCorrectionsAnalytics: Array<{ pendingCorrections: number }>;
  riskMetricsAnalytics: Array<{ riskCategory: string; participantCount: number; totalParticipants: number; percentage: number | null }>;
  referralAnalytics: Array<{ referralCreated: boolean; referralMissing: boolean }>;
  referralFollowupAnalytics: Array<{ followUpCompleted: boolean }>;
};

export async function loadClientAnalytics(filters: AnalyticsFilters = {}): Promise<ClientAnalytics> {
  const organisationId = (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
  if (!organisationId) throw new Error("Select an organisation to load report analytics.");
  const apiFilters = {
    ...filters,
    from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
    to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
  };
  const result = await graphqlRequest<Response>(query, { organisationId, variables: { filters: apiFilters } });
  const hasData = [
    result.participantsScreenedAnalytics,
    result.screeningParticipationAnalytics,
    result.screeningCompletionAnalytics,
    result.pendingCorrectionsAnalytics,
    result.riskMetricsAnalytics,
    result.referralAnalytics,
    result.referralFollowupAnalytics,
  ].some((rows) => rows.length > 0);
  return {
    hasData,
    participantsScreened: result.participantsScreenedAnalytics.reduce((total, row) => total + row.participantsScreened, 0),
    screeningParticipationRate: result.screeningParticipationAnalytics[0]?.participationRate ?? 0,
    screeningCompletionRate: result.screeningCompletionAnalytics[0]?.screeningCompletionRate ?? 0,
    pendingCorrections: result.pendingCorrectionsAnalytics.reduce((total, row) => total + row.pendingCorrections, 0),
    riskMetrics: result.riskMetricsAnalytics.map((row) => ({ category: row.riskCategory, participantCount: row.participantCount, totalParticipants: row.totalParticipants, percentage: row.percentage })),
    referrals: { total: result.referralAnalytics.length, missing: result.referralAnalytics.filter((row) => row.referralMissing).length, created: result.referralAnalytics.filter((row) => row.referralCreated).length },
    followUps: { total: result.referralFollowupAnalytics.length, completed: result.referralFollowupAnalytics.filter((row) => row.followUpCompleted).length },
  };
}
