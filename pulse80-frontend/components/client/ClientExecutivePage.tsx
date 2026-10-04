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
import {
  Activity,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  FileText,
  HeartPulse,
  UsersRound,
} from "@/components/icons/IconsaxIcons";
import {
  clientPageConfigs,
  type ClientMetric,
  type ClientPageConfig,
  type ClientRecord,
} from "@/data/client-portal-ui";
import type { ClientDashboardStats } from "@/app/actions/client-dashboard";
import type { Activation } from "@/types/programme";

type ClientExecutivePageProps = {
  configId: ClientPageConfig["id"];
  stats?: ClientDashboardStats;
  activations?: Activation[];
};

export function ClientExecutivePage({ configId, stats, activations }: ClientExecutivePageProps) {
  const baseConfig = clientPageConfigs[configId];
  const usesAnalytics = Boolean(stats && ["dashboard", "reports", "insights"].includes(configId));
  const usesActivations = Boolean(activations && configId === "activations");
  const unavailableRecommendations = configId === "recommendations";
  const config = usesAnalytics || usesActivations || unavailableRecommendations
    ? {
        ...baseConfig,
        primaryAction: configId === "reports"
          ? "Download report summary"
          : configId === "insights"
            ? "Download insights summary"
            : configId === "activations"
              ? "Download activation summary"
              : "",
        description: unavailableRecommendations
          ? "Recommendations will appear here when connected to an approved data source."
          : baseConfig.description,
        metrics: unavailableRecommendations ? [] : baseConfig.metrics,
        filters: usesActivations
          ? baseConfig.filters.map((filter) => filter.key === "status"
            ? { ...filter, options: ["All", ...new Set((activations ?? []).map((item) => item.status))] }
            : filter)
          : [],
        records: usesActivations ? buildActivationRecords(activations ?? []) : [],
        featured: undefined,
        emptyTitle: unavailableRecommendations ? "No live recommendations available" : baseConfig.emptyTitle,
        emptyDescription: unavailableRecommendations
          ? "No recommendation records are connected. Demo content is hidden."
          : baseConfig.emptyDescription,
      }
    : { ...baseConfig, records: [], metrics: [], filters: [], primaryAction: "", secondaryAction: undefined, featured: undefined };
  const metrics = usesActivations
    ? buildActivationMetrics(activations ?? [], baseConfig.metrics)
    : usesAnalytics
      ? buildAnalyticsMetrics(configId, stats!)
      : config.metrics;

  return (
    <DataListPage
      config={config}
      metrics={metrics}
      columns={clientColumns(config.id)}
      detailEyebrow={`${config.eyebrow} details`}
      featuredTitle="Featured latest report"
      readOnly={usesAnalytics || usesActivations || unavailableRecommendations}
      allowExport={usesActivations}
      rowActions={{ edit: false, archive: false, download: false, cycleStatus: false }}
      onCycleStatus={usesAnalytics || usesActivations || unavailableRecommendations
        ? undefined
        : (record) => cycleClientStatus(config.id, record)}
    />
  );
}

function buildActivationMetrics(activations: Activation[], source: ClientMetric[]): ClientMetric[] {
  const now = Date.now();
  const upcoming = activations.filter((item) =>
    new Date(item.startsAt).getTime() >= now && !["Completed", "Cancelled"].includes(item.status),
  ).length;
  const completed = activations.filter((item) => item.status === "Completed").length;
  const services = new Set(activations.flatMap((item) => item.serviceNames));
  const number = new Intl.NumberFormat("en-BW");

  return [
    { ...source[0], label: "Upcoming activations", value: number.format(upcoming), detail: "Scheduled or planned activations" },
    { ...source[1], label: "Completed activations", value: number.format(completed), detail: "Marked completed in the activation workflow" },
    { ...source[2], label: "Activation records", value: number.format(activations.length), detail: "Available to this organisation" },
    { ...source[3], label: "Services planned", value: number.format(services.size), detail: "Distinct services across activations" },
  ];
}

