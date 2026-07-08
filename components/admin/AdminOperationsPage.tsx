"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { FormInput } from "@/components/portal/FormInput";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Search, Eye } from "@/components/icons/IconsaxIcons";
import { adminPageConfigs, type AdminPageConfig, type AdminRecord, type AdminTone } from "@/data/admin-portal-ui";
import { cn } from "@/lib/utils/cn";

type AdminOperationsPageProps = {
  configId: AdminPageConfig["id"];
};

type ModalMode = "create" | "edit" | "archive" | null;

const toneStyles: Record<AdminTone, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
  neutral: "border-card-border bg-soft-bg text-muted",
};

export function AdminOperationsPage({ configId }: AdminOperationsPageProps) {
  const config = adminPageConfigs[configId];
  const [records, setRecords] = useState(config.records);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.filters.map((filter) => [filter.key, "All"])),
  );
  const [activeTab, setActiveTab] = useState(config.tabs?.[0] ?? "All");
  const [selected, setSelected] = useState<AdminRecord | null>(config.records[0] ?? null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch = normalizedQuery
        ? `${record.title} ${record.subtitle} ${record.meta} ${record.search}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesFilters = config.filters.every((filter) => {
        const selectedFilter = filters[filter.key] ?? "All";
        return selectedFilter === "All" || record.filters[filter.key] === selectedFilter;
      });
      const matchesTab =
        !config.tabs ||
        activeTab === "Overview" ||
        record.status.toLowerCase().includes(activeTab.toLowerCase()) ||
        record.filters.risk?.toLowerCase().includes(activeTab.toLowerCase()) ||
        record.filters.department?.toLowerCase().includes(activeTab.toLowerCase());

      return matchesSearch && matchesFilters && matchesTab;
    });
  }, [activeTab, config.filters, config.tabs, filters, query, records]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function simulateLoading() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      showToast(`${config.title} refreshed with mock data.`);
    }, 700);
  }

  function openCreate() {
    setFormError(null);
    setModalMode("create");
  }

  function openEdit(record: AdminRecord) {
    setSelected(record);
    setFormError(null);
    setModalMode("edit");
  }

  function submitModal() {
    if (modalMode === "archive" && selected) {
      setRecords((items) => items.filter((item) => item.id !== selected.id));
      setSelected(null);
      setModalMode(null);
      showToast("Record archived locally.");
      return;
    }

    const firstField = document.querySelector<HTMLInputElement>("[data-admin-modal-input='0']");
    if (!firstField?.value.trim()) {
      setFormError("Complete the first field to preview the saved state.");
      return;
    }

    if (modalMode === "create") {
      const created: AdminRecord = {
        id: `${config.id}-${Date.now()}`,
        title: firstField.value.trim(),
        subtitle: "New mock record · frontend only",
        meta: "Created locally for UI review. This record is not persisted.",
        status: "Draft",
        statusTone: "neutral",
        search: firstField.value.trim().toLowerCase(),
        filters: Object.fromEntries(config.filters.map((filter) => [filter.key, filter.options[1] ?? "All"])),
        fields: config.formFields.slice(0, 4).map((field, index) => ({
          label: field,
          value: index === 0 ? firstField.value.trim() : "Draft",
        })),
        details: [
          { label: "Source", value: "Created through local mock modal." },
          { label: "Persistence", value: "Frontend state only." },
        ],
        progress: 18,
      };
      setRecords((items) => [created, ...items]);
      setSelected(created);
      showToast(`${config.formTitle} created locally.`);
    }

    if (modalMode === "edit" && selected) {
      setRecords((items) =>
        items.map((item) =>
          item.id === selected.id ? { ...item, title: firstField.value.trim(), search: `${item.search} ${firstField.value}` } : item,
        ),
      );
      setSelected((item) => (item ? { ...item, title: firstField.value.trim() } : item));
      showToast(`${config.formTitle} updated locally.`);
    }

    setModalMode(null);
  }

  function cycleRecommendation(record: AdminRecord) {
    const nextStatus = record.status === "Completed" ? "New" : record.status === "Planned" ? "Completed" : "Planned";
    updateRecord(record.id, {
      status: nextStatus,
      statusTone: nextStatus === "Completed" ? "success" : nextStatus === "Planned" ? "info" : "warning",
      filters: { ...record.filters, status: nextStatus },
      progress: nextStatus === "Completed" ? 100 : nextStatus === "Planned" ? 62 : 28,
    });
    showToast(`Recommendation marked ${nextStatus.toLowerCase()}.`);
  }

  function toggleReport(record: AdminRecord) {
    const published = record.status === "Published";
    const nextStatus = published ? "Draft" : "Published";
    updateRecord(record.id, {
      status: nextStatus,
      statusTone: published ? "neutral" : "success",
      filters: { ...record.filters, status: nextStatus },
      progress: published ? 58 : 100,
    });
    showToast(published ? "Report unpublished locally." : "Report published locally.");
  }

  function updateRecord(id: string, patch: Partial<AdminRecord>) {
    setRecords((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setSelected((item) => (item?.id === id ? { ...item, ...patch } : item));
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
            <ActionButton onClick={config.id === "settings" ? () => showToast("Settings saved locally.") : openCreate}>
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={config.searchPlaceholder}
              className="h-11 w-full rounded-lg border border-card-border bg-soft-bg pl-10 pr-3 text-sm text-navy outline-none transition placeholder:text-muted hover:border-primary/30 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {config.tabs?.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "h-10 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                  activeTab === tab
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-card-border bg-surface text-muted hover:border-primary/30 hover:text-navy",
                )}
              >
                {tab}
              </button>
            ))}
            {config.filters.map((filter) => (
              <label key={filter.key} className="sr-only">
                {filter.label}
                <select
                  value={filters[filter.key] ?? "All"}
                  onChange={(event) => setFilters((value) => ({ ...value, [filter.key]: event.target.value }))}
                >
                  {filter.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        <EmptyPanel title={config.emptyTitle} description={config.emptyDescription} onReset={() => {
          setQuery("");
          setFilters(Object.fromEntries(config.filters.map((filter) => [filter.key, "All"])));
        }} />
      ) : null}

      {!loading && visibleRecords.length > 0 ? (
        <section className={cn("grid gap-4", config.id === "activations" || config.id === "recommendations" ? "xl:grid-cols-3" : "xl:grid-cols-2")}>
          {visibleRecords.map((record) => (
            <RecordCard
              key={record.id}
              config={config}
              record={record}
              onSelect={() => setSelected(record)}
              onEdit={() => openEdit(record)}
              onArchive={() => {
                setSelected(record);
                setModalMode("archive");
              }}
              onReportToggle={() => toggleReport(record)}
              onRecommendationCycle={() => cycleRecommendation(record)}
              onToast={showToast}
              onRoleChange={(role) => updateRecord(record.id, {
                filters: { ...record.filters, role },
                fields: record.fields.map((field) => (field.label === "Role" ? { ...field, value: role } : field)),
                subtitle: record.subtitle.replace(/· .+$/, `· ${role}`),
              })}
            />
          ))}
        </section>
      ) : null}

      {selected ? (
        <DetailDrawer
          config={config}
          record={selected}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onArchive={() => setModalMode("archive")}
          onToast={showToast}
        />
      ) : null}

      {modalMode ? (
        <AdminModal
          mode={modalMode}
          config={config}
          record={selected}
          error={formError}
          onClose={() => setModalMode(null)}
          onSubmit={submitModal}
        />
      ) : null}
    </div>
  );
}

function RecordCard({
  config,
  record,
  onSelect,
  onEdit,
  onArchive,
  onReportToggle,
  onRecommendationCycle,
  onToast,
  onRoleChange,
}: {
  config: AdminPageConfig;
  record: AdminRecord;
  onSelect: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onReportToggle: () => void;
  onRecommendationCycle: () => void;
  onToast: (message: string) => void;
  onRoleChange: (role: string) => void;
}) {
  return (
    <DashboardWidget interactive className="overflow-hidden">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full p-5 text-left transition hover:bg-soft-bg/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-navy">{record.title}</h2>
            <p className="mt-1 text-sm leading-6 text-subtle">{record.subtitle}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{record.meta}</p>
          </div>
          <StatusBadge status={record.status} tone={record.statusTone} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {record.fields.slice(0, 4).map((field) => (
            <div key={`${record.id}-${field.label}`} className="rounded-lg border border-card-border bg-white/75 p-3">
              <p className="text-xs font-semibold text-muted">{field.label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-navy">{field.value}</p>
            </div>
          ))}
        </div>

        {typeof record.progress === "number" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>{config.id === "activations" ? "Progress tracker" : "Readiness"}</span>
              <span>{record.progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-soft-bg">
              <div
                className={cn(
                  "h-2 rounded-full",
                  record.progress > 80 ? "bg-success" : record.progress > 50 ? "bg-primary" : "bg-warning",
                )}
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

      <div className="flex flex-wrap items-center gap-2 border-t border-card-border bg-soft-bg/45 px-5 py-3">
        <ActionButton variant="ghost" className="h-9 px-3" onClick={onSelect}>
          View details
        </ActionButton>
        {config.id !== "settings" ? (
          <ActionButton variant="secondary" className="h-9 px-3" onClick={onEdit}>
            Edit
          </ActionButton>
        ) : (
          <ActionButton variant="secondary" className="h-9 px-3" onClick={() => onToast("Settings section saved locally.")}>
            Save section
          </ActionButton>
        )}
        {config.id === "organizations" ? (
          <ActionButton variant="secondary" className="h-9 px-3 text-pulse-red" onClick={onArchive}>
            Archive
          </ActionButton>
        ) : null}
        {config.id === "reports" ? (
          <>
            <ActionButton variant="secondary" className="h-9 px-3" onClick={onReportToggle}>
              {record.status === "Published" ? "Unpublish" : "Publish"}
            </ActionButton>
            <ActionButton variant="ghost" className="h-9 px-3" onClick={() => onToast("Download prepared as a placeholder.")}>
              Download
            </ActionButton>
          </>
        ) : null}
        {config.id === "recommendations" ? (
          <ActionButton variant="secondary" className="h-9 px-3" onClick={onRecommendationCycle}>
            {record.status === "Completed" ? "Reopen" : record.status === "Planned" ? "Complete" : "Plan"}
          </ActionButton>
        ) : null}
        {config.id === "users" ? (
          <select
            aria-label="Change role"
            value={record.filters.role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="h-9 rounded-lg border border-card-border bg-surface px-3 text-xs font-semibold text-navy outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {["Operations Lead", "Clinical Reviewer", "Finance", "Viewer"].map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        ) : null}
      </div>
    </DashboardWidget>
  );
}

function DetailDrawer({
  config,
  record,
  onClose,
  onEdit,
  onArchive,
  onToast,
}: {
  config: AdminPageConfig;
  record: AdminRecord;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onToast: (message: string) => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl border-l border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.16)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-card-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">Details</p>
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

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {record.details.map((detail) => (
              <div key={`${record.id}-${detail.label}`} className="rounded-lg border border-card-border bg-soft-bg p-4">
                <p className="text-xs font-semibold text-muted">{detail.label}</p>
                <p className={cn("mt-2 text-sm font-semibold leading-6 text-navy", detail.tone ? toneText(detail.tone) : "")}>{detail.value}</p>
              </div>
            ))}
          </div>

          {record.checklist ? (
            <DashboardWidget className="p-4">
              <h3 className="text-base font-semibold text-navy">
                {config.id === "activations" ? "Services checklist" : "Checklist"}
              </h3>
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

          <DashboardWidget className="p-4">
            <h3 className="text-base font-semibold text-navy">
              {config.id === "reports" ? "Report preview" : config.id === "billing" ? "Invoice preview" : "Activity preview"}
            </h3>
            <div className="mt-4 grid gap-3">
              {["Owner assigned", "Mock data reviewed", "Client-facing state ready"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-card-border bg-white p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-navy">{item}</p>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-card-border p-5">
          <ActionButton onClick={onEdit}>
            Edit details
          </ActionButton>
          {config.id === "organizations" ? (
            <ActionButton variant="secondary" className="text-pulse-red" onClick={onArchive}>
              Archive
            </ActionButton>
          ) : null}
          <ActionButton variant="secondary" onClick={() => onToast("Placeholder action completed locally.")}>
            {config.secondaryAction ?? "Run action"}
          </ActionButton>
        </div>
      </div>
    </aside>
  );
}

function AdminModal({
  mode,
  config,
  record,
  error,
  onClose,
  onSubmit,
}: {
  mode: Exclude<ModalMode, null>;
  config: AdminPageConfig;
  record: AdminRecord | null;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isArchive = mode === "archive";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.18)]">
        <div className="border-b border-card-border p-5">
          <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">
            {isArchive ? "Confirmation" : config.formTitle}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-navy">
            {isArchive ? `Archive ${record?.title ?? "record"}?` : mode === "create" ? config.primaryAction : `Edit ${record?.title ?? config.formTitle}`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-subtle">
            {isArchive
              ? "This removes the item from the current mock list only. No backend data is changed."
              : "Complete the local form to preview create and edit behavior without persistence."}
          </p>
        </div>

        <div className="space-y-4 p-5">
          {isArchive ? (
            <div className="rounded-lg border border-pulse-red/20 bg-pulse-red/10 p-4 text-sm font-semibold leading-6 text-pulse-red">
              Archive action is frontend-only and can be restored by refreshing the page.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {config.formFields.map((field, index) => (
                <FormInput
                  key={field}
                  data-admin-modal-input={index}
                  label={field}
                  defaultValue={index === 0 ? record?.title ?? "" : record?.fields[index - 1]?.value ?? ""}
                  placeholder={field}
                  state={error && index === 0 ? "error" : "default"}
                  message={error && index === 0 ? error : index === 0 ? "Required for mock save." : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-card-border p-5">
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton onClick={onSubmit} className={isArchive ? "bg-pulse-red hover:bg-pulse-red" : undefined}>
            {isArchive ? "Archive" : "Save locally"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 xl:grid-cols-2" aria-label="Loading admin records">
      {[0, 1, 2, 3].map((item) => (
        <DashboardWidget key={item} className="p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-card-border" />
          <div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-card-border" />
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className="h-16 animate-pulse rounded-lg bg-soft-bg" />
            ))}
          </div>
        </DashboardWidget>
      ))}
    </div>
  );
}

function EmptyPanel({ title, description, onReset }: { title: string; description: string; onReset: () => void }) {
  return (
    <DashboardWidget className="p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Eye className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-subtle">{description}</p>
      <ActionButton className="mt-5" variant="secondary" onClick={onReset}>
        Clear filters
      </ActionButton>
    </DashboardWidget>
  );
}

function toneText(tone: AdminTone) {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "danger") return "text-pulse-red";
  if (tone === "primary") return "text-primary";
  return "text-muted";
}
