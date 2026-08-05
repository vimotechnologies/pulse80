import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { portalConfigs } from "@/data/portal-phase-two";
import { requireRole } from "@/lib/auth/session";

export default async function AdminPortalLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  const config = portalConfigs.admin;

  return (
    <PortalLayout
      portalKey={config.key}
      portalName={config.name}
      portalDescription={config.description}
      userLabel={config.userLabel}
      userRole={config.userRole}
    >
      {children}
    </PortalLayout>
  );
}
