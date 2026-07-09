import type { PortalConfig, PortalDashboardData } from "@/data/portal-phase-two";
import { Bell, MessageQuestion, Search } from "@/components/icons/IconsaxIcons";
import { DashboardSection } from "@/components/portal/DashboardSection";
import { DrillDownCard } from "@/components/portal/DrillDownCard";
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
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[var(--pulse-tracking-heading)] text-navy">
            Dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-subtle">
            Overview of wellness operations and client activity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <span className="sr-only">Search dashboard</span>
            <input
              type="search"
              placeholder="Search dashboard"
              className="h-10 w-full min-w-0 rounded-xl border border-card-border bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-72"
            />
          </label>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-card-border bg-white text-muted transition hover:border-primary/20 hover:bg-soft-bg hover:text-navy"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-pulse-red" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-card-border bg-white text-muted transition hover:border-primary/20 hover:bg-soft-bg hover:text-navy"
            aria-label="Help"
          >
            <MessageQuestion className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/15">
            {config.userLabel
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
