import type { ReactNode } from "react";
import {
  ArrowDown,
  Download,
  Refresh,
  Search,
  Sort,
} from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

export function UnifiedFilterCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-card-border bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      {children}
    </section>
  );
}

export function UnifiedFilterSearch({
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
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#43536b]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-card-border bg-white pl-4 pr-10 text-[12px] font-medium text-black outline-none transition placeholder:text-[#667085] focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

export function UnifiedFilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-card-border bg-white pl-4 pr-10 text-[12px] font-medium text-black outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
      <ArrowDown
        className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#43536b]"
        aria-hidden="true"
      />
    </label>
  );
}

export function UnifiedFilterSort({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-card-border bg-white pl-4 pr-20 text-[12px] font-medium text-black outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-3 text-[#43536b]">
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        <Sort className="h-3.5 w-3.5" aria-hidden="true" />
        <Refresh className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </label>
  );
}

export function UnifiedFilterClear({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center px-2 text-[12px] font-semibold text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        className,
      )}
    >
      Clear Filters
    </button>
  );
}

export function UnifiedFilterAction({
  onClick,
  children = "Export",
  className,
}: {
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-card-border bg-white px-4 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        className,
      )}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
