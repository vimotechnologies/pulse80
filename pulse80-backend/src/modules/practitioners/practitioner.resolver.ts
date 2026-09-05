import { GraphQLError } from "graphql";
import { z } from "zod";

import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser, requirePlatformPermission } from "../auth/auth.guard.js";
import { PractitionerDashboardService } from "./practitioner-dashboard.service.js";
import {
  PractitionerService,
  type PractitionerAssignmentInput,
  type PractitionerDocumentVerificationStatus,
  type PractitionerVerificationUpdate,
} from "./practitioner.service.js";

const contactMethods = ["Email", "Phone", "WhatsApp"] as const;
const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  professionalEmail: z.email().trim().toLowerCase().optional(),
  phone: z.string().trim().max(40).nullish(),
  country: z.string().trim().min(2).max(100).optional(),
  profession: z.string().trim().min(2).max(120).optional(),
  registrationNumber: z.string().trim().max(120).nullish(),
  registrationAuthority: z.string().trim().max(180).nullish(),
  registrationCountry: z.string().trim().max(100).nullish(),
  registrationExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  city: z.string().trim().max(120).nullish(),
  districtProvince: z.string().trim().max(120).nullish(),
  clinicHospital: z.string().trim().max(180).nullish(),
  preferredContactMethod: z.enum(contactMethods).optional(),
  specialisation: z.string().trim().max(180).nullish(),
  specialisations: z.array(z.string().trim().min(2).max(180)).max(20).optional(),
  selectedServiceCodes: z.array(z.string().trim().min(2).max(120)).max(50).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  qualifications: z.array(z.string().trim().min(2).max(200)).max(20).optional(),
  assignmentNotifications: z.boolean().optional(),
  documentNotifications: z.boolean().optional(),
  paymentNotifications: z.boolean().optional(),
});
const fileSchema = z.object({ fileName: z.string().trim().min(1).max(160), dataUrl: z.string().max(7_200_000) });
const uploadDocumentSchema = z.object({
  documentType: z.string().trim().min(2).max(100),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  file: fileSchema,
});
const verificationStatuses = ["Verified", "Under Review", "Action Required", "Expired"] as const;
const practitionerStatuses = ["Active", "Pending Verification", "Suspended"] as const;
const verificationSchema = z.object({
  verificationStatus: z.enum(verificationStatuses),
  practitionerStatus: z.enum(practitionerStatuses),
});
const documentStatusSchema = z.enum(["Verified", "Under Review", "Expired", "Action Required"]);
const idSchema = z.uuid();
const assignmentStatuses = ["Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "Action Required"] as const;
const assignmentSchema = z.object({
  practitionerUserId: z.uuid(),
  organisationId: z.uuid(),
  programmeName: z.string().trim().min(2).max(180),
  activityName: z.string().trim().min(2).max(180),
  serviceName: z.string().trim().min(2).max(180),
  serviceNames: z.array(z.string().trim().min(2).max(180)).min(1).max(20).optional(),
  roleName: z.string().trim().min(2).max(180).nullish(),
  location: z.string().trim().min(2).max(180),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullish(),
  status: z.enum(assignmentStatuses),
}).refine((value) => !value.endsAt || value.endsAt > value.startsAt, {
  message: "Assignment end time must be after its start time.",
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new GraphQLError(result.error.issues[0]?.message ?? "Invalid practitioner details.", { extensions: { code: "BAD_USER_INPUT" } });
  return result.data;
}

function completeness(row: Awaited<ReturnType<PractitionerService["getProfile"]>>, capabilityCount: number) {
  const fields = [row.full_name, row.professional_email, row.phone, row.country, row.city, row.profession,
    row.specialisation, row.registration_number, row.registration_authority, row.registration_country,
    row.registration_expiry_date, row.qualifications.length ? "complete" : null, capabilityCount ? "complete" : null];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function profileShape(service: PractitionerService, row: Awaited<ReturnType<PractitionerService["getProfile"]>>, capabilityCount = 0) {
  return {
    userId: row.user_id, fullName: row.full_name ?? "Practitioner", professionalEmail: row.professional_email,
    phone: row.phone, country: row.country, city: row.city, districtProvince: row.district_province, clinicHospital: row.clinic_hospital, preferredContactMethod: row.preferred_contact_method,
    profession: row.profession, specialisation: row.specialisation, yearsExperience: row.years_experience,
    qualifications: row.qualifications, registrationNumber: row.registration_number,
    registrationAuthority: row.registration_authority, registrationCountry: row.registration_country,
    registrationExpiryDate: row.registration_expiry_date, verificationStatus: row.verification_status,
    practitionerStatus: row.practitioner_status, profilePhotoUrl: service.photoUrl(row.profile_photo_path),
    profileCompleteness: completeness(row, capabilityCount), assignmentNotifications: row.assignment_notifications,
    documentNotifications: row.document_notifications, paymentNotifications: row.payment_notifications,
  };
}

type AdminPractitionerRow = Awaited<ReturnType<PractitionerService["listForAdmin"]>>[number];

function adminProfileShape(service: PractitionerService, row: AdminPractitionerRow) {
  const capabilities = row.practitioner_capabilities ?? [];
  const assignments = row.practitioner_assignments ?? [];
  const documents = row.practitioner_documents ?? [];
  const identity = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const profile = { ...row, full_name: identity?.full_name ?? null };

  return {
    ...profileShape(service, profile, capabilities.length),
    capabilities,
    assignmentCount: assignments.length,
    completedAssignmentCount: assignments.filter((assignment) => assignment.status === "Completed").length,
    documents,
  };
}

async function loadProfile(context: GraphQLContext) {
  const { user } = requireAuthenticatedUser(context);
  if (context.identity.organisationRole !== "practitioner") throw new GraphQLError("Practitioner access required.", { extensions: { code: "FORBIDDEN" } });
  const service = new PractitionerService(context.adminSupabase);
  const [profile, capabilities, specialisations] = await Promise.all([service.getProfile(user.id), service.getCapabilities(user.id), service.getSpecialisations(user.id)]);
  return { service, userId: user.id, profile, capabilities, specialisations };
}

export const practitionerResolvers = {
  Query: {
    practitionerDashboard: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { userId } = await loadProfile(context);
      return new PractitionerDashboardService(context.adminSupabase).getDashboard(userId);
    },
    practitionerProfile: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { service, profile, capabilities, specialisations } = await loadProfile(context);
      return { ...profileShape(service, profile, capabilities.length), capabilities, selectedServices: capabilities, specialisations };
    },
    adminPractitioners: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "provider:manage");
      const service = new PractitionerService(context.adminSupabase);
      const practitioners = await service.listForAdmin();
      return practitioners.map((practitioner) => adminProfileShape(service, practitioner));
    },
    adminPractitionerAssignments: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "provider:manage");
      return new PractitionerService(context.adminSupabase).listAssignmentsForAdmin();
    },
  },
  PractitionerAssignmentAlert: {
    changeType: (row: { change_type: string }) => row.change_type,
    changedAt: (row: { changed_at: string }) => row.changed_at,
  },
  PractitionerAssignmentResponse: {
    respondedAt: (row: { responded_at: string }) => row.responded_at,
    reason: (row: { response_reason: string | null }) => row.response_reason,
    urgent: (row: { withdrawal_urgent: boolean }) => row.withdrawal_urgent,
  },
  PractitionerAssignmentAlertAcknowledgement: {
    acknowledgedAt: (row: { acknowledged_at: string }) => row.acknowledged_at,
  },
  PractitionerProfile: {
    capabilities: (parent: { capabilities?: unknown[] }) => parent.capabilities ?? [],
    selectedServices: (parent: { selectedServices?: unknown[] }) => parent.selectedServices ?? [],
    specialisations: (parent: { specialisations?: unknown[] }) => parent.specialisations ?? [],
    assignments: async (_parent: unknown, arguments_: { limit?: number }, context: GraphQLContext) => {
      const { service, userId } = await loadProfile(context);
      return service.getAssignments(userId, Math.min(Math.max(arguments_.limit ?? 5, 1), 20));
    },
    documents: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { service, userId } = await loadProfile(context);
      return service.getDocuments(userId);
    },
  },
  PractitionerCapability: {
    code: (row: { service_code: string }) => row.service_code,
    name: (row: { service_name: string }) => row.service_name,
    approvalStatus: (row: { approval_status: string }) => row.approval_status,
  },
  PractitionerSpecialisation: {
    sortOrder: (row: { sort_order: number }) => row.sort_order,
  },
  PractitionerAssignment: {
    organisationName: (row: { organisations: { name: string } | null }) => row.organisations?.name ?? "Pulse80 programme",
    programmeName: (row: { programme_name: string }) => row.programme_name,
    activityName: (row: { activity_name: string }) => row.activity_name,
    serviceName: (row: { service_name: string }) => row.service_name,
    startsAt: (row: { starts_at: string }) => row.starts_at,
    endsAt: (row: { ends_at: string | null }) => row.ends_at,
  },
  PractitionerDocument: {
    documentType: (row: { document_type: string }) => row.document_type,
    fileName: (row: { file_name: string }) => row.file_name,
    expiryDate: (row: { expiry_date: string | null }) => row.expiry_date,
    verificationStatus: (row: { verification_status: string }) => row.verification_status,
    uploadedAt: (row: { uploaded_at: string }) => row.uploaded_at,
    downloadUrl: (row: { download_url: string | null }) => row.download_url,
  },
  AdminPractitionerDocument: {
    documentType: (row: { document_type: string }) => row.document_type,
    fileName: (row: { file_name: string }) => row.file_name,
    expiryDate: (row: { expiry_date: string | null }) => row.expiry_date,
    verificationStatus: (row: { verification_status: string }) => row.verification_status,
    uploadedAt: (row: { uploaded_at: string }) => row.uploaded_at,
    reviewedAt: (row: { reviewed_at: string | null }) => row.reviewed_at,
    downloadUrl: async (row: { storage_path: string }, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "provider:manage");
      const { data } = await context.adminSupabase.storage
        .from("practitioner-verification-documents")
        .createSignedUrl(row.storage_path, 900);
      return data?.signedUrl ?? null;
    },
  },
  AdminPractitionerAssignment: {
    practitionerUserId: (row: { practitioner_user_id: string }) => row.practitioner_user_id,
    practitionerName: (row: { practitioner_profiles: { profiles: { full_name: string | null } | null } | null }) => row.practitioner_profiles?.profiles?.full_name ?? "Practitioner",
    practitionerProfession: (row: { practitioner_profiles: { profession: string } | null }) => row.practitioner_profiles?.profession ?? "Practitioner",
    organisationId: (row: { organisation_id: string | null }) => row.organisation_id,
    organisationName: (row: { organisations: { name: string } | null }) => row.organisations?.name ?? "Organisation unavailable",
    programmeName: (row: { programme_name: string }) => row.programme_name,
    activityName: (row: { activity_name: string }) => row.activity_name,
    serviceName: (row: { service_name: string }) => row.service_name,
    startsAt: (row: { starts_at: string }) => row.starts_at,
    endsAt: (row: { ends_at: string | null }) => row.ends_at,
    createdAt: (row: { created_at: string }) => row.created_at,
    updatedAt: (row: { updated_at: string }) => row.updated_at,
  },
  Mutation: {
    confirmPractitionerAssignment: async (
      _parent: unknown,
      arguments_: { assignmentId: string },
      context: GraphQLContext,
    ) => {
      const { userId } = await loadProfile(context);
      return new PractitionerDashboardService(context.adminSupabase).respondToAssignment(
        parse(idSchema, arguments_.assignmentId), userId, "Confirmed", null,
      );
    },
    declinePractitionerAssignment: async (
      _parent: unknown,
      arguments_: { assignmentId: string; reason: string },
      context: GraphQLContext,
    ) => {
      const { userId } = await loadProfile(context);
      const reason = parse(z.string().trim().min(2).max(500), arguments_.reason);
      return new PractitionerDashboardService(context.adminSupabase).respondToAssignment(
        parse(idSchema, arguments_.assignmentId), userId, "Declined", reason,
      );
    },
    withdrawPractitionerAssignment: async (
      _parent: unknown,
      arguments_: { assignmentId: string; reason: string },
      context: GraphQLContext,
    ) => {
      const { userId } = await loadProfile(context);
      const reason = parse(z.string().trim().min(2).max(500), arguments_.reason);
      return new PractitionerDashboardService(context.adminSupabase).respondToAssignment(
        parse(idSchema, arguments_.assignmentId), userId, "Withdrawn", reason,
      );
    },
    acknowledgePractitionerAssignmentAlert: async (
      _parent: unknown,
      arguments_: { alertId: string },
      context: GraphQLContext,
    ) => {
      const { userId } = await loadProfile(context);
      return new PractitionerDashboardService(context.adminSupabase).acknowledgeAlert(
        parse(idSchema, arguments_.alertId), userId,
      );
    },
    updatePractitionerProfile: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      const { service, userId, capabilities } = await loadProfile(context);
      const profile = await service.updateProfile(userId, parse(updateSchema, arguments_.input));
      const refreshedCapabilities = await service.getCapabilities(userId);
      const specialisations = await service.getSpecialisations(userId);
      return { ...profileShape(service, profile, refreshedCapabilities.length), capabilities: refreshedCapabilities, selectedServices: refreshedCapabilities, specialisations };
    },
    uploadPractitionerPhoto: async (_parent: unknown, arguments_: { file: unknown }, context: GraphQLContext) => {
      const { service, userId, capabilities } = await loadProfile(context);
      const profile = await service.uploadPhoto(userId, parse(fileSchema, arguments_.file));
      return { ...profileShape(service, profile, capabilities.length), capabilities, selectedServices: capabilities, specialisations: await service.getSpecialisations(userId) };
    },
    deletePractitionerPhoto: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { service, userId, capabilities } = await loadProfile(context);
      const profile = await service.deletePhoto(userId);
      return { ...profileShape(service, profile, capabilities.length), capabilities, selectedServices: capabilities, specialisations: await service.getSpecialisations(userId) };
    },
    uploadPractitionerDocument: async (_parent: unknown, arguments_: unknown, context: GraphQLContext) => {
      const { service, userId } = await loadProfile(context);
      const input = parse(uploadDocumentSchema, arguments_);
      return service.uploadDocument(userId, input.documentType, input.expiryDate ?? null, input.file);
    },
    updatePractitionerVerification: async (
      _parent: unknown,
      arguments_: { userId: string; input: unknown },
      context: GraphQLContext,
    ) => {
      requirePlatformPermission(context, "provider:manage");
      const input = parse(verificationSchema, arguments_.input) as PractitionerVerificationUpdate;
      const userId = parse(idSchema, arguments_.userId);
      const service = new PractitionerService(context.adminSupabase);
      return adminProfileShape(service, await service.updateVerification(userId, input));
    },
    reviewPractitionerDocument: async (
      _parent: unknown,
      arguments_: { documentId: string; status: unknown },
      context: GraphQLContext,
    ) => {
      requirePlatformPermission(context, "provider:manage");
      const status = parse(documentStatusSchema, arguments_.status) as PractitionerDocumentVerificationStatus;
      const documentId = parse(idSchema, arguments_.documentId);
      const service = new PractitionerService(context.adminSupabase);
      return adminProfileShape(service, await service.reviewDocument(documentId, status));
    },
    createPractitionerAssignment: async (
      _parent: unknown,
      arguments_: { input: unknown },
      context: GraphQLContext,
    ) => {
      requirePlatformPermission(context, "provider:manage");
      requirePlatformPermission(context, "programme:manage");
      const input = parse(assignmentSchema, arguments_.input) as PractitionerAssignmentInput;
      return new PractitionerService(context.adminSupabase).createAssignment(input);
    },
    updatePractitionerAssignment: async (
      _parent: unknown,
      arguments_: { id: string; input: unknown },
      context: GraphQLContext,
    ) => {
      requirePlatformPermission(context, "provider:manage");
      requirePlatformPermission(context, "programme:manage");
      const id = parse(idSchema, arguments_.id);
      const input = parse(assignmentSchema, arguments_.input) as PractitionerAssignmentInput;
      return new PractitionerService(context.adminSupabase).updateAssignment(id, input);
    },
  },
};
