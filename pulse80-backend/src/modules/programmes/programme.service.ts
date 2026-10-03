import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export interface ProgrammeInput {
  organisationId: string;
  name: string;
  description: string | null;
  status: "Planned" | "Active" | "Paused" | "Completed" | "Cancelled";
  startsOn: string;
  endsOn: string;
  serviceNames: string[];
  targetParticipants: number;
}

export interface ActivationInput {
  programmeId: string;
  title: string;
  description: string | null;
  location: string;
  startsAt: string;
  endsAt: string;
  expectedParticipants: number;
  serviceNames: string[];
  status: "Draft" | "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Action Required";
  readinessLabels: string[];
}

const programmeSelect = `
  id, organisation_id, name, description, status, starts_on, ends_on,
  service_names, target_participants, created_at, updated_at,
  organisations (name), activations (id)
`;

const activationSelect = `
  id, programme_id, organisation_id, title, description, location,
  starts_at, ends_at, expected_participants, service_names, status,
  created_at, updated_at, programmes (name, organisations (name)),
  activation_readiness_items (id, label, completed, completed_at),
  practitioner_assignments (id)
`;

export class ProgrammeService {
  constructor(private readonly supabase: TypedSupabase) {}

  async assignmentActivations() {
    const [activations, catalogue, links] = await Promise.all([
      this.listActivations(),
      this.supabase.from("services").select("id, name, code").eq("active", true),
      this.supabase.from("programme_services").select("programme_id, service_id"),
    ]);
    if (catalogue.error) throw new Error(catalogue.error.message);
    if (links.error) throw new Error(links.error.message);
    return activations.map((event) => ({
      id: event.id, organisationId: event.organisation_id, programmeName: event.programmes?.name,
      title: event.title, location: event.location, startsAt: event.starts_at, endsAt: event.ends_at,
      services: catalogue.data.filter((service) =>
        links.data.some((link) => link.programme_id === event.programme_id && link.service_id === service.id) &&
        event.service_names.some((name) => [service.name.toLowerCase(), service.code.toLowerCase()].includes(name.trim().toLowerCase()))),
    }));
  }

  async saveParticipant(input: { programmeId: string; employeeId: string; screeningReference: string; requiredServiceIds: string[]; eligibilityStatus: string; registrationStatus: string }) {
    const { data, error } = await this.supabase.rpc("save_programme_participant", {
      p_programme_id: input.programmeId, p_employee_id: input.employeeId,
      p_screening_reference: input.screeningReference, p_service_ids: input.requiredServiceIds,
      p_eligibility_status: input.eligibilityStatus, p_registration_status: input.registrationStatus,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async listProgrammes() {
    const { data, error } = await this.supabase.from("programmes").select(programmeSelect).order("starts_on", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async listActivations() {
    const { data, error } = await this.supabase.from("activations").select(activationSelect).order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async listOrganisationActivations(organisationId: string) {
    const { data, error } = await this.supabase
      .from("activations")
      .select(activationSelect)
      .eq("organisation_id", organisationId)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async createProgramme(input: ProgrammeInput) {
    const { data, error } = await this.supabase.from("programmes").insert({
      organisation_id: input.organisationId,
      name: input.name,
      description: input.description,
      status: input.status,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      service_names: input.serviceNames,
      target_participants: input.targetParticipants,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return this.getProgramme(data.id);
  }

  async updateProgramme(id: string, input: ProgrammeInput) {
    const { error } = await this.supabase.from("programmes").update({
      organisation_id: input.organisationId,
      name: input.name,
      description: input.description,
      status: input.status,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      service_names: input.serviceNames,
      target_participants: input.targetParticipants,
    }).eq("id", id);
    if (error) throw new Error(error.message);
    return this.getProgramme(id);
  }

  async createActivation(input: ActivationInput) {
    const programme = await this.requireActivationWithinProgramme(input);
    const { data, error } = await this.supabase.from("activations").insert({
      programme_id: input.programmeId,
      organisation_id: programme.organisation_id,
      title: input.title,
      description: input.description,
      location: input.location,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      expected_participants: input.expectedParticipants,
      service_names: input.serviceNames,
      status: input.status,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await this.replaceReadiness(data.id, input.readinessLabels);
    return this.getActivation(data.id);
  }

  async updateActivation(id: string, input: ActivationInput) {
    const programme = await this.requireActivationWithinProgramme(input);
    const { error } = await this.supabase.from("activations").update({
      programme_id: input.programmeId,
      organisation_id: programme.organisation_id,
      title: input.title,
      description: input.description,
      location: input.location,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      expected_participants: input.expectedParticipants,
      service_names: input.serviceNames,
      status: input.status,
    }).eq("id", id);
    if (error) throw new Error(error.message);
    await this.replaceReadiness(id, input.readinessLabels);
    return this.getActivation(id);
  }

  async setReadinessItem(id: string, completed: boolean) {
    const { data, error } = await this.supabase.from("activation_readiness_items").update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", id).select("activation_id").single();
    if (error) throw new Error(error.message);
    return this.getActivation(data.activation_id);
  }

  private async requireActivationWithinProgramme(input: ActivationInput) {
    const { data, error } = await this.supabase.from("programmes").select("organisation_id, starts_on, ends_on, service_names").eq("id", input.programmeId).single();
    if (error) throw new Error(error.message);
    const startDate = input.startsAt.slice(0, 10);
    const endDate = input.endsAt.slice(0, 10);
    if (startDate < data.starts_on || endDate > data.ends_on) throw new Error("Activation dates must fall within the programme period.");
    const unsupported = input.serviceNames.filter((service) => !data.service_names.includes(service));
    if (unsupported.length) throw new Error("Activation services must be included in the programme.");
    return data;
  }

  private async replaceReadiness(activationId: string, labels: string[]) {
    const { data: existing, error: readError } = await this.supabase.from("activation_readiness_items").select("id, label").eq("activation_id", activationId);
    if (readError) throw new Error(readError.message);
    const normalized = [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
    const removed = (existing ?? []).filter((item) => !normalized.includes(item.label)).map((item) => item.id);
    if (removed.length) {
      const { error } = await this.supabase.from("activation_readiness_items").delete().in("id", removed);
      if (error) throw new Error(error.message);
    }
    const rows = normalized.map((label) => ({ activation_id: activationId, label }));
    if (rows.length) {
      const { error } = await this.supabase.from("activation_readiness_items").upsert(rows, { onConflict: "activation_id,label", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
  }

  private async getProgramme(id: string) {
    const { data, error } = await this.supabase.from("programmes").select(programmeSelect).eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  private async getActivation(id: string) {
    const { data, error } = await this.supabase.from("activations").select(activationSelect).eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }
}
