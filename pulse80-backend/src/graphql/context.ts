import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { FastifyReply, FastifyRequest } from "fastify";
import { GraphQLError } from "graphql";

import { env } from "../config/env.js";
import type { Database } from "../generated/database.types.js";
import { publicSupabase } from "../lib/supabase.js";

export interface GraphQLContext {
  request: FastifyRequest;
  reply: FastifyReply;
  accessToken: string | null;
  user: User | null;
  supabase: SupabaseClient<Database> | null;
}

function extractBearerToken(request: FastifyRequest): string {
  const authorization = request.headers.authorization;

  if (!authorization) {
    throw unauthenticatedError();
  }

  const [scheme, token, ...extraParts] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    throw unauthenticatedError();
  }

  return token;
}

function unauthenticatedError() {
  return new GraphQLError("Authentication Error", {
    extensions: {
      code: "UNAUTHENTICATED",
      http: { status: 401 },
    },
  });
}

export async function createGraphQLContext(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<GraphQLContext> {
  const accessToken = extractBearerToken(request);

  const {
    data: { user },
    error,
  } = await publicSupabase.auth.getUser(accessToken);

  if (error || !user) {
    request.log.warn({ authError: error?.message }, "GraphQL authentication failed");
    throw unauthenticatedError();
  }

  const supabase = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return {
    request,
    reply,
    accessToken,
    user,
    supabase,
  };
}
