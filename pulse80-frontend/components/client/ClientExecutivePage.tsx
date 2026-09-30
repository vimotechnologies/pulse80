"use client";

import {
  DataListPage,
  ProgressCell,
  RecordIdentity,
  StatusCell,
  listField,
  type DataColumn,
} from "@/components/portal/DataListPage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Activity, BarChart3, ClipboardCheck, FileText, HeartPulse, UsersRound } from "@/components/icons/IconsaxIcons";
import {
  clientPageConfigs,
  type ClientMetric,
  type ClientPageConfig,
  type ClientRecord,
} from "@/data/client-portal-ui";
import type { ClientAnalytics } from "@/app/actions/analytics";
import type { ClientDashboardStats } from "@/app/actions/client-dashboard";
import { analyticsUiState, formatCount, formatPercentage, percentage } from "@/lib/analytics/presentation";

type ClientExecutivePageProps = {
  configId: ClientPageConfig["id"];
  analytics?: ClientAnalytics;
  analyticsError?: string;
  stats?: ClientDashboardStats;
};

export function ClientExecutivePage({ configId, analytics, analyticsError, stats }: ClientExecutivePageProps) {
  const config = clientPageConfigs[configId];
  const metrics = analytics ? analyticsMetrics(analytics) : stats ? legacyDashboardMetrics(config.metrics, stats) : [];
  const state = analyticsUiState(analytics, analyticsError);

  return (
    <div className="space-y-4">
      {state === "error" ? <AnalyticsMessage tone="error" message={analyticsError!} /> : null}
      {state === "empty" ? <AnalyticsMessage tone="empty" message="No analytics data matches the selected filters." /> : null}
      <DataListPage
        config={config}
        metrics={metrics}
        columns={clientColumns(config.id)}
        detailEyebrow={`${config.eyebrow} details`}
        featuredTitle="Featured latest report"
        onCycleStatus={(record) => cycleClientStatus(config.id, record)}
      />
    </div>
  );
}

function analyticsMetrics(analytics: ClientAnalytics): ClientMetric[] {
  const highRisk = analytics.riskMetrics.find((item) => item.category === "High");
  const referralRate = percentage(analytics.referrals.created, analytics.referrals.total);
  const followUpRate = percentage(analytics.followUps.completed, analytics.followUps.total);
  return [
    { label: "Participants Screened", value: formatCount(analytics.participantsScreened), detail: "Unique completed-screening participants", tone: "primary", icon: UsersRound },
    { label: "Screening Participation", value: formatPercentage(analytics.screeningParticipationRate), detail: "Eligible, registered participants screened", tone: "primary", icon: ClipboardCheck },
    { label: "Screening Completion", value: formatPercentage(analytics.screeningCompletionRate), detail: "Required screenings completed", tone: "success", icon: Activity },
    { label: "Pending Corrections", value: formatCount(analytics.pendingCorrections), detail: "Screenings requiring correction", tone: analytics.pendingCorrections ? "warning" : "success", icon: FileText },
    { label: "High Risk", value: formatCount(highRisk?.participantCount ?? 0), detail: highRisk ? `${formatPercentage(highRisk.percentage ?? 0)} of screened participants` : "No high-risk participants", tone: "danger", icon: HeartPulse },
    { label: "Referral Creation", value: formatPercentage(referralRate), detail: `${formatCount(analytics.referrals.created)} of ${formatCount(analytics.referrals.total)} required referrals created`, tone: analytics.referrals.missing ? "warning" : "success", icon: BarChart3 },
    { label: "Follow-up Completion", value: formatPercentage(followUpRate), detail: `${formatCount(analytics.followUps.completed)} of ${formatCount(analytics.followUps.total)} referrals followed up`, tone: "primary", icon: Activity },
  ];
}

function legacyDashboardMetrics(metrics: ClientMetric[], stats: ClientDashboardStats) {
  return metrics.map((metric) => {
    if (metric.label === "Workforce Wellness Score") return { ...metric, value: String(Math.max(0, 100 - stats.wellnessRiskScore)) };
    if (metric.label === "Absenteeism Risk") return { ...metric, value: stats.wellnessRisk };
    if (metric.label === "Screening Participation") return { ...metric, value: formatPercentage(stats.screeningParticipation) };
    if (metric.label === "Employees Screened") return { ...metric, value: formatCount(stats.completedScreenings) };
    if (metric.label === "Next Action") return { ...metric, value: stats.upcomingActivations > 0 ? "Upcoming activation" : "Review insights" };
    return metric;
  });
}

