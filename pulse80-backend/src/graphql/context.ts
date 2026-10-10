import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { FastifyReply, FastifyRequest } from "fastify";
import { GraphQLError } from "graphql";
import { z } from "zod";

import type { Database } from "../generated/database.types.js";
import {
  adminSupabase,
  authSupabase,
  createUserSupabase,
} from "../lib/supabase.js";
import { AuthorizationService } from "../modules/auth/authorization.service.js";
import type {
  OrganisationRole,
  PlatformRole,
} from "../modules/auth/roles.js";

type TypedSupabase = SupabaseClient<Database>;

export interface RequestIdentity {
  platformRole: PlatformRole | null;
  organisationId: string | null;
  organisationRole: OrganisationRole | null;
}

export interface GraphQLContext {
  request: FastifyRequest;
  reply: FastifyReply;
  accessToken: string | null;
  user: (Pick<User, "id"> & { email: string | null }) | null;
  supabase: TypedSupabase | null;
  adminSupabase: TypedSupabase;
  identity: RequestIdentity;
}

function extractBearerToken(authorization?: string): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

const organisationIdSchema = z.string().uuid();

function extractOrganisationId(request: FastifyRequest): string | null {
  const header = request.headers["x-organisation-id"];

  if (!header) {
    return null;
  }

  const value = Array.isArray(header) ? header[0] : header;
  const parsed = organisationIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new GraphQLError("Invalid organisation context.", {
      extensions: {
        code: "BAD_REQUEST",
      },
    });
  }

  return parsed.data;
}

export async function createGraphQLContext({
  req,
  reply,
}: {
  req: FastifyRequest;
  reply: FastifyReply;
}): Promise<GraphQLContext> {
  const organisationId = extractOrganisationId(req);
  const accessToken = extractBearerToken(req.headers.authorization);

  const anonymousContext = (): GraphQLContext => ({
    request: req,
    reply,
    accessToken: null,
    user: null,
    supabase: null,
    adminSupabase,
    identity: {
      platformRole: null,
      organisationId,
      organisationRole: null,
    },
  });

  if (!accessToken) {
    return anonymousContext();
  }

  const { data, error } = await authSupabase.auth.getClaims(accessToken);
  const claims = data?.claims;
  const subject = claims?.sub;

  if (error || typeof subject !== "string") {
    req.log.warn({ authError: error?.message }, "GraphQL authentication failed");
    return anonymousContext();
  }

  const user = {
    id: subject,
    email: typeof claims?.email === "string" ? claims.email : null,
  };

  const userSupabase = createUserSupabase(accessToken);
  const authorizationService = new AuthorizationService(userSupabase);
  const platformRole = await authorizationService.getPlatformRole(user.id);
  const organisationAccess = organisationId
    ? await authorizationService.getOrganisationAccess(user.id, organisationId)
    : null;
  const { data: registration } = await (adminSupabase as unknown as SupabaseClient).from("practitioner_registrations")
    .select("account_status").eq("invited_user_id", user.id).maybeSingle();
  const practitionerActive = registration?.account_status === "Active";

  return {
    request: req,
    reply,
    accessToken,
    user,
    supabase: userSupabase,
    adminSupabase,
    identity: {
      platformRole,
      organisationId,
      organisationRole: registration && !practitionerActive ? null : organisationAccess?.role ?? (practitionerActive ? "practitioner" : null),
    },
  };
}
