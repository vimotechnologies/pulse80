import { GraphQLError } from "graphql";
import { z } from "zod";

import type { GraphQLContext } from "../../graphql/context.js";
import { requirePermission } from "../auth/auth.guard.js";
import { OrganisationService } from "./organisation.service.js";

const updateOrganisationSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  })
  .refine((input) => input.name !== undefined || input.slug !== undefined);

function toOrganisation(row: {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const organisationResolvers = {
  Query: {
    organisation: async (
      _parent: unknown,
      _arguments: unknown,
      context: GraphQLContext,
    ) => {
      const { organisationId } = requirePermission(context, "organisation:read");
      return toOrganisation(
        await new OrganisationService(context.supabase!).getById(organisationId),
      );
    },
  },

  Mutation: {
    updateOrganisation: async (
      _parent: unknown,
      arguments_: { input: unknown },
      context: GraphQLContext,
    ) => {
      const { organisationId } = requirePermission(context, "organisation:update");
      const parsed = updateOrganisationSchema.safeParse(arguments_.input);

      if (!parsed.success) {
        throw new GraphQLError("Invalid organisation details.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return toOrganisation(
        await new OrganisationService(context.supabase!).update(
          organisationId,
          parsed.data,
        ),
      );
    },
  },
};
