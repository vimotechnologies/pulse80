"use server";

import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";
import type { Activation, ActivationForm, Programme, ProgrammeForm } from "@/types/programme";

const programmeFields = `id organisationId organisationName name description status startsOn endsOn serviceNames targetParticipants activationCount createdAt updatedAt`;
const activationFields = `id programmeId programmeName organisationId organisationName title description location startsAt endsAt expectedParticipants serviceNames status readinessScore practitionerCount createdAt updatedAt readinessItems { id label completed completedAt }`;
const pageQuery = `query ProgrammeOperations { adminProgrammes { ${programmeFields} } adminActivations { ${activationFields} } adminOrganisations { id name status } }`;
const createProgrammeMutation = `mutation CreateProgramme($input: ProgrammeInput!) { createProgramme(input: $input) { ${programmeFields} } }`;
const updateProgrammeMutation = `mutation UpdateProgramme($id: ID!, $input: ProgrammeInput!) { updateProgramme(id: $id, input: $input) { ${programmeFields} } }`;
const createActivationMutation = `mutation CreateActivation($input: ActivationInput!) { createActivation(input: $input) { ${activationFields} } }`;
const updateActivationMutation = `mutation UpdateActivation($id: ID!, $input: ActivationInput!) { updateActivation(id: $id, input: $input) { ${activationFields} } }`;
const readinessMutation = `mutation SetActivationReadiness($id: ID!, $completed: Boolean!) { setActivationReadiness(id: $id, completed: $completed) { ${activationFields} } }`;

export type OrganisationOption = { id: string; name: string; status: string };
export async function loadProgrammeOperations() { return graphqlRequest<{ adminProgrammes: Programme[]; adminActivations: Activation[]; adminOrganisations: OrganisationOption[] }>(pageQuery); }
const list = (value: string) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
const programmeInput = (form: ProgrammeForm) => ({ ...form, description: form.description || null, serviceNames: list(form.serviceNames), targetParticipants: Number(form.targetParticipants) });
const activationInput = (form: ActivationForm) => ({ ...form, description: form.description || null, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), expectedParticipants: Number(form.expectedParticipants), serviceNames: list(form.serviceNames), readinessLabels: list(form.readinessLabels) });

async function mutate<T>(query: string, variables: Record<string, unknown>) {
  try { const result = await graphqlRequest<T>(query, { variables }); revalidatePath("/admin/programmes"); revalidatePath("/admin/activations"); revalidatePath("/client/activations"); return { ok: true as const, result }; }
  catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "UPDATE_FAILED" }; }
}
export async function createProgramme(form: ProgrammeForm) {
  return mutate<{ createProgramme: Programme }>(createProgrammeMutation, { input: programmeInput(form) });
}

export async function updateProgramme(id: string, form: ProgrammeForm) {
  return mutate<{ updateProgramme: Programme }>(updateProgrammeMutation, { id, input: programmeInput(form) });
}

export async function createActivation(form: ActivationForm) {
  return mutate<{ createActivation: Activation }>(createActivationMutation, { input: activationInput(form) });
}

export async function updateActivation(id: string, form: ActivationForm) {
  return mutate<{ updateActivation: Activation }>(updateActivationMutation, { id, input: activationInput(form) });
}

export async function setActivationReadiness(id: string, completed: boolean) {
  return mutate<{ setActivationReadiness: Activation }>(readinessMutation, { id, completed });
}
