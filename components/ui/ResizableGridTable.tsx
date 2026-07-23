"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { PulseCard } from "@/components/ui/PulseCard";

export type ResizableGridColumn = {
  key: string;
  label: string;
  width: number;
  minWidth?: number;
  header?: ReactNode;
  headerClassName?: string;
};

type ResizableGridTableProps<RowType> = {
  columns: ResizableGridColumn[];
  rows: RowType[];
  getRowKey: (row: RowType) => string;
  renderRow: (row: RowType, gridTemplateColumns: string) => ReactNode;
  className?: string;
  framed?: boolean;
};

export function ResizableGridTable<RowType>({
  columns,
  rows,
  getRowKey,
  renderRow,
  className,
  framed = true,
}: ResizableGridTableProps<RowType>) {
  const [widths, setWidths] = useState(() => columns.map((column) => column.width));
  const gridTemplateColumns = useMemo(() => widths.map((width) => `${width}px`).join(" "), [widths]);
  const tableWidth = useMemo(() => widths.reduce((total, width) => total + width, 0), [widths]);

  function startResize(columnIndex: number, startX: number) {
    const startWidth = widths[columnIndex];
    const minWidth = columns[columnIndex]?.minWidth ?? 96;

    function resize(event: PointerEvent) {
      const nextWidth = Math.max(minWidth, startWidth + event.clientX - startX);
      setWidths((current) => current.map((width, index) => (index === columnIndex ? nextWidth : width)));
    }

    function stopResize() {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
    }

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize);
  }

  const content = (
      <div className="overflow-x-auto">
        <div className="min-w-full" style={{ width: tableWidth }}>
          <div
            className="grid bg-[#f8fafc] px-5 py-3 text-[11px] font-semibold uppercase text-black/70"
            style={{ gridTemplateColumns }}
          >
            {columns.map((column, index) => (
              <span key={column.key} className={cn("relative min-w-0 pr-4", column.headerClassName)}>
                {column.header ?? <span className="block truncate">{column.label}</span>}
                {index < columns.length - 1 ? (
                  <button
                    type="button"
                    aria-label={`Resize ${column.label} column`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      startResize(index, event.clientX);
                    }}
                    className="absolute right-0 top-1/2 h-6 w-2 -translate-y-1/2 cursor-col-resize rounded-full transition hover:bg-[#d0d5dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                ) : null}
              </span>
            ))}
          </div>
          <div>
            {rows.map((row) => (
              <div key={getRowKey(row)} className="border-t border-[#d0d5dd]">
                {renderRow(row, gridTemplateColumns)}
              </div>
            ))}
          </div>
        </div>
      </div>
  );

  if (!framed) {
    return <div className={className}>{content}</div>;
  }

  return (
    <PulseCard className={cn("overflow-hidden", className)}>
      {content}
    </PulseCard>
  );
}
