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
  const signedDetail = detail.match(/^\s*([+-])\s*\d/);
  const signedValue = value.match(/^\s*([+-])\s*\d/);
  const inferredTrend: MetricTrend | undefined = signedDetail
    ? { direction: signedDetail[1] === "+" ? "up" : "down", value: detail }
    : signedValue
      ? { direction: signedValue[1] === "+" ? "up" : "down", value }
      : undefined;
  const displayedTrend = trend ?? inferredTrend;
  const valueDirection = signedValue ? inferredTrend?.direction : undefined;
  const normalizedValue = value.trim().toLowerCase();
  const participation = label.toLowerCase().includes("participation")
    ? Number.parseFloat(value.replace("%", ""))
    : Number.NaN;
  const semanticValueClass =
    normalizedValue === "high"
      ? "text-pulse-red"
      : normalizedValue === "medium"
        ? "text-warning"
        : normalizedValue === "low"
          ? "text-success"
          : Number.isFinite(participation)
            ? participation > 65
              ? "text-success"
              : participation < 50
                ? "text-pulse-red"
                : "text-warning"
            : valueDirection === "up"
              ? "text-success"
              : valueDirection === "down"
                ? "text-pulse-red"
                : "text-navy";
  const TrendIcon =
    displayedTrend?.direction === "up"
      ? ArrowUpRight
      : displayedTrend?.direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <article className="rounded-2xl border border-card-border bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium leading-4 text-muted">{label}</p>
          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 text-[24px] font-semibold leading-8 tracking-[var(--pulse-tracking-heading)]",
              semanticValueClass,
            )}
          >
            {valueDirection ? <TrendIcon className="h-5 w-5" aria-hidden="true" /> : null}
            <span>{value}</span>
          </p>
          {detail && !signedDetail ? <p className="mt-2 text-[12px] leading-5 text-subtle">{detail}</p> : null}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-black" aria-hidden="true" />
      </div>

      {displayedTrend && !valueDirection ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold leading-4",
            displayedTrend.direction === "up" && "text-success",
            displayedTrend.direction === "down" && "text-pulse-red",
            displayedTrend.direction === "neutral" && "text-muted",
          )}
        >
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
          <span>{displayedTrend.value}</span>
        </p>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
