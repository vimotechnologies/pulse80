import type { ClientAnalytics } from "@/app/actions/analytics";

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-BW", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("en-BW", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value)}%`;
}

export function percentage(completed: number, total: number) {
  return total > 0 ? (completed / total) * 100 : 0;
}

export function analyticsUiState(analytics?: ClientAnalytics, error?: string) {
  if (error) return "error" as const;
  if (analytics && !analytics.hasData) return "empty" as const;
  if (analytics) return "success" as const;
  return "loading" as const;
}
