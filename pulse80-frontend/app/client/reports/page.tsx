import { loadClientDashboardStats } from "@/app/actions/client-dashboard";
import { loadOrganisationRecords } from "@/app/actions/portal-records";
import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
export default async function ClientReportsPage() {
  const [records, stats] = await Promise.all([loadOrganisationRecords("report"), loadClientDashboardStats().catch(() => null)]);
  return <div className="space-y-8">
    {stats ? <ClientExecutivePage configId="reports" stats={stats} /> : <p role="status" className="text-sm text-muted">Analytics are currently unavailable while this feature is under development. Published reports remain available below.</p>}
    <RecordWorkspace kind="report" workspace={{ records, organisations: [], practitioners: [], canManage: false }} />
  </div>;
}
