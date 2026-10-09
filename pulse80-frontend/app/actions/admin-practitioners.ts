"use server";

import { revalidatePath } from "next/cache";

import { graphqlRequest } from "@/lib/graphql/client";
import type { AdminPractitioner } from "@/types/admin-practitioner";

const practitionerFields = /* GraphQL */ `
  userId fullName professionalEmail phone country city profession specialisation
  yearsExperience registrationNumber registrationAuthority registrationCountry
  registrationExpiryDate verificationStatus practitionerStatus profilePhotoUrl
  profileCompleteness assignmentCount completedAssignmentCount
  capabilities { id code name approvalStatus }
  documents {
    id documentType fileName expiryDate verificationStatus uploadedAt reviewedAt downloadUrl
  }
`;

const listQuery = /* GraphQL */ `
  query AdminPractitioners {
    adminPractitioners { ${practitionerFields} }
  }
`;

const updateVerificationMutation = /* GraphQL */ `
  mutation UpdatePractitionerVerification($userId: ID!, $input: PractitionerVerificationInput!) {
    updatePractitionerVerification(userId: $userId, input: $input) { ${practitionerFields} }
  }
`;

const reviewDocumentMutation = /* GraphQL */ `
  mutation ReviewPractitionerDocument($documentId: ID!, $status: String!) {
    reviewPractitionerDocument(documentId: $documentId, status: $status) { ${practitionerFields} }
  }
`;

export async function loadAdminPractitioners() {
  const result = await graphqlRequest<{ adminPractitioners: AdminPractitioner[] }>(listQuery);
  return result.adminPractitioners;
}

export async function updatePractitionerVerification(
  userId: string,
  verificationStatus: "Verified" | "Under Review" | "Action Required" | "Expired",
  practitionerStatus: "Active" | "Pending Verification" | "Suspended",
) {
  try {
    const result = await graphqlRequest<{ updatePractitionerVerification: AdminPractitioner }>(
      updateVerificationMutation,
      { variables: { userId, input: { verificationStatus, practitionerStatus } } },
    );
    revalidatePath("/admin/practitioners");
    revalidatePath("/admin/practitioner-verification");
    return { ok: true as const, practitioner: result.updatePractitionerVerification };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "UPDATE_FAILED" };
  }
}

export async function reviewPractitionerDocument(
  documentId: string,
  status: "Verified" | "Under Review" | "Expired" | "Action Required",
) {
  try {
    const result = await graphqlRequest<{ reviewPractitionerDocument: AdminPractitioner }>(
      reviewDocumentMutation,
      { variables: { documentId, status } },
    );
    revalidatePath("/admin/practitioners");
    revalidatePath("/admin/practitioner-verification");
    return { ok: true as const, practitioner: result.reviewPractitionerDocument };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "UPDATE_FAILED" };
  }
}

export type RegisteredPractitioner = {
  id: string;
  fullName: string;
  email: string;
  accountStatus: string;
  invitedAt: string | null;
  profession: string;
  country: string;
  city: string;
  capabilities: string[];
  verificationStatus: string;
};

export async function loadRegisteredPractitioners(): Promise<RegisteredPractitioner[]> {
  const result = await graphqlRequest<{ registeredPractitioners: RegisteredPractitioner[] }>(
    `query RegisteredPractitioners { registeredPractitioners { id fullName email accountStatus invitedAt profession country city capabilities verificationStatus } }`,
  );
  return result.registeredPractitioners;
}

export async function registerPractitioner(input: {
  fullName: string; email: string; profession: string; country: string; city: string; capabilities: string[];
}) {
  try {
    await graphqlRequest(
      `mutation RegisterPractitioner($input: RegisterPractitionerInput!) {
        registerPractitioner(input: $input) { id }
      }`,
      { variables: { input } },
    );
    revalidatePath("/admin/practitioners");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not save practitioner." };
  }
}

export async function setPractitionerRegistrationStatus(id: string, status: "Active" | "Disabled") {
  try {
    await graphqlRequest(
      `mutation SetPractitionerRegistrationStatus($id: ID!, $status: String!) {
        setPractitionerRegistrationStatus(id: $id, status: $status) { id accountStatus }
      }`,
      { variables: { id, status } },
    );
    revalidatePath("/admin/practitioners");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not change account status." };
  }
}

export async function inviteRegisteredPractitioner(id: string) {
  try {
    await graphqlRequest(
      `mutation InviteRegisteredPractitioner($id: ID!) {
        inviteRegisteredPractitioner(id: $id) { id invitedAt }
      }`,
      { variables: { id } },
    );
    revalidatePath("/admin/practitioners");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not send invitation." };
  }
}
