import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { UnifiedMetricCard } from "@/components/ui/UnifiedMetricCard";

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
  icon,
}: PortalMetricCardProps) {
  return (
    <UnifiedMetricCard label={label} value={value} detail={detail} icon={icon} />
  );
}
