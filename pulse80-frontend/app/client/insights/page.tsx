import { loadClientDashboardStats } from "@/app/actions/client-dashboard";
import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";

export default async function ClientInsightsPage() {
  const stats = await loadClientDashboardStats();

  return <ClientExecutivePage configId="insights" stats={stats} />;
}
