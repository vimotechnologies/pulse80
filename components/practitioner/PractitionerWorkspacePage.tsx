"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { FormInput } from "@/components/portal/FormInput";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Eye, Search } from "@/components/icons/IconsaxIcons";
import {
  practitionerPageConfigs,
  type PractitionerPageConfig,
  type PractitionerRecord,
  type PractitionerTone,
} from "@/data/practitioner-portal-ui";
import { cn } from "@/lib/utils/cn";

type PractitionerWorkspacePageProps = {
  configId: PractitionerPageConfig["id"];
};

const toneStyles: Record<PractitionerTone, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
  neutral: "border-card-border bg-soft-bg text-muted",
};

export function PractitionerWorkspacePage({ configId }: PractitionerWorkspacePageProps) {
  const config = practitionerPageConfigs[configId];
  const [records, setRecords] = useState(config.records);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.filters.map((filter) => [filter.key, "All"])),
  );
  const [selected, setSelected] = useState<PractitionerRecord | null>(config.records[0] ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch = normalizedQuery
        ? `${record.title} ${record.subtitle} ${record.meta} ${record.search}`.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesFilters = config.filters.every((filter) => {
        const value = filters[filter.key] ?? "All";
        return value === "All" || record.filters[filter.key] === value;
      });
      return matchesSearch && matchesFilters;
    });
  }, [config.filters, filters, query, records]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function simulateLoading() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      showToast(`${config.title} refreshed with mock data.`);
    }, 650);
  }

  function submitModal() {
    const firstField = document.querySelector<HTMLInputElement>("[data-practitioner-modal-input='0']");
    if (!firstField?.value.trim()) {
      setFormError("Add a short note before submitting this mock action.");
      return;
    }

    if (selected) {
      const patch: Partial<PractitionerRecord> = {
        status: config.id === "documents" ? "Pending" : config.id === "payments" ? "Submitted" : "Confirmed",
        statusTone: config.id === "documents" || config.id === "payments" ? "warning" : "success",
        progress: Math.max(selected.progress ?? 0, 74),
      };
      setRecords((items) => items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
      setSelected((item) => (item ? { ...item, ...patch } : item));
    }

    setModalOpen(false);
    setFormError(null);
    showToast(`${config.primaryAction} completed locally.`);
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="secondary" loading={loading} onClick={simulateLoading}>
              Refresh
            </ActionButton>
            <ActionButton onClick={() => setModalOpen(true)}>
              {config.primaryAction}
            </ActionButton>
          </div>
        }
      />

      {toast ? (
        <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success shadow-sm">
          {toast}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <DashboardWidget key={metric.label} interactive className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-navy">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-subtle">{metric.detail}</p>
                </div>
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", toneStyles[metric.tone])}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </DashboardWidget>
          );
        })}
      </section>

      <DashboardWidget className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={config.searchPlaceholder}
            className="h-11 w-full rounded-lg border border-card-border bg-soft-bg pl-10 pr-3 text-sm text-navy outline-none transition placeholder:text-muted hover:border-primary/30 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {config.filters.map((filter) => (
            <label key={filter.key} className="block">
              <span className="text-xs font-semibold text-muted">{filter.label}</span>
              <select
                value={filters[filter.key] ?? "All"}
                onChange={(event) => setFilters((value) => ({ ...value, [filter.key]: event.target.value }))}
                className="mt-2 h-10 w-full rounded-lg border border-card-border bg-surface px-3 text-sm text-navy outline-none transition hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {filter.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </DashboardWidget>

      {loading ? <LoadingState /> : null}

      {!loading && visibleRecords.length === 0 ? (
        <DashboardWidget className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Eye className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-navy">{config.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-subtle">{config.emptyDescription}</p>
          <ActionButton
            className="mt-5"
            variant="secondary"
            onClick={() => {
              setQuery("");
              setFilters(Object.fromEntries(config.filters.map((filter) => [filter.key, "All"])));
            }}
          >
            Clear filters
          </ActionButton>
        </DashboardWidget>
      ) : null}

      {!loading && visibleRecords.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {visibleRecords.map((record) => (
            <PractitionerTaskCard
              key={record.id}
              record={record}
              onSelect={() => setSelected(record)}
              onAction={() => {
                setSelected(record);
                setModalOpen(true);
              }}
            />
          ))}
        </section>
      ) : null}

      {selected ? (
        <PractitionerDrawer
          config={config}
          record={selected}
          onClose={() => setSelected(null)}
          onAction={() => setModalOpen(true)}
          onToast={showToast}
        />
      ) : null}

      {modalOpen ? (
        <PractitionerModal
          config={config}
          record={selected}
          error={formError}
          onClose={() => {
            setModalOpen(false);
            setFormError(null);
          }}
          onSubmit={submitModal}
        />
      ) : null}
    </div>
  );
}

