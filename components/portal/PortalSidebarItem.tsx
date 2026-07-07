"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: IconsaxIcon;
};

type PortalSidebarItemProps = {
  item: PortalNavItem;
  collapsed?: boolean;
};

export function PortalSidebarItem({ item, collapsed = false }: PortalSidebarItemProps) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "flex h-11 items-center rounded-lg text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-navy",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active && "bg-primary/12 text-navy shadow-[inset_3px_0_0_var(--color-primary)]",
      )}
    >
      <Icon
        className={cn("h-5 w-5", active ? "text-primary" : "text-muted")}
        aria-hidden="true"
      />
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  );
}
