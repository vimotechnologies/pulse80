import { cn } from "@/lib/utils/cn";

type StatusBadgeProps = {
  status: string;
  tone?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "high-risk"
    | "medium-risk"
    | "low-risk"
    | "published"
    | "draft"
    | "pending"
    | "verified"
    | "in-progress"
    | "completed"
    | "error";
};

const toneStyles = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
  info: "border-primary/25 bg-primary/10 text-primary",
  neutral: "border-card-border bg-surface text-muted",
  "high-risk": "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
  "medium-risk": "border-warning/25 bg-warning/10 text-warning",
  "low-risk": "border-success/20 bg-success/10 text-success",
  published: "border-success/20 bg-success/10 text-success",
  draft: "border-card-border bg-soft-bg text-muted",
  pending: "border-warning/25 bg-warning/10 text-warning",
  verified: "border-success/20 bg-success/10 text-success",
  "in-progress": "border-primary/25 bg-primary/10 text-primary",
  completed: "border-success/20 bg-success/10 text-success",
  error: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
};

export function StatusBadge({ status, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold capitalize",
        toneStyles[tone],
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}
