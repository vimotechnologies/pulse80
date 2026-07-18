import { ArrowDownRight, ArrowRight, ArrowUpRight } from "@/components/icons/IconsaxIcons";
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
    <article className="rounded-lg border border-card-border bg-surface p-5 shadow-[0_12px_30px_var(--card-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{metric.label}</p>
          <p className="mt-3 text-xl font-semibold tracking-[var(--pulse-tracking-heading)] text-navy">
            {metric.value}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <metric.icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <div
        className={cn(
          "mt-5 flex items-center gap-1.5 text-sm font-medium",
          metric.trend === "down" ? "text-pulse-red" : "text-success",
          metric.trend === "neutral" && "text-muted",
        )}
      >
        <TrendIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>{metric.change}</span>
      </div>
    </article>
  );
}
