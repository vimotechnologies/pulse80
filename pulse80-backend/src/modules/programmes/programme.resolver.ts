import { GraphQLError } from "graphql";
import { z } from "zod";

import type { GraphQLContext } from "../../graphql/context.js";
import { requirePlatformPermission } from "../auth/auth.guard.js";
import { ProgrammeService, type ActivationInput, type ProgrammeInput } from "./programme.service.js";

const idSchema = z.uuid();
const servicesSchema = z.array(z.string().trim().min(2).max(160)).min(1).max(30);
const programmeSchema = z.object({
  organisationId: z.uuid(), name: z.string().trim().min(2).max(180), description: z.string().trim().max(2000).nullish(),
  status: z.enum(["Planned", "Active", "Paused", "Completed", "Cancelled"]), startsOn: z.iso.date(), endsOn: z.iso.date(),
  serviceNames: servicesSchema, targetParticipants: z.number().int().min(0).max(10_000_000),
}).refine((value) => value.endsOn >= value.startsOn, { message: "Programme end date must be on or after its start date." });
const activationSchema = z.object({
  programmeId: z.uuid(), title: z.string().trim().min(2).max(180), description: z.string().trim().max(2000).nullish(),
  location: z.string().trim().min(2).max(180), startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }),
  expectedParticipants: z.number().int().min(0).max(10_000_000), serviceNames: servicesSchema,
  status: z.enum(["Draft", "Scheduled", "In Progress", "Completed", "Cancelled", "Action Required"]),
  readinessLabels: z.array(z.string().trim().min(2).max(160)).max(30),
}).refine((value) => value.endsAt > value.startsAt, { message: "Activation end time must be after its start time." });

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new GraphQLError(result.error.issues[0]?.message ?? "Invalid programme details.", { extensions: { code: "BAD_USER_INPUT" } });
  return result.data;
}

function programmeShape(row: Awaited<ReturnType<ProgrammeService["listProgrammes"]>>[number]) {
  return { id: row.id, organisationId: row.organisation_id, organisationName: row.organisations?.name ?? "Organisation unavailable", name: row.name,
    description: row.description, status: row.status, startsOn: row.starts_on, endsOn: row.ends_on, serviceNames: row.service_names,
    targetParticipants: row.target_participants, activationCount: row.activations?.length ?? 0, createdAt: row.created_at, updatedAt: row.updated_at };
}

function activationShape(row: Awaited<ReturnType<ProgrammeService["listActivations"]>>[number]) {
  const readiness = row.activation_readiness_items ?? [];
  return { id: row.id, programmeId: row.programme_id, programmeName: row.programmes?.name ?? "Programme unavailable",
    organisationId: row.organisation_id, organisationName: row.programmes?.organisations?.name ?? "Organisation unavailable", title: row.title,
    description: row.description, location: row.location, startsAt: row.starts_at, endsAt: row.ends_at,
    expectedParticipants: row.expected_participants, serviceNames: row.service_names, status: row.status,
    readinessScore: readiness.length ? Math.round((readiness.filter((item) => item.completed).length / readiness.length) * 100) : 0,
    readinessItems: readiness, practitionerCount: row.practitioner_assignments?.length ?? 0, createdAt: row.created_at, updatedAt: row.updated_at };
}

export const programmeResolvers = {
  Query: {
    adminProgrammes: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:read");
      return (await new ProgrammeService(context.adminSupabase).listProgrammes()).map(programmeShape);
    },
    adminActivations: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:read");
      return (await new ProgrammeService(context.adminSupabase).listActivations()).map(activationShape);
    },
  },
  Mutation: {
    createProgramme: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:manage");
      const service = new ProgrammeService(context.adminSupabase);
      return programmeShape(await service.createProgramme(parse(programmeSchema, arguments_.input) as ProgrammeInput));
    },
    updateProgramme: async (_parent: unknown, arguments_: { id: string; input: unknown }, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:manage");
      const service = new ProgrammeService(context.adminSupabase);
      return programmeShape(await service.updateProgramme(parse(idSchema, arguments_.id), parse(programmeSchema, arguments_.input) as ProgrammeInput));
    },
    createActivation: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:manage");
      const service = new ProgrammeService(context.adminSupabase);
      return activationShape(await service.createActivation(parse(activationSchema, arguments_.input) as ActivationInput));
    },
    updateActivation: async (_parent: unknown, arguments_: { id: string; input: unknown }, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:manage");
      const service = new ProgrammeService(context.adminSupabase);
      return activationShape(await service.updateActivation(parse(idSchema, arguments_.id), parse(activationSchema, arguments_.input) as ActivationInput));
    },
    setActivationReadiness: async (_parent: unknown, arguments_: { id: string; completed: boolean }, context: GraphQLContext) => {
      requirePlatformPermission(context, "programme:manage");
      const service = new ProgrammeService(context.adminSupabase);
      return activationShape(await service.setReadinessItem(parse(idSchema, arguments_.id), arguments_.completed));
    },
  },
};
