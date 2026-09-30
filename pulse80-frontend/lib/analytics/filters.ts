import type { AnalyticsFilters } from "@/app/actions/analytics";

type SearchParams = Record<string, string | string[] | undefined>;

export function analyticsFilters(params: SearchParams): AnalyticsFilters {
  return {
    programmeId: first(params.programmeId),
    branch: first(params.branch),
    department: first(params.department),
    from: date(first(params.from)),
    to: date(first(params.to)),
  };
}

function first(value: string | string[] | undefined) {
  const result = Array.isArray(value) ? value[0] : value;
  return result?.trim() || undefined;
}

function date(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}
