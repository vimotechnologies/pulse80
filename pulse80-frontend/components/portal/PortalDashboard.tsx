import { MetricCardGroup } from "@/components/ui/MetricCardGroup";
import type { PortalConfig, PortalDashboardData } from "@/data/portal-phase-two";
import { MetricWidget } from "@/components/portal/MetricWidget";

type PortalDashboardProps = {
  config: PortalConfig;
  data: Pick<PortalDashboardData, "metrics">;
};

export function PortalDashboard({ data }: PortalDashboardProps) {
  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[var(--pulse-tracking-heading)] text-navy">
            Dashboard
          </h1>
          <p className="mt-2 text-[12px] leading-5 text-subtle">
            Overview of wellness operations and client activity
          </p>
        </div>
      </header>

      <MetricCardGroup>
        {data.metrics.map((metric) => (
          <MetricWidget key={metric.label} {...metric} />
        ))}
      </MetricCardGroup>
    </div>
  );
}
