import type { AnalyticsFilters } from "@/app/actions/analytics";

export function AnalyticsFilterBar({ filters }: { filters: AnalyticsFilters }) {
  return (
    <form method="get" className="grid gap-3 rounded-xl border border-card-border bg-surface p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
      <FilterInput name="programmeId" label="Programme ID" value={filters.programmeId} />
      <FilterInput name="branch" label="Branch" value={filters.branch} />
      <FilterInput name="department" label="Department" value={filters.department} />
      <FilterInput name="from" label="From" value={filters.from} type="date" />
      <FilterInput name="to" label="To" value={filters.to} type="date" />
      <div className="flex items-end gap-2">
        <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white">Apply filters</button>
        <a href="?" className="rounded-lg border border-card-border px-4 py-2.5 text-xs font-semibold text-navy">Clear</a>
      </div>
    </form>
  );
}

function FilterInput({ name, label, value, type = "text" }: { name: string; label: string; value?: string; type?: string }) {
  return (
    <label className="text-xs font-semibold text-navy">
      {label}
      <input name={name} type={type} defaultValue={value ?? ""} className="mt-2 w-full rounded-lg border border-card-border bg-white px-3 py-2.5 text-sm font-normal text-navy outline-none focus:border-primary" />
    </label>
  );
}
