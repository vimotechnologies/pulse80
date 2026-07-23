"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AddCircle,
  AlertCircle,
  CloseCircle,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Refresh,
  Trash,
} from "@/components/icons/IconsaxIcons";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { FormInput } from "@/components/portal/FormInput";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import {
  ListClearButton,
  ListFilterCard,
  ListFilterField,
  ListSearchField,
  practitionerFilterGridClass,
} from "@/components/ui/ListFilterCard";
import { MetricCardShell } from "@/components/ui/MetricCardShell";
import { ResizableGridTable, type ResizableGridColumn } from "@/components/ui/ResizableGridTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type RecordTone = "success" | "warning" | "danger" | "info" | "neutral";
type MetricTone = "primary" | "success" | "warning" | "danger" | "neutral";
type DetailTone = MetricTone | "info";
type ModalMode = "create" | "edit" | "archive" | null;

export type DataRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  statusTone: RecordTone;
  search: string;
  filters: Record<string, string>;
  fields: { label: string; value: string }[];
  details: { label: string; value: string; tone?: DetailTone }[];
  progress?: number;
  warning?: string;
  checklist?: { label: string; done: boolean }[];
  highlight?: string;
};

export type DataMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
  icon: IconsaxIcon;
};

export type DataFilter = {
  key: string;
  label: string;
  options: string[];
};

export type DataPageConfig<RecordType extends DataRecord> = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  searchPlaceholder: string;
  filters: DataFilter[];
  metrics: DataMetric[];
  records: RecordType[];
  tabs?: string[];
  formTitle?: string;
  formFields: string[];
  emptyTitle: string;
  emptyDescription: string;
  featured?: RecordType;
};

export type DataColumn<RecordType extends DataRecord> = {
  key: string;
  label: string;
  className?: string;
  render: (record: RecordType) => ReactNode;
  sortValue?: (record: RecordType) => string | number;
};

type DataListPageProps<RecordType extends DataRecord> = {
  config: DataPageConfig<RecordType>;
  columns: DataColumn<RecordType>[];
  detailEyebrow?: string;
  featuredTitle?: string;
  enableBulkActions?: boolean;
  onCycleStatus?: (record: RecordType) => Partial<RecordType>;
  onRoleChange?: (record: RecordType, role: string) => Partial<RecordType>;
};

function field(record: DataRecord, label: string) {
  return record.fields.find((item) => item.label === label)?.value ?? "";
}

function detail(record: DataRecord, label: string) {
  return record.details.find((item) => item.label === label)?.value ?? "";
}

