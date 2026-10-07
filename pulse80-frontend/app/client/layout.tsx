import { loadAccount } from "@/app/actions/account";
import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { portalConfigs } from "@/data/portal-phase-two";
import { requireRole } from "@/lib/auth/session";

export default async function ClientPortalLayout({ children }: { children: ReactNode }) {
  const viewer = await requireRole("client");
  const account = await loadAccount();
  const config = portalConfigs.client;

  return (
    <PortalLayout
      portalKey={config.key}
      portalName={config.name}
      portalDescription={config.description}
      userLabel={account.fullName || account.email}
      userRole={viewer.platformRole ?? viewer.organisationRole ?? "User"}
    >
      {children}
    </PortalLayout>
  );
}
