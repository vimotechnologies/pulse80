import { loadAdminPortalAnalytics } from "@/app/actions/admin-dashboard";
import { loadRecordWorkspace } from "@/app/actions/portal-records";
import { AdminOperationsPage } from "@/components/admin/AdminOperationsPage";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
export default async function AdminReportsPage() {
  const [workspace, analytics] = await Promise.all([loadRecordWorkspace("report"), loadAdminPortalAnalytics().catch(() => null)]);
  return <div className="space-y-8">
    {analytics ? <AdminOperationsPage configId="reports" analytics={analytics} /> : <p role="status" className="text-sm text-muted">Analytics are currently unavailable while this feature is under development. Saved reports remain available below.</p>}
    <RecordWorkspace kind="report" workspace={workspace} />
  </div>;
}
