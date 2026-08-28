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
  Sort,
  Trash,
} from "@/components/icons/IconsaxIcons";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { FormInput } from "@/components/portal/FormInput";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastMessage } from "@/components/ui/ToastMessage";
import {
  UnifiedTablePagination,
  UnifiedTableSurface,
  UnifiedTableViewport,
  unifiedTableCellClass,
  unifiedTableHeaderClass,
} from "@/components/ui/UnifiedDataTable";
import { UnifiedMetricCard } from "@/components/ui/UnifiedMetricCard";
import {
  UnifiedFilterAction,
  UnifiedFilterCard,
  UnifiedFilterClear,
  UnifiedFilterSearch,
  UnifiedFilterSelect,
  UnifiedFilterSort,
} from "@/components/ui/UnifiedFilterCard";
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
  metrics?: DataMetric[];
  columns: DataColumn<RecordType>[];
  detailEyebrow?: string;
  featuredTitle?: string;
  enableBulkActions?: boolean;
  onCycleStatus?: (record: RecordType) => Partial<RecordType>;
  onRoleChange?: (record: RecordType, role: string) => Partial<RecordType>;
  onRecordOpen?: (record: RecordType) => void;
  hideDefaultDetailModal?: boolean;
  rowActions?: {
    edit?: boolean;
    archive?: boolean;
    download?: boolean;
    cycleStatus?: boolean;
  };
};

function field(record: DataRecord, label: string) {
  return record.fields.find((item) => item.label === label)?.value ?? "";
}

function detail(record: DataRecord, label: string) {
  return record.details.find((item) => item.label === label)?.value ?? "";
}

