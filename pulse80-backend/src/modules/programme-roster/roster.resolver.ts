import { z } from "zod";
import type { GraphQLContext } from "../../graphql/context.js";
import { requirePermission, requirePlatformPermission } from "../auth/auth.guard.js";
import { ProgrammeRosterService, parseRoster, rosterEntrySchema, rosterImportSchema, rosterStatusSchema } from "./roster.service.js";
import { ProgrammeExportService } from "./programme-export.service.js";

function service(context: GraphQLContext) {
  // Tenant IDs are resolved from authenticated context, never mutation input.
  if (context.identity.platformRole) {
    requirePlatformPermission(context, "programme:manage");
    return new ProgrammeRosterService(context.adminSupabase);
  }
  const { organisationId } = requirePermission(context, "programme:manage");
  return new ProgrammeRosterService(context.adminSupabase, organisationId);
}
const id = (value: unknown) => parseRoster(z.uuid(), value);
export const rosterResolvers = {
  Query: {
    programmeRoster: (_: unknown, args: { programmeId: string; offset?: number }, context: GraphQLContext) =>
      service(context).list(id(args.programmeId), parseRoster(z.number().int().min(0), args.offset ?? 0)),
    programmeScreeningExport: (_: unknown, args: { programmeId: string }, context: GraphQLContext) => {
      if (context.identity.platformRole) { requirePlatformPermission(context, "programme:manage"); return new ProgrammeExportService(context.adminSupabase).screeningRows(id(args.programmeId)); }
      const { organisationId } = requirePermission(context, "programme:manage");
      return new ProgrammeExportService(context.adminSupabase, organisationId).screeningRows(id(args.programmeId));
    },
  },
  Mutation: {
    createProgrammeParticipant: async (_: unknown, args: { programmeId: string; input: unknown }, context: GraphQLContext) => {
      const roster = service(context);
      const ids = await roster.import(id(args.programmeId), [parseRoster(rosterEntrySchema, args.input)]);
      return ids[0];
    },
    importProgrammeParticipants: (_: unknown, args: { programmeId: string; rows: unknown }, context: GraphQLContext) =>
      service(context).import(id(args.programmeId), parseRoster(rosterImportSchema, args.rows)),
    updateProgrammeParticipantStatus: (_: unknown, args: { programmeId: string; id: string; input: unknown }, context: GraphQLContext) =>
      service(context).updateStatus(id(args.programmeId), id(args.id), parseRoster(rosterStatusSchema, args.input)),
  },
};
