import { GraphQLError } from "graphql";

import type { GraphQLContext } from "../../graphql/context.js";
import { calculatePermissions, type Permission } from "./roles.js";

export function requireAuthenticatedUser(context: GraphQLContext) {
  if (!context.user || !context.supabase) {
    throw new GraphQLError("Authentication required.", {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }

  return {
    user: context.user,
    supabase: context.supabase,
  };
}

export function requireOrganisationContext(context: GraphQLContext) {
  requireAuthenticatedUser(context);

  if (!context.identity.organisationId) {
    throw new GraphQLError("Organisation context is required.", {
      extensions: {
        code: "ORGANISATION_CONTEXT_REQUIRED",
      },
    });
  }

  if (!context.identity.organisationRole && !context.identity.platformRole) {
    throw new GraphQLError("You do not have access to this organisation.", {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }

  return {
    organisationId: context.identity.organisationId,
    organisationRole: context.identity.organisationRole,
    platformRole: context.identity.platformRole,
  };
}

export function requirePermission(
  context: GraphQLContext,
  permission: Permission,
) {
  requireOrganisationContext(context);

  const userPermissions = calculatePermissions(
    context.identity.organisationRole,
    context.identity.platformRole,
  );

  if (!userPermissions.includes(permission)) {
    throw new GraphQLError(
      "You do not have permission to perform this action.",
      {
        extensions: {
          code: "FORBIDDEN",
          permission,
        },
      },
    );
  }

  return {
    organisationId: context.identity.organisationId!,
  };
}

export function requirePlatformPermission(
  context: GraphQLContext,
  permission: Permission,
) {
  requireAuthenticatedUser(context);

  const role = context.identity.platformRole;
  if (!role || !calculatePermissions(null, role).includes(permission)) {
    throw new GraphQLError(
      "You do not have permission to perform this platform action.",
      { extensions: { code: "FORBIDDEN", permission } },
    );
  }

  return { user: context.user!, platformRole: role };
}
