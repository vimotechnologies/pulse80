"use client";

import {
  DataListPage,
  ProgressCell,
  RecordIdentity,
  StatusCell,
  listDetail,
  listField,
  type DataColumn,
} from "@/components/portal/DataListPage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminPageConfigs, type AdminMetric, type AdminPageConfig, type AdminRecord } from "@/data/admin-portal-ui";
import type { AdminPortalAnalytics } from "@/app/actions/admin-dashboard";

type AdminOperationsPageProps = {
  configId: AdminPageConfig["id"];
  analytics?: AdminPortalAnalytics;
};

export function AdminOperationsPage({ configId, analytics }: AdminOperationsPageProps) {
  const baseConfig = adminPageConfigs[configId];
  const hasAnalytics = Boolean(analytics && (configId === "reports" || configId === "insights"));
  const config = hasAnalytics
    ? {
        ...baseConfig,
        primaryAction: configId === "reports" ? "Download reports summary" : "Download insights summary",
        secondaryAction: undefined,
        records: [],
        filters: [],
        metrics: buildAdminMetrics(configId as "reports" | "insights", analytics!, baseConfig.metrics),
        emptyTitle: "No report records are available",
        emptyDescription: "The metrics above are calculated from current production analytics. Saved reports are managed in the report library.",
      }
    : {
        ...baseConfig,
        description: `${baseConfig.description} Live data is not connected for this workflow.`,
        primaryAction: "",
        secondaryAction: undefined,
        metrics: [],
        records: [],
        filters: [],
        emptyTitle: "No live data available",
        emptyDescription: "This workflow has no connected backend data yet. Demo records and metrics are hidden.",
      };

  return (
    <DataListPage
      config={config}
      columns={adminColumns(config.id)}
      detailEyebrow={`${config.eyebrow} details`}
      readOnly
      onCycleStatus={undefined}
      onRoleChange={undefined}
      enableBulkActions={false}
      rowActions={{ edit: false, archive: false, download: false, cycleStatus: false }}
    />
  );
}

function buildAdminMetrics(
  configId: "reports" | "insights",
  analytics: AdminPortalAnalytics,
  source: AdminMetric[],
): AdminMetric[] {
  const number = new Intl.NumberFormat("en-BW");
  const metric = (index: number, label: string, value: string, detail: string): AdminMetric => ({
    ...source[index],
    label,
    value,
    detail,
  });

  if (configId === "reports") {
    return [
      metric(0, "Participants screened", number.format(analytics.participantsScreened), "Unique participants with completed screenings"),
      metric(1, "Completed screenings", number.format(analytics.completedScreenings), "Completed screening records"),
      metric(2, "Screening participation", analytics.screeningParticipationRate === null ? "Not available" : `${analytics.screeningParticipationRate.toFixed(2)}%`, `${number.format(analytics.participantsScreened)} of ${number.format(analytics.eligibleParticipants)} eligible participants`),
      metric(3, "Screening completion", analytics.screeningCompletionRate === null ? "Not available" : `${analytics.screeningCompletionRate.toFixed(2)}%`, `${number.format(analytics.completedRequiredScreenings)} of ${number.format(analytics.expectedRequiredScreenings)} required screenings`),
      metric(0, "Missing referrals", number.format(analytics.missingReferralCount), `Of ${number.format(analytics.requiredReferralCount)} referral-required screenings`),
    ];
  }

  return [
    ...analytics.riskDistribution.map((entry, index) =>
      metric(index, entry.riskCategory === "Not Calculated" ? "Risk not calculated" : `${entry.riskCategory} risk`, number.format(entry.participantCount), `${entry.riskCategory} risk participants`)),
    metric(0, "Referrals required", number.format(analytics.requiredReferralCount), "Completed screenings requiring referral"),
    metric(1, "Referrals followed up", number.format(analytics.followedUpReferralCount), `Followed up of ${number.format(analytics.followUpCount)} referrals`),
  ];
}

