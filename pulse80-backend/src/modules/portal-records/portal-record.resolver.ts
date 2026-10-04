import { GraphQLError } from "graphql";
import { z } from "zod";
import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser, requirePermission, requirePlatformPermission } from "../auth/auth.guard.js";
import { getPlatformPermissions, type Permission } from "../auth/roles.js";
import { PortalRecordService, recordKinds, recordStatuses, type RecordKind } from "./portal-record.service.js";

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new GraphQLError(parsed.error.issues[0]?.message ?? "Invalid record", { extensions: { code: "BAD_USER_INPUT" } });
  return parsed.data;
}
const inputSchema = z.object({
  organisationId: z.uuid(), practitionerUserId: z.uuid().nullish(),
  title: z.string().trim().min(2).max(180), description: z.string().trim().max(20000),
  status: z.string(), amount: z.number().nonnegative().max(999999999.99).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001, "Use at most two decimal places").nullish(),
  currency: z.string().regex(/^[A-Z]{3}$/), dueOn: z.iso.date().nullish(),
});
export function recordPermission(kind: RecordKind, write = false): Permission {
  if (kind === "invoice" || kind === "payment") return write ? "billing:manage" : "billing:read";
  if (kind === "report" || kind === "recommendation") return write ? "reports:manage" : "reports:read";
  return write ? "programme:manage" : "programme:read";
}
export const portalRecordResolvers = {
  Query: {
    adminRecordWorkspace: async (_: unknown, args: { kind: string }, context: GraphQLContext) => {
      const kind = parse(z.enum(recordKinds), args.kind);
      requirePlatformPermission(context, recordPermission(kind));
      const service = new PortalRecordService(context.adminSupabase);
      const [records, options] = await Promise.all([service.list(kind), service.options(kind)]);
      return { records, ...options, canManage: getPlatformPermissions(context.identity.platformRole).includes(recordPermission(kind, true)) };
    },
    adminOrganisationRecords: async (_: unknown, args: { kind: string; organisationId: string }, context: GraphQLContext) => {
      const kind = parse(z.enum(["report", "recommendation"]), args.kind);
      requirePlatformPermission(context, recordPermission(kind));
      return new PortalRecordService(context.adminSupabase).list(kind, { organisationId: parse(z.uuid(), args.organisationId) });
    },
    organisationRecords: async (_: unknown, args: { kind: string }, context: GraphQLContext) => {
      const kind = parse(z.enum(["report", "recommendation"]), args.kind);
      const { organisationId } = requirePermission(context, "reports:read");
      return new PortalRecordService(context.adminSupabase).list(kind, { organisationId, publishedOnly: true });
    },
    practitionerPayments: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      const { user } = requireAuthenticatedUser(context);
      return new PortalRecordService(context.adminSupabase).list("payment", { practitionerUserId: user.id });
    },
  },
  Mutation: {
    savePortalRecord: async (_: unknown, args: { kind: string; id?: string; input: unknown }, context: GraphQLContext) => {
      const kind = parse(z.enum(recordKinds), args.kind);
      const { user } = requirePlatformPermission(context, recordPermission(kind, true));
      const input = parse(inputSchema, args.input);
      if (!recordStatuses[kind].includes(input.status)) throw new GraphQLError("Invalid status for this record type", { extensions: { code: "BAD_USER_INPUT" } });
      const financial = kind === "invoice" || kind === "payment";
      if (financial !== (input.amount != null) || (kind === "payment") !== Boolean(input.practitionerUserId)) {
        throw new GraphQLError("Financial records require an amount; payments also require a practitioner. Other records must omit these fields.", { extensions: { code: "BAD_USER_INPUT" } });
      }
      return new PortalRecordService(context.adminSupabase).save(kind, args.id ? parse(z.uuid(), args.id) : undefined, input, user.id);
    },
  },
};
