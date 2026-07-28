import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/data/portal-phase-two";

type ProgressWidgetProps = {
  value: number;
  label?: string;
  tone?: Tone;
};

const barStyles: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-pulse-red",
  neutral: "bg-muted",
};

export function ProgressWidget({
  value,
  label,
  tone = "primary",
}: ProgressWidgetProps) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>{label}</span>
          <span className="font-semibold text-navy">{boundedValue}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-soft-bg ring-1 ring-card-border/70">
        <div
          className={cn("h-full rounded-full", barStyles[tone])}
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
}
