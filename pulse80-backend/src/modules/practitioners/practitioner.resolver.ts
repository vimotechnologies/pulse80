import { GraphQLError } from "graphql";
import { z } from "zod";

import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser } from "../auth/auth.guard.js";
import { PractitionerService } from "./practitioner.service.js";

const contactMethods = ["Email", "Phone", "WhatsApp"] as const;
const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  professionalEmail: z.email().trim().toLowerCase().optional(),
  phone: z.string().trim().max(40).nullish(),
  country: z.string().trim().min(2).max(100).optional(),
  city: z.string().trim().max(120).nullish(),
  preferredContactMethod: z.enum(contactMethods).optional(),
  specialisation: z.string().trim().max(180).nullish(),
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
    phone: row.phone, country: row.country, city: row.city, preferredContactMethod: row.preferred_contact_method,
    profession: row.profession, specialisation: row.specialisation, yearsExperience: row.years_experience,
    qualifications: row.qualifications, registrationNumber: row.registration_number,
    registrationAuthority: row.registration_authority, registrationCountry: row.registration_country,
    registrationExpiryDate: row.registration_expiry_date, verificationStatus: row.verification_status,
    practitionerStatus: row.practitioner_status, profilePhotoUrl: service.photoUrl(row.profile_photo_path),
    profileCompleteness: completeness(row, capabilityCount), assignmentNotifications: row.assignment_notifications,
    documentNotifications: row.document_notifications, paymentNotifications: row.payment_notifications,
  };
}

async function loadProfile(context: GraphQLContext) {
  const { user } = requireAuthenticatedUser(context);
  if (context.identity.organisationRole !== "practitioner") throw new GraphQLError("Practitioner access required.", { extensions: { code: "FORBIDDEN" } });
  const service = new PractitionerService(context.adminSupabase);
  const [profile, capabilities] = await Promise.all([service.getProfile(user.id), service.getCapabilities(user.id)]);
  return { service, userId: user.id, profile, capabilities };
}

export const practitionerResolvers = {
  Query: {
    practitionerProfile: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { service, profile, capabilities } = await loadProfile(context);
      return { ...profileShape(service, profile, capabilities.length), capabilities };
    },
  },
  PractitionerProfile: {
    capabilities: (parent: { capabilities?: unknown[] }) => parent.capabilities ?? [],
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
  Mutation: {
    updatePractitionerProfile: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      const { service, userId, capabilities } = await loadProfile(context);
      const profile = await service.updateProfile(userId, parse(updateSchema, arguments_.input));
      return { ...profileShape(service, profile, capabilities.length), capabilities };
    },
    uploadPractitionerPhoto: async (_parent: unknown, arguments_: { file: unknown }, context: GraphQLContext) => {
      const { service, userId, capabilities } = await loadProfile(context);
      const profile = await service.uploadPhoto(userId, parse(fileSchema, arguments_.file));
      return { ...profileShape(service, profile, capabilities.length), capabilities };
    },
    uploadPractitionerDocument: async (_parent: unknown, arguments_: unknown, context: GraphQLContext) => {
      const { service, userId } = await loadProfile(context);
      const input = parse(uploadDocumentSchema, arguments_);
      return service.uploadDocument(userId, input.documentType, input.expiryDate ?? null, input.file);
    },
  },
};
