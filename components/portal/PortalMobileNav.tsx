"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Menu,
  Microscope,
  Settings,
} from "@/components/icons/IconsaxIcons";
import type { PortalNavEntry, PortalNavItem } from "@/components/portal/PortalSidebarItem";
import { portalConfigs, type PortalKey } from "@/data/portal-phase-two";
import { cn } from "@/lib/utils/cn";

type PortalMobileNavProps = {
  portalKey: PortalKey;
  portalName: string;
};

type QuickNavItem = PortalNavItem & {
  kind?: "menu" | "dashboard";
};

function findItem(items: PortalNavItem[], label: string) {
  return items.find((item) => item.label === label);
}

function flattenNavItems(items: PortalNavEntry[]): PortalNavItem[] {
  return items.flatMap((item) => (item.type === "group" ? item.children : [item]));
}

function mobileItems(portalKey: PortalKey, items: PortalNavItem[]): QuickNavItem[] {
  const dashboard = findItem(items, "Dashboard") ?? {
    label: "Dashboard",
    href: `/${portalKey}/dashboard`,
    icon: LayoutDashboard,
  };

  const settings = findItem(items, "Settings") ?? {
    label: "Settings",
    href: `/${portalKey}/settings`,
    icon: Settings,
  };

  const fallbackOne = items[1] ?? dashboard;
  const fallbackTwo = items[2] ?? settings;

  const portalQuickItems: Record<PortalKey, QuickNavItem[]> = {
    admin: [
      { label: "Menu", href: "#", icon: Menu, kind: "menu" },
      findItem(items, "Organizations") ?? { ...fallbackOne, icon: Building2 },
      { ...dashboard, kind: "dashboard" },
      findItem(items, "Reports") ?? { ...fallbackTwo, icon: FileBarChart },
      settings,
    ],
    client: [
      { label: "Menu", href: "#", icon: Menu, kind: "menu" },
      findItem(items, "Reports") ?? { ...fallbackOne, icon: FileText },
      { ...dashboard, kind: "dashboard" },
      findItem(items, "Insights") ?? fallbackTwo,
      settings,
    ],
    practitioner: [
      { label: "Menu", href: "#", icon: Menu, kind: "menu" },
      findItem(items, "Assignments") ?? { ...fallbackOne, icon: CalendarCheck },
      { ...dashboard, kind: "dashboard" },
      findItem(items, "Screenings") ?? { ...fallbackTwo, icon: Microscope },
      settings,
    ],
  };

  return portalQuickItems[portalKey];
}

export function PortalMobileNav({ portalKey, portalName }: PortalMobileNavProps) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const items = useMemo(() => flattenNavItems(portalConfigs[portalKey].items), [portalKey]);
  const quickItems = useMemo(() => mobileItems(portalKey, items), [items, portalKey]);

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            className="h-full w-full cursor-default"
            aria-label="Close portal menu"
            onClick={() => setExpanded(false)}
          />
        </div>
      )}

      <div
        className={cn(
          "fixed inset-x-3 bottom-24 z-50 overflow-hidden rounded-2xl border border-[#d0d5dd] bg-surface shadow-[0_20px_60px_rgba(20,43,83,0.18)] transition lg:hidden",
          expanded
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-[#d0d5dd] px-4 py-4">
          <Image
            src="/brand/pulse80-mark.svg"
            alt="Pulse80"
            width={40}
            height={40}
            className="h-9 w-9"
          />
          <div>
            <p className="text-sm font-semibold text-navy">{portalName}</p>
            <p className="text-xs text-muted">Portal navigation</p>
          </div>
        </div>

        <nav className="grid max-h-[58vh] gap-1 overflow-y-auto p-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setExpanded(false)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-primary/10 hover:text-navy",
                  active && "bg-primary/12 text-navy",
                )}
              >
                <Icon
                  className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-muted")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid h-[76px] grid-cols-5 items-center rounded-[24px] border border-[#d0d5dd] bg-surface/95 px-2 shadow-[0_18px_55px_rgba(20,43,83,0.16)] backdrop-blur lg:hidden">
        {quickItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          if (item.kind === "menu") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className={cn(
                  "mx-auto flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold text-muted transition",
                  expanded && "bg-primary/10 text-primary",
                )}
                aria-expanded={expanded}
                aria-label="Open portal menu"
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </button>
            );
          }

          if (item.kind === "dashboard") {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative mx-auto -mt-8 flex h-[72px] w-[72px] items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,#142B53,#BA1325)] text-white shadow-[0_18px_34px_rgba(20,43,83,0.28)] transition hover:-translate-y-0.5"
                aria-label="Dashboard"
                onClick={() => setExpanded(false)}
              >
                <span className="absolute inset-1 rounded-[22px] border border-white/25" />
                <Icon className="relative h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setExpanded(false)}
              className={cn(
                "mx-auto flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold text-muted transition hover:bg-primary/10 hover:text-navy",
                active && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
