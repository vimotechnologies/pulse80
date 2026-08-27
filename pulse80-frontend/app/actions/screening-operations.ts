"use server";

import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";
import type { Screening, ScreeningAssignmentOption, ScreeningCaptureForm } from "@/types/screening";

const fields = `id organisationId organisationName activationId activationName assignmentId practitionerName participantReference department status consentConfirmed practitionerNote capturedAt submittedAt reviewedAt reviewNote result { systolicMmhg diastolicMmhg glucoseMmolL cholesterolMmolL heightCm weightKg bmi riskLevel escalationRequired }`;
const adminQuery = `query AdminScreenings { adminScreenings { ${fields} } }`;
const practitionerQuery = `query MyScreeningWorkspace { myScreenings { ${fields} } myScreeningAssignments { id organisationName activationName serviceName location startsAt status } }`;
const captureMutation = `mutation CaptureScreening($input: ScreeningCaptureInput!) { captureScreening(input: $input) { ${fields} } }`;
const reviewMutation = `mutation ReviewScreening($id: ID!, $input: ScreeningReviewInput!) { reviewScreening(id: $id, input: $input) { ${fields} } }`;

export async function loadAdminScreenings() {
  return graphqlRequest<{ adminScreenings: Screening[] }>(adminQuery);
}

export async function loadPractitionerScreenings() {
  return graphqlRequest<{ myScreenings: Screening[]; myScreeningAssignments: ScreeningAssignmentOption[] }>(practitionerQuery);
}

const optionalNumber = (value: string) => value.trim() ? Number(value) : null;

function screeningInput(form: ScreeningCaptureForm) {
  return {
    assignmentId: form.assignmentId,
    participantReference: form.participantReference,
    department: form.department || null,
    consentConfirmed: form.consentConfirmed,
    practitionerNote: form.practitionerNote || null,
    systolicMmhg: optionalNumber(form.systolicMmhg),
    diastolicMmhg: optionalNumber(form.diastolicMmhg),
    glucoseMmolL: optionalNumber(form.glucoseMmolL),
    cholesterolMmolL: optionalNumber(form.cholesterolMmolL),
    heightCm: optionalNumber(form.heightCm),
    weightKg: optionalNumber(form.weightKg),
  };
}

export async function captureScreening(form: ScreeningCaptureForm) {
  try {
    const result = await graphqlRequest<{ captureScreening: Screening }>(captureMutation, {
      variables: { input: screeningInput(form) },
    });
    revalidateScreenings();
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "CAPTURE_FAILED" };
  }
}

export async function captureScreeningBatch(forms: ScreeningCaptureForm[]) {
  const results: Screening[] = [];

  try {
    for (const form of forms) {
      const result = await graphqlRequest<{ captureScreening: Screening }>(captureMutation, {
        variables: { input: screeningInput(form) },
      });
      results.push(result.captureScreening);
    }

    revalidateScreenings();
    return { ok: true as const, results };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "BULK_CAPTURE_FAILED",
      submittedCount: results.length,
    };
  }
}

export async function reviewScreening(id: string, status: "Approved" | "Needs Correction", reviewNote: string) {
  try {
    const result = await graphqlRequest<{ reviewScreening: Screening }>(reviewMutation, { variables: { id, input: { status, reviewNote: reviewNote || null } } });
    revalidateScreenings();
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "REVIEW_FAILED" };
  }
}

function revalidateScreenings() {
  revalidatePath("/admin/screenings");
  revalidatePath("/admin/results");
  revalidatePath("/practitioner/screenings");
}
