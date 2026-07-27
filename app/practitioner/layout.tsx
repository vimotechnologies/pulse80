import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { portalConfigs } from "@/data/portal-phase-two";
import { requireRole } from "@/lib/auth/session";

export default async function PractitionerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("practitioner");
  const config = portalConfigs.practitioner;

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
