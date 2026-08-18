import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  graphqlRequest,
  type OrganisationRole,
  type Viewer,
} from "@/lib/graphql/client";
import { createClient } from "@/lib/supabase/server";

export type PortalRole = "admin" | "client" | "practitioner";

export const ORGANISATION_COOKIE = "pulse80_organisation_id";

const destinations: Record<PortalRole, string> = {
  admin: "/admin/dashboard",
  client: "/client/dashboard",
  practitioner: "/practitioner/dashboard",
};

const ME_QUERY = /* GraphQL */ `
  query Viewer {
    me {
      id
      email
      platformRole
      organisationId
      organisationRole
      permissions
    }
  }
`;

export function portalRoleForViewer(viewer: Viewer): PortalRole | null {
  if (viewer.platformRole) return "admin";
  if (viewer.organisationRole === "practitioner") return "practitioner";
  if (viewer.organisationRole) return "client";
  return null;
}

export async function getViewer(
  organisationId?: string | null,
  accessToken?: string,
) {
  const result = await graphqlRequest<{ me: Viewer }>(ME_QUERY, {
    accessToken,
    organisationId,
  });
  return result.me;
}

export async function findInitialOrganisationId(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("profile_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.organisation_id ?? null;
}

export async function setOrganisationContext(organisationId: string | null) {
  const cookieStore = await cookies();

  if (!organisationId) {
    cookieStore.delete(ORGANISATION_COOKIE);
    return;
  }

  cookieStore.set(ORGANISATION_COOKIE, organisationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function requireRole(requiredRole: PortalRole) {
  const organisationId = (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
  let viewer: Viewer;

  try {
    viewer = await getViewer(organisationId);
  } catch {
    redirect("/login");
  }

  const actualRole = portalRoleForViewer(viewer);

  if (!actualRole) redirect("/login?error=no-access");
  if (actualRole !== requiredRole) redirect(destinations[actualRole]);
  return viewer;
}

export async function deleteSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ORGANISATION_COOKIE);
}

export function destinationForRole(role: PortalRole) {
  return destinations[role];
}

export function isClientOrganisationRole(
  role: OrganisationRole | null,
): role is Exclude<OrganisationRole, "practitioner"> {
  return Boolean(role && role !== "practitioner");
}
