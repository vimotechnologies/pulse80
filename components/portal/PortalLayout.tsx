import type { ReactNode } from "react";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalTopNav } from "@/components/portal/PortalTopNav";
import type { PortalKey } from "@/data/portal-phase-two";

type PortalLayoutProps = {
  children: ReactNode;
  portalKey: PortalKey;
  portalName: string;
  portalDescription: string;
  userLabel: string;
  userRole: string;
};

export function PortalLayout({
  children,
  portalKey,
  portalName,
  portalDescription,
  userLabel,
  userRole,
}: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-soft-bg">
      <PortalSidebar
        portalKey={portalKey}
        portalName={portalName}
        portalDescription={portalDescription}
      />
      <PortalTopNav
        portalName={portalName}
        userLabel={userLabel}
        userRole={userRole}
      />
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
