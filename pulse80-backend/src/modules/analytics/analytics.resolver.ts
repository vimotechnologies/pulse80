import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../../graphql/context.js";
import { requirePermission, requirePlatformPermission } from "../auth/auth.guard.js";
import { AnalyticsService } from "./analytics.service.js";
import type { AnalyticsFilters } from "./analytics.types.js";

export function resolveAnalyticsFilters(context: GraphQLContext, value: AnalyticsFilters | null | undefined) {
  const requested = value ?? {};
  const organisationId = context.identity.platformRole
    ? requested.organisationId ?? context.identity.organisationId ?? null
    : requirePermission(context, "analytics:read").organisationId;

  if (!context.identity.platformRole) requirePermission(context, "analytics:read");
  if (requested.organisationId && organisationId && requested.organisationId !== organisationId) {
    throw new GraphQLError("You do not have access to this organisation.", { extensions: { code: "FORBIDDEN" } });
  }
  return { ...requested, organisationId };
}

function service(context: GraphQLContext) {
  if (context.identity.platformRole) requirePlatformPermission(context, "analytics:read");
  else requirePermission(context, "analytics:read");
  return new AnalyticsService(context.adminSupabase as never);
}

export const analyticsResolvers = {
  Query: {
    participantsScreenedAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getParticipantsScreened(resolveAnalyticsFilters(context, args.filters)),
    screeningCompletionAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getScreeningCompletion(resolveAnalyticsFilters(context, args.filters)),
    screeningParticipationAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getScreeningParticipation(resolveAnalyticsFilters(context, args.filters)),
    pendingCorrectionsAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getPendingCorrections(resolveAnalyticsFilters(context, args.filters)),
    riskMetricsAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getRiskMetrics(resolveAnalyticsFilters(context, args.filters)),
    referralAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getReferrals(resolveAnalyticsFilters(context, args.filters)),
    referralFollowupAnalytics: (_: unknown, args: { filters?: AnalyticsFilters | null }, context: GraphQLContext) => service(context).getReferralFollowups(resolveAnalyticsFilters(context, args.filters)),
  },
  ParticipantsScreenedAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    programmeId: (row: { programme_id: string | null }) => row.programme_id,
    screeningEvents: (row: { screening_events: number }) => row.screening_events,
    participantsScreened: (row: { participants_screened: number }) => row.participants_screened,
    completedScreeningEvents: (row: { completed_screening_events: number }) => row.completed_screening_events,
  },
  ScreeningParticipationAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    eligibleParticipantCount: (row: { eligible_participant_count: number }) => row.eligible_participant_count,
    participantsScreened: (row: { screened_participant_count: number }) => row.screened_participant_count,
    participationRate: (row: { screening_participation_rate_pct: number }) => row.screening_participation_rate_pct,
  },
  ScreeningCompletionAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    expectedRequiredScreenings: (row: { expected_required_screenings: number }) => row.expected_required_screenings,
    completedRequiredScreenings: (row: { completed_required_screenings: number }) => row.completed_required_screenings,
    screeningCompletionRate: (row: { screening_completion_rate: number }) => row.screening_completion_rate,
  },
  PendingCorrectionsAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    practitionerUserId: (row: { practitioner_user_id: string | null }) => row.practitioner_user_id,
    pendingCorrections: (row: { pending_corrections: number }) => row.pending_corrections,
  },
  RiskMetricsAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    riskCategory: (row: { risk_category: string }) => row.risk_category,
    participantCount: (row: { participant_count: number }) => row.participant_count,
    totalParticipants: (row: { total_participants: number }) => row.total_participants,
  },
  ReferralAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    screeningId: (row: { screening_id: string }) => row.screening_id,
    screeningDate: (row: { screening_date: string }) => row.screening_date,
    referralRequired: (row: { referral_required: boolean }) => row.referral_required,
    referralCreated: (row: { referral_created: boolean }) => row.referral_created,
    referralMissing: (row: { referral_missing: boolean }) => row.referral_missing,
    referralId: (row: { referral_id: string | null }) => row.referral_id,
    referralStatus: (row: { referral_status: string | null }) => row.referral_status,
    referredAt: (row: { referred_at: string | null }) => row.referred_at,
    dueAt: (row: { due_at: string | null }) => row.due_at,
    completedAt: (row: { completed_at: string | null }) => row.completed_at,
  },
  ReferralFollowupAnalytics: {
    organisationId: (row: { organisation_id: string }) => row.organisation_id,
    referralId: (row: { referral_id: string }) => row.referral_id,
    screeningId: (row: { screening_id: string }) => row.screening_id,
    referralStatus: (row: { referral_status: string | null }) => row.referral_status,
    referredAt: (row: { referred_at: string }) => row.referred_at,
    followUpCount: (row: { follow_up_count: number }) => row.follow_up_count,
    followUpCompleted: (row: { follow_up_completed: boolean }) => row.follow_up_completed,
    latestFollowUpAt: (row: { latest_follow_up_at: string | null }) => row.latest_follow_up_at,
    nextFollowUpAt: (row: { next_follow_up_at: string | null }) => row.next_follow_up_at,
  },
};
