"use client";

import Image from "next/image";
import { PortalSidebarItem } from "@/components/portal/PortalSidebarItem";
import { ArrowLeft2 } from "@/components/icons/IconsaxIcons";
import { portalConfigs, type PortalKey } from "@/data/portal-phase-two";
import { cn } from "@/lib/utils/cn";

type PortalSidebarProps = {
  portalKey: PortalKey;
  portalName: string;
  portalDescription: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function PortalSidebar({
  portalKey,
  portalName,
  portalDescription,
  collapsed,
  onToggleCollapsed,
}: PortalSidebarProps) {
  const items = portalConfigs[portalKey].items;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-card-border bg-surface transition-[width] duration-300 lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center border-b border-card-border px-4",
          collapsed ? "justify-center" : "justify-between gap-3",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="relative h-10 w-10 shrink-0 rounded-lg transition hover:bg-primary/10"
            aria-label="Expand sidebar"
            aria-expanded={false}
          >
            <Image
              src="/brand/pulse80-mark.svg"
              alt="Pulse80"
              fill
              sizes="40px"
              priority
              className="object-contain object-center"
            />
          </button>
        ) : (
          <>
            <div className="relative h-[52px] w-40 shrink-0">
              <Image
                src="/brand/pulse80-logo-no-tagline.svg"
                alt="Pulse80"
                fill
                sizes="160px"
                priority
                className="object-contain object-left"
              />
            </div>

            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-primary/10 hover:text-primary lg:flex"
              aria-label="Collapse sidebar"
              aria-expanded
            >
              <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {!collapsed ? (
        <div className="border-b border-card-border px-5 py-4">
          <p className="text-sm font-semibold text-navy">{portalName}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{portalDescription}</p>
        </div>
      ) : null}

      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto py-5",
          collapsed ? "px-3" : "px-3",
        )}
      >
        {items.map((item) => (
          <PortalSidebarItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
