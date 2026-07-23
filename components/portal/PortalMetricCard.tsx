import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { MetricCardShell } from "@/components/ui/MetricCardShell";

type PortalMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: IconsaxIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
};

export function PortalMetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: PortalMetricCardProps) {
  return (
    <MetricCardShell label={label} value={value} detail={detail} icon={Icon} />
  );
}
