import { env } from "../../config/env.js";
import { GraphQLError } from "graphql";
import { z } from "zod";
import type { GraphQLContext } from "../../graphql/context.js";
import { requirePlatformPermission } from "../auth/auth.guard.js";
import { organisationRoles, platformRoles } from "../auth/roles.js";
import { UserService } from "./user.service.js";
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new GraphQLError(result.error.issues[0]?.message ?? "Invalid user details", { extensions: { code: "BAD_USER_INPUT" } });
  return result.data;
}
function guard(context: GraphQLContext) { return requirePlatformPermission(context, "members:manage"); }
export const userResolvers = {
  Query: {
    adminUserDirectory: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      const { platformRole } = guard(context);
      return { ...await new UserService(context.adminSupabase).directory(), canManagePlatform: platformRole === "super_admin" };
    },
  },
  Mutation: {
    inviteOrganisationUser: async (_: unknown, args: unknown, context: GraphQLContext) => {
      guard(context);
      const input = parse(z.object({ organisationId: z.uuid(), email: z.email().trim().toLowerCase(), fullName: z.string().trim().min(2).max(160), role: z.enum(["client_admin", "hr", "occupational_health", "executive"]) }), args);
      await new UserService(context.adminSupabase).invite(input, new URL("/auth/setup", env.FRONTEND_URL).toString()); return true;
    },
    updateOrganisationMemberRole: async (_: unknown, args: { id: string; role: string }, context: GraphQLContext) => {
      guard(context);
      const role = parse(z.enum(organisationRoles), args.role);
      if (role === "owner" || role === "practitioner") throw new GraphQLError("Owner and practitioner access must be managed through their dedicated workflows.", { extensions: { code: "BAD_USER_INPUT" } });
      await new UserService(context.adminSupabase).updateMember(parse(z.uuid(), args.id), role); return true;
    },
    removeOrganisationMember: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      const { user } = guard(context);
      await new UserService(context.adminSupabase).removeMember(parse(z.uuid(), args.id), user.id); return true;
    },
    updatePlatformUserRole: async (_: unknown, args: { userId: string; role: string }, context: GraphQLContext) => {
      const { user, platformRole } = guard(context);
      if (platformRole !== "super_admin") throw new GraphQLError("Only a super admin can change platform roles.", { extensions: { code: "FORBIDDEN" } });
      const id = parse(z.uuid(), args.userId);
      if (id === user.id) throw new GraphQLError("You cannot change your own platform role.", { extensions: { code: "BAD_USER_INPUT" } });
      await new UserService(context.adminSupabase).updatePlatformRole(id, parse(z.enum(platformRoles), args.role)); return true;
    },
  },
};
