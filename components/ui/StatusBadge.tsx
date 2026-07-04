import { cn } from "@/lib/utils/cn";

type StatusBadgeProps = {
  status: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
};

const toneStyles = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
  info: "border-primary/25 bg-primary/10 text-primary",
  neutral: "border-card-border bg-surface text-muted",
};

export function StatusBadge({ status, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold capitalize",
        toneStyles[tone],
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}
