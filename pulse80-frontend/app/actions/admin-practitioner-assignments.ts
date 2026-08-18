"use server";

import { revalidatePath } from "next/cache";

import { graphqlRequest } from "@/lib/graphql/client";
import type {
  AdminPractitioner,
  AdminPractitionerAssignment,
  PractitionerAssignmentForm,
} from "@/types/admin-practitioner";

const assignmentFields = /* GraphQL */ `
  id practitionerUserId practitionerName practitionerProfession organisationId
  organisationName programmeName activityName serviceName location startsAt
  endsAt status createdAt updatedAt
`;

const pageQuery = /* GraphQL */ `
  query AdminPractitionerAssignmentPage {
    adminPractitionerAssignments { ${assignmentFields} }
    adminPractitioners {
      userId fullName profession verificationStatus practitionerStatus
      capabilities { id code name approvalStatus }
    }
    adminOrganisations { id name status }
  }
`;

const createMutation = /* GraphQL */ `
  mutation CreatePractitionerAssignment($input: PractitionerAssignmentInput!) {
    createPractitionerAssignment(input: $input) { ${assignmentFields} }
  }
`;

const updateMutation = /* GraphQL */ `
  mutation UpdatePractitionerAssignment($id: ID!, $input: PractitionerAssignmentInput!) {
    updatePractitionerAssignment(id: $id, input: $input) { ${assignmentFields} }
  }
`;

type OrganisationOption = { id: string; name: string; status: string };

export async function loadPractitionerAssignmentPage() {
  return graphqlRequest<{
    adminPractitionerAssignments: AdminPractitionerAssignment[];
    adminPractitioners: Pick<AdminPractitioner, "userId" | "fullName" | "profession" | "verificationStatus" | "practitionerStatus" | "capabilities">[];
    adminOrganisations: OrganisationOption[];
  }>(pageQuery);
}

function assignmentInput(form: PractitionerAssignmentForm) {
  return {
    ...form,
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
  };
}

export async function createPractitionerAssignment(form: PractitionerAssignmentForm) {
  try {
    const result = await graphqlRequest<{ createPractitionerAssignment: AdminPractitionerAssignment }>(createMutation, {
      variables: { input: assignmentInput(form) },
    });
    revalidatePath("/admin/practitioner-assignments");
    revalidatePath("/practitioner/assignments");
    return { ok: true as const, assignment: result.createPractitionerAssignment };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "CREATE_FAILED" };
  }
}

export async function updatePractitionerAssignment(id: string, form: PractitionerAssignmentForm) {
  try {
    const result = await graphqlRequest<{ updatePractitionerAssignment: AdminPractitionerAssignment }>(updateMutation, {
      variables: { id, input: assignmentInput(form) },
    });
    revalidatePath("/admin/practitioner-assignments");
    revalidatePath("/practitioner/assignments");
    return { ok: true as const, assignment: result.updatePractitionerAssignment };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "UPDATE_FAILED" };
  }
}
