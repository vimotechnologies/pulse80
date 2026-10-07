import type { SupabaseClient } from "@supabase/supabase-js";
import { GraphQLError } from "graphql";
import type { Database } from "../../generated/database.types.js";

export class ProgrammeExportService {
  constructor(private readonly db: SupabaseClient<Database>, private readonly organisationId?: string) {}

  private async programme(id: string) {
    let query = this.db.from("programmes").select("id, organisation_id, name").eq("id", id);
    if (this.organisationId !== undefined) query = query.eq("organisation_id", this.organisationId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new GraphQLError("Programme is unavailable.", { extensions: { code: "FORBIDDEN" } });
    return data;
  }

  async screeningRows(programmeId: string) {
    const programme = await this.programme(programmeId);
    const { data: activations, error: activationError } = await this.db.from("activations").select("id").eq("programme_id", programme.id).eq("organisation_id", programme.organisation_id);
    if (activationError) throw new Error(activationError.message);
    const activationIds = (activations ?? []).map(row => row.id);
    if (!activationIds.length) return { programmeName: programme.name, rows: [] };

    const { data, error } = await this.db.from("screenings").select(`
      id, participant_reference, department, status, captured_at, submitted_at, reviewed_at,
      service_id, services(name, code), practitioner_profiles(profiles(full_name)),
      screening_results(systolic_mmhg, diastolic_mmhg, glucose_mmol_l, cholesterol_mmol_l, height_cm, weight_kg, bmi, risk_level, escalation_required),
      screening_result_values(value_number, value_text, value_boolean, value_code, service_result_fields(label, unit)),
      screening_outcomes(outcome_summary, referral_required, escalation_required, reporting_risk_category)
    `).eq("organisation_id", programme.organisation_id).in("activation_id", activationIds).order("captured_at", { ascending: true });
    if (error) throw new Error(error.message);

    return { programmeName: programme.name, rows: (data ?? []).map((row: any) => ({
      screeningId: row.id,
      participantCode: row.participant_reference,
      service: row.services?.name ?? row.services?.code ?? "",
      department: row.department,
      status: row.status,
      practitioner: row.practitioner_profiles?.profiles?.full_name ?? "",
      capturedAt: row.captured_at,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      systolicMmhg: row.screening_results?.systolic_mmhg ?? null,
      diastolicMmhg: row.screening_results?.diastolic_mmhg ?? null,
      glucoseMmolL: row.screening_results?.glucose_mmol_l ?? null,
      cholesterolMmolL: row.screening_results?.cholesterol_mmol_l ?? null,
      heightCm: row.screening_results?.height_cm ?? null,
      weightKg: row.screening_results?.weight_kg ?? null,
      bmi: row.screening_results?.bmi ?? null,
      riskLevel: row.screening_results?.risk_level ?? row.screening_outcomes?.reporting_risk_category ?? null,
      escalationRequired: row.screening_outcomes?.escalation_required ?? row.screening_results?.escalation_required ?? false,
      referralRequired: row.screening_outcomes?.referral_required ?? false,
      outcomeSummary: row.screening_outcomes?.outcome_summary ?? null,
      flexibleResults: (row.screening_result_values ?? []).map((value: any) => ({
        label: value.service_result_fields?.label ?? "Result",
        unit: value.service_result_fields?.unit ?? null,
        value: value.value_number ?? value.value_text ?? value.value_code ?? (value.value_boolean === null || value.value_boolean === undefined ? null : value.value_boolean ? "Yes" : "No"),
      })),
    })) };
  }
}
