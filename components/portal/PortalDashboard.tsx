import type { PortalConfig, PortalDashboardData } from "@/data/portal-phase-two";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardSection } from "@/components/portal/DashboardSection";
import { DrillDownCard } from "@/components/portal/DrillDownCard";
import { FilterTabs } from "@/components/portal/FilterTabs";
import { InsightCard } from "@/components/portal/InsightCard";
import { MetricWidget } from "@/components/portal/MetricWidget";
import { RiskCard } from "@/components/portal/RiskCard";

type PortalDashboardProps = {
  config: PortalConfig;
  data: PortalDashboardData;
};

export function PortalDashboard({ config, data }: PortalDashboardProps) {
  const riskInsights = data.insights.filter((insight) => insight.tone === "danger");
  const calmerInsights = data.insights.filter((insight) => insight.tone !== "danger");

  return (
    <div className="space-y-7">
      <PortalPageHeader
        eyebrow={config.eyebrow}
        title={config.dashboardTitle}
        description={config.dashboardDescription}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <FilterTabs tabs={["Overview", "Risks", "Reports", "Activity"]} />
            <ActionButton variant="secondary">Export view</ActionButton>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {data.metrics.map((metric) => (
          <MetricWidget key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {data.sections.map((section) => (
          <DashboardSection
            key={section.title}
            title={section.title}
            description={section.description}
          >
            {section.items.map((item) => (
              <DrillDownCard
                key={`${section.title}-${item.title}`}
                item={item}
              />
            ))}
          </DashboardSection>
        ))}
      </section>

      <DashboardSection
        title={data.insightsTitle}
        description={data.insightsDescription}
      >
        <div className="grid gap-4 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3">
            {riskInsights.length > 0 ? (
              riskInsights.map((insight) => (
                <RiskCard
                  key={insight.title}
                  title={insight.title}
                  detail={insight.detail}
                  level="high-risk"
                />
              ))
            ) : (
              <RiskCard
                title="No critical risk flags"
                detail="No high-risk operational or wellness signals are active in this view."
                level="low-risk"
              />
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {calmerInsights.map((insight) => (
              <InsightCard key={insight.title} {...insight} />
            ))}
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
