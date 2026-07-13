import type { PortalConfig, PortalDashboardData } from "@/data/portal-phase-two";
import { DashboardSection } from "@/components/portal/DashboardSection";
import { DrillDownCard } from "@/components/portal/DrillDownCard";
import { InsightCard } from "@/components/portal/InsightCard";
import { MetricWidget } from "@/components/portal/MetricWidget";
import { RiskCard } from "@/components/portal/RiskCard";
import { RequestsPipelineCard } from "@/components/portal/RequestsPipelineCard";
import { WellnessDaysCard } from "@/components/portal/WellnessDaysCard";

type PortalDashboardProps = {
  config: PortalConfig;
  data: PortalDashboardData;
};

export function PortalDashboard({ data }: PortalDashboardProps) {
  const riskInsights = data.insights.filter((insight) => insight.tone === "danger");
  const calmerInsights = data.insights.filter((insight) => insight.tone !== "danger");

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[var(--pulse-tracking-heading)] text-navy">
            Dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-subtle">
            Overview of wellness operations and client activity
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricWidget key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="grid gap-5">
          <WellnessDaysCard />
        </div>
        <div className="grid gap-5">
          <RequestsPipelineCard />
          {data.sections.slice(1, 3).map((section) => (
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
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {data.sections.slice(3).map((section) => (
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
