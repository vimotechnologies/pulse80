import { StatusBadge } from "@/components/ui/StatusBadge";

type RiskCardProps = {
  title: string;
  detail: string;
  level: "high-risk" | "medium-risk" | "low-risk";
};

export function RiskCard({ title, detail, level }: RiskCardProps) {
  return (
    <div className="rounded-lg border border-card-border bg-soft-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        <StatusBadge status={level} tone={level} />
      </div>
      <p className="mt-2 text-sm leading-6 text-subtle">{detail}</p>
    </div>
  );
}
