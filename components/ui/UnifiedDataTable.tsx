import type { ReactNode } from "react";
import { ArrowLeft2, ArrowRight } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

export function UnifiedTableSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function UnifiedTableViewport({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export const unifiedTableHeaderClass =
  "border-b border-card-border bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold normal-case tracking-normal text-black";

export const unifiedTableCellClass =
  "border-b border-card-border px-4 py-3 align-middle text-[12px] text-black";

export function UnifiedTablePagination({
  page,
  totalPages,
  rowsPerPage,
  rowOptions = [5, 10, 20],
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: {
  page: number;
  totalPages: number;
  rowsPerPage: number;
  rowOptions?: number[];
  totalRows?: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-card-border px-4 py-3 text-[12px] text-black/60 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {page} of {totalPages}
        {typeof totalRows === "number" ? ` · ${totalRows} records` : ""}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-9 rounded-2xl border border-card-border bg-white px-3 text-[12px] font-medium text-black outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          aria-label="Rows per page"
        >
          {rowOptions.map((value) => (
            <option key={value} value={value}>
              {value} rows
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-2xl border border-card-border bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-2xl border border-card-border bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
