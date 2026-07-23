"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  PortalSidebarGroup,
  PortalSidebarItem,
  type PortalNavEntry,
} from "@/components/portal/PortalSidebarItem";
import { ArrowLeft2, Logout } from "@/components/icons/IconsaxIcons";
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
  collapsed,
  onToggleCollapsed,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = portalConfigs[portalKey].items;
  const activeGroups = useMemo(
    () =>
      items
        .filter((item) => item.type === "group" && item.children.some((child) => pathname === child.href))
        .map((item) => item.label),
    [items, pathname],
  );
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  function toggleGroup(label: string) {
    setOpenGroups((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  return (
    <aside
      className={cn(
        "pulse-portal-sidebar fixed inset-y-0 left-0 z-30 hidden border-r border-[#d0d5dd] bg-surface transition-[width] duration-300 lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center px-4",
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
              src="/brand/pulse80-mark.png"
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
                src="/brand/pulse80-logo-no-tagline.png"
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
              <ArrowLeft2 className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto py-5",
          collapsed ? "px-3" : "px-3",
        )}
      >
        {items.map((item) => (
          <SidebarEntry
            key={item.type === "group" ? item.label : item.href}
            entry={item}
            collapsed={collapsed}
            open={item.type === "group" ? activeGroups.includes(item.label) || openGroups.includes(item.label) : false}
            onToggle={() => item.type === "group" && toggleGroup(item.label)}
          />
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="mx-2 mb-3 border-t border-slate-200" />
        <button
          type="button"
          onClick={() => router.push("/login")}
          className={cn(
            "flex h-11 w-full items-center rounded-lg bg-surface text-[14px] font-normal text-subtle transition hover:bg-slate-100 hover:text-subtle",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
          )}
          style={{ fontSize: "14px", lineHeight: "20px" }}
          aria-label="Sign out"
          title={collapsed ? "Sign out" : undefined}
        >
          <Logout className="h-[18px] w-[18px] text-subtle" aria-hidden="true" />
          {!collapsed ? (
            <span className="leading-5" style={{ fontSize: "14px", lineHeight: "20px" }}>
              Sign out
            </span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}

function SidebarEntry({
  entry,
  collapsed,
  open,
  onToggle,
}: {
  entry: PortalNavEntry;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  if (entry.type === "group") {
    return (
      <PortalSidebarGroup
        group={entry}
        collapsed={collapsed}
        open={open}
        onToggle={onToggle}
      />
    );
  }

  return <PortalSidebarItem item={entry} collapsed={collapsed} />;
}
