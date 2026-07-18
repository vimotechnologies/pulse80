import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import type { Tone } from "@/data/portal-phase-two";
import { TrendingDown, TrendingUp } from "react-feather";
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
  const [trendPercentage, ...trendContext] = trend?.value.split(" ") ?? [];
  const trendContextText = trendContext.join(" ");

  return (
    <DashboardWidget
      interactive
      className="rounded-2xl border-card-border bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium leading-4 text-muted">{label}</p>
          <p className="pulse-metric-value mt-2 tracking-[var(--pulse-tracking-heading)]">
            {value}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-subtle">{detail}</p>
          {trend ? (
            <p
              className="pulse-metric-trend mt-3"
              data-trend-direction={trend.direction}
            >
              <TrendIcon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{trendPercentage}</span>
              {trendContextText ? (
                <span className="pulse-metric-trend-context">{trendContextText}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <Icon className="h-[18px] w-[18px] shrink-0 text-black" aria-hidden="true" />
      </div>
      {typeof progress === "number" ? (
        <div className="mt-4">
          <ProgressWidget value={progress} tone={tone} />
        </div>
      ) : null}
    </DashboardWidget>
  );
}
