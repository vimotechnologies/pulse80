import { loadAdminPortalAnalytics } from "@/app/actions/admin-dashboard";
import { AdminOperationsPage } from "@/components/admin/AdminOperationsPage";
export default async function AdminInsightsPage() {
  const analytics = await loadAdminPortalAnalytics().catch(() => null);
  return analytics ? <AdminOperationsPage configId="insights" analytics={analytics} /> : <section><h1 className="text-xl font-semibold">Insights</h1><p role="status" className="mt-3 text-sm text-muted">Analytics are under development and could not be loaded. Please try again later.</p></section>;
}
