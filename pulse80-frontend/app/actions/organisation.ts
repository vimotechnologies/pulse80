"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { ORGANISATION_COOKIE } from "@/lib/auth/session";
import { graphqlRequest } from "@/lib/graphql/client";

export type Organisation = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

const updateOrganisationSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters.").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must contain at least 2 characters.")
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens only.",
    ),
});

const ORGANISATION_QUERY = /* GraphQL */ `
  query Organisation {
    organisation {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_ORGANISATION_MUTATION = /* GraphQL */ `
  mutation UpdateOrganisation($input: UpdateOrganisationInput!) {
    updateOrganisation(input: $input) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

async function selectedOrganisationId() {
  return (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
}

export async function loadOrganisation(): Promise<Organisation> {
  const result = await graphqlRequest<{ organisation: Organisation }>(
    ORGANISATION_QUERY,
    { organisationId: await selectedOrganisationId() },
  );
  return result.organisation;
}

export async function updateOrganisationAction(formData: FormData) {
  const parsed = updateOrganisationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid organisation details.",
    };
  }

  try {
    const result = await graphqlRequest<{ updateOrganisation: Organisation }>(
      UPDATE_ORGANISATION_MUTATION,
      {
        organisationId: await selectedOrganisationId(),
        variables: { input: parsed.data },
      },
    );

    revalidatePath("/client/settings");
    return { ok: true as const, organisation: result.updateOrganisation };
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const message =
      code === "FORBIDDEN"
        ? "You do not have permission to update this organisation."
        : code === "UNAUTHENTICATED"
          ? "Your session has expired. Please sign in again."
          : "The organisation could not be updated. Please try again.";

    return { ok: false as const, error: message };
  }
}
