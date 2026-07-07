import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PortalListItem } from "@/data/portal-phase-two";

type DrillDownCardProps = {
  item: PortalListItem;
};

export function DrillDownCard({ item }: DrillDownCardProps) {
  return (
    <details className="group border-b border-card-border last:border-b-0">
      <summary className="grid cursor-pointer list-none gap-3 p-5 transition hover:bg-soft-bg/70 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-navy">{item.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{item.meta}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} tone={item.tone} />
          <span className="text-xs font-semibold text-primary group-open:hidden">
            Details
          </span>
          <span className="hidden text-xs font-semibold text-muted group-open:inline">
            Close
          </span>
        </div>
      </summary>
      <div className="px-5 pb-5">
        <div className="rounded-lg border border-card-border bg-white/75 p-4 text-xs leading-5 text-muted">
          Owner, due date, source report, and action history will appear here in
          a later phase. This keeps the dashboard high-level by default.
        </div>
      </div>
    </details>
  );
}
