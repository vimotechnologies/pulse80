import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { ArrowDown, ArrowUpRight } from "@/components/icons/IconsaxIcons";
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
  trend?: {
    value: string;
    direction: "up" | "down";
    tone: "success" | "danger";
  };
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
  trend,
}: MetricWidgetProps) {
  const TrendIcon = trend?.direction === "down" ? ArrowDown : ArrowUpRight;

  return (
    <DashboardWidget
      interactive
      className="rounded-2xl border-card-border bg-white p-5 shadow-[0_18px_44px_rgba(7,22,51,0.065)]"
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
            toneStyles[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-muted">{label}</p>
          <p className="mt-2 text-xl font-semibold leading-7 tracking-[var(--pulse-tracking-heading)] text-navy">
            {value}
          </p>
          <p className="mt-2 text-sm leading-5 text-subtle">{detail}</p>
          {trend ? (
            <p
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold",
                trend.tone === "success" ? "text-success" : "text-pulse-red",
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {trend.value}
            </p>
          ) : null}
        </div>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-4">
          <ProgressWidget value={progress} tone={tone} />
        </div>
      ) : null}
    </DashboardWidget>
  );
}
