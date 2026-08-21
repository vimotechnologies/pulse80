import { loadClientDashboardStats } from "@/app/actions/client-dashboard";
import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";

export default async function ClientDashboardPage() {
  const stats = await loadClientDashboardStats();

  return <ClientExecutivePage configId="dashboard" stats={stats} />;
}
