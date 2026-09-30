import { loadClientAnalytics } from "@/app/actions/analytics";
import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { analyticsFilters } from "@/lib/analytics/filters";

export default async function ClientDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = analyticsFilters(await searchParams);
  let analytics;
  let analyticsError: string | undefined;
  try {
    analytics = await loadClientAnalytics(filters);
  } catch {
    analyticsError = "Analytics could not be loaded. Check the backend connection and try again.";
  }
  return <div className="space-y-4"><AnalyticsFilterBar filters={filters} /><ClientExecutivePage configId="dashboard" analytics={analytics} analyticsError={analyticsError} /></div>;
}
