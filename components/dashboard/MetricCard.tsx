import { ArrowDownRight, ArrowRight, ArrowUpRight } from "@/components/icons/IconsaxIcons";
import { MetricCardShell } from "@/components/ui/MetricCardShell";
import type { MetricCardData } from "@/types/dashboard";
import { cn } from "@/lib/utils/cn";

type MetricCardProps = {
  metric: MetricCardData;
};

export function MetricCard({ metric }: MetricCardProps) {
  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <MetricCardShell label={metric.label} value={metric.value} icon={metric.icon}>
      <div
        className={cn(
          "mt-3 flex items-center gap-1.5 text-[12px] font-medium",
          metric.trend === "down" ? "text-pulse-red" : "text-success",
          metric.trend === "neutral" && "text-muted",
        )}
      >
        <TrendIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>{metric.change}</span>
      </div>
    </MetricCardShell>
  );
}
