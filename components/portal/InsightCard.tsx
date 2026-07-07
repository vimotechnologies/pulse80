import type { Tone } from "@/data/portal-phase-two";
import { cn } from "@/lib/utils/cn";

type InsightCardProps = {
  title: string;
  detail: string;
  tone?: Tone;
};

const insightToneStyles: Record<Tone, string> = {
  primary: "border-primary/20 bg-primary/5",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/25 bg-warning/5",
  danger: "border-pulse-red/20 bg-pulse-red/5",
  neutral: "border-card-border bg-soft-bg",
};

export function InsightCard({ title, detail, tone = "primary" }: InsightCardProps) {
  return (
    <details
      className={cn(
        "group rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(7,22,51,0.07)]",
        insightToneStyles[tone],
      )}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          <span className="text-xs font-semibold text-primary group-open:hidden">
            Expand
          </span>
          <span className="hidden text-xs font-semibold text-muted group-open:inline">
            Hide
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-subtle">{detail}</p>
      </summary>
      <div className="mt-3 rounded-lg border border-card-border/70 bg-white/70 p-3 text-xs leading-5 text-muted">
        Suggested next step: review the underlying cohort, compare against the
        previous reporting period, and assign an owner before the next activation.
      </div>
    </details>
  );
}
