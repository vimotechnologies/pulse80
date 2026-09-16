import {
  periodStart,
  summariseParticipation,
  type DashboardPeriod,
  type ParticipationRow,
} from "./participation.js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

type CountResult = {
  count: number | null;
  error: { message: string } | null;
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
    const [
      organisations,
      workforce,
      verifiedPractitioners,
      upcomingAssignments,
    ] = await Promise.all([
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

  private async loadParticipation(
    organisationId: string,
    start: string | null,
    now: Date,
  ) {
    const rows: ParticipationRow[] = [];
    let afterId: string | undefined;

    // Page by the unique ID so the Data API row limit cannot truncate the count.
    for (;;) {
      let query = this.supabase
        .from("screenings")
        .select("id, participant_reference, captured_at, department")
        .eq("organisation_id", organisationId)
        .eq("status", "Approved")
        .lte("captured_at", now.toISOString())
        .order("id")
        .limit(1000);
      if (start) query = query.gte("captured_at", start);
      if (afterId) query = query.gt("id", afterId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      if (!data?.length) break;

      for (const screening of data) {
        rows.push(screening);
        afterId = screening.id;
      }
    }

    return {
      ...summariseParticipation(rows, start, now),
      approvedScreenings: rows.length,
    };
  }

  async getOrganisationStats(
    organisationId: string,
    period: DashboardPeriod = "ALL_TIME",
  ) {
    const now = new Date().toISOString();
    const start = periodStart(period, new Date(now));
    const [organisation, upcomingActivations, participation, activities] =
      await Promise.all([
        this.supabase
          .from("organisations")
          .select("name, workforce_size, wellness_risk_score")
          .eq("id", organisationId)
          .single(),
        this.supabase
          .from("activations")
          .select("*", { count: "exact", head: true })
          .eq("organisation_id", organisationId)
          .gte("starts_at", now)
          .in("status", ["Scheduled", "Planning"]),
        this.loadParticipation(organisationId, start, new Date(now)),
        this.supabase
          .from("activations")
          .select("id, title, starts_at, location, status")
          .eq("organisation_id", organisationId)
          .gte("starts_at", now)
          .in("status", ["Scheduled", "Planning"])
          .order("starts_at")
          .order("id")
          .limit(5),
      ]);

    if (organisation.error) throw new Error(organisation.error.message);

    const workforceSize = organisation.data.workforce_size ?? 0;
    const wellnessRiskScore = organisation.data.wellness_risk_score;
    if (activities.error) throw new Error(activities.error.message);

    const { participantsScreened } = participation;
    return {
      ...participation,
      organisationName: organisation.data.name,
      refreshedAt: now,
      upcomingActivities: (activities.data ?? []).map((activity) => ({
        id: activity.id,
        title: activity.title,
        startsAt: activity.starts_at,
        location: activity.location,
        status: activity.status,
      })),
      workforceSize,
      wellnessRiskScore,
      wellnessRisk: riskLabel(wellnessRiskScore),
      participantsScreened,
      screeningParticipation:
        workforceSize > 0
          ? Math.min(
              100,
              Math.round((participantsScreened / workforceSize) * 100),
            )
          : 0,
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
