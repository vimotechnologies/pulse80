import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "@/components/icons/IconsaxIcons";
import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type MetricTrend = {
  direction: "up" | "down" | "neutral";
  value: string;
};

export function UnifiedMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  footer,
}: {
  label: string;
  value: string;
  detail: string;
  icon: IconsaxIcon;
  trend?: MetricTrend;
  footer?: ReactNode;
}) {
  const TrendIcon =
    trend?.direction === "up"
      ? ArrowUpRight
      : trend?.direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <article className="rounded-2xl border border-card-border bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium leading-4 text-muted">{label}</p>
          <p className="mt-2 text-[24px] font-semibold leading-8 tracking-[var(--pulse-tracking-heading)] text-navy">
            {value}
          </p>
          {detail ? <p className="mt-2 text-[12px] leading-5 text-subtle">{detail}</p> : null}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-black" aria-hidden="true" />
      </div>

      {trend ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold leading-4",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-pulse-red",
            trend.direction === "neutral" && "text-muted",
          )}
        >
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
          <span>{trend.value}</span>
        </p>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
