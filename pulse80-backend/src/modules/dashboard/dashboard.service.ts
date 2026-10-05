import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

type ParticipationViewRow = {
  eligible_participant_count: number | null;
  screened_participant_count: number | null;
  screening_participation_rate_pct: number | null;
};

type CompletionViewRow = {
  expected_required_screenings: number | null;
  completed_required_screenings: number | null;
  screening_completion_rate: number | null;
};

type RiskMetricsRow = {
  risk_category: string | null;
  participant_count: number | null;
};

function requireCount(result: CountResult) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export class DashboardService {
  constructor(private readonly supabase: TypedSupabase) {}

  /**
   * Implements data-analytics/sql/002_participants_screened_calculation.sql
   * for the dashboards' all-programme, all-time scope. Tenant callers must
   * supply the organisation ID authorised by the resolver, never client input.
   * The admin total sums tenant-distinct references (references are not global IDs).
   */
  private async countParticipantsScreened(organisationId?: string) {
    const participants = new Set<string>();
    const pageSize = 1000;
    let offset = 0;

    while (true) {
      let query = this.supabase
        .from("screenings")
        .select("organisation_id, participant_reference, activations!screenings_activation_id_fkey!inner(organisation_id, programme_id)")
        .ilike("status", "completed")
        .order("id")
        .range(offset, offset + pageSize - 1);

      if (organisationId !== undefined) {
        query = query
          .eq("organisation_id", organisationId)
          .eq("activations.organisation_id", organisationId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      if (!data?.length) break;

      for (const screening of data) {
        // Match the SQL join's tenant condition, including for platform admins.
        if (screening.activations.organisation_id !== screening.organisation_id) continue;
        if (screening.participant_reference == null) continue;
        participants.add(JSON.stringify([screening.organisation_id, screening.participant_reference]));
      }
      // Continue even after a short page: the server may cap responses below 1000.
      offset += data.length;
    }

    return participants.size;
  }

  async getAdminStats() {
    const now = new Date().toISOString();
    const [organisations, workforce, verifiedPractitioners, upcomingAssignments] =
      await Promise.all([
        this.supabase
          .from("organisations")
          .select("*", { count: "exact", head: true }),
        this.supabase.from("organisations").select("workforce_size"),
        this.supabase
          .from("practitioner_profiles")
          .select("*", { count: "exact", head: true })
          .eq("verification_status", "Verified")
          .eq("practitioner_status", "Active"),
        this.supabase
          .from("practitioner_assignments")
          .select("*", { count: "exact", head: true })
          .gte("starts_at", now)
          .in("status", ["Scheduled", "Confirmed"]),
      ]);

    if (workforce.error) {
      throw new Error(workforce.error.message);
    }

    return {
      totalOrganisations: requireCount(organisations),
      representedEmployees: (workforce.data ?? []).reduce(
        (total, organisation) => total + (organisation.workforce_size ?? 0),
        0,
      ),
      verifiedPractitioners: requireCount(verifiedPractitioners),
      upcomingAssignments: requireCount(upcomingAssignments),
    };
  }

  async getAdminPortalAnalytics() {
    const [participantsScreened, participation, completion, risk, completedScreenings, referrals, missingReferrals, followUps, followedUpReferrals] = await Promise.all([
      this.countParticipantsScreened(),
      this.supabase
        .from("analytics_screening_participation")
        .select("eligible_participant_count, screened_participant_count")
        .range(0, 9999),
      this.supabase
        .from("analytics_screening_completion")
        .select("expected_required_screenings, completed_required_screenings")
        .range(0, 9999),
      this.supabase
        .from("analytics_risk_metrics")
        .select("risk_category, participant_count")
        .range(0, 9999),
      this.supabase
        .from("screenings")
        .select("id", { count: "exact", head: true })
        .eq("status", "Completed"),
      this.supabase
        .from("analytics_referrals")
        .select("referral_id", { count: "exact", head: true }),
      this.supabase
        .from("analytics_referrals")
        .select("referral_id", { count: "exact", head: true })
        .eq("referral_missing", true),
      this.supabase
        .from("analytics_referral_followups")
        .select("referral_id", { count: "exact", head: true }),
      this.supabase
        .from("analytics_referral_followups")
        .select("referral_id", { count: "exact", head: true })
        .eq("follow_up_completed", true),
    ]);

    for (const result of [participation, completion, risk]) {
      if (result.error) throw new Error(result.error.message);
    }

    const participationRows = participation.data as unknown as ParticipationViewRow[];
    const completionRows = completion.data as unknown as CompletionViewRow[];
    const riskRows = risk.data as unknown as RiskMetricsRow[];
    const eligibleParticipants = participationRows.reduce(
      (total, row) => total + (row.eligible_participant_count ?? 0),
      0,
    );
    const participationScreenedParticipants = participationRows.reduce(
      (total, row) => total + (row.screened_participant_count ?? 0),
      0,
    );
    const expectedRequiredScreenings = completionRows.reduce(
      (total, row) => total + (row.expected_required_screenings ?? 0),
      0,
    );
    const completedRequiredScreenings = completionRows.reduce(
      (total, row) => total + (row.completed_required_screenings ?? 0),
      0,
    );
    const riskCategories = ["Low", "Moderate", "High", "Not Calculated"];
    const riskDistribution = riskCategories.map((riskCategory) => ({
      riskCategory,
      participantCount: riskRows
        .filter((row) => row.risk_category === riskCategory)
        .reduce((total, row) => total + (row.participant_count ?? 0), 0),
    }));

    for (const result of [completedScreenings, referrals, missingReferrals, followUps, followedUpReferrals]) {
      if (result.error) throw new Error(result.error.message);
    }

    const requiredReferralCount = requireCount(referrals);
    const missingReferralCount = requireCount(missingReferrals);
    const followUpCount = requireCount(followUps);
    const followedUpReferralCount = requireCount(followedUpReferrals);

    return {
      participantsScreened,
      eligibleParticipants,
      screeningParticipationRate: eligibleParticipants
        ? (participationScreenedParticipants / eligibleParticipants) * 100
        : null,
      completedScreenings: requireCount(completedScreenings),
      expectedRequiredScreenings,
      completedRequiredScreenings,
      screeningCompletionRate: expectedRequiredScreenings
        ? (completedRequiredScreenings / expectedRequiredScreenings) * 100
        : null,
      riskDistribution,
      requiredReferralCount,
      missingReferralCount,
      followUpCount,
      followedUpReferralCount,
    };
  }

  async getOrganisationStats(organisationId: string) {
    const now = new Date().toISOString();
    const [
      organisation,
      participantsScreened,
      completedScreenings,
      upcomingActivations,
      participation,
      completion,
    ] =
      await Promise.all([
        this.supabase
          .from("organisations")
          .select("workforce_size, wellness_risk_score")
          .eq("id", organisationId)
          .single(),
        this.countParticipantsScreened(organisationId),
        this.supabase
          .from("screenings")
          .select("*", { count: "exact", head: true })
          .eq("organisation_id", organisationId)
          .eq("status", "Completed"),
        this.supabase
          .from("activations")
          .select("*", { count: "exact", head: true })
          .eq("organisation_id", organisationId)
          .gte("starts_at", now)
          .in("status", ["Scheduled", "Planning"]),
        this.supabase
          .from("analytics_screening_participation")
          .select(
            "eligible_participant_count, screened_participant_count, screening_participation_rate_pct",
          )
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        this.supabase
          .from("analytics_screening_completion")
          .select(
            "expected_required_screenings, completed_required_screenings, screening_completion_rate",
          )
          .eq("organisation_id", organisationId)
          .maybeSingle(),
      ]);

    if (organisation.error) throw new Error(organisation.error.message);
    if (participation.error) throw new Error(participation.error.message);
    if (completion.error) throw new Error(completion.error.message);

    const participationRow = participation.data as ParticipationViewRow | null;
    const completionRow = completion.data as CompletionViewRow | null;
    const wellnessRiskScore = organisation.data.wellness_risk_score;
    return {
      workforceSize: organisation.data.workforce_size ?? 0,
      wellnessRiskScore,
      wellnessRisk: riskLabel(wellnessRiskScore),
      completedScreenings: requireCount(completedScreenings),
      participantsScreened,
      eligibleParticipants: participationRow?.eligible_participant_count ?? 0,
      screeningParticipation:
        participationRow?.screening_participation_rate_pct ?? 0,
      expectedRequiredScreenings:
        completionRow?.expected_required_screenings ?? 0,
      completedRequiredScreenings:
        completionRow?.completed_required_screenings ?? 0,
      screeningCompletionRate: completionRow?.screening_completion_rate ?? 0,
      upcomingActivations: requireCount(upcomingActivations),
    };
  }
}

function riskLabel(score: number) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}
