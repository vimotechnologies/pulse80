import { Bell, Menu, Search } from "@/components/icons/LucideIcons";
import { PulseLogo } from "@/components/brand/PulseLogo";

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-card-border bg-surface/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:ml-72 lg:px-8">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-card-border text-navy lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <PulseLogo variant="mark" className="max-h-9 lg:hidden" />
        <div className="relative hidden flex-1 sm:block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search organizations, reports, practitioners"
            className="h-11 w-full max-w-xl rounded-lg border border-card-border bg-soft-bg pl-11 pr-4 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-card-border bg-surface text-muted transition hover:text-navy"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-pulse-red" />
          </button>
          <div className="flex items-center gap-3 rounded-lg border border-card-border bg-surface py-1.5 pl-2 pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-sm font-semibold text-white">
              RM
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-navy">Refiloe M.</p>
              <p className="text-xs text-muted">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
