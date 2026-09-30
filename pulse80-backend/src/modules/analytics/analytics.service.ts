import type { SupabaseClient } from "@supabase/supabase-js";
import { GraphQLError } from "graphql";
import type { Database } from "../../generated/database.types.js";
import type {
  AnalyticsFilters,
  ParticipantsScreenedAnalytics,
  PendingCorrectionsAnalytics,
  ReferralAnalytics,
  ReferralFollowupAnalytics,
  RiskMetricsAnalytics,
  ScreeningCompletionAnalytics,
  ScreeningParticipationAnalytics,
} from "./analytics.types.js";

type TypedSupabase = SupabaseClient<Database>;
type AnalyticsDatabase = TypedSupabase & { from: (view: string) => any };

function queryFilters<T extends { eq: (column: string, value: string) => T; gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(query: T, filters: AnalyticsFilters, options: { programme?: boolean; dateColumn?: string } = {}) {
  let result = query;
  if (filters.organisationId) result = result.eq("organisation_id", filters.organisationId);
  if (options.programme && filters.programmeId) result = result.eq("programme_id", filters.programmeId);
  if (options.dateColumn && filters.from) result = result.gte(options.dateColumn, filters.from);
  if (options.dateColumn && filters.to) result = result.lte(options.dateColumn, filters.to);
  return result;
}

async function rows<T>(result: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const response = await result;
  if (response.error) throw new Error(response.error.message);
  return response.data ?? [];
}

export class AnalyticsService {
  constructor(private readonly supabase: AnalyticsDatabase) {}

  async getParticipantsScreened(filters: AnalyticsFilters): Promise<ParticipantsScreenedAnalytics[]> {
    const query = this.supabase.from("analytics_screening_summary").select("organisation_id, programme_id, screening_events, participants_screened, completed_screening_events");
    return rows(queryFilters(query, filters, { programme: true }) as never);
  }

  async getScreeningCompletion(filters: AnalyticsFilters): Promise<ScreeningCompletionAnalytics[]> {
    const query = this.supabase.from("analytics_screening_completion").select("organisation_id, expected_required_screenings, completed_required_screenings, screening_completion_rate");
    return rows(queryFilters(query, filters) as never);
  }

  async getScreeningParticipation(filters: AnalyticsFilters): Promise<ScreeningParticipationAnalytics[]> {
    // The deployed view is an all-time organisation aggregate. Filtering an
    // aggregate by dimensions it no longer contains would misrepresent the KPI.
    if (filters.programmeId || filters.branch || filters.department || filters.from || filters.to) {
      throw new GraphQLError("Screening participation supports organisation filtering only.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    const query = this.supabase.from("analytics_screening_participation").select("organisation_id, eligible_participant_count, screened_participant_count, screening_participation_rate_pct");
    return rows(queryFilters(query, filters) as never);
  }

  async getPendingCorrections(filters: AnalyticsFilters): Promise<PendingCorrectionsAnalytics[]> {
    const query = this.supabase.from("analytics_pending_corrections").select("organisation_id, practitioner_user_id, pending_corrections");
    return rows(queryFilters(query, filters) as never);
  }

  async getRiskMetrics(filters: AnalyticsFilters): Promise<RiskMetricsAnalytics[]> {
    const query = this.supabase.from("analytics_risk_metrics").select("organisation_id, risk_category, participant_count, total_participants, percentage");
    return rows(queryFilters(query, filters) as never);
  }

  async getReferrals(filters: AnalyticsFilters): Promise<ReferralAnalytics[]> {
    const query = this.supabase.from("analytics_referrals").select("organisation_id, screening_id, screening_date, referral_required, referral_created, referral_missing, referral_id, referral_status, urgency, referred_at, due_at, completed_at");
    return rows(queryFilters(query, filters, { dateColumn: "screening_date" }) as never);
  }

  async getReferralFollowups(filters: AnalyticsFilters): Promise<ReferralFollowupAnalytics[]> {
    const query = this.supabase.from("analytics_referral_followups").select("organisation_id, referral_id, screening_id, referral_status, referred_at, follow_up_count, follow_up_completed, latest_follow_up_at, next_follow_up_at");
    return rows(queryFilters(query, filters, { dateColumn: "referred_at" }) as never);
  }
}
