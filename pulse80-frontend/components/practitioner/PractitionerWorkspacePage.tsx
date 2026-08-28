"use client";

import { useState } from "react";
import {
  DataListPage,
  ProgressCell,
  RecordIdentity,
  StatusCell,
  listField,
  type DataColumn,
} from "@/components/portal/DataListPage";
import { ActionButton } from "@/components/portal/ActionButton";
import { CalendarDays, Clock, CloseCircle, Location } from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  practitionerPageConfigs,
  type PractitionerPageConfig,
  type PractitionerRecord,
} from "@/data/practitioner-portal-ui";

type PractitionerWorkspacePageProps = {
  configId: PractitionerPageConfig["id"];
  records?: PractitionerRecord[];
};

export function PractitionerWorkspacePage({ configId, records }: PractitionerWorkspacePageProps) {
  const baseConfig = practitionerPageConfigs[configId];
  const config = records ? { ...baseConfig, records } : baseConfig;

  if (configId === "assignments") {
    return <AssignmentWorkspacePage config={config} />;
  }

  return (
    <DataListPage
      config={config}
      columns={practitionerColumns(config.id)}
      detailEyebrow={`${config.eyebrow} details`}
      onCycleStatus={(record) => cyclePractitionerStatus(config.id, record)}
    />
  );
}

function AssignmentWorkspacePage({ config }: { config: PractitionerPageConfig }) {
  const [selectedAssignment, setSelectedAssignment] = useState<PractitionerRecord | null>(null);

  return (
    <>
      <DataListPage
        config={config}
        columns={practitionerColumns("assignments")}
        detailEyebrow={`${config.eyebrow} details`}
        onCycleStatus={(record) => cyclePractitionerStatus("assignments", record)}
        rowActions={{ edit: false, archive: false, download: false, cycleStatus: false }}
        onRecordOpen={setSelectedAssignment}
        hideDefaultDetailModal
      />

      {selectedAssignment ? (
        <AssignmentDetailModal
          record={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      ) : null}
    </>
  );
}

function AssignmentDetailModal({ record, onClose }: { record: PractitionerRecord; onClose: () => void }) {
  const { date, time } = getAssignmentDateTime(record);
  const organisation = getAssignmentOrganisation(record);
  const programme = getAssignmentProgramme(record);
  const service = listDetailFromDetails(record, "Service") || "Not set";
  const location = record.filters.location || "Not set";
  const actionLabel = assignmentActionLabel(record.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close assignment details"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${record.title} assignment details`}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.16)]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">
                  Assignment details
                </p>
                <StatusBadge status={record.status} tone={record.statusTone} />
              </div>
              <h2 className="mt-2 text-xl font-semibold leading-7 text-navy">{record.title}</h2>
              <p className="mt-1 text-sm font-medium text-subtle">{organisation}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-card-border text-muted transition hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              aria-label="Close assignment details"
            >
              <CloseCircle className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 grid gap-3 rounded-xl border border-card-border bg-soft-bg p-4 sm:grid-cols-3">
            <AssignmentFact icon={CalendarDays} label="Date" value={date} />
            <AssignmentFact icon={Clock} label="Time" value={time} />
            <AssignmentFact icon={Location} label="Location" value={location} />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <AssignmentDetail label="Service" value={service} />
            <AssignmentDetail label="Programme" value={programme || "Not set"} />
          </div>

          <div className="mt-5 border-t border-card-border pt-5">
            <p className="text-xs font-semibold text-muted">Your assignment</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-navy">
              Complete the scheduled {service.toLowerCase()} for {organisation}.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-card-border bg-[#fbfcfe] px-5 py-4 sm:px-6">
          <ActionButton onClick={onClose}>{actionLabel}</ActionButton>
        </div>
      </section>
    </div>
  );
}

function AssignmentFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted">{label}</p>
        <p className="mt-1 text-sm font-semibold text-navy">{value}</p>
      </div>
    </div>
  );
}

function AssignmentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1.5 text-sm font-semibold leading-5 text-navy">{value}</p>
    </div>
  );
}

function assignmentActionLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("completed")) return "View summary";
  if (normalized.includes("progress")) return "Continue assignment";
  if (normalized.includes("confirmed")) return "Start assignment";
  return "Confirm assignment";
}

function practitionerColumns(configId: PractitionerPageConfig["id"]): DataColumn<PractitionerRecord>[] {
  if (configId === "assignments") {
    return [
      assignmentColumn(),
      textColumn("Organisation", getAssignmentOrganisation, "min-w-40"),
      assignmentProgrammeColumn(),
      assignmentDateTimeColumn(),
      assignmentLocationColumn(),
      statusColumn(),
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

function assignmentColumn(): DataColumn<PractitionerRecord> {
  return {
    key: "title",
    label: "Assignment",
    className: "min-w-60",
    render: (record) => (
      <div className="space-y-1">
        <p className="text-sm font-semibold leading-5 text-navy">{record.title}</p>
        <p className="text-xs leading-4 text-muted">{getAssignmentSecondaryText(record)}</p>
      </div>
    ),
    sortValue: (record) => record.title,
  };
}

function assignmentProgrammeColumn(): DataColumn<PractitionerRecord> {
  return {
    key: "programme",
    label: "Programme",
    className: "min-w-64 max-w-80",
    render: (record) => <p className="max-w-72 whitespace-normal text-sm font-medium leading-5 text-navy">{getAssignmentProgramme(record) || "Not set"}</p>,
    sortValue: getAssignmentProgramme,
  };
}

function assignmentDateTimeColumn(): DataColumn<PractitionerRecord> {
  return {
    key: "date-time",
    label: "Date & Time",
    className: "min-w-40",
    render: (record) => {
      const { date, time } = getAssignmentDateTime(record);
      return (
        <div className="space-y-1.5 text-navy">
          <span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />{date}</span>
          <span className="flex items-center gap-2 text-xs text-muted"><Clock className="h-4 w-4 shrink-0" aria-hidden="true" />{time}</span>
        </div>
      );
    },
    sortValue: (record) => `${getAssignmentDateTime(record).date} ${getAssignmentDateTime(record).time}`,
  };
}

function assignmentLocationColumn(): DataColumn<PractitionerRecord> {
  return {
    key: "location",
    label: "Location",
    className: "min-w-36",
    render: (record) => (
      <span className="flex items-center gap-2 text-sm font-medium text-navy">
        <Location className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        {record.filters.location || "Not set"}
      </span>
    ),
    sortValue: (record) => record.filters.location,
  };
}

function getAssignmentOrganisation(record: PractitionerRecord) {
  return listDetailFromDetails(record, "Organisation") || record.title.replace(/ wellness activation| screening day| follow-up clinic/g, "");
}

function getAssignmentSecondaryText(record: PractitionerRecord) {
  const team = record.fields.find((item) => item.label === "Team")?.value;
  const expected = record.fields.find((item) => item.label === "Expected")?.value;
  return [team ? `Team of ${team}` : "", expected ? `${expected} expected` : ""].filter(Boolean).join(" · ")
    || listDetailFromDetails(record, "Service")
    || record.id;
}

function getAssignmentProgramme(record: PractitionerRecord) {
  return listDetailFromDetails(record, "Programme") || listDetailFromMeta(record.meta);
}

function getAssignmentDateTime(record: PractitionerRecord) {
  const [date = "Date not set", time = "Time not set"] = record.subtitle.split(" · ");
  return { date, time };
}

function identityColumn(label: string): DataColumn<PractitionerRecord> {
  return {
    key: "title",
    label,
    render: (record) => <RecordIdentity record={record} />,
    sortValue: (record) => record.title,
  };
}

function textColumn(label: string, value: (record: PractitionerRecord) => string, className?: string): DataColumn<PractitionerRecord> {
  return {
    key: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    className,
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
