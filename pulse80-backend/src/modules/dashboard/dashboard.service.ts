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

function requireCount(result: CountResult) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export class DashboardService {
  constructor(private readonly supabase: TypedSupabase) {}

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

  async getOrganisationStats(organisationId: string) {
    const now = new Date().toISOString();
    const [
      organisation,
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
      participantsScreened: participationRow?.screened_participant_count ?? 0,
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
