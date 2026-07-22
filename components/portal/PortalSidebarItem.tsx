"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft2 } from "@/components/icons/IconsaxIcons";
import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

export type PortalNavItem = {
  type?: "link";
  label: string;
  href: string;
  icon: IconsaxIcon;
  badge?: {
    label: string;
    tone: "primary" | "warning" | "danger";
  };
};

export type PortalNavGroup = {
  type: "group";
  label: string;
  icon: IconsaxIcon;
  badge?: {
    label: string;
    tone: "primary" | "warning" | "danger";
  };
  children: PortalNavItem[];
};

export type PortalNavEntry = PortalNavItem | PortalNavGroup;

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
        "flex h-11 items-center rounded-lg text-[14px] font-normal text-subtle transition hover:bg-slate-100 hover:text-subtle",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active && "bg-primary/12 text-primary hover:text-primary",
      )}
      style={{ fontSize: "14px", lineHeight: "20px" }}
    >
      <Icon
        className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-subtle")}
        aria-hidden="true"
      />
      {!collapsed ? (
        <span style={{ fontSize: "14px", lineHeight: "20px" }}>
          {item.label}
        </span>
      ) : null}
      {!collapsed && item.badge ? <NavBadge badge={item.badge} className="ml-auto" /> : null}
    </Link>
  );
}

type PortalSidebarGroupProps = {
  group: PortalNavGroup;
  collapsed?: boolean;
  open: boolean;
  onToggle: () => void;
};

export function PortalSidebarGroup({
  group,
  collapsed = false,
  open,
  onToggle,
}: PortalSidebarGroupProps) {
  const pathname = usePathname();
  const active = group.children.some((child) => pathname === child.href);
  const Icon = group.icon;

  if (collapsed) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          title={group.label}
          aria-label={group.label}
          onClick={onToggle}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-lg text-subtle transition hover:bg-slate-100 hover:text-subtle",
            active && "bg-primary/12 text-primary hover:text-primary",
          )}
          style={{ fontSize: "14px", lineHeight: "20px" }}
        >
          <Icon className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-subtle")} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[14px] font-normal text-subtle transition hover:bg-slate-100 hover:text-subtle",
          active && "bg-primary/8 text-primary hover:text-primary",
        )}
        style={{ fontSize: "14px", lineHeight: "20px" }}
      >
        <Icon className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-subtle")} aria-hidden="true" />
        <span
          className="min-w-0 flex-1 truncate text-left"
          style={{ fontSize: "14px", lineHeight: "20px" }}
        >
          {group.label}
        </span>
        {group.badge ? <NavBadge badge={group.badge} /> : null}
        <ArrowLeft2
          className={cn(
            "h-[18px] w-[18px] -rotate-90 text-subtle transition-transform duration-200",
            open && "rotate-90 text-primary",
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="ml-5 mt-1 space-y-1 border-l border-[#d0d5dd] pl-2">
            {group.children.map((child) => {
              const ChildIcon = child.icon;
              const childActive = pathname === child.href;

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-3 text-[14px] font-normal text-subtle transition hover:bg-slate-100 hover:text-subtle",
                    childActive && "bg-primary/12 text-primary hover:text-primary",
                  )}
                  style={{ fontSize: "14px", lineHeight: "20px" }}
                >
                  <ChildIcon className={cn("h-[18px] w-[18px]", childActive ? "text-primary" : "text-subtle")} aria-hidden="true" />
                  <span
                    className="min-w-0 flex-1 truncate"
                    style={{ fontSize: "14px", lineHeight: "20px" }}
                  >
                    {child.label}
                  </span>
                  {childActive ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBadge({
  badge,
  className,
}: {
  badge: NonNullable<PortalNavItem["badge"]>;
  className?: string;
}) {
  const toneStyles = {
    primary: "border-primary/20 bg-primary/10 text-primary",
    warning: "border-warning/25 bg-warning/10 text-warning",
    danger: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
  };

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[10px] font-semibold leading-none",
        toneStyles[badge.tone],
        className,
      )}
    >
      {badge.label}
    </span>
  );
}
