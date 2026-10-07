"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadOrganisationOperations } from "@/app/actions/portal-records";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
import { OrganisationProgrammeReports } from "@/components/reports/OrganisationProgrammeReports";
export function OrganisationOperations({ organisationId }: { organisationId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadOrganisationOperations>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; void loadOrganisationOperations(organisationId).then(result => { if (active) setData(result); }).catch(() => { if (active) setError("Could not load operations. Check your permissions and try again."); }); return () => { active = false; }; }, [organisationId]);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Loading organisation operations…</p>;
  return <div className="space-y-6"><OrganisationProgrammeReports organisationId={organisationId} /><section className="space-y-3"><h2 className="font-semibold">Activations</h2><Link className="text-sm text-primary underline" href="/admin/activations">Manage activations</Link>{!data.adminOrganisationActivations.length && <p className="text-sm text-muted">No activations recorded.</p>}{data.adminOrganisationActivations.map(item => <div key={item.id} className="rounded border p-3 text-sm">{item.title} · {new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeZone: "Africa/Gaborone" }).format(new Date(item.startsAt))} · {item.location} · {item.status}</div>)}</section><RecordWorkspace kind="report" workspace={{ records: data.adminOrganisationRecords, organisations: [], practitioners: [], canManage: false }} /></div>;
}
