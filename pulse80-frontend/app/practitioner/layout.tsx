import type { ReactNode } from "react";
import { loadPractitionerProfile } from "@/app/actions/practitioner-profile";
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
  const profile = await loadPractitionerProfile();

  return (
    <PortalLayout
      portalKey={config.key}
      portalName={config.name}
      portalDescription={config.description}
      userLabel={profile.fullName}
      userRole={config.userRole}
    >
      {children}
    </PortalLayout>
  );
}
