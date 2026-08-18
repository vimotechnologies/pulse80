import type { MetricCardData } from "@/types/dashboard";
import { UnifiedMetricCard } from "@/components/ui/UnifiedMetricCard";

type MetricCardProps = {
  metric: MetricCardData;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <UnifiedMetricCard
      label={metric.label}
      value={metric.value}
      detail=""
      icon={metric.icon}
      trend={{ direction: metric.trend, value: metric.change }}
    />
  );
}
