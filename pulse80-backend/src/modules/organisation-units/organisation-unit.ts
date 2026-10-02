import { GraphQLError } from "graphql";
import { z } from "zod";
import type { GraphQLContext } from "../../graphql/context.js";
import { requirePlatformPermission } from "../auth/auth.guard.js";
export const unitTypeDefs = /* GraphQL */ `
  type OrganisationUnit { id: ID!, organisationId: ID!, parentId: ID, kind: String!, name: String!, location: String!, employees: Int!, status: String! }
  input OrganisationUnitInput { organisationId: ID!, parentId: ID, kind: String!, name: String!, location: String!, employees: Int!, status: String! }
  extend type Query { adminOrganisationUnits(organisationId: ID!): [OrganisationUnit!]! }
  extend type Mutation { saveOrganisationUnit(id: ID, input: OrganisationUnitInput!): Boolean! }
`;
export const unitResolvers = {
  Query: { adminOrganisationUnits: async (_: unknown, args: { organisationId: string }, context: GraphQLContext) => {
    requirePlatformPermission(context, "organisation:read");
    const id = z.uuid().parse(args.organisationId); const rows = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await context.adminSupabase.from("organisation_units").select("*").eq("organisation_id", id).order("id").range(offset, offset + 499);
      if (error) throw new Error(error.message); rows.push(...data); if (data.length < 500) break;
    }
    return rows.map(row => ({ ...row, organisationId: row.organisation_id, parentId: row.parent_id }));
  } },
  Mutation: { saveOrganisationUnit: async (_: unknown, args: { id?: string; input: unknown }, context: GraphQLContext) => {
    requirePlatformPermission(context, "organisation:update");
    const parsed = z.object({ organisationId: z.uuid(), parentId: z.uuid().nullish(), kind: z.enum(["branch", "department"]), name: z.string().trim().min(2).max(160), location: z.string().trim().max(500), employees: z.number().int().min(0).max(10000000), status: z.enum(["Active", "Paused", "Archived"]) }).safeParse(args.input);
    if (!parsed.success) throw new GraphQLError("Invalid branch or department details.", { extensions: { code: "BAD_USER_INPUT" } });
    const input = parsed.data;
    if ((input.kind === "department") !== Boolean(input.parentId)) throw new GraphQLError("Departments require a parent branch.", { extensions: { code: "BAD_USER_INPUT" } });
    if (input.parentId) {
      const parent = await context.adminSupabase.from("organisation_units").select("id").eq("id", input.parentId).eq("organisation_id", input.organisationId).eq("kind", "branch").single();
      if (parent.error) throw new GraphQLError("The branch does not belong to this organisation.", { extensions: { code: "BAD_USER_INPUT" } });
    }
    const row = { organisation_id: input.organisationId, parent_id: input.parentId ?? null, kind: input.kind, name: input.name, location: input.location, employees: input.employees, status: input.status, updated_at: new Date().toISOString() };
    const query = args.id ? context.adminSupabase.from("organisation_units").update(row).eq("id", z.uuid().parse(args.id)).eq("organisation_id", input.organisationId).eq("kind", input.kind) : context.adminSupabase.from("organisation_units").insert(row);
    const { error } = await query.select("id").single(); if (error) throw new Error(error.message); return true;
  } },
};