function buildActivationRecords(activations: Activation[]): ClientRecord[] {
  const dateFormatter = new Intl.DateTimeFormat("en-BW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Gaborone",
  });

  return activations.map((activation) => {
    const startsAt = new Date(activation.startsAt);
    const timing = startsAt.getTime() >= Date.now() ? "Upcoming" : "Past";
    const statusTone = activation.status === "Completed"
      ? "success"
      : activation.status === "Cancelled" || activation.status === "Action Required"
        ? "warning"
        : "info";

    return {
      id: activation.id,
      title: activation.title,
      subtitle: `${dateFormatter.format(startsAt)} · ${activation.location}`,
      meta: activation.description ?? activation.programmeName,
      status: activation.status,
      statusTone,
      search: [activation.title, activation.location, activation.programmeName, ...activation.serviceNames].join(" ").toLowerCase(),
      filters: { timing, status: activation.status },
      fields: [
        { label: "Date", value: dateFormatter.format(startsAt) },
        { label: "Location", value: activation.location },
        { label: "Expected participants", value: String(activation.expectedParticipants) },
        { label: "Services", value: activation.serviceNames.join(", ") },
        { label: "Practitioners", value: String(activation.practitionerCount) },
      ],
      details: [
        { label: "Programme", value: activation.programmeName },
        { label: "Readiness", value: `${activation.readinessScore}%` },
      ],
      progress: activation.readinessScore,
    };
  });
}

function buildAnalyticsMetrics(configId: ClientPageConfig["id"], stats: ClientDashboardStats): ClientMetric[] {
  const participation = stats.eligibleParticipants
    ? `${stats.screeningParticipation}%`
    : "Not available";
  const participationDetail = stats.eligibleParticipants
    ? `${stats.participantsScreened} of ${stats.eligibleParticipants} eligible participants screened`
    : "No eligible participants recorded";
  const completion = stats.expectedRequiredScreenings
    ? `${stats.screeningCompletionRate}%`
    : "Not available";
  const completionDetail = stats.expectedRequiredScreenings
    ? `${stats.completedRequiredScreenings} of ${stats.expectedRequiredScreenings} required screenings completed`
    : "No required screenings recorded";

  if (configId === "reports") {
    return [
      { label: "Participants screened", value: String(stats.participantsScreened), detail: "Unique participants with completed screenings", tone: "primary", icon: ClipboardCheck },
      { label: "Screening participation", value: participation, detail: participationDetail, tone: "primary", icon: ClipboardCheck },
      { label: "Completed screenings", value: String(stats.completedScreenings), detail: "Screenings approved as completed", tone: "success", icon: FileText },
      { label: "Screening completion", value: completion, detail: completionDetail, tone: "primary", icon: FileBarChart },
    ];
  }

  if (configId === "insights") {
    return [
      { label: "Workforce size", value: String(stats.workforceSize), detail: "Employees in this organisation", tone: "primary", icon: UsersRound },
      { label: "Wellness risk", value: stats.wellnessRisk, detail: `Risk score ${stats.wellnessRiskScore} of 100`, tone: "warning", icon: HeartPulse },
      { label: "Screening participation", value: participation, detail: participationDetail, tone: "primary", icon: ClipboardCheck },
      { label: "Upcoming activations", value: String(stats.upcomingActivations), detail: "Scheduled or planned", tone: "success", icon: CalendarCheck },
    ];
  }

  return [
    { label: "Workforce size", value: String(stats.workforceSize), detail: "Employees in this organisation", tone: "primary", icon: UsersRound },
    { label: "Wellness risk score", value: String(stats.wellnessRiskScore), detail: "Stored organisation risk score (0–100)", tone: "warning", icon: HeartPulse },
    { label: "Wellness risk", value: stats.wellnessRisk, detail: `Risk score ${stats.wellnessRiskScore} of 100`, tone: "warning", icon: Activity },
    { label: "Participants screened", value: String(stats.participantsScreened), detail: "Unique participants with completed screenings", tone: "primary", icon: ClipboardCheck },
    { label: "Screening participation", value: participation, detail: participationDetail, tone: "primary", icon: ClipboardCheck },
    { label: "Screening completion", value: completion, detail: completionDetail, tone: "primary", icon: FileBarChart },
    { label: "Completed screenings", value: String(stats.completedScreenings), detail: "Screenings approved as completed", tone: "success", icon: FileText },
    { label: "Upcoming activations", value: String(stats.upcomingActivations), detail: "Scheduled or planned", tone: "success", icon: CalendarCheck },
  ];
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
      textColumn("Date", (record) => listField(record, "Date")),
      textColumn("Location", (record) => listField(record, "Location")),
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
