import { CalendarDays, ChevronDown, Clock, FileText, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { WellnessOverviewChart } from "@/components/dashboard/WellnessOverviewChart";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  adminAlerts,
  adminMetrics,
  platformInsights,
  practitionerNetwork,
  recentReports,
  todaysActivations,
  wellnessOverview,
} from "@/data/admin-dashboard";

function activationTone(status: string) {
  if (status === "at-risk") return "danger" as const;
  if (status === "in-progress") return "info" as const;
  return "neutral" as const;
}

function alertTone(severity: string) {
  if (severity === "critical") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  if (severity === "success") return "success" as const;
  return "info" as const;
}

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-soft-bg">
      <AppSidebar />
      <TopNav />
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">
        <PageHeader
          eyebrow="Admin Operations"
          title="Good morning, Refiloe"
          description="Monitor activations, practitioner readiness, published reports, and workforce wellness intelligence from one operations view."
          actions={
            <button className="flex h-11 items-center gap-2 rounded-lg border border-card-border bg-surface px-4 text-sm font-semibold text-navy shadow-sm">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Last 30 days
              <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
            </button>
          }
        />

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {adminMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          <DashboardCard>
            <SectionHeader
              title="Wellness overview"
              description="Screenings, engagement, and risk flag patterns across active organizations."
              action={<StatusBadge status="Live data preview" tone="info" />}
            />
            <WellnessOverviewChart data={wellnessOverview} />
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              title="Today's activations"
              description="Operational readiness for scheduled onsite work."
            />
            <div className="divide-y divide-card-border">
              {todaysActivations.map((activation) => (
                <div key={`${activation.organization}-${activation.time}`} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-navy">
                        {activation.organization}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{activation.type}</p>
                    </div>
                    <StatusBadge
                      status={activation.status}
                      tone={activationTone(activation.status)}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                      {activation.time}
                    </span>
                    <span>{activation.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <DashboardCard>
            <SectionHeader
              title="Practitioner network"
              description="Coverage and credentialing snapshot."
            />
            <div className="grid gap-3 p-5">
              {practitionerNetwork.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-card-border bg-soft-bg p-4"
                >
                  <span className="text-sm font-medium text-subtle">{item.label}</span>
                  <span className="text-2xl font-semibold text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              title="Alerts and notifications"
              description="Signals that may need operations review."
            />
            <div className="space-y-3 p-5">
              {adminAlerts.map((alert) => (
                <div key={alert.title} className="rounded-lg border border-card-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-navy">{alert.title}</h3>
                    <StatusBadge status={alert.severity} tone={alertTone(alert.severity)} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{alert.detail}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader title="Recent reports" description="Latest client-facing outputs." />
            <div className="divide-y divide-card-border">
              {recentReports.map((report) => (
                <div key={report.title} className="flex items-start gap-3 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-navy">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {report.organization} · {report.date}
                    </p>
                  </div>
                  <StatusBadge
                    status={report.status}
                    tone={report.status === "published" ? "success" : "neutral"}
                  />
                </div>
              ))}
            </div>
          </DashboardCard>
        </section>

        <DashboardCard className="mt-5">
          <SectionHeader
            title="Platform insights"
            description="Dummy intelligence prompts for the future analytics layer."
          />
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {platformInsights.map((insight) => (
              <div key={insight} className="rounded-lg border border-card-border bg-soft-bg p-4">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm leading-6 text-subtle">{insight}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </main>
    </div>
  );
}
