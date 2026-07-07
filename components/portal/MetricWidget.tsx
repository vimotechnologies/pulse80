import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { ArrowRight } from "@/components/icons/IconsaxIcons";
import type { Tone } from "@/data/portal-phase-two";
import { cn } from "@/lib/utils/cn";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { ProgressWidget } from "@/components/portal/ProgressWidget";

type MetricWidgetProps = {
  label: string;
  value: string;
  detail: string;
  icon: IconsaxIcon;
  tone?: Tone;
  progress?: number;
  actionLabel?: string;
};

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  success: "bg-success/10 text-success ring-success/15",
  warning: "bg-warning/10 text-warning ring-warning/15",
  danger: "bg-pulse-red/10 text-pulse-red ring-pulse-red/15",
  neutral: "bg-soft-bg text-muted ring-card-border",
};

export function MetricWidget({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
  progress,
  actionLabel = "View details",
}: MetricWidgetProps) {
  return (
    <DashboardWidget interactive className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[var(--pulse-tracking-heading)] text-navy">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1",
            toneStyles[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-subtle">{detail}</p>
      {typeof progress === "number" ? (
        <div className="mt-4">
          <ProgressWidget value={progress} tone={tone} />
        </div>
      ) : null}
      <button
        type="button"
        className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </DashboardWidget>
  );
}
