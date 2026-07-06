import type { PortalConfig, PortalDashboardData, Tone } from "@/data/portal-phase-two";
import { PortalContentCard } from "@/components/portal/PortalContentCard";
import { PortalMetricCard } from "@/components/portal/PortalMetricCard";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";

type PortalDashboardProps = {
  config: PortalConfig;
  data: PortalDashboardData;
};

const insightToneStyles: Record<Tone, string> = {
  primary: "border-primary/20 bg-primary/5",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/25 bg-warning/5",
  danger: "border-pulse-red/20 bg-pulse-red/5",
  neutral: "border-card-border bg-soft-bg",
};

export function PortalDashboard({ config, data }: PortalDashboardProps) {
  return (
    <div className="space-y-7">
      <PortalPageHeader
        eyebrow={config.eyebrow}
        title={config.dashboardTitle}
        description={config.dashboardDescription}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.metrics.map((metric) => (
          <PortalMetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {data.sections.map((section) => (
          <PortalContentCard
            key={section.title}
            title={section.title}
            description={section.description}
            bodyClassName="divide-y divide-card-border p-0"
          >
            {section.items.map((item) => (
              <div
                key={`${section.title}-${item.title}`}
                className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <h3 className="text-sm font-semibold text-navy">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.meta}</p>
                </div>
                <StatusBadge status={item.status} tone={item.tone} />
              </div>
            ))}
          </PortalContentCard>
        ))}
      </section>

      <PortalContentCard
        title={data.insightsTitle}
        description={data.insightsDescription}
        bodyClassName="grid gap-4 md:grid-cols-3"
      >
        {data.insights.map((insight) => (
          <div
            key={insight.title}
            className={cn(
              "rounded-lg border p-4",
              insightToneStyles[insight.tone],
            )}
          >
            <h3 className="text-sm font-semibold text-navy">{insight.title}</h3>
            <p className="mt-2 text-sm leading-6 text-subtle">{insight.detail}</p>
          </div>
        ))}
      </PortalContentCard>
    </div>
  );
}
