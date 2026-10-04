import "server-only";

import { redirect } from "next/navigation";

import { createClient, getVerifiedSession } from "@/lib/supabase/server";

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
  options: {
    accessToken?: string;
    organisationId?: string | null;
    variables?: Record<string, unknown>;
  } = {},
): Promise<T> {
  let accessToken = options.accessToken;

  if (!accessToken) {
    accessToken = (await getVerifiedSession()).accessToken;
  }

  const graphqlUrl = process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${accessToken}`,
  };

  if (options.organisationId) {
    headers["x-organisation-id"] = options.organisationId;
  }

  const protectionBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (protectionBypassSecret) {
    headers["x-vercel-protection-bypass"] = protectionBypassSecret;
  }

  const sendRequest = async (token: string) => {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { ...headers, authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables: options.variables }),
      cache: "no-store",
    });
    return { response, payload: (await response.json()) as GraphQLResponse<T> };
  };

  let { response, payload } = await sendRequest(accessToken);
  const authFailed = payload.errors?.[0]?.extensions?.code === "UNAUTHENTICATED";
  if (authFailed) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.refreshSession();
    const refreshedToken = data.session?.access_token;
    if (!error && refreshedToken) {
      accessToken = refreshedToken;
      ({ response, payload } = await sendRequest(accessToken));
    }
  }

  if (!response.ok || payload.errors?.length || !payload.data) {
    const graphQLError = payload.errors?.[0];
    const errorCode = graphQLError?.extensions?.code ?? "GRAPHQL_REQUEST_FAILED";
    if (errorCode === "UNAUTHENTICATED") redirect("/login");
    throw new Error(errorCode === "BAD_USER_INPUT" && graphQLError?.message ? graphQLError.message : errorCode);
  }

  return payload.data;
}
