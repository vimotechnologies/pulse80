import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { portalConfigs } from "@/data/portal-phase-two";

export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  const config = portalConfigs.client;

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
