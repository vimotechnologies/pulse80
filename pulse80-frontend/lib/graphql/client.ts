import "server-only";

import { createClient } from "@/lib/supabase/server";

export type OrganisationRole =
  | "owner"
  | "client_admin"
  | "hr"
  | "occupational_health"
  | "executive"
  | "practitioner";

export type PlatformRole =
  | "super_admin"
  | "operations"
  | "business_development"
  | "finance"
  | "wellness_coordinator";

export interface Viewer {
  id: string;
  email: string | null;
  platformRole: PlatformRole | null;
  organisationId: string | null;
  organisationRole: OrganisationRole | null;
  permissions: string[];
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

export async function graphqlRequest<T>(
  query: string,
  options: { organisationId?: string | null; variables?: Record<string, unknown> } = {},
): Promise<T> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (userError || !userData.user || !accessToken) {
    throw new Error("UNAUTHENTICATED");
  }

  const graphqlUrl = process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${accessToken}`,
  };

  if (options.organisationId) {
    headers["x-organisation-id"] = options.organisationId;
  }

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: options.variables }),
    cache: "no-store",
  });
  const payload = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(payload.errors?.[0]?.extensions?.code ?? "GRAPHQL_REQUEST_FAILED");
  }

  return payload.data;
}
