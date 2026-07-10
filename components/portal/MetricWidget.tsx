import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import type { Tone } from "@/data/portal-phase-two";
import { TrendingDown, TrendingUp } from "react-feather";
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

export function MetricWidget({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
  progress,
  trend,
}: MetricWidgetProps) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;

  return (
    <DashboardWidget
      interactive
      className="rounded-2xl border-card-border bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium leading-4 text-muted">{label}</p>
          <p className="mt-2 text-[18px] font-semibold leading-6 tracking-[var(--pulse-tracking-heading)] text-navy">
            {value}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-subtle">{detail}</p>
          {trend ? (
            <p
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold leading-4",
                trend.tone === "success" ? "text-success" : "text-pulse-red",
              )}
            >
              <TrendIcon size={14} strokeWidth={2} aria-hidden="true" />
              {trend.value}
            </p>
          ) : null}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-black" aria-hidden="true" />
      </div>
      {typeof progress === "number" ? (
        <div className="mt-4">
          <ProgressWidget value={progress} tone={tone} />
        </div>
      ) : null}
    </DashboardWidget>
  );
}
