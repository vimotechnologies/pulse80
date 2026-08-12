import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser } from "./auth.guard.js";
import { calculatePermissions } from "./roles.js";

export const authResolvers = {
  Query: {
    me: (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { user } = requireAuthenticatedUser(context);

      return {
        id: user.id,
        email: user.email ?? null,
        platformRole: context.identity.platformRole,
        organisationId: context.identity.organisationId,
        organisationRole: context.identity.organisationRole,
        permissions: calculatePermissions(
          context.identity.organisationRole,
          context.identity.platformRole,
        ),
      };
    },
  },
};
