"use server";

import { cookies } from "next/headers";
import { getViewer, ORGANISATION_COOKIE } from "@/lib/auth/session";
import { graphqlRequest } from "@/lib/graphql/client";
import type { PdfClient } from "@/lib/pdf/download";

export async function loadPdfBranding(): Promise<{ client?: PdfClient; clients: PdfClient[] }> {
  const organisationId = (await cookies()).get(ORGANISATION_COOKIE)?.value ?? null;
  const viewer = await getViewer(organisationId);
  if (viewer.platformRole) {
    const result = await graphqlRequest<{ adminOrganisationBranding: PdfClient[] }>(
      `query PdfClients { adminOrganisationBranding { name logoUrl } }`,
    );
    return { clients: result.adminOrganisationBranding };
  }
  const result = await graphqlRequest<{ organisationBranding: PdfClient }>(
    `query PdfClient { organisationBranding { name logoUrl } }`, { organisationId },
  );
  return { client: viewer.organisationRole === "practitioner" ? undefined : result.organisationBranding, clients: [result.organisationBranding] };
}