function PractitionerTaskCard({
  record,
  onSelect,
  onAction,
}: {
  record: PractitionerRecord;
  onSelect: () => void;
  onAction: () => void;
}) {
  return (
    <DashboardWidget interactive className="overflow-hidden">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full p-5 text-left transition hover:bg-soft-bg/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy">{record.title}</h2>
            <p className="mt-1 text-sm leading-6 text-subtle">{record.subtitle}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{record.meta}</p>
          </div>
          <StatusBadge status={record.status} tone={record.statusTone} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {record.fields.map((field) => (
            <div key={`${record.id}-${field.label}`} className="rounded-lg border border-card-border bg-white/75 p-3">
              <p className="text-xs font-semibold text-muted">{field.label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-navy">{field.value}</p>
            </div>
          ))}
        </div>

        {typeof record.progress === "number" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Readiness</span>
              <span>{record.progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-soft-bg">
              <div
                className={cn("h-2 rounded-full", record.progress > 80 ? "bg-success" : record.progress > 50 ? "bg-primary" : "bg-warning")}
                style={{ width: `${record.progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {record.warning ? (
          <div className="mt-4 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs font-semibold leading-5 text-warning">
            {record.warning}
          </div>
        ) : null}
      </button>

      <div className="flex flex-wrap gap-2 border-t border-card-border bg-soft-bg/45 px-5 py-3">
        <ActionButton variant="ghost" className="h-9 px-3" onClick={onSelect}>
          Details
        </ActionButton>
        <ActionButton variant="secondary" className="h-9 px-3" onClick={onAction}>
          Update
        </ActionButton>
      </div>
    </DashboardWidget>
  );
}

function PractitionerDrawer({
  config,
  record,
  onClose,
  onAction,
  onToast,
}: {
  config: PractitionerPageConfig;
  record: PractitionerRecord;
  onClose: () => void;
  onAction: () => void;
  onToast: (message: string) => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-lg border-l border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.16)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-card-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">
                Field workflow
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">{record.title}</h2>
              <p className="mt-1 text-sm leading-6 text-subtle">{record.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-card-border px-3 text-sm font-semibold text-muted transition hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {record.details.map((detail) => (
            <div key={`${record.id}-${detail.label}`} className="rounded-lg border border-card-border bg-soft-bg p-4">
              <p className="text-xs font-semibold text-muted">{detail.label}</p>
              <p className={cn("mt-2 text-sm font-semibold leading-6 text-navy", detail.tone ? toneText(detail.tone) : "")}>
                {detail.value}
              </p>
            </div>
          ))}

          {record.checklist ? (
            <DashboardWidget className="p-4">
              <h3 className="text-base font-semibold text-navy">Readiness checklist</h3>
              <div className="mt-3 space-y-3">
                {record.checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-white p-3">
                    <span className="text-sm font-semibold text-navy">{item.label}</span>
                    <StatusBadge status={item.done ? "complete" : "pending"} tone={item.done ? "success" : "warning"} />
                  </div>
                ))}
              </div>
            </DashboardWidget>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-card-border p-5">
          <ActionButton onClick={onAction}>{config.primaryAction}</ActionButton>
          <ActionButton variant="secondary" onClick={() => onToast("Placeholder export prepared locally.")}>
            Export
          </ActionButton>
        </div>
      </div>
    </aside>
  );
}

function PractitionerModal({
  config,
  record,
  error,
  onClose,
  onSubmit,
}: {
  config: PractitionerPageConfig;
  record: PractitionerRecord | null;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg border border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.18)]">
        <div className="border-b border-card-border p-5">
          <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">
            Local practitioner action
          </p>
          <h2 className="mt-2 text-xl font-semibold text-navy">{config.primaryAction}</h2>
          <p className="mt-2 text-sm leading-6 text-subtle">
            {record?.title ?? "This action"} updates frontend state only. No backend or authentication is connected.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {config.formFields.map((field, index) => (
            <FormInput
              key={field}
              data-practitioner-modal-input={index}
              label={field}
              placeholder={field}
              state={error && index === 0 ? "error" : index === 1 ? "warning" : "default"}
              message={error && index === 0 ? error : index === 1 ? "Review before submitting." : undefined}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-card-border p-5">
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton onClick={onSubmit}>Submit locally</ActionButton>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <DashboardWidget key={item} className="p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-card-border" />
          <div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-card-border" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((field) => (
              <div key={field} className="h-16 animate-pulse rounded-lg bg-soft-bg" />
            ))}
          </div>
        </DashboardWidget>
      ))}
    </div>
  );
}

function toneText(tone: PractitionerTone) {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "danger") return "text-pulse-red";
  if (tone === "primary") return "text-primary";
  return "text-muted";
}
