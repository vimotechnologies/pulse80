"use client";

import Image from "next/image";
import { PortalSidebarItem } from "@/components/portal/PortalSidebarItem";
import { portalConfigs, type PortalKey } from "@/data/portal-phase-two";

type PortalSidebarProps = {
  portalKey: PortalKey;
  portalName: string;
  portalDescription: string;
};

export function PortalSidebar({
  portalKey,
  portalName,
  portalDescription,
}: PortalSidebarProps) {
  const items = portalConfigs[portalKey].items;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-card-border bg-surface lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-card-border px-6">
        <Image
          src="/brand/pulse80-logo-no-tagline.png"
          alt="Pulse80"
          width={190}
          height={58}
          priority
          className="h-auto w-44"
        />
      </div>

      <div className="border-b border-card-border px-6 py-5">
        <p className="text-sm font-semibold text-navy">{portalName}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{portalDescription}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {items.map((item) => (
          <PortalSidebarItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
