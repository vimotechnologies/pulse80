import { loadClientDashboardStats } from "@/app/actions/client-dashboard";
import { loadOrganisationRecords } from "@/app/actions/portal-records";
import { loadClientProgrammeReports } from "@/app/actions/programme-reports";
import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
import { ProgrammeInterimReportCard } from "@/components/reports/ProgrammeInterimReportCard";
export default async function ClientReportsPage() {
  const [records, stats, programmeReports] = await Promise.all([
    loadOrganisationRecords("report"), loadClientDashboardStats().catch(() => null), loadClientProgrammeReports().catch(() => null),
  ]);
  return <div className="space-y-8">
    {stats ? <ClientExecutivePage configId="reports" stats={stats} /> : <p role="status" className="text-sm text-muted">Analytics are currently unavailable while this feature is under development. Published reports remain available below.</p>}
    <section className="space-y-4"><div><h2 className="text-lg font-semibold">Programme reports</h2><p className="text-sm text-muted">Interim reports reflect screening data captured so far and update as the programme progresses.</p></div>
      {programmeReports?.reports.length ? programmeReports.reports.map(report => <ProgrammeInterimReportCard key={report.programmeId} report={report} />) : <p className="rounded-lg border border-card-border bg-white p-5 text-sm text-muted">No programme reports are available yet.</p>}
    </section>
    <RecordWorkspace kind="report" workspace={{ records, organisations: [], practitioners: [], canManage: false }} />
  </div>;
}