export function DataListPage<RecordType extends DataRecord>({
  config,
  metrics = config.metrics,
  columns,
  detailEyebrow = "Record details",
  featuredTitle = "Featured latest report",
  enableBulkActions = false,
  onCycleStatus,
  onRoleChange,
  onRecordOpen,
  hideDefaultDetailModal = false,
  rowActions,
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
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  function openRecord(record: RecordType) {
    if (onRecordOpen) {
      onRecordOpen(record);
      return;
    }
    setSelected(record);
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
  }

  function refreshList() {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setLoading(false);
      showToast(`${config.title} refreshed with local mock data.`);
    }, 550);
  }

  function toggleSort(column: DataColumn<RecordType>) {
    if (sortKey === column.key) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column.key);
    setSortDirection("asc");
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
              <Refresh className="mr-2 h-5 w-5" aria-hidden="true" />
              Refresh
            </ActionButton>
            <ActionButton onClick={() => setModalMode("create")}>
              <AddCircle className="mr-2 h-5 w-5" aria-hidden="true" />
              {config.primaryAction}
            </ActionButton>
          </div>
        }
      />

      <ToastMessage message={toast} />

      {error ? <ErrorState message={error} onRetry={() => setError(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.slice(0, 5).map((metric) => (
          <ListSummaryMetric key={metric.label} metric={metric} />
        ))}
      </section>

      {config.featured ? (
        <DashboardWidget interactive className="overflow-hidden">
          <div className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold text-primary">
                {config.featured.highlight ?? featuredTitle}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">{config.featured.title}</h2>
              <p className="mt-2 text-sm leading-6 text-subtle">{config.featured.meta}</p>
            </div>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <ActionButton variant="secondary" onClick={() => openRecord(config.featured as RecordType)}>
                <Eye className="mr-2 h-5 w-5" aria-hidden="true" />
                Preview
              </ActionButton>
              <ActionButton onClick={() => showToast("Download prepared as a placeholder.")}>
                <Download className="mr-2 h-5 w-5" aria-hidden="true" />
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
        tabs={config.tabs}
        activeTab={activeTab}
        onTabChange={(value) => {
          setActiveTab(value);
          setPage(1);
        }}
        filters={config.filters}
        values={filters}
        onFilterChange={(key, value) => {
          setFilters((items) => ({ ...items, [key]: value }));
          setPage(1);
        }}
        sortOptions={columns}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={(value) => {
          setSortKey(value);
          setPage(1);
        }}
        onClear={resetFilters}
        onExport={() => showToast("Export prepared as a placeholder.")}
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
        <DataTable
          columns={columns}
          records={pageRecords}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort}
          onOpen={openRecord}
          enableBulkActions={enableBulkActions}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          pagination={
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
          }
          renderActions={(record) => (
            <RowActionMenu
              record={record}
              onView={() => openRecord(record)}
              onEdit={rowActions?.edit === false ? undefined : () => {
                setSelected(record);
                setModalMode("edit");
              }}
              onArchive={rowActions?.archive === false ? undefined : () => {
                setSelected(record);
                setModalMode("archive");
              }}
              onDownload={rowActions?.download === false ? undefined : () => showToast("Download prepared as a placeholder.")}
              onCycleStatus={rowActions?.cycleStatus === false ? undefined : () => cycleStatus(record)}
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
      ) : null}

      {!hideDefaultDetailModal && selected ? (
        <DetailModal
          eyebrow={detailEyebrow}
          record={selected}
          title={selected.title}
          subtitle={selected.subtitle}
          onClose={() => setSelected(null)}
          onEdit={rowActions?.edit === false ? undefined : () => setModalMode("edit")}
          onArchive={rowActions?.archive === false ? undefined : () => setModalMode("archive")}
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
  return (
    <UnifiedMetricCard
      label={metric.label}
      value={metric.value}
      detail={metric.detail}
      icon={metric.icon}
    />
  );
}

export function DataToolbar<RecordType extends DataRecord>({
  query,
  onQueryChange,
  placeholder,
  tabs,
  activeTab,
  onTabChange,
  filters,
  values,
  onFilterChange,
  sortOptions,
  sortKey,
  sortDirection,
  onSortChange,
  onClear,
  onExport,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  tabs?: string[];
  activeTab: string;
  onTabChange: (value: string) => void;
  filters: DataFilter[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  sortOptions: DataColumn<RecordType>[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSortChange: (value: string) => void;
  onClear: () => void;
  onExport: () => void;
}) {
  return (
    <UnifiedFilterCard>
      {tabs ? (
        <div className="mb-3">
          <FilterTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput value={query} onChange={onQueryChange} placeholder={placeholder} />
        {filters.map((filterItem) => (
          <FilterSelect
            key={filterItem.key}
            filter={filterItem}
            value={values[filterItem.key] ?? "All"}
            onChange={(value) => onFilterChange(filterItem.key, value)}
          />
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1.7fr)_auto_auto_1fr]">
        <UnifiedFilterSort
          value={sortKey}
          options={sortOptions.map((option) => ({
            value: option.key,
            label: `Sort by: ${option.label}${sortKey === option.key ? ` (${sortDirection})` : ""}`,
          }))}
          onChange={onSortChange}
        />
        <UnifiedFilterAction onClick={onExport}>Export</UnifiedFilterAction>
        <UnifiedFilterClear onClick={onClear} />
      </div>
    </UnifiedFilterCard>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return <UnifiedFilterSearch value={value} onChange={onChange} placeholder={placeholder} />;
}

export function FilterSelect({
  filter,
  value,
  onChange,
}: {
  filter: DataFilter;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <UnifiedFilterSelect
      label={filter.label}
      value={value}
      options={filter.options}
      onChange={onChange}
    />
  );
}

export function FilterTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: string[];
  activeTab: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
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
    </div>
  );
}

export function DataTable<RecordType extends DataRecord>({
  columns,
  records,
  sortKey,
  sortDirection,
  onSort,
  onOpen,
  renderActions,
  enableBulkActions,
  selectedIds,
  onSelectedIdsChange,
  pagination,
}: {
  columns: DataColumn<RecordType>[];
  records: RecordType[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (column: DataColumn<RecordType>) => void;
  onOpen: (record: RecordType) => void;
  renderActions: (record: RecordType) => ReactNode;
  enableBulkActions: boolean;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  pagination: ReactNode;
}) {
  const allSelected = records.length > 0 && records.every((record) => selectedIds.includes(record.id));

  return (
    <UnifiedTableSurface>
      <UnifiedTableViewport>
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
          <DataTableHeader
            columns={columns}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
            enableBulkActions={enableBulkActions}
            allSelected={allSelected}
            onToggleAll={() =>
              onSelectedIdsChange(
                allSelected
                  ? selectedIds.filter((id) => !records.some((record) => record.id === id))
                  : [...new Set([...selectedIds, ...records.map((record) => record.id)])],
              )
            }
          />
          <tbody>
            {records.map((record) => (
              <DataTableRow
                key={record.id}
                record={record}
                columns={columns}
                onOpen={() => onOpen(record)}
                actions={renderActions(record)}
                enableBulkActions={enableBulkActions}
                selected={selectedIds.includes(record.id)}
                onSelectedChange={(checked) =>
                  onSelectedIdsChange(
                    checked ? [...selectedIds, record.id] : selectedIds.filter((id) => id !== record.id),
                  )
                }
              />
            ))}
          </tbody>
        </table>
      </UnifiedTableViewport>
      {pagination}
    </UnifiedTableSurface>
  );
}

export function DataTableHeader<RecordType extends DataRecord>({
  columns,
  sortKey,
  sortDirection,
  onSort,
  enableBulkActions,
  allSelected,
  onToggleAll,
}: {
  columns: DataColumn<RecordType>[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (column: DataColumn<RecordType>) => void;
  enableBulkActions: boolean;
  allSelected: boolean;
  onToggleAll: () => void;
}) {
  return (
    <thead className="sticky top-0 z-10 bg-[#f8fafc]">
      <tr>
        {enableBulkActions ? (
          <th className={cn("w-12", unifiedTableHeaderClass)}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
              aria-label="Select all rows"
            />
          </th>
        ) : null}
        {columns.map((column) => (
          <th key={column.key} className={cn(unifiedTableHeaderClass, column.className)}>
            <button
              type="button"
              onClick={() => onSort(column)}
              className="flex items-center gap-2 text-[12px] font-semibold text-black transition hover:text-primary"
            >
              {column.label}
              <Sort className={cn("h-4 w-4", sortKey === column.key ? "text-primary" : "text-muted")} aria-hidden="true" />
              {sortKey === column.key ? <span className="sr-only">sorted {sortDirection}</span> : null}
            </button>
          </th>
        ))}
        <th className={cn("w-24 text-right", unifiedTableHeaderClass)}>Actions</th>
      </tr>
    </thead>
  );
}

export function DataTableRow<RecordType extends DataRecord>({
  record,
  columns,
  onOpen,
  actions,
  enableBulkActions,
  selected,
  onSelectedChange,
}: {
  record: RecordType;
  columns: DataColumn<RecordType>[];
  onOpen: () => void;
  actions: ReactNode;
  enableBulkActions: boolean;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
}) {
  return (
    <tr className="group transition hover:bg-[#f8fafc]">
      {enableBulkActions ? (
        <td className={unifiedTableCellClass}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange(event.target.checked)}
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
            aria-label={`Select ${record.title}`}
          />
        </td>
      ) : null}
      {columns.map((column) => (
        <td key={`${record.id}-${column.key}`} className={cn(unifiedTableCellClass, column.className)}>
          <button
            type="button"
            onClick={onOpen}
            className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            {column.render(record)}
          </button>
        </td>
      ))}
      <td className={cn(unifiedTableCellClass, "text-right")}>{actions}</td>
    </tr>
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
  onEdit?: () => void;
  onArchive?: () => void;
  onDownload?: () => void;
  onCycleStatus?: () => void;
  onRoleChange?: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasMenuActions = Boolean(onEdit || onArchive || onDownload || onCycleStatus || onRoleChange);

  return (
    <div className="relative inline-flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onView();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-[#e4e7ec] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        aria-label={`View ${record.title}`}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </button>
      {hasMenuActions ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-[#e4e7ec] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          aria-label={`Open actions for ${record.title}`}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
      {open && hasMenuActions ? (
        <div className="absolute right-0 top-10 z-20 w-52 rounded-lg border border-card-border bg-surface p-1 text-left shadow-[0_18px_44px_rgba(7,22,51,0.14)]">
          <ActionItem icon={Eye} label="View details" onClick={onView} />
          {onEdit ? <ActionItem icon={Edit} label="Edit locally" onClick={onEdit} /> : null}
          {onDownload ? <ActionItem icon={Download} label="Download" onClick={onDownload} /> : null}
          {onCycleStatus ? <ActionItem icon={Refresh} label={record.status === "Published" ? "Unpublish" : "Update status"} onClick={onCycleStatus} /> : null}
          {onRoleChange ? (
            <label className="mt-1 block border-t border-card-border px-3 py-2 text-xs font-semibold text-muted">
              Role
              <select
                value={record.filters.role}
                onChange={(event) => onRoleChange(event.target.value)}
                className="mt-2 h-9 w-full rounded-lg border border-card-border bg-soft-bg px-2 text-xs text-navy outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {["Operations Lead", "Clinical Reviewer", "Finance", "Viewer"].map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          ) : null}
          {onArchive ? <ActionItem icon={Trash} label="Archive locally" danger onClick={onArchive} /> : null}
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
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function DetailModal<RecordType extends DataRecord>({
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
  onEdit?: () => void;
  onArchive?: () => void;
  onAction: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close details" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${title} details`}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.16)]"
      >
        <div className="border-b border-card-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[var(--pulse-tracking-eyebrow)] text-primary">{eyebrow}</p>
              <h2 className="mt-2 text-xl font-semibold text-navy">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-subtle">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-card-border text-muted transition hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              aria-label="Close details"
            >
              <CloseCircle className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {record.warning ? <WarningState message={record.warning} /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {record.details.map((item) => (
              <div key={`${record.id}-${item.label}`} className="rounded-lg border border-card-border bg-soft-bg p-4">
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
                <div key={`${record.id}-field-${item.label}`} className="flex items-center justify-between gap-4 rounded-lg border border-card-border bg-white p-3">
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
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-white p-3">
                    <span className="text-sm font-semibold text-navy">{item.label}</span>
                    <StatusBadge status={item.done ? "Complete" : "Pending"} tone={item.done ? "success" : "warning"} />
                  </div>
                ))}
              </div>
            </DashboardWidget>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-card-border p-5">
          {onEdit ? (
            <ActionButton onClick={onEdit}>
              <Edit className="mr-2 h-5 w-5" aria-hidden="true" />
              Edit details
            </ActionButton>
          ) : null}
          <ActionButton variant="secondary" onClick={onAction}>{actionLabel}</ActionButton>
          {onArchive ? (
            <ActionButton variant="secondary" className="text-pulse-red" onClick={onArchive}>Archive</ActionButton>
          ) : null}
        </div>
      </section>
    </div>
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
    <UnifiedTablePagination
      page={page}
      totalPages={totalPages}
      rowsPerPage={rowsPerPage}
      totalRows={totalRows}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
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
        <ActionButton variant="secondary" className="h-9 px-3" onClick={onClear}>Clear</ActionButton>
        <ActionButton className="h-9 px-3" onClick={onAction}>Apply action</ActionButton>
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
        <Eye className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-subtle">{description}</p>
      <ActionButton className="mt-5" variant="secondary" onClick={onReset}>Clear filters</ActionButton>
    </DashboardWidget>
  );
}

export function LoadingState() {
  return (
    <DashboardWidget className="overflow-hidden" aria-label="Loading records">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="grid grid-cols-5 gap-4 border-b border-card-border p-4">
          <div className="h-4 animate-pulse rounded bg-card-border" />
          <div className="h-4 animate-pulse rounded bg-card-border" />
          <div className="h-4 animate-pulse rounded bg-card-border" />
          <div className="h-4 animate-pulse rounded bg-card-border" />
          <div className="h-4 animate-pulse rounded bg-card-border" />
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
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          {message}
        </p>
        <ActionButton variant="secondary" className="h-9 px-3" onClick={onRetry}>Retry</ActionButton>
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
      <div className="w-full max-w-2xl rounded-lg border border-card-border bg-surface shadow-[0_24px_70px_rgba(7,22,51,0.18)]">
        <div className="border-b border-card-border p-5">
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
        <div className="flex flex-wrap justify-end gap-2 border-t border-card-border p-5">
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{initials}</span>
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

export function listField(record: DataRecord, label: string) {
  return field(record, label) || detail(record, label);
}

function toneText(tone: DetailTone) {
  if (tone === "danger") return "text-pulse-red";
  if (tone === "warning") return "text-warning";
  if (tone === "success") return "text-success";
  if (tone === "primary" || tone === "info") return "text-primary";
  return "text-navy";
}
