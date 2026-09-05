import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export interface ScreeningCaptureInput {
  assignmentId: string;
  participantReference: string;
  department: string | null;
  consentConfirmed: boolean;
  practitionerNote: string | null;
  systolicMmhg: number | null;
  diastolicMmhg: number | null;
  glucoseMmolL: number | null;
  cholesterolMmolL: number | null;
  heightCm: number | null;
  weightKg: number | null;
}

export type ScreeningCorrectionInput = Omit<ScreeningCaptureInput, "assignmentId">;

const screeningSelect = `
  id, organisation_id, activation_id, assignment_id, practitioner_user_id,
  participant_reference, department, consent_confirmed, status,
  practitioner_note, captured_at, submitted_at, reviewed_at, review_note,
  organisations (name), activations (title),
  practitioner_profiles (profiles (full_name)),
  screening_results (
    systolic_mmhg, diastolic_mmhg, glucose_mmol_l,
    cholesterol_mmol_l, height_cm, weight_kg, bmi,
    risk_level, escalation_required
  )
`;

export class ScreeningService {
  constructor(private readonly supabase: TypedSupabase) {}

  async listAll() {
    const { data, error } = await this.supabase.from("screenings").select(screeningSelect).order("captured_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async listForPractitioner(userId: string) {
    const { data, error } = await this.supabase.from("screenings").select(screeningSelect).eq("practitioner_user_id", userId).order("captured_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async listAssignmentOptions(userId: string) {
    const { data, error } = await this.supabase
      .from("practitioner_assignments")
      .select("id, service_name, location, starts_at, status, organisations(name), activations(title)")
      .eq("practitioner_user_id", userId)
      .in("status", ["Confirmed", "In Progress"])
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async capture(userId: string, input: ScreeningCaptureInput) {
    validateMeasurements(input);

    const { data: assignment, error: assignmentError } = await this.supabase
      .from("practitioner_assignments")
      .select("id, practitioner_user_id, organisation_id, activation_id, status")
      .eq("id", input.assignmentId)
      .eq("practitioner_user_id", userId)
      .in("status", ["Confirmed", "In Progress"])
      .maybeSingle();
    if (assignmentError) throw new Error(assignmentError.message);
    if (!assignment) throw new Error("Screenings can only be captured for your confirmed or active assignments.");
    if (!assignment.organisation_id) throw new Error("The assignment is not linked to an organisation.");

    const bmi = input.heightCm && input.weightKg
      ? Number((input.weightKg / ((input.heightCm / 100) ** 2)).toFixed(2))
      : null;
    const riskLevel = calculateRisk({ ...input, bmi });

    const { data: screening, error: screeningError } = await this.supabase.from("screenings").insert({
      organisation_id: assignment.organisation_id,
      activation_id: assignment.activation_id,
      assignment_id: assignment.id,
      practitioner_user_id: userId,
      participant_reference: input.participantReference,
      department: input.department,
      consent_confirmed: true,
      status: "Under Review",
      practitioner_note: input.practitionerNote,
      submitted_at: new Date().toISOString(),
    }).select("id").single();
    if (screeningError) throw new Error(screeningError.message);

    const { error: resultError } = await this.supabase.from("screening_results").insert({
      screening_id: screening.id,
      systolic_mmhg: input.systolicMmhg,
      diastolic_mmhg: input.diastolicMmhg,
      glucose_mmol_l: input.glucoseMmolL,
      cholesterol_mmol_l: input.cholesterolMmolL,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      bmi,
      risk_level: riskLevel,
      escalation_required: riskLevel === "High",
    });
    if (resultError) {
      await this.supabase.from("screenings").delete().eq("id", screening.id);
      throw new Error(resultError.message);
    }
    return this.get(screening.id);
  }

  async resubmit(id: string, userId: string, input: ScreeningCorrectionInput) {
    validateMeasurements(input);

    const { data: screening, error: screeningError } = await this.supabase
      .from("screenings")
      .select("id, practitioner_user_id, status")
      .eq("id", id)
      .eq("practitioner_user_id", userId)
      .maybeSingle();
    if (screeningError) throw new Error(screeningError.message);
    if (!screening) throw new Error("Screening record is unavailable.");
    if (screening.status !== "Needs Correction") throw new Error("Only screenings returned for correction can be resubmitted.");

    const { data: previousResult, error: previousResultError } = await this.supabase
      .from("screening_results")
      .select("systolic_mmhg, diastolic_mmhg, glucose_mmol_l, cholesterol_mmol_l, height_cm, weight_kg, bmi, risk_level, escalation_required")
      .eq("screening_id", id)
      .single();
    if (previousResultError) throw new Error(previousResultError.message);

    const bmi = input.heightCm && input.weightKg
      ? Number((input.weightKg / ((input.heightCm / 100) ** 2)).toFixed(2))
      : null;
    const riskLevel = calculateRisk({ ...input, assignmentId: "", bmi });
    const nextResult = {
      systolic_mmhg: input.systolicMmhg,
      diastolic_mmhg: input.diastolicMmhg,
      glucose_mmol_l: input.glucoseMmolL,
      cholesterol_mmol_l: input.cholesterolMmolL,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      bmi,
      risk_level: riskLevel,
      escalation_required: riskLevel === "High",
    };

    const { error: resultError } = await this.supabase.from("screening_results").update(nextResult).eq("screening_id", id);
    if (resultError) throw new Error(resultError.message);

    const { data: updated, error: updateError } = await this.supabase.from("screenings").update({
      participant_reference: input.participantReference,
      department: input.department,
      consent_confirmed: true,
      practitioner_note: input.practitionerNote,
      status: "Under Review",
      submitted_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
    }).eq("id", id).eq("practitioner_user_id", userId).eq("status", "Needs Correction").select("id").maybeSingle();

    if (updateError || !updated) {
      await this.supabase.from("screening_results").update(previousResult).eq("screening_id", id);
      throw new Error(updateError?.message ?? "Screening status changed before it could be resubmitted.");
    }

    const { error: resolveError } = await this.supabase
      .from("screening_correction_errors")
      .update({ resolved_at: new Date().toISOString() })
      .eq("screening_id", id)
      .is("resolved_at", null);
    if (resolveError) throw new Error(resolveError.message);

    return this.get(id);
  }

  async review(
    id: string,
    reviewerId: string,
    status: "Approved" | "Needs Correction",
    reviewNote: string | null,
    errors: Array<{ field: string; message: string }>,
  ) {
    if (status === "Needs Correction" && !errors.length) throw new Error("At least one correction error is required.");
    const { error } = await this.supabase.from("screenings").update({
      status,
      review_note: reviewNote,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id).in("status", ["Submitted", "Under Review", "Needs Correction"]);
    if (error) throw new Error(error.message);
    if (status === "Needs Correction") {
      const { error: correctionError } = await this.supabase.from("screening_correction_errors").insert(
        errors.map((item) => ({ screening_id: id, field_name: item.field, message: item.message })),
      );
      if (correctionError) throw new Error(correctionError.message);
    } else {
      const { error: resolveError } = await this.supabase
        .from("screening_correction_errors")
        .update({ resolved_at: new Date().toISOString() })
        .eq("screening_id", id)
        .is("resolved_at", null);
      if (resolveError) throw new Error(resolveError.message);
    }
    return this.get(id);
  }

  private async get(id: string) {
    const { data, error } = await this.supabase.from("screenings").select(screeningSelect).eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

function validateMeasurements(input: ScreeningCorrectionInput) {
  if (!input.consentConfirmed) throw new Error("Participant consent must be confirmed before submission.");
  const measurements = [input.systolicMmhg, input.diastolicMmhg, input.glucoseMmolL, input.cholesterolMmolL, input.heightCm, input.weightKg];
  if (measurements.every((value) => value === null)) throw new Error("At least one screening measurement is required.");
  if ((input.systolicMmhg === null) !== (input.diastolicMmhg === null)) throw new Error("Both blood pressure values are required together.");
  if ((input.heightCm === null) !== (input.weightKg === null)) throw new Error("Height and weight are required together for BMI.");
}

function calculateRisk(input: ScreeningCaptureInput & { bmi: number | null }) {
  const high = (input.systolicMmhg ?? 0) >= 160 || (input.diastolicMmhg ?? 0) >= 100 || (input.glucoseMmolL ?? 0) >= 11.1 || (input.cholesterolMmolL ?? 0) >= 6.2 || (input.bmi ?? 0) >= 35;
  if (high) return "High";
  const medium = (input.systolicMmhg ?? 0) >= 140 || (input.diastolicMmhg ?? 0) >= 90 || (input.glucoseMmolL ?? 0) >= 7 || (input.cholesterolMmolL ?? 0) >= 5.2 || (input.bmi ?? 0) >= 30;
  return medium ? "Medium" : "Low";
}
