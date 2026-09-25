"use client";

import * as React from "react";

import { ArrowLeft2, ArrowRight } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2026, month, 1)));
const weekdayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function Calendar({ selected, onSelect, className }: { selected?: Date; onSelect?: (date: Date) => void; className?: string }) {
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date(selected?.getFullYear() ?? new Date().getFullYear(), selected?.getMonth() ?? new Date().getMonth(), 1));
  const today = new Date();
  const yearStart = Math.min(today.getFullYear() - 10, (selected?.getFullYear() ?? today.getFullYear()) - 2);
  const yearEnd = Math.max(today.getFullYear() + 30, (selected?.getFullYear() ?? today.getFullYear()) + 2);
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) => yearStart + index);
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className={cn("w-[292px] select-none", className)}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border text-subtle hover:bg-soft-bg hover:text-navy"><ArrowLeft2 className="h-4 w-4" /></button>
        <div className="flex min-w-0 flex-1 gap-2">
          <select aria-label="Month" value={visibleMonth.getMonth()} onChange={(event) => setVisibleMonth(new Date(visibleMonth.getFullYear(), Number(event.target.value), 1))} className="h-9 min-w-0 flex-1 rounded-lg border border-card-border bg-white px-2 text-xs font-semibold outline-none focus:ring-4 focus:ring-primary/10">
            {monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}
          </select>
          <select aria-label="Year" value={visibleMonth.getFullYear()} onChange={(event) => setVisibleMonth(new Date(Number(event.target.value), visibleMonth.getMonth(), 1))} className="h-9 w-24 rounded-lg border border-card-border bg-white px-2 text-xs font-semibold outline-none focus:ring-4 focus:ring-primary/10">
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border text-subtle hover:bg-soft-bg hover:text-navy"><ArrowRight className="h-4 w-4" /></button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
        {weekdayNames.map((weekday) => <div key={weekday} className="py-1.5">{weekday}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date) => {
          const isSelected = selected ? sameDay(date, selected) : false;
          const isToday = sameDay(date, today);
          const isOutside = date.getMonth() !== visibleMonth.getMonth();
          return (
            <button
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              type="button"
              aria-label={new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(date)}
              aria-pressed={isSelected}
              onClick={() => onSelect?.(date)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-xs transition hover:bg-soft-bg",
                isOutside && "text-muted/45",
                isToday && !isSelected && "border border-primary/30 font-semibold text-primary",
                isSelected && "bg-primary font-semibold text-white hover:bg-primary",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
