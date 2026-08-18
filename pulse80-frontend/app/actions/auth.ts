"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  deleteSession,
  destinationForRole,
  findInitialOrganisationId,
  getViewer,
  portalRoleForViewer,
  setOrganisationContext,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user || !data.session) {
    return { ok: false as const, error: "The email or password is incorrect." };
  }

  try {
    const organisationId = await findInitialOrganisationId(data.user.id, supabase);
    await setOrganisationContext(organisationId);

    const viewer = await getViewer(organisationId, data.session.access_token);
    const portalRole = portalRoleForViewer(viewer);

    if (!portalRole) {
      await deleteSession();
      return {
        ok: false as const,
        error: "Your account does not have access to a Pulse80 workspace.",
      };
    }

    return { ok: true as const, destination: destinationForRole(portalRole) };
  } catch {
    await deleteSession();
    return {
      ok: false as const,
      error: "Unable to load your Pulse80 access. Please try again.",
    };
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
