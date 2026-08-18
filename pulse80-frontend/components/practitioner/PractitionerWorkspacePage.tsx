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
  practitionerPageConfigs,
  type PractitionerPageConfig,
  type PractitionerRecord,
} from "@/data/practitioner-portal-ui";

type PractitionerWorkspacePageProps = {
  configId: PractitionerPageConfig["id"];
};

export function PractitionerWorkspacePage({ configId }: PractitionerWorkspacePageProps) {
  const config = practitionerPageConfigs[configId];

  return (
    <DataListPage
      config={config}
      columns={practitionerColumns(config.id)}
      detailEyebrow={`${config.eyebrow} details`}
      onCycleStatus={(record) => cyclePractitionerStatus(config.id, record)}
    />
  );
}

function practitionerColumns(configId: PractitionerPageConfig["id"]): DataColumn<PractitionerRecord>[] {
  if (configId === "assignments") {
    return [
      identityColumn("Assignment"),
      textColumn("Organization", (record) => record.title.replace(/ wellness activation| screening day| follow-up clinic/g, "")),
      textColumn("Date", (record) => record.subtitle.split(" · ")[0]),
      textColumn("Location", (record) => record.filters.location),
      textColumn("Services", (record) => listDetailFromMeta(record.meta) || listDetailFromDetails(record, "Services")),
      statusColumn(),
      progressColumn("Readiness"),
    ];
  }

  if (configId === "screenings") {
    return [
      identityColumn("Screening Batch"),
      textColumn("Activation", (record) => record.title),
      textColumn("Records", (record) => listField(record, "Records") || listField(record, "Captured")),
      textColumn("Incomplete", (record) => listField(record, "Incomplete")),
      badgeColumn("Risk", (record) => listField(record, "Risk") || record.filters.risk),
      statusColumn(),
      progressColumn("Submission"),
    ];
  }

  if (configId === "documents") {
    return [
      identityColumn("Document"),
      textColumn("Type", (record) => listField(record, "Type") || record.filters.type),
      textColumn("Expiry", (record) => listField(record, "Expires")),
      statusColumn(),
      progressColumn("Readiness"),
    ];
  }

  if (configId === "payments") {
    return [
      identityColumn("Payment"),
      textColumn("Organization", (record) => record.title.replace(/ activation payment| screening payment/g, "")),
      textColumn("Amount", (record) => listField(record, "Amount")),
      textColumn("Period", (record) => listField(record, "Period")),
      statusColumn(),
      progressColumn("Approval"),
    ];
  }

  return [
    identityColumn("Item"),
    textColumn("Area", (record) => Object.values(record.filters)[0] ?? "Workflow"),
    textColumn("Metric", (record) => record.fields[0]?.value ?? "Tracked"),
    statusColumn(),
    progressColumn("Progress"),
  ];
}

function identityColumn(label: string): DataColumn<PractitionerRecord> {
  return {
    key: "title",
    label,
    render: (record) => <RecordIdentity record={record} />,
    sortValue: (record) => record.title,
  };
}

function textColumn(label: string, value: (record: PractitionerRecord) => string): DataColumn<PractitionerRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    render: (record) => <span className="font-medium text-navy">{value(record) || "Not set"}</span>,
    sortValue: value,
  };
}

function badgeColumn(label: string, value: (record: PractitionerRecord) => string): DataColumn<PractitionerRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    render: (record) => {
      const badgeValue = value(record) || "Low";
      const tone = badgeValue.toLowerCase().includes("medium")
        ? "warning"
        : badgeValue.toLowerCase().includes("high")
          ? "danger"
          : "success";
      return <StatusBadge status={badgeValue} tone={tone} />;
    },
    sortValue: value,
  };
}

function statusColumn(label = "Status"): DataColumn<PractitionerRecord> {
  return {
    key: "status",
    label,
    render: (record) => <StatusCell record={record} />,
    sortValue: (record) => record.status,
  };
}

function progressColumn(label: string): DataColumn<PractitionerRecord> {
  return {
    key: "progress",
    label,
    render: (record) => <ProgressCell record={record} />,
    sortValue: (record) => record.progress ?? 0,
  };
}

function listDetailFromDetails(record: PractitionerRecord, label: string) {
  return record.details.find((detail) => detail.label === label)?.value ?? "";
}

function listDetailFromMeta(meta: string) {
  return meta.split(" · ")[0] ?? "";
}

function cyclePractitionerStatus(
  configId: PractitionerPageConfig["id"],
  record: PractitionerRecord,
): Partial<PractitionerRecord> {
  if (configId === "documents") {
    return {
      status: "Pending",
      statusTone: "warning",
      filters: { ...record.filters, status: "Pending" },
      progress: Math.max(record.progress ?? 0, 74),
    };
  }

  if (configId === "payments") {
    return {
      status: "Submitted",
      statusTone: "warning",
      filters: { ...record.filters, status: "Pending" },
      progress: Math.max(record.progress ?? 0, 74),
    };
  }

  return {
    status: "Confirmed",
    statusTone: "success",
    filters: { ...record.filters, status: "Confirmed" },
    progress: Math.max(record.progress ?? 0, 74),
  };
}
