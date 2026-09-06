import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export function calculateDashboardStats(completedCount: number, screeningCount: number, pendingCount: number) {
  return {
    participantsScreened: screeningCount,
    screeningCompletionRate: screeningCount ? Math.round((completedCount / screeningCount) * 100) : 0,
    pendingCorrections: pendingCount,
  };
}

export function isUrgentWithdrawal(response: string, startsAt: string, now = new Date()) {
  const botswanaDate = (value: Date) => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(value);
  return response === "Withdrawn" && botswanaDate(new Date(startsAt)) === botswanaDate(now);
}

export class PractitionerDashboardService {
  constructor(private readonly supabase: TypedSupabase) {}

  async getDashboard(userId: string) {
    const now = new Date().toISOString();
    const completedStatuses = ["Under Review", "Approved"];
    const [assignmentsResult, assignmentCountResult, completedCountResult, screeningCountResult,
      pendingCountResult, correctionsResult, alertsResult] = await Promise.all([
      this.supabase
        .from("practitioner_assignments")
        .select(`
          id, programme_name, activity_name, location, starts_at, ends_at, status,
          role_name, response_reason, organisations(name),
          practitioner_assignment_services(service_name)
        `)
        .eq("practitioner_user_id", userId)
        .gte("starts_at", now)
        .in("status", ["Scheduled", "Confirmed"])
        .order("starts_at")
        .limit(5),
      this.supabase
        .from("practitioner_assignments")
        .select("id", { count: "exact", head: true })
        .eq("practitioner_user_id", userId)
        .gte("starts_at", now)
        .in("status", ["Scheduled", "Confirmed"]),
      this.supabase.from("screenings").select("id", { count: "exact", head: true })
        .eq("practitioner_user_id", userId).in("status", completedStatuses),
      this.supabase.from("screenings").select("id", { count: "exact", head: true })
        .eq("practitioner_user_id", userId),
      this.supabase.from("screenings").select("id", { count: "exact", head: true })
        .eq("practitioner_user_id", userId).eq("status", "Needs Correction"),
      this.supabase.from("screenings").select(`
        id, participant_reference, captured_at, reviewed_at, review_note,
        practitioner_assignments(activity_name, practitioner_assignment_services(service_name)),
        screening_correction_errors!inner(id, field_name, message, returned_at, resolved_at)
      `).eq("practitioner_user_id", userId).eq("status", "Needs Correction")
        .is("screening_correction_errors.resolved_at", null)
        .order("reviewed_at", { ascending: false }).limit(5),
      this.supabase
        .from("practitioner_assignment_alerts")
        .select("id, message, change_type, urgent, changed_at", { count: "exact" })
        .eq("practitioner_user_id", userId)
        .is("acknowledged_at", null)
        .order("urgent", { ascending: false })
        .order("changed_at", { ascending: false })
        .limit(1),
    ]);

    if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
    if (assignmentCountResult.error) throw new Error(assignmentCountResult.error.message);
    if (completedCountResult.error) throw new Error(completedCountResult.error.message);
    if (screeningCountResult.error) throw new Error(screeningCountResult.error.message);
    if (pendingCountResult.error) throw new Error(pendingCountResult.error.message);
    if (correctionsResult.error) throw new Error(correctionsResult.error.message);
    if (alertsResult.error) throw new Error(alertsResult.error.message);

    const completedCount = completedCountResult.count ?? 0;
    const screeningCount = screeningCountResult.count ?? 0;
    const screeningStats = calculateDashboardStats(
      completedCount, screeningCount, pendingCountResult.count ?? 0,
    );

    return {
      stats: {
        upcomingAssignments: assignmentCountResult.count ?? 0,
        ...screeningStats,
      },
      assignmentAlert: alertsResult.data[0]
        ? { ...alertsResult.data[0], additionalAlertCount: Math.max((alertsResult.count ?? 1) - 1, 0) }
        : null,
      upcomingAssignments: assignmentsResult.data.map((assignment) => ({
        id: assignment.id,
        organisationName: assignment.organisations?.name ?? "Organisation unavailable",
        programmeName: assignment.programme_name,
        activityName: assignment.activity_name,
        location: assignment.location,
        startsAt: assignment.starts_at,
        endsAt: assignment.ends_at,
        role: assignment.role_name,
        services: assignment.practitioner_assignment_services.map((item) => item.service_name),
        status: assignment.status,
        confirmationRequired: assignment.status === "Scheduled",
      })),
      recentCorrections: correctionsResult.data
        .map((screening) => {
          const errors = screening.screening_correction_errors
            .filter((item) => item.resolved_at === null)
            .map((item) => ({
              id: item.id,
              field: item.field_name,
              message: item.message,
              returnedAt: item.returned_at,
            }));
          return {
            id: screening.id,
            participantReference: screening.participant_reference,
            assignmentName: screening.practitioner_assignments?.activity_name ?? "Assignment unavailable",
            services: screening.practitioner_assignments?.practitioner_assignment_services.map((item) => item.service_name) ?? [],
            returnedAt: errors[0]?.returnedAt ?? screening.reviewed_at ?? screening.captured_at,
            errorCount: errors.length,
            errors,
            reviewerNote: screening.review_note,
          };
        })
        .filter((screening) => screening.errors.length > 0),
    };
  }

  async respondToAssignment(
    assignmentId: string,
    userId: string,
    response: "Confirmed" | "Declined" | "Withdrawn",
    reason: string | null,
  ) {
    const { data: assignment, error: findError } = await this.supabase
      .from("practitioner_assignments")
      .select("id, status, starts_at")
      .eq("id", assignmentId)
      .eq("practitioner_user_id", userId)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!assignment) throw new Error("Assignment is unavailable.");
    if (response !== "Confirmed" && !reason?.trim()) throw new Error("A reason is required.");

    const allowedPreviousStatus = response === "Confirmed" || response === "Declined" ? "Scheduled" : "Confirmed";
    if (assignment.status !== allowedPreviousStatus) {
      throw new Error(`Only ${allowedPreviousStatus.toLowerCase()} assignments can be ${response.toLowerCase()}.`);
    }

    const urgent = isUrgentWithdrawal(response, assignment.starts_at);
    const respondedAt = new Date().toISOString();
    const { error: updateError } = await this.supabase.rpc("respond_to_practitioner_assignment", {
      p_assignment_id: assignmentId,
      p_practitioner_user_id: userId,
      p_response: response,
      p_reason: reason,
      p_urgent: urgent,
      p_responded_at: respondedAt,
    });
    if (updateError) throw new Error(updateError.message);
    const { data: updated, error: readError } = await this.supabase
      .from("practitioner_assignments")
      .select("id, status, responded_at, response_reason, withdrawal_urgent")
      .eq("id", assignmentId)
      .single();
    if (readError) throw new Error(readError.message);
    return updated;
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const { data, error } = await this.supabase
      .from("practitioner_assignment_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", alertId)
      .eq("practitioner_user_id", userId)
      .is("acknowledged_at", null)
      .select("id, acknowledged_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Assignment alert is unavailable.");
    return data;
  }
}
