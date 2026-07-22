import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type PortalMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: IconsaxIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
};

const toneStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-pulse-red/10 text-pulse-red",
  neutral: "bg-soft-bg text-muted",
};

export function PortalMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: PortalMetricCardProps) {
  return (
    <article className="rounded-lg border border-[#d0d5dd] bg-surface p-5 shadow-[0_12px_30px_var(--card-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 text-xl font-semibold tracking-[var(--pulse-tracking-heading)] text-navy">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            toneStyles[tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-5 text-sm leading-6 text-subtle">{detail}</p>
    </article>
  );
}
