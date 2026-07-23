"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRotateLeft,
  Search,
} from "@/components/icons/IconsaxIcons";
import { PulseCard } from "@/components/ui/PulseCard";
import { cn } from "@/lib/utils/cn";

type ListFilterCardProps = {
  search: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  filterGridClassName?: string;
};

export const practitionerFilterGridClass =
  "xl:grid-cols-[minmax(120px,0.85fr)_minmax(190px,1.35fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(170px,1.1fr)]";

export function ListFilterCard({
  search,
  actions,
  children,
  className,
  filterGridClassName,
}: ListFilterCardProps) {
  return (
    <PulseCard className={cn("p-3", className)}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {search}
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className={cn("mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-4", filterGridClassName)}>
        {children}
      </div>
    </PulseCard>
  );
}

export function ListSearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={cn("relative w-full max-w-[432px]", className)}>
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/55" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-[#d0d5dd] bg-white pl-10 pr-4 text-[13px] text-black outline-none transition placeholder:text-black/45 focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

export function ListFilterField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [touched, setTouched] = useState(false);
  const placeholder = value === "All" && !touched;
  const selectValue = placeholder ? "" : value;
  const displayValue = placeholder ? label : value;

  return (
    <label className="group relative min-w-0">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none flex h-9 w-full items-center truncate rounded-lg border border-[#d0d5dd] bg-white px-3 pr-9 text-[12px] font-medium text-black transition group-focus-within:ring-4 group-focus-within:ring-primary/10">
        {displayValue}
      </span>
      <select
        value={selectValue}
        onChange={(event) => {
          setTouched(true);
          onChange(event.target.value);
        }}
        className="absolute inset-0 h-9 w-full cursor-pointer appearance-none rounded-lg border border-[#d0d5dd] bg-transparent opacity-0 outline-none"
        title={displayValue}
      >
        {placeholder ? (
          <option value="" disabled>
            {label}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ArrowDown className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/60" aria-hidden="true" />
    </label>
  );
}

export function ListClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[12px] font-semibold text-primary transition hover:bg-black hover:text-white active:scale-[0.98] active:bg-primary active:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
    >
      <ArrowRotateLeft className="h-[18px] w-[18px]" aria-hidden="true" />
      Clear Filters
    </button>
  );
}
