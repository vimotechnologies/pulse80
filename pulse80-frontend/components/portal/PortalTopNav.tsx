import Image from "next/image";
import { Bell, Search } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type PortalTopNavProps = {
  portalName: string;
  userLabel: string;
  userRole: string;
  sidebarCollapsed?: boolean;
};

export function PortalTopNav({
  portalName,
  userLabel,
  userRole,
  sidebarCollapsed = false,
}: PortalTopNavProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-card-border bg-surface/95 backdrop-blur">
      <div
        className={cn(
          "flex h-20 items-center gap-4 px-4 transition-[margin] duration-300 sm:px-6 lg:px-8",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
        )}
      >
        <Image
          src="/brand/pulse80-logo-no-tagline.svg"
          alt="Pulse80"
          width={150}
          height={46}
          priority
          className="h-auto w-28 shrink-0 sm:w-32 lg:hidden"
        />

        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder={`Search ${portalName.toLowerCase()}`}
              className="h-10 w-64 rounded-lg border border-card-border bg-white pl-10 pr-3 text-[12px] outline-none transition placeholder:text-[12px] placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-card-border bg-surface text-muted transition hover:text-navy"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-pulse-red" />
          </button>
          <div className="flex items-center gap-3 rounded-lg border border-card-border bg-surface py-1.5 pl-2 pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {userLabel
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-navy">{userLabel}</p>
              <p className="text-xs text-muted">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
