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
}
