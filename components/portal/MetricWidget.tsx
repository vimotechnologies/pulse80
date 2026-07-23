import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import type { Tone } from "@/data/portal-phase-two";
import { TrendingDown, TrendingUp } from "react-feather";
import { ProgressWidget } from "@/components/portal/ProgressWidget";
import { MetricCardShell } from "@/components/ui/MetricCardShell";

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
    <MetricCardShell label={label} value={value} detail={detail} icon={Icon}>
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
      {typeof progress === "number" ? (
        <div className="mt-4">
          <ProgressWidget value={progress} tone={tone} />
        </div>
      ) : null}
    </MetricCardShell>
  );
}
