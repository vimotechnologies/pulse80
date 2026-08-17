import { GraphQLError } from "graphql";
import { z } from "zod";

import { env } from "../../config/env.js";
import type { GraphQLContext } from "../../graphql/context.js";
import {
  requirePermission,
  requirePlatformPermission,
} from "../auth/auth.guard.js";
import {
  OrganisationService,
  type OrganisationInput,
} from "./organisation.service.js";

const statuses = [
  "Prospect",
  "Onboarding",
  "Active",
  "Paused",
  "Contract Expired",
  "Archived",
] as const;
const methods = ["Email", "Phone", "WhatsApp", "Portal"] as const;
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const logoSchema = z.string().max(2_800_000);
const contactSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(160),
  roleLabel: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().max(40).nullish(),
  method: z.enum(methods),
  primary: z.boolean(),
  notes: z.string().trim().max(1000).nullish(),
});

const sharedFields = {
  name: z.string().trim().min(2).max(160),
  industry: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(100),
  primaryLocation: z.string().trim().min(2).max(160),
  region: z.string().trim().min(1).max(160),
  employees: z.number().int().min(0).max(10_000_000),
  package: z.string().trim().min(2).max(160),
  contractStart: dateSchema,
  contractEnd: dateSchema,
  status: z.enum(statuses),
  customPackageNotes: z.string().trim().max(3000).nullish(),
};

const createSchema = z
  .object({
    ...sharedFields,
    logoDataUrl: logoSchema.nullish(),
    contacts: z.array(contactSchema).min(1).max(10),
  })
  .refine((value) => value.contractEnd >= value.contractStart, {
    message: "Contract end date must be on or after its start date.",
  })
  .refine((value) => value.contacts.filter((contact) => contact.primary).length === 1, {
    message: "Exactly one primary contact is required.",
  });

const updateSchema = z
  .object({
    name: sharedFields.name.optional(),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    industry: sharedFields.industry.optional(),
    country: sharedFields.country.optional(),
    primaryLocation: sharedFields.primaryLocation.optional(),
    region: sharedFields.region.optional(),
    employees: sharedFields.employees.optional(),
    package: sharedFields.package.optional(),
    contractStart: sharedFields.contractStart.optional(),
    contractEnd: sharedFields.contractEnd.optional(),
    status: sharedFields.status.optional(),
    customPackageNotes: sharedFields.customPackageNotes.optional(),
    logoDataUrl: logoSchema.nullish(),
    removeLogo: z.boolean().optional(),
    contacts: z.array(contactSchema).min(1).max(10).optional(),
  })
  .refine((value) => !value.contacts || value.contacts.filter((contact) => contact.primary).length === 1, {
    message: "Exactly one primary contact is required.",
  });

type OrganisationRow = Awaited<ReturnType<OrganisationService["getById"]>>;

function wellnessRisk(score: number) {
  if (score <= 25) return "Low";
  if (score <= 50) return "Medium";
  if (score <= 75) return "High";
  return "Critical";
}

function toOrganisation(row: OrganisationRow) {
  const score = row.wellness_risk_score ?? 0;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    code: row.code ?? row.slug.toUpperCase(),
    logoUrl: row.logo_path
      ? `${env.SUPABASE_URL}/storage/v1/object/public/organisation-logos/${row.logo_path}`
      : null,
    industry: row.industry ?? "Not specified",
    country: row.country ?? "Not specified",
    primaryLocation: row.primary_location ?? "Not specified",
    region: row.region ?? "Not specified",
    employees: row.workforce_size ?? 0,
    package: row.package_name ?? "Not assigned",
    contractStart: row.contract_start ?? "",
    contractEnd: row.contract_end ?? "",
    wellnessRiskScore: score,
    wellnessRisk: wellnessRisk(score),
    status: row.status,
    customPackageNotes: row.custom_package_notes,
    contacts: (row.organisation_contacts ?? []).map((contact) => ({
      id: contact.id,
      name: contact.full_name,
      roleLabel: contact.role_label,
      email: contact.email,
      phone: contact.phone,
      method: contact.preferred_method,
      primary: contact.is_primary,
      notes: contact.notes,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new GraphQLError(parsed.error.issues[0]?.message ?? "Invalid organisation details.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  return parsed.data;
}

export const organisationResolvers = {
  Query: {
    organisation: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { organisationId } = requirePermission(context, "organisation:read");
      return toOrganisation(await new OrganisationService(context.supabase!).getById(organisationId));
    },
    adminOrganisations: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "organisation:read");
      const rows = await new OrganisationService(context.adminSupabase).list();
      return rows.map(toOrganisation);
    },
    adminOrganisation: async (_parent: unknown, arguments_: { id: string }, context: GraphQLContext) => {
      requirePlatformPermission(context, "organisation:read");
      return toOrganisation(await new OrganisationService(context.adminSupabase).getById(arguments_.id));
    },
  },
  Mutation: {
    createOrganisation: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      requirePlatformPermission(context, "organisation:update");
      const input = parse(createSchema, arguments_.input);
      return toOrganisation(await new OrganisationService(context.adminSupabase).create(input));
    },
    updateOrganisation: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      const { organisationId } = requirePermission(context, "organisation:update");
      const input = parse(updateSchema, arguments_.input);
      const tenantInput: OrganisationInput = { name: input.name, slug: input.slug };
      return toOrganisation(await new OrganisationService(context.supabase!).update(organisationId, tenantInput));
    },
    updateAdminOrganisation: async (_parent: unknown, arguments_: { id: string; input: unknown }, context: GraphQLContext) => {
      requirePlatformPermission(context, "organisation:update");
      const input = parse(updateSchema, arguments_.input);
      return toOrganisation(await new OrganisationService(context.adminSupabase).update(arguments_.id, input));
    },
  },
};
