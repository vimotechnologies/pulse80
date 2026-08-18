"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalMobileNav } from "@/components/portal/PortalMobileNav";
import { PortalTopNav } from "@/components/portal/PortalTopNav";
import type { PortalKey } from "@/data/portal-phase-two";
import { cn } from "@/lib/utils/cn";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={cn("min-h-screen", portalKey === "admin" ? "bg-[#f7f7f7]" : "bg-soft-bg")}>
      <PortalSidebar
        portalKey={portalKey}
        portalName={portalName}
        portalDescription={portalDescription}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />
      <PortalTopNav
        portalName={portalName}
        userLabel={userLabel}
        userRole={userRole}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main
        className={cn(
          "px-4 pb-28 pt-6 transition-[margin] duration-300 sm:px-6 lg:px-8 lg:py-8",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
        )}
      >
        {children}
      </main>
      <PortalMobileNav portalKey={portalKey} portalName={portalName} />
    </div>
  );
}
