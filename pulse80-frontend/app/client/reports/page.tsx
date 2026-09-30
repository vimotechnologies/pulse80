import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";
import { loadClientAnalytics } from "@/app/actions/analytics";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { analyticsFilters } from "@/lib/analytics/filters";

export default async function ClientReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = analyticsFilters(await searchParams);
  let analytics;
  let analyticsError: string | undefined;
  try {
    analytics = await loadClientAnalytics(filters);
  } catch {
    analyticsError = "Analytics could not be loaded. Check the backend connection and try again.";
  }
  return <div className="space-y-4"><AnalyticsFilterBar filters={filters} /><ClientExecutivePage configId="reports" analytics={analytics} analyticsError={analyticsError} /></div>;
}
