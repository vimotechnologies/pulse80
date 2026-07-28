import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import type { Tone } from "@/data/portal-phase-two";
import { ProgressWidget } from "@/components/portal/ProgressWidget";
import { UnifiedMetricCard } from "@/components/ui/UnifiedMetricCard";

type MetricWidgetProps = {
  label: string;
  value: string;
  detail: string;
  icon: IconsaxIcon;
  tone?: Tone;
  progress?: number;
  actionLabel?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
    tone: "success" | "danger";
  };
};

export function MetricWidget({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
  progress,
  trend,
}: MetricWidgetProps) {
  return (
    <UnifiedMetricCard
      label={label}
      value={value}
      detail={detail}
      icon={Icon}
      trend={trend ? { direction: trend.direction, value: trend.value } : undefined}
      footer={typeof progress === "number" ? <ProgressWidget value={progress} tone={tone} /> : undefined}
    />
  );
}
