import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export class PractitionerDashboardService {
  constructor(private readonly supabase: TypedSupabase) {}

  async getDashboard(userId: string) {
    const now = new Date().toISOString();
    const [assignmentsResult, assignmentCountResult, screeningsResult, alertsResult] = await Promise.all([
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
      this.supabase
        .from("screenings")
        .select(`
          id, participant_reference, status, captured_at, reviewed_at, review_note,
          practitioner_assignments(activity_name, practitioner_assignment_services(service_name)),
          screening_correction_errors(id, field_name, message, returned_at, resolved_at)
        `)
        .eq("practitioner_user_id", userId)
        .order("captured_at", { ascending: false }),
      this.supabase
        .from("practitioner_assignment_alerts")
        .select("id, message, change_type, urgent, changed_at")
        .eq("practitioner_user_id", userId)
        .is("acknowledged_at", null)
        .order("urgent", { ascending: false })
        .order("changed_at", { ascending: false }),
    ]);

    if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
    if (assignmentCountResult.error) throw new Error(assignmentCountResult.error.message);
    if (screeningsResult.error) throw new Error(screeningsResult.error.message);
    if (alertsResult.error) throw new Error(alertsResult.error.message);

    const screenings = screeningsResult.data;
    const completed = screenings.filter((item) =>
      ["Submitted", "Under Review", "Approved"].includes(item.status),
    );
    const pending = screenings.filter((item) => item.status === "Needs Correction");
    const participants = new Set(completed.map((item) => item.participant_reference));
    const completionRate = screenings.length
      ? Math.round((completed.length / screenings.length) * 100)
      : 0;

    return {
      stats: {
        upcomingAssignments: assignmentCountResult.count ?? 0,
        participantsScreened: participants.size,
        screeningCompletionRate: completionRate,
        pendingCorrections: pending.length,
      },
      assignmentAlert: alertsResult.data[0]
        ? { ...alertsResult.data[0], additionalAlertCount: Math.max(alertsResult.data.length - 1, 0) }
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
      recentCorrections: pending
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
        .sort((a, b) => b.returnedAt.localeCompare(a.returnedAt))
        .slice(0, 5),
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

    const botswanaDate = (value: Date) => new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(value);
    const urgent = response === "Withdrawn"
      && botswanaDate(new Date(assignment.starts_at)) === botswanaDate(new Date());
    const respondedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await this.supabase
      .from("practitioner_assignments")
      .update({
        status: response,
        response_reason: reason,
        responded_at: respondedAt,
        withdrawal_urgent: urgent,
      })
      .eq("id", assignmentId)
      .eq("practitioner_user_id", userId)
      .eq("status", assignment.status)
      .select("id, status, responded_at, response_reason, withdrawal_urgent")
      .maybeSingle();
    if (updateError || !updated) throw new Error(updateError?.message ?? "Assignment status changed. Refresh and try again.");

    const { error: historyError } = await this.supabase.from("practitioner_assignment_responses").insert({
      practitioner_assignment_id: assignmentId,
      practitioner_user_id: userId,
      previous_status: assignment.status,
      response_status: response,
      reason,
      urgent,
      responded_at: respondedAt,
    });
    if (historyError) {
      await this.supabase.from("practitioner_assignments").update({ status: assignment.status }).eq("id", assignmentId);
      throw new Error(historyError.message);
    }
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
