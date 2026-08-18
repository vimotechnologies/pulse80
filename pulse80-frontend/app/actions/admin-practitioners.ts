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