export function DataListPage<RecordType extends DataRecord>({
  config,
  columns,
  detailEyebrow = "Record details",
  featuredTitle = "Featured latest report",
  enableBulkActions = false,
  onCycleStatus,
  onRoleChange,
}: DataListPageProps<RecordType>) {
  const [records, setRecords] = useState<RecordType[]>(() => config.records);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.filters.map((item) => [item.key, "All"])),
  );
  const [activeTab, setActiveTab] = useState(config.tabs?.[0] ?? "All");
  const [selected, setSelected] = useState<RecordType | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const sortKey = columns[0]?.key ?? "title";
  const sortDirection: "asc" | "desc" = "asc";
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterResetSignal, setFilterResetSignal] = useState(0);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = `${record.title} ${record.subtitle} ${record.meta} ${record.search} ${record.fields
        .map((item) => `${item.label} ${item.value}`)
        .join(" ")}`.toLowerCase();
      const matchesSearch = normalizedQuery ? searchable.includes(normalizedQuery) : true;
      const matchesFilters = config.filters.every((filterItem) => {
        const value = filters[filterItem.key] ?? "All";
        return value === "All" || record.filters[filterItem.key] === value;
      });
      const tab = activeTab.toLowerCase();
      const matchesTab =
        !config.tabs ||
        activeTab === "All" ||
        activeTab === "Overview" ||
        record.status.toLowerCase().includes(tab) ||
        Object.values(record.filters).some((value) => value.toLowerCase().includes(tab));

      return matchesSearch && matchesFilters && matchesTab;
    });
  }, [activeTab, config.filters, config.tabs, filters, query, records]);

  const sortedRecords = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey);
    return [...filteredRecords].sort((first, second) => {
      const firstValue = column?.sortValue?.(first) ?? first.title;
      const secondValue = column?.sortValue?.(second) ?? second.title;
      const result = String(firstValue).localeCompare(String(secondValue), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "asc" ? result : -result;
    });
  }, [columns, filteredRecords, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const pageRecords = sortedRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function updateRecord(id: string, patch: Partial<RecordType>) {
    setRecords((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setSelected((item) => (item?.id === id ? { ...item, ...patch } : item));
  }

  function resetFilters() {
    setQuery("");
    setFilters(Object.fromEntries(config.filters.map((item) => [item.key, "All"])));
    setActiveTab(config.tabs?.[0] ?? "All");
    setPage(1);
    setFilterResetSignal((value) => value + 1);
  }

  function refreshList() {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setLoading(false);
      showToast(`${config.title} refreshed with local mock data.`);
    }, 550);
  }

  function submitModal() {
    if (modalMode === "archive" && selected) {
      setRecords((items) => items.filter((item) => item.id !== selected.id));
      setSelected(null);
      setModalMode(null);
      showToast("Record archived locally.");
      return;
    }

    const firstField = document.querySelector<HTMLInputElement>("[data-list-modal-input='0']");
    if (!firstField?.value.trim()) {
      setFormError("Complete the first field to preview the saved state.");
      return;
    }

    if (modalMode === "create") {
      const created = {
        id: `${config.id}-${Date.now()}`,
        title: firstField.value.trim(),
        subtitle: "New mock record",
        meta: "Created locally for UI review. This record is not persisted.",
        status: "Draft",
        statusTone: "neutral",
        search: firstField.value.trim().toLowerCase(),
        filters: Object.fromEntries(config.filters.map((item) => [item.key, item.options[1] ?? "All"])),
        fields: config.formFields.slice(0, 4).map((item, index) => ({
          label: item,
          value: index === 0 ? firstField.value.trim() : "Draft",
        })),
        details: [
          { label: "Source", value: "Created through local mock modal." },
          { label: "Persistence", value: "Frontend state only." },
        ],
        progress: 18,
      } satisfies DataRecord;

      setRecords((items) => [created as RecordType, ...items]);
      setSelected(created as RecordType);
      showToast(`${config.formTitle ?? config.title} created locally.`);
    }

    if (modalMode === "edit" && selected) {
      updateRecord(selected.id, {
        title: firstField.value.trim(),
        search: `${selected.search} ${firstField.value.trim()}`,
      } as Partial<RecordType>);
      showToast(`${config.formTitle ?? "Record"} updated locally.`);
    }

    setModalMode(null);
    setFormError(null);
  }

  function cycleStatus(record: RecordType) {
    if (onCycleStatus) {
      updateRecord(record.id, onCycleStatus(record));
      showToast("Status updated locally.");
      return;
    }

    const nextStatus = record.status === "Published" ? "Draft" : record.status === "Completed" ? "Planned" : "Completed";
    updateRecord(record.id, {
      status: nextStatus,
      statusTone: nextStatus === "Completed" ? "success" : nextStatus === "Draft" ? "neutral" : "info",
      filters: { ...record.filters, status: nextStatus },
    } as unknown as Partial<RecordType>);
    showToast("Status updated locally.");
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="secondary" loading={loading} onClick={refreshList}>
              <Refresh className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
              Refresh
            </ActionButton>
            <ActionButton onClick={() => setModalMode("create")}>
              <AddCircle className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
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

      {error ? <ErrorState message={error} onRetry={() => setError(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.metrics.slice(0, 5).map((metric) => (
          <ListSummaryMetric key={metric.label} metric={metric} />
        ))}
      </section>

      {config.featured ? (
        <DashboardWidget interactive className="overflow-hidden">
          <div className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">
                {config.featured.highlight ?? featuredTitle}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">{config.featured.title}</h2>
              <p className="mt-2 text-sm leading-6 text-subtle">{config.featured.meta}</p>
            </div>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <ActionButton variant="secondary" onClick={() => setSelected(config.featured ?? null)}>
                <Eye className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
                Preview
              </ActionButton>
              <ActionButton onClick={() => showToast("Download prepared as a placeholder.")}>
                <Download className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
                Download
              </ActionButton>
            </div>
          </div>
        </DashboardWidget>
      ) : null}

      <DataToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder={config.searchPlaceholder}
        filters={config.filters}
        values={filters}
        onFilterChange={(key, value) => {
          setFilters((items) => ({ ...items, [key]: value }));
          setPage(1);
        }}
        onClearFilters={resetFilters}
        resetSignal={filterResetSignal}
      />

      {selectedIds.length > 0 ? (
        <BulkActionBar
          count={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onAction={() => showToast("Bulk action completed locally.")}
        />
      ) : null}

      {loading ? <LoadingState /> : null}

      {!loading && pageRecords.length === 0 ? (
        <EmptyState title={config.emptyTitle} description={config.emptyDescription} onReset={resetFilters} />
      ) : null}

      {!loading && pageRecords.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            records={pageRecords}
            onOpen={setSelected}
            enableBulkActions={enableBulkActions}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            renderActions={(record) => (
              <RowActionMenu
                record={record}
                onView={() => setSelected(record)}
                onEdit={() => {
                  setSelected(record);
                  setModalMode("edit");
                }}
                onArchive={() => {
                  setSelected(record);
                  setModalMode("archive");
                }}
                onDownload={() => showToast("Download prepared as a placeholder.")}
                onCycleStatus={() => cycleStatus(record)}
                onRoleChange={
                  onRoleChange
                    ? (role) => {
                        updateRecord(record.id, onRoleChange(record, role));
                        showToast("Role changed locally.");
                      }
                    : undefined
                }
              />
            )}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={sortedRecords.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(1);
            }}
          />
        </>
      ) : null}

      {selected ? (
        <DetailDrawer
          eyebrow={detailEyebrow}
          record={selected}
          title={selected.title}
          subtitle={selected.subtitle}
          onClose={() => setSelected(null)}
          onEdit={() => setModalMode("edit")}
          onArchive={() => setModalMode("archive")}
          onAction={() => showToast(`${config.secondaryAction ?? config.primaryAction} completed locally.`)}
          actionLabel={config.secondaryAction ?? "Run action"}
        />
      ) : null}

      {modalMode ? (
        <ListModal
          mode={modalMode}
          title={config.formTitle ?? config.title}
          primaryAction={config.primaryAction}
          fields={config.formFields}
          record={selected}
          error={formError}
          onClose={() => {
            setModalMode(null);
            setFormError(null);
          }}
          onSubmit={submitModal}
        />
      ) : null}
    </div>
  );
}

export function ListSummaryMetric({ metric }: { metric: DataMetric }) {
  const Icon = metric.icon;
  return (
    <MetricCardShell label={metric.label} value={metric.value} detail={metric.detail} icon={Icon} />
  );
}

export function DataToolbar({
  query,
  onQueryChange,
  placeholder,
  filters,
  values,
  onFilterChange,
  onClearFilters,
  resetSignal,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  filters: DataFilter[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  resetSignal: number;
}) {
  return (
    <ListFilterCard
      search={<ListSearchField value={query} onChange={onQueryChange} placeholder={placeholder} />}
      actions={<ListClearButton onClick={onClearFilters} />}
      filterGridClassName={practitionerFilterGridClass}
    >
      {filters.map((filterItem) => (
        <ListFilterField
          key={`${filterItem.key}-${resetSignal}`}
          label={filterItem.label}
          value={values[filterItem.key] ?? "All"}
          options={filterItem.options}
          onChange={(value) => onFilterChange(filterItem.key, value)}
        />
      ))}
    </ListFilterCard>
  );
}

function columnWidth(label: string, index: number) {
  const normalized = label.toLowerCase();
  if (index === 0) return 280;
  if (normalized.includes("organization")) return 180;
  if (normalized.includes("date") || normalized.includes("period")) return 150;
  if (normalized.includes("services") || normalized.includes("impact")) return 190;
  if (normalized.includes("practitioner") || normalized.includes("employee")) return 160;
  if (normalized.includes("progress") || normalized.includes("readiness")) return 150;
  if (normalized.includes("status") || normalized.includes("priority") || normalized.includes("risk")) return 132;
  return 150;
}

export function DataTable<RecordType extends DataRecord>({
  columns,
  records,
  onOpen,
  renderActions,
  enableBulkActions,
  selectedIds,
  onSelectedIdsChange,
}: {
  columns: DataColumn<RecordType>[];
  records: RecordType[];
  onOpen: (record: RecordType) => void;
  renderActions: (record: RecordType) => ReactNode;
  enableBulkActions: boolean;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}) {
  const allSelected = records.length > 0 && records.every((record) => selectedIds.includes(record.id));
  const tableColumns: ResizableGridColumn[] = [
    ...(enableBulkActions
      ? [
          {
            key: "select",
            label: "Select",
            width: 56,
            minWidth: 48,
            header: (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  onSelectedIdsChange(
                    allSelected
                      ? selectedIds.filter((id) => !records.some((record) => record.id === id))
                      : [...new Set([...selectedIds, ...records.map((record) => record.id)])],
                  )
                }
                className="h-4 w-4 rounded border-[#d0d5dd] text-primary focus:ring-primary"
                aria-label="Select all rows"
              />
            ),
          },
        ]
      : []),
    ...columns.map((column, index) => ({
      key: column.key,
      label: column.label,
      width: columnWidth(column.label, index),
      minWidth: index === 0 ? 220 : 112,
    })),
    {
      key: "actions",
      label: "Actions",
      width: 96,
      minWidth: 88,
      headerClassName: "text-right",
      header: <span className="block truncate text-right">Actions</span>,
    },
  ];

  return (
    <ResizableGridTable
      columns={tableColumns}
      rows={records}
      getRowKey={(record) => record.id}
      renderRow={(record, gridTemplateColumns) => (
        <div
          className="grid w-full cursor-pointer items-center px-5 py-3 text-left text-[12px] text-black transition hover:bg-[#f8fafc]"
          style={{ gridTemplateColumns }}
          onClick={() => onOpen(record)}
        >
          {enableBulkActions ? (
            <span className="pr-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(record.id)}
                onChange={(event) =>
                  onSelectedIdsChange(
                    event.target.checked ? [...selectedIds, record.id] : selectedIds.filter((id) => id !== record.id),
                  )
                }
                onClick={(event) => event.stopPropagation()}
                className="h-4 w-4 rounded border-[#d0d5dd] text-primary focus:ring-primary"
                aria-label={`Select ${record.title}`}
              />
            </span>
          ) : null}
          {columns.map((column) => (
            <button
              key={`${record.id}-${column.key}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(record);
              }}
              className={cn(
                "min-w-0 pr-4 text-left text-[12px] text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                column.className,
              )}
            >
              {column.render(record)}
            </button>
          ))}
          <span className="flex justify-end">{renderActions(record)}</span>
        </div>
      )}
    />
  );
}

export function RowActionMenu<RecordType extends DataRecord>({
  record,
  onView,
  onEdit,
  onArchive,
  onDownload,
  onCycleStatus,
  onRoleChange,
}: {
  record: RecordType;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDownload: () => void;
  onCycleStatus: () => void;
  onRoleChange?: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex justify-end">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-black transition hover:bg-black hover:text-white active:scale-[0.96] active:bg-primary active:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        aria-label={`Open actions for ${record.title}`}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-52 rounded-lg border border-[#d0d5dd] bg-surface p-1 text-left shadow-[0_18px_44px_rgba(7,22,51,0.14)]">
          <ActionItem icon={Eye} label="View details" onClick={onView} />
          <ActionItem icon={Edit} label="Edit locally" onClick={onEdit} />
          <ActionItem icon={Download} label="Download" onClick={onDownload} />
          <ActionItem icon={Refresh} label={record.status === "Published" ? "Unpublish" : "Update status"} onClick={onCycleStatus} />
          {onRoleChange ? (
            <label className="mt-1 block border-t border-[#d0d5dd] px-3 py-2 text-xs font-semibold text-muted">
              Role
              <select
                value={record.filters.role}
                onChange={(event) => onRoleChange(event.target.value)}
                className="mt-2 h-9 w-full rounded-lg border border-[#d0d5dd] bg-soft-bg px-2 text-xs text-navy outline-none focus:ring-4 focus:ring-primary/10"
              >
                {["Operations Lead", "Clinical Reviewer", "Finance", "Viewer"].map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          ) : null}
          <ActionItem icon={Trash} label="Archive locally" danger onClick={onArchive} />
        </div>
      ) : null}
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: IconsaxIcon;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-soft-bg",
        danger ? "text-pulse-red" : "text-navy",
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      {label}
    </button>
  );
}

export function DetailDrawer<RecordType extends DataRecord>({
  eyebrow,
  title,
  subtitle,
  record,
  actionLabel,
  onClose,
  onEdit,
  onArchive,
  onAction,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  record: RecordType;
  actionLabel: string;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onAction: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl border-l border-[#d0d5dd] bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.16)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-[#d0d5dd] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">{eyebrow}</p>
              <h2 className="mt-2 text-xl font-semibold text-navy">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-subtle">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d0d5dd] text-muted transition hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              aria-label="Close details"
            >
              <CloseCircle className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {record.warning ? <WarningState message={record.warning} /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {record.details.map((item) => (
              <div key={`${record.id}-${item.label}`} className="rounded-lg border border-[#d0d5dd] bg-soft-bg p-4">
                <p className="text-xs font-semibold text-muted">{item.label}</p>
                <p className={cn("mt-2 text-sm font-semibold leading-6 text-navy", item.tone ? toneText(item.tone) : "")}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <DashboardWidget className="p-4">
            <h3 className="text-base font-semibold text-navy">Key metadata</h3>
            <div className="mt-4 grid gap-3">
              {record.fields.map((item) => (
                <div key={`${record.id}-field-${item.label}`} className="flex items-center justify-between gap-4 rounded-lg border border-[#d0d5dd] bg-white p-3">
                  <span className="text-sm font-semibold text-muted">{item.label}</span>
                  <span className="text-sm font-semibold text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>

          {typeof record.progress === "number" ? (
            <DashboardWidget className="p-4">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold text-navy">
                <span>Progress</span>
                <span>{record.progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-soft-bg">
                <div
                  className={cn("h-2 rounded-full", record.progress > 80 ? "bg-success" : record.progress > 50 ? "bg-primary" : "bg-warning")}
                  style={{ width: `${record.progress}%` }}
                />
              </div>
            </DashboardWidget>
          ) : null}

          {record.checklist ? (
            <DashboardWidget className="p-4">
              <h3 className="text-base font-semibold text-navy">Readiness checklist</h3>
              <div className="mt-3 space-y-3">
                {record.checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#d0d5dd] bg-white p-3">
                    <span className="text-sm font-semibold text-navy">{item.label}</span>
                    <StatusBadge status={item.done ? "Complete" : "Pending"} tone={item.done ? "success" : "warning"} />
                  </div>
                ))}
              </div>
            </DashboardWidget>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[#d0d5dd] p-5">
          <ActionButton onClick={onEdit}>
            <Edit className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
            Edit details
          </ActionButton>
          <ActionButton variant="secondary" onClick={onAction}>
            {actionLabel}
          </ActionButton>
          <ActionButton variant="secondary" className="text-pulse-red" onClick={onArchive}>
            Archive
          </ActionButton>
        </div>
      </div>
    </aside>
  );
}

export function Pagination({
  page,
  totalPages,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: {
  page: number;
  totalPages: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#d0d5dd] bg-surface px-4 py-3 text-sm text-muted shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page <strong className="text-navy">{page}</strong> of <strong className="text-navy">{totalPages}</strong> · {totalRows} records
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          Rows
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-[#d0d5dd] bg-surface px-2 text-xs text-navy outline-none focus:ring-4 focus:ring-primary/10"
          >
            {[5, 10, 20].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <ActionButton variant="secondary" className="h-9 px-3" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </ActionButton>
        <ActionButton variant="secondary" className="h-9 px-3" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </ActionButton>
      </div>
    </div>
  );
}

export function BulkActionBar({
  count,
  onClear,
  onAction,
}: {
  count: number;
  onClear: () => void;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3">
      <p className="text-sm font-semibold text-navy">{count} selected</p>
      <div className="flex gap-2">
        <ActionButton variant="secondary" className="h-9 px-3" onClick={onClear}>
          Clear
        </ActionButton>
        <ActionButton className="h-9 px-3" onClick={onAction}>
          Apply action
        </ActionButton>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset: () => void;
}) {
  return (
    <DashboardWidget className="p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-subtle">{description}</p>
      <ActionButton className="mt-5" variant="secondary" onClick={onReset}>
        Clear filters
      </ActionButton>
    </DashboardWidget>
  );
}

export function LoadingState() {
  return (
    <DashboardWidget className="overflow-hidden" aria-label="Loading records">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="grid grid-cols-5 gap-4 border-b border-[#d0d5dd] p-4">
          <div className="h-4 animate-pulse rounded bg-[#d0d5dd]" />
          <div className="h-4 animate-pulse rounded bg-[#d0d5dd]" />
          <div className="h-4 animate-pulse rounded bg-[#d0d5dd]" />
          <div className="h-4 animate-pulse rounded bg-[#d0d5dd]" />
          <div className="h-4 animate-pulse rounded bg-[#d0d5dd]" />
        </div>
      ))}
    </DashboardWidget>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-pulse-red/20 bg-pulse-red/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-pulse-red">
          <AlertCircle className="h-[18px] w-[18px]" aria-hidden="true" />
          {message}
        </p>
        <ActionButton variant="secondary" className="h-9 px-3" onClick={onRetry}>
          Retry
        </ActionButton>
      </div>
    </div>
  );
}

export function WarningState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold leading-6 text-warning">
      {message}
    </div>
  );
}

function ListModal<RecordType extends DataRecord>({
  mode,
  title,
  primaryAction,
  fields,
  record,
  error,
  onClose,
  onSubmit,
}: {
  mode: Exclude<ModalMode, null>;
  title: string;
  primaryAction: string;
  fields: string[];
  record: RecordType | null;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isArchive = mode === "archive";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-[#d0d5dd] bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.18)]">
        <div className="border-b border-[#d0d5dd] p-5">
          <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">
            {isArchive ? "Confirmation" : title}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-navy">
            {isArchive ? `Archive ${record?.title ?? "record"}?` : mode === "create" ? primaryAction : `Edit ${record?.title ?? title}`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-subtle">
            {isArchive
              ? "This removes the item from the current mock list only. No backend data is changed."
              : "Complete the local form to preview create and edit behavior without persistence."}
          </p>
        </div>
        <div className="space-y-4 p-5">
          {isArchive ? (
            <WarningState message="Archive action is frontend-only and can be restored by refreshing the page." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((item, index) => (
                <FormInput
                  key={item}
                  data-list-modal-input={index}
                  label={item}
                  defaultValue={index === 0 ? record?.title ?? "" : record?.fields[index - 1]?.value ?? ""}
                  placeholder={item}
                  state={error && index === 0 ? "error" : index === 1 ? "warning" : "default"}
                  message={error && index === 0 ? error : index === 1 ? "Review before submitting." : undefined}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#d0d5dd] p-5">
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

export function RecordIdentity({ record }: { record: DataRecord }) {
  const initials = record.title
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-navy">{record.title}</span>
        <span className="mt-1 block truncate text-xs font-medium text-muted">{record.subtitle}</span>
      </span>
    </div>
  );
}

export function StatusCell({ record }: { record: DataRecord }) {
  return <StatusBadge status={record.status} tone={record.statusTone} />;
}

export function ProgressCell({ record }: { record: DataRecord }) {
  if (typeof record.progress !== "number") return <span className="text-muted">Not tracked</span>;
  return (
    <div className="min-w-[130px]">
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span>{record.progress}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-soft-bg">
        <div
          className={cn("h-2 rounded-full", record.progress > 80 ? "bg-success" : record.progress > 50 ? "bg-primary" : "bg-warning")}
          style={{ width: `${record.progress}%` }}
        />
      </div>
    </div>
  );
}

export const listField = field;
export const listDetail = detail;

function toneText(tone: DetailTone) {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "danger") return "text-pulse-red";
  if (tone === "primary" || tone === "info") return "text-primary";
  return "text-muted";
}
