"use client";
import { useEffect, useState } from "react";
import { loadAdminOrganisationProgrammeReports } from "@/app/actions/programme-reports";
import { ProgrammeInterimReportCard } from "@/components/reports/ProgrammeInterimReportCard";
import type { ProgrammeInterimReport } from "@/app/actions/programme-roster";

export function OrganisationProgrammeReports({ organisationId }: { organisationId: string }) {
  const [reports,setReports] = useState<ProgrammeInterimReport[] | null>(null);
  const [error,setError] = useState(false);
  useEffect(() => { let active=true; loadAdminOrganisationProgrammeReports(organisationId).then(v=>active&&setReports(v.reports)).catch(()=>active&&setError(true)); return()=>{active=false}; },[organisationId]);
  if (error) return <p role="alert" className="text-sm">Programme reports could not be loaded.</p>;
  if (!reports) return <p role="status" className="text-sm text-muted">Loading programme reports…</p>;
  if (!reports.length) return <p className="text-sm text-muted">No programmes are available for this organisation yet.</p>;
  return <section className="space-y-4"><div><h2 className="font-semibold">Programme reports</h2><p className="mt-1 text-sm text-muted">Live interim reports update from captured programme screening data.</p></div>{reports.map(report=><ProgrammeInterimReportCard key={report.programmeId} report={report}/>)}</section>;
}
