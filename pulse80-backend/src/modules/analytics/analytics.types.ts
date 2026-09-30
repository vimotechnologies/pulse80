export type AnalyticsFilters = {
  organisationId?: string | null;
  programmeId?: string | null;
  branch?: string | null;
  department?: string | null;
  from?: string | null;
  to?: string | null;
};

export type ParticipantsScreenedAnalytics = {
  organisation_id: string;
  programme_id: string | null;
  screening_events: number;
  participants_screened: number;
  completed_screening_events: number;
};

export type ScreeningCompletionAnalytics = {
  organisation_id: string;
  expected_required_screenings: number;
  completed_required_screenings: number;
  screening_completion_rate: number;
};

export type ScreeningParticipationAnalytics = {
  organisation_id: string;
  eligible_participant_count: number;
  screened_participant_count: number;
  screening_participation_rate_pct: number;
};

export type PendingCorrectionsAnalytics = {
  organisation_id: string;
  practitioner_user_id: string | null;
  pending_corrections: number;
};

export type RiskMetricsAnalytics = {
  organisation_id: string;
  risk_category: string;
  participant_count: number;
  total_participants: number;
  percentage: number | null;
};

export type ReferralAnalytics = {
  organisation_id: string;
  screening_id: string;
  screening_date: string;
  referral_required: boolean;
  referral_created: boolean;
  referral_missing: boolean;
  referral_id: string | null;
  referral_status: string | null;
  urgency: string | null;
  referred_at: string | null;
  due_at: string | null;
  completed_at: string | null;
};

export type ReferralFollowupAnalytics = {
  organisation_id: string;
  referral_id: string;
  screening_id: string;
  referral_status: string | null;
  referred_at: string;
  follow_up_count: number;
  follow_up_completed: boolean;
  latest_follow_up_at: string | null;
  next_follow_up_at: string | null;
};