function adminColumns(configId: AdminPageConfig["id"]): DataColumn<AdminRecord>[] {
  if (configId === "organizations") {
    return [
      identityColumn("Organization"),
      textColumn("Industry", (record) => record.filters.industry),
      textColumn("Employees", (record) => listField(record, "Employees")),
      textColumn("Wellness Score", (record) => listField(record, "Wellness score")),
      badgeColumn("Risk Level", (record) => listField(record, "Risk level")),
      textColumn("Package", (record) => listDetail(record, "Active package")),
      textColumn("Last Activation", (record) => listDetail(record, "Last activation")),
      statusColumn(),
    ];
  }

  if (configId === "activations") {
    return [
      identityColumn("Activation"),
      textColumn("Organization", (record) => record.subtitle.split(" · ")[0] ?? record.filters.organization),
      textColumn("Date", (record) => record.subtitle.split(" · ")[1] ?? "Scheduled"),
      textColumn("Services", (record) => listDetail(record, "Services") || listField(record, "Services")),
      textColumn("Practitioners", (record) => listField(record, "Practitioners")),
      textColumn("Expected Employees", (record) => listField(record, "Expected")),
      statusColumn(),
      progressColumn("Progress"),
    ];
  }

  if (configId === "practitioners") {
    return [
      identityColumn("Practitioner"),
      textColumn("Profession", (record) => record.filters.profession),
      textColumn("Location", (record) => record.filters.location),
      textColumn("Services", (record) => listDetail(record, "Services")),
      statusColumn("Verification"),
      textColumn("Availability", (record) => listField(record, "Availability") || record.filters.availability),
      textColumn("Assignments", (record) => listField(record, "Completed")),
    ];
  }

  if (configId === "screenings" || configId === "results") {
    return [
      identityColumn("Employee Reference"),
      textColumn("Organization", (record) => record.filters.organization),
      textColumn("Activation", (record) => listField(record, "Activation") || record.subtitle.split(" · ")[0] || "Activation"),
      textColumn("Department", (record) => record.filters.department),
      badgeColumn("Risk Level", (record) => listField(record, "Risk level") || record.filters.risk),
      textColumn("Referral Required", (record) => (record.filters.risk === "High" ? "Yes" : "No")),
      textColumn("Captured By", (record) => listField(record, "Reviewer") || listDetail(record, "Reviewer") || "Clinical QA"),
      textColumn("Date", (record) => listField(record, "Date") || "Jul 2026"),
    ];
  }

  if (configId === "reports") {
    return [
      identityColumn("Report"),
      textColumn("Organization", (record) => record.filters.organization),
      textColumn("Type", (record) => listField(record, "Type") || record.filters.type),
      textColumn("Period", (record) => listField(record, "Period") || "Q3 2026"),
      statusColumn(),
      textColumn("Published Date", (record) => listDetail(record, "Last updated") || record.meta.split(" · ")[0]),
    ];
  }

  if (configId === "recommendations") {
    return [
      identityColumn("Recommendation"),
      textColumn("Organization", (record) => record.filters.organization),
      badgeColumn("Priority", (record) => listField(record, "Priority") || record.filters.risk),
      textColumn("Owner", (record) => listField(record, "Owner")),
      textColumn("Impact", (record) => listField(record, "Impact")),
      statusColumn(),
      progressColumn("Progress"),
    ];
  }

  if (configId === "billing") {
    return [
      identityColumn("Invoice"),
      textColumn("Organization", (record) => record.subtitle.split(" · ")[0]),
      textColumn("Package", (record) => listField(record, "Package") || record.filters.package),
      textColumn("Amount", (record) => listField(record, "Amount")),
      textColumn("Due Date", (record) => listField(record, "Due") || listField(record, "Paid")),
      statusColumn(),
    ];
  }

  if (configId === "users") {
    return [
      identityColumn("User"),
      textColumn("Role", (record) => listField(record, "Role") || record.filters.role),
      textColumn("Organization/Practitioner", (record) => listField(record, "Scope") || "Pulse80"),
      statusColumn(),
      textColumn("Last Active", (record) => listField(record, "Last seen")),
    ];
  }

  return [
    identityColumn("Record"),
    textColumn("Area", (record) => Object.values(record.filters)[0] ?? "General"),
    textColumn("Owner", (record) => listField(record, "Owner") || listField(record, "Scope") || "Pulse80"),
    statusColumn(),
    progressColumn("Readiness"),
  ];
}

function identityColumn(label: string): DataColumn<AdminRecord> {
  return {
    key: "title",
    label,
    render: (record) => <RecordIdentity record={record} />,
    sortValue: (record) => record.title,
  };
}

function textColumn(label: string, value: (record: AdminRecord) => string): DataColumn<AdminRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    render: (record) => <span className="font-medium text-navy">{value(record) || "Not set"}</span>,
    sortValue: value,
  };
}

function badgeColumn(label: string, value: (record: AdminRecord) => string): DataColumn<AdminRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    render: (record) => {
      const badgeValue = value(record) || "Neutral";
      const tone = badgeValue.toLowerCase().includes("high")
        ? "danger"
        : badgeValue.toLowerCase().includes("medium")
          ? "warning"
          : badgeValue.toLowerCase().includes("low")
            ? "success"
            : "neutral";
      return <StatusBadge status={badgeValue} tone={tone} />;
    },
    sortValue: value,
  };
}

function statusColumn(label = "Status"): DataColumn<AdminRecord> {
  return {
    key: "status",
    label,
    render: (record) => <StatusCell record={record} />,
    sortValue: (record) => record.status,
  };
}

function progressColumn(label: string): DataColumn<AdminRecord> {
  return {
    key: "progress",
    label,
    render: (record) => <ProgressCell record={record} />,
    sortValue: (record) => record.progress ?? 0,
  };
}