function AnalyticsMessage({ tone, message }: { tone: "error" | "empty"; message: string }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${tone === "error" ? "border-danger/25 bg-danger/10 text-danger" : "border-card-border bg-surface text-subtle"}`}>{message}</div>;
}

function clientColumns(configId: ClientPageConfig["id"]): DataColumn<ClientRecord>[] {
  if (configId === "reports") {
    return [
      identityColumn("Report"),
      textColumn("Type", (record) => listField(record, "Type") || record.filters.type),
      textColumn("Period", (record) => listField(record, "Period") || record.filters.period),
      textColumn("Published Date", (record) => publishedDate(record)),
      statusColumn(),
    ];
  }

  if (configId === "activations") {
    return [
      identityColumn("Activation"),
      textColumn("Organization", () => "Your organization"),
      textColumn("Date", (record) => record.subtitle.split(" · ")[1] || "Upcoming"),
      textColumn("Location", (record) => record.subtitle.split(" · ")[2] || "Site"),
      textColumn("Services", (record) => listField(record, "Services")),
      statusColumn(),
      progressColumn("Progress"),
    ];
  }

  if (configId === "recommendations") {
    return [
      identityColumn("Recommendation"),
      badgeColumn("Priority", (record) => listField(record, "Priority") || record.filters.priority),
      textColumn("Business Impact", (record) => listField(record, "Impact")),
      textColumn("Timing", (record) => listField(record, "Timing")),
      statusColumn(),
      progressColumn("Progress"),
    ];
  }

  return [
    identityColumn("Item"),
    textColumn("Type", (record) => Object.values(record.filters)[0] ?? "Overview"),
    textColumn("Metric", (record) => record.fields[0]?.value ?? "Tracked"),
    statusColumn(),
    progressColumn("Progress"),
  ];
}

function identityColumn(label: string): DataColumn<ClientRecord> {
  return {
    key: "title",
    label,
    render: (record) => <RecordIdentity record={record} />,
    sortValue: (record) => record.title,
  };
}

function textColumn(label: string, value: (record: ClientRecord) => string): DataColumn<ClientRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    render: (record) => <span className="font-medium text-navy">{value(record) || "Not set"}</span>,
    sortValue: value,
  };
}

function badgeColumn(label: string, value: (record: ClientRecord) => string): DataColumn<ClientRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    render: (record) => {
      const badgeValue = value(record) || "Medium";
      const tone = badgeValue.toLowerCase().includes("high")
        ? "danger"
        : badgeValue.toLowerCase().includes("medium")
          ? "warning"
          : badgeValue.toLowerCase().includes("low")
            ? "success"
            : "info";
      return <StatusBadge status={badgeValue} tone={tone} />;
    },
    sortValue: value,
  };
}

function statusColumn(label = "Status"): DataColumn<ClientRecord> {
  return {
    key: "status",
    label,
    render: (record) => <StatusCell record={record} />,
    sortValue: (record) => record.status,
  };
}

function progressColumn(label: string): DataColumn<ClientRecord> {
  return {
    key: "progress",
    label,
    render: (record) => <ProgressCell record={record} />,
    sortValue: (record) => record.progress ?? 0,
  };
}

function publishedDate(record: ClientRecord) {
  if (record.status === "Published") return record.subtitle.split(" · ")[0] || "Published";
  return "Pending";
}

function cycleClientStatus(configId: ClientPageConfig["id"], record: ClientRecord): Partial<ClientRecord> {
  if (configId === "recommendations") {
    const nextStatus = record.status === "Completed" ? "Recommended" : record.status === "Planned" ? "Completed" : "Planned";
    return {
      status: nextStatus,
      statusTone: nextStatus === "Completed" ? "success" : nextStatus === "Planned" ? "info" : "warning",
      filters: { ...record.filters, status: nextStatus },
      progress: nextStatus === "Completed" ? 100 : nextStatus === "Planned" ? 64 : 36,
    };
  }

  return {};
}
