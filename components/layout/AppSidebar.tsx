import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CreditCard,
  FileBarChart,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  Microscope,
  Settings,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "@/components/icons/IconsaxIcons";
import { PulseLogo } from "@/components/brand/PulseLogo";
import { cn } from "@/lib/utils/cn";

const sidebarItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, active: true },
  { label: "Organizations", href: "#", icon: Building2 },
  { label: "Wellness Activations", href: "#", icon: CalendarCheck },
  { label: "Onsite Screenings", href: "#", icon: Microscope },
  { label: "Practitioners", href: "#", icon: Stethoscope },
  { label: "Screening Results", href: "#", icon: HeartPulse },
  { label: "Reports", href: "#", icon: FileBarChart },
  { label: "Insights", href: "#", icon: BarChart3 },
  { label: "Recommendations", href: "#", icon: Lightbulb },
  { label: "Billing & Invoices", href: "#", icon: CreditCard },
  { label: "Users & Roles", href: "#", icon: UsersRound },
  { label: "Settings", href: "#", icon: Settings },
];

type AppSidebarProps = {
  collapsed?: boolean;
};

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-card-border bg-surface lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center border-b border-card-border",
          collapsed ? "justify-center px-3" : "px-6",
        )}
      >
        <PulseLogo
          variant={collapsed ? "mark" : "no-tagline"}
          priority
          className={collapsed ? "max-h-10" : "max-h-11"}
        />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-navy",
              collapsed && "justify-center px-0",
              item.active &&
                "bg-primary/12 text-navy shadow-[inset_3px_0_0_var(--color-primary)]",
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon
              className={cn("h-[18px] w-[18px]", item.active ? "text-primary" : "text-muted")}
              aria-hidden="true"
            />
            <span className={cn(collapsed && "sr-only")}>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className={cn("border-t border-card-border p-4", collapsed && "hidden")}>
        <div className="rounded-lg bg-soft-bg p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
              <ShieldCheck className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">Operations Portal</p>
              <p className="text-xs text-muted">Phase 1 foundation</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
