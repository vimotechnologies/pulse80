import { resolveScreeningParticipant } from "./participant-code.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FlexibleResultValue = { fieldId: string; valueNumber?: number | null; valueText?: string | null; valueBoolean?: boolean | null; valueCode?: string | null };
export type FlexibleCaptureInput = { assignmentId: string; serviceId: string; participantReference: string; department?: string | null; consentConfirmed: boolean; practitionerNote?: string | null; values: FlexibleResultValue[]; outcomeSummary?: string | null; referralRequired?: boolean; escalationRequired?: boolean; reportingRiskCategory?: string | null };

type FieldRow = { id: string; service_id: string; code: string; label: string; data_type: string; unit: string | null; required: boolean; options: unknown; min_value: number | null; max_value: number | null; display_order: number };
type AssignmentRow = { id: string; practitioner_user_id: string; organisation_id: string | null; activation_id: string | null; service_id: string | null; status: string };

export class FlexibleScreeningService {
  private readonly db: SupabaseClient<any>;
  constructor(supabase: SupabaseClient<any>) { this.db = supabase; }

  async fieldsForService(serviceId: string) {
    const { data, error } = await this.db.from("service_result_fields").select("id, service_id, code, label, data_type, unit, required, options, min_value, max_value, display_order").eq("service_id", serviceId).eq("active", true).lt("display_order", 900).order("display_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as FieldRow[];
  }

  async assignmentServices(userId: string, assignmentId: string) {
    const { data: assignment, error } = await this.db.from("practitioner_assignments").select("id, practitioner_user_id, organisation_id, activation_id, service_id, status").eq("id", assignmentId).eq("practitioner_user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!assignment) throw new Error("Assignment is unavailable.");
    const { data: rows, error: servicesError } = await this.db.from("practitioner_assignment_services").select("service_id, services(id, code, name)").eq("practitioner_assignment_id", assignmentId).not("service_id", "is", null);
    if (servicesError) throw new Error(servicesError.message);
    const services = (rows ?? []).map((row: any) => row.services).filter(Boolean);
    if (!services.length && assignment.service_id) {
      const { data: service } = await this.db.from("services").select("id, code, name").eq("id", assignment.service_id).maybeSingle();
      if (service) services.push(service);
    }
    return services;
  }

  async capture(userId: string, input: FlexibleCaptureInput) {
    if (!input.consentConfirmed) throw new Error("Participant consent must be confirmed before submission.");
    const { data: assignment, error } = await this.db.from("practitioner_assignments").select("id, practitioner_user_id, organisation_id, activation_id, service_id, status").eq("id", input.assignmentId).eq("practitioner_user_id", userId).in("status", ["Confirmed", "In Progress"]).maybeSingle();
    if (error) throw new Error(error.message);
    const a = assignment as AssignmentRow | null;
    if (!a?.organisation_id) throw new Error("Screenings can only be captured for your confirmed or active assignments.");

    if (!a.activation_id) throw new Error("This assignment needs an activation link before screening capture.");
    const participantId = await resolveScreeningParticipant(this.db, a.id, userId, input.participantReference);
    const services = await this.assignmentServices(userId, input.assignmentId);
    if (!services.some((service: any) => service.id === input.serviceId)) throw new Error("This service is not part of the selected assignment.");
    const fields = await this.fieldsForService(input.serviceId);
    if (!fields.length) throw new Error("This service does not have screening fields configured yet.");
    const safeValues = calculateBmiValues(fields, input.values);
    validateValues(fields, safeValues);

    const { data: screening, error: screeningError } = await this.db.from("screenings").insert({ organisation_id: a.organisation_id, activation_id: a.activation_id, assignment_id: a.id, practitioner_user_id: userId, service_id: input.serviceId, programme_participant_id: participantId, participant_reference: input.participantReference.trim(), department: input.department || null, consent_confirmed: true, practitioner_note: input.practitionerNote || null, status: "Under Review", submitted_at: new Date().toISOString() }).select("id").single();
    if (screeningError) throw new Error(screeningError.message);
    try {
      const rows = safeValues.map((value) => ({ screening_id: screening.id, service_result_field_id: value.fieldId, value_number: value.valueNumber ?? null, value_text: value.valueText ?? null, value_boolean: value.valueBoolean ?? null, value_code: value.valueCode ?? null }));
      const { error: valueError } = await this.db.from("screening_result_values").insert(rows);
      if (valueError) throw new Error(valueError.message);
      const { error: outcomeError } = await this.db.from("screening_outcomes").insert({ screening_id: screening.id, outcome_summary: input.outcomeSummary || null, referral_required: input.referralRequired ?? false, escalation_required: input.escalationRequired ?? false, reporting_risk_category: input.reportingRiskCategory || null });
      if (outcomeError) throw new Error(outcomeError.message);
      return screening.id as string;
    } catch (captureError) {
      await this.db.from("screenings").delete().eq("id", screening.id);
      throw captureError;
    }
  }
}

function validateValues(fields: FieldRow[], values: FlexibleResultValue[]) {
  const byId = new Map(values.map((value) => [value.fieldId, value]));
  for (const value of values) if (!fields.some((field) => field.id === value.fieldId)) throw new Error("A submitted result field does not belong to this service.");
  for (const field of fields) {
    const value = byId.get(field.id);
    if (field.required && !value) throw new Error(`${field.label} is required.`);
    if (!value) continue;
    const supplied = [value.valueNumber, value.valueText, value.valueBoolean, value.valueCode].filter((item) => item !== null && item !== undefined);
    if (supplied.length !== 1) throw new Error(`${field.label} must contain one value.`);
    if (field.data_type === "number") {
      if (value.valueNumber === null || value.valueNumber === undefined || !Number.isFinite(value.valueNumber)) throw new Error(`${field.label} must be a number.`);
      if (field.min_value !== null && value.valueNumber < field.min_value) throw new Error(`${field.label} is below the allowed range.`);
      if (field.max_value !== null && value.valueNumber > field.max_value) throw new Error(`${field.label} is above the allowed range.`);
    } else if (field.data_type === "boolean" && typeof value.valueBoolean !== "boolean") throw new Error(`${field.label} must be Yes or No.`);
    else if (field.data_type === "text" && !value.valueText?.trim()) throw new Error(`${field.label} is required.`);
    else if (field.data_type === "select") {
      const options = Array.isArray(field.options) ? field.options : [];
      if (!value.valueCode || !options.includes(value.valueCode)) throw new Error(`${field.label} has an invalid option.`);
    }
  }
}
function calculateBmiValues(fields: FieldRow[], values: FlexibleResultValue[]): FlexibleResultValue[] {
  const bmi = fields.find(field => /^(bmi|body_mass_index)$/i.test(field.code) || /^(bmi|body mass index)$/i.test(field.label));
  if (!bmi) return values;
  const height = fields.find(field => /height/i.test(field.code + " " + field.label));
  const weight = fields.find(field => /weight/i.test(field.code + " " + field.label));
  if (!height || !weight) throw new Error("BMI requires height and weight fields.");
  const h = values.find(value => value.fieldId === height.id)?.valueNumber;
  const w = values.find(value => value.fieldId === weight.id)?.valueNumber;
  if (h === undefined || h === null || w === undefined || w === null || h <= 0 || w <= 0) throw new Error("Enter valid height and weight to calculate BMI.");
  const metres = /\\bcm\\b/i.test(height.unit ?? "") || h > 3 ? h / 100 : h;
  const result = Math.round((w / (metres * metres)) * 10) / 10;
  if (!Number.isFinite(result) || result <= 0) throw new Error("Invalid height or weight for BMI.");
  return [...values.filter(value => value.fieldId !== bmi.id), { fieldId: bmi.id, valueNumber: result }];
}
