"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "@/components/icons/LucideIcons";
import { cn } from "@/lib/utils/cn";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type PortalSidebarItemProps = {
  item: PortalNavItem;
};

export function PortalSidebarItem({ item }: PortalSidebarItemProps) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-navy",
        active && "bg-primary/12 text-navy shadow-[inset_3px_0_0_var(--color-primary)]",
      )}
    >
      <Icon
        className={cn("h-5 w-5", active ? "text-primary" : "text-muted")}
        aria-hidden="true"
      />
      <span>{item.label}</span>
    </Link>
  );
}
