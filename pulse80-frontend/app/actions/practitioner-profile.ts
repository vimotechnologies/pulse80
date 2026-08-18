"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { graphqlRequest } from "@/lib/graphql/client";
import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PractitionerCapability = { id: string; code: string; name: string; approvalStatus: string };
export type PractitionerAssignment = {
  id: string; organisationName: string; programmeName: string; activityName: string;
  serviceName: string; location: string; startsAt: string; endsAt: string | null; status: string;
};
export type PractitionerDocument = {
  id: string; documentType: string; fileName: string; expiryDate: string | null;
  verificationStatus: string; uploadedAt: string; downloadUrl: string | null;
};
export type PractitionerProfile = {
  userId: string; fullName: string; professionalEmail: string; phone: string | null;
  country: string; city: string | null; preferredContactMethod: string; profession: string;
  specialisation: string | null; yearsExperience: number; qualifications: string[];
  registrationNumber: string | null; registrationAuthority: string | null;
  registrationCountry: string | null; registrationExpiryDate: string | null;
  verificationStatus: string; practitionerStatus: string; profilePhotoUrl: string | null;
  profileCompleteness: number; assignmentNotifications: boolean; documentNotifications: boolean;
  paymentNotifications: boolean; capabilities: PractitionerCapability[];
  assignments: PractitionerAssignment[]; documents: PractitionerDocument[];
};

const fields = /* GraphQL */ `
  userId fullName professionalEmail phone country city preferredContactMethod
  profession specialisation yearsExperience qualifications registrationNumber
  registrationAuthority registrationCountry registrationExpiryDate verificationStatus
  practitionerStatus profilePhotoUrl profileCompleteness assignmentNotifications
  documentNotifications paymentNotifications
  capabilities { id code name approvalStatus }
  assignments(limit: 5) { id organisationName programmeName activityName serviceName location startsAt endsAt status }
  documents { id documentType fileName expiryDate verificationStatus uploadedAt downloadUrl }
`;
const query = /* GraphQL */ `query PractitionerProfile { practitionerProfile { ${fields} } }`;
const updateMutation = /* GraphQL */ `mutation UpdatePractitionerProfile($input: UpdatePractitionerProfileInput!) {
  updatePractitionerProfile(input: $input) { ${fields} }
}`;
const photoMutation = /* GraphQL */ `mutation UploadPractitionerPhoto($file: PractitionerFileInput!) {
  uploadPractitionerPhoto(file: $file) { ${fields} }
}`;
const documentMutation = /* GraphQL */ `mutation UploadPractitionerDocument($documentType: String!, $expiryDate: String, $file: PractitionerFileInput!) {
  uploadPractitionerDocument(documentType: $documentType, expiryDate: $expiryDate, file: $file) {
    id documentType fileName expiryDate verificationStatus uploadedAt downloadUrl
  }
}`;

async function selectedOrganisationId() {
  return (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
}

const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  professionalEmail: z.email().trim().toLowerCase(),
  phone: z.string().trim().max(40), country: z.string().trim().min(2).max(100),
  city: z.string().trim().max(120), preferredContactMethod: z.enum(["Email", "Phone", "WhatsApp"]),
  specialisation: z.string().trim().max(180), yearsExperience: z.number().int().min(0).max(80),
  qualifications: z.array(z.string().trim().min(2).max(200)).max(20),
  assignmentNotifications: z.boolean(), documentNotifications: z.boolean(), paymentNotifications: z.boolean(),
});

export async function loadPractitionerProfile() {
  const result = await graphqlRequest<{ practitionerProfile: PractitionerProfile }>(query, {
    organisationId: await selectedOrganisationId(),
  });
  return result.practitionerProfile;
}

export async function updatePractitionerProfile(input: unknown) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check your profile information." };
  try {
    const result = await graphqlRequest<{ updatePractitionerProfile: PractitionerProfile }>(updateMutation, {
      organisationId: await selectedOrganisationId(), variables: { input: parsed.data },
    });
    revalidatePath("/practitioner/profile");
    return { ok: true as const, profile: result.updatePractitionerProfile };
  } catch {
    return { ok: false as const, error: "Your profile could not be saved. Please try again." };
  }
}

export async function uploadPractitionerPhoto(file: { fileName: string; dataUrl: string }) {
  try {
    const result = await graphqlRequest<{ uploadPractitionerPhoto: PractitionerProfile }>(photoMutation, {
      organisationId: await selectedOrganisationId(), variables: { file },
    });
    revalidatePath("/practitioner/profile");
    return { ok: true as const, profile: result.uploadPractitionerPhoto };
  } catch {
    return { ok: false as const, error: "The profile photo could not be uploaded." };
  }
}

export async function uploadPractitionerDocument(input: { documentType: string; expiryDate: string | null; file: { fileName: string; dataUrl: string } }) {
  try {
    const result = await graphqlRequest<{ uploadPractitionerDocument: PractitionerDocument }>(documentMutation, {
      organisationId: await selectedOrganisationId(), variables: input,
    });
    revalidatePath("/practitioner/profile");
    return { ok: true as const, document: result.uploadPractitionerDocument };
  } catch {
    return { ok: false as const, error: "The verification document could not be uploaded." };
  }
}

export async function updatePractitionerPassword(password: string) {
  const parsed = z.string().min(8, "Use at least 8 characters.").max(128).safeParse(password);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  return error ? { ok: false as const, error: "The password could not be updated." } : { ok: true as const };
}
