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
import { clientPageConfigs, type ClientPageConfig, type ClientRecord } from "@/data/client-portal-ui";

type ClientExecutivePageProps = {
  configId: ClientPageConfig["id"];
};

export function ClientExecutivePage({ configId }: ClientExecutivePageProps) {
  const config = clientPageConfigs[configId];

  return (
    <DataListPage
      config={config}
      columns={clientColumns(config.id)}
      detailEyebrow={`${config.eyebrow} details`}
      featuredTitle="Featured latest report"
      onCycleStatus={(record) => cycleClientStatus(config.id, record)}
    />
  );
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
