"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import { graphqlRequest } from "@/lib/graphql/client";

export type PractitionerDashboardData = {
  stats: {
    upcomingAssignments: number;
    participantsScreened: number;
    screeningCompletionRate: number;
    pendingCorrections: number;
  };
  assignmentAlert: null | {
    id: string;
    message: string;
    changeType: string;
    urgent: boolean;
    changedAt: string;
    additionalAlertCount: number;
  };
  upcomingAssignments: Array<{
    id: string;
    organisationName: string;
    programmeName: string;
    activityName: string;
    location: string;
    startsAt: string;
    endsAt: string | null;
    role: string | null;
    services: string[];
    status: string;
    confirmationRequired: boolean;
  }>;
  recentCorrections: Array<{
    id: string;
    participantReference: string;
    assignmentName: string;
    services: string[];
    returnedAt: string;
    errorCount: number;
    errors: Array<{ id: string; field: string; message: string; returnedAt: string }>;
    reviewerNote: string | null;
  }>;
};

const dashboardQuery = /* GraphQL */ `
  query PractitionerDashboard {
    practitionerDashboard {
      stats { upcomingAssignments participantsScreened screeningCompletionRate pendingCorrections }
      assignmentAlert { id message changeType urgent changedAt additionalAlertCount }
      upcomingAssignments {
        id organisationName programmeName activityName location startsAt endsAt role
        services status confirmationRequired
      }
      recentCorrections {
        id participantReference assignmentName services returnedAt errorCount reviewerNote
        errors { id field message returnedAt }
      }
    }
  }
`;

const responseFields = "id status respondedAt reason urgent";
const confirmMutation = `mutation ConfirmAssignment($assignmentId: ID!) {
  confirmPractitionerAssignment(assignmentId: $assignmentId) { ${responseFields} }
}`;
const declineMutation = `mutation DeclineAssignment($assignmentId: ID!, $reason: String!) {
  declinePractitionerAssignment(assignmentId: $assignmentId, reason: $reason) { ${responseFields} }
}`;
const withdrawMutation = `mutation WithdrawAssignment($assignmentId: ID!, $reason: String!) {
  withdrawPractitionerAssignment(assignmentId: $assignmentId, reason: $reason) { ${responseFields} }
}`;
const acknowledgeMutation = `mutation AcknowledgeAssignmentAlert($alertId: ID!) {
  acknowledgePractitionerAssignmentAlert(alertId: $alertId) { id acknowledgedAt }
}`;

const idSchema = z.uuid();
const reasonSchema = z.string().trim().min(2, "Enter a reason.").max(500);

async function selectedOrganisationId() {
  return (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
}

export async function loadPractitionerDashboard() {
  const result = await graphqlRequest<{ practitionerDashboard: PractitionerDashboardData }>(dashboardQuery, {
    organisationId: await selectedOrganisationId(),
  });
  return result.practitionerDashboard;
}

export async function confirmDashboardAssignment(assignmentId: string) {
  return assignmentResponse(confirmMutation, "confirmPractitionerAssignment", assignmentId);
}

export async function declineDashboardAssignment(assignmentId: string, reason: string) {
  return assignmentResponse(declineMutation, "declinePractitionerAssignment", assignmentId, reason);
}

export async function withdrawDashboardAssignment(assignmentId: string, reason: string) {
  return assignmentResponse(withdrawMutation, "withdrawPractitionerAssignment", assignmentId, reason);
}

async function assignmentResponse(mutation: string, field: string, assignmentId: string, reason?: string) {
  const parsedId = idSchema.safeParse(assignmentId);
  const parsedReason = reason === undefined ? null : reasonSchema.safeParse(reason);
  if (!parsedId.success || (parsedReason && !parsedReason.success)) {
    return { ok: false as const, error: parsedReason && !parsedReason.success ? parsedReason.error.issues[0]?.message : "Invalid assignment." };
  }
  try {
    await graphqlRequest<Record<string, unknown>>(mutation, {
      organisationId: await selectedOrganisationId(),
      variables: { assignmentId: parsedId.data, ...(parsedReason ? { reason: parsedReason.data } : {}) },
    });
    revalidatePath("/practitioner/dashboard");
    revalidatePath("/practitioner/assignments");
    return { ok: true as const, field };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "The assignment could not be updated." };
  }
}

export async function acknowledgeDashboardAlert(alertId: string) {
  const parsed = idSchema.safeParse(alertId);
  if (!parsed.success) return { ok: false as const, error: "Invalid alert." };
  try {
    await graphqlRequest(acknowledgeMutation, {
      organisationId: await selectedOrganisationId(),
      variables: { alertId: parsed.data },
    });
    revalidatePath("/practitioner/dashboard");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "The update could not be acknowledged." };
  }
}
