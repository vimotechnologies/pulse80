"use client";
import { useState } from "react";
import { downloadPdf } from "@/lib/pdf/download";
import type { ProgrammeInterimReport } from "@/app/actions/programme-roster";

const pct = (value: number | null) => value === null ? "Not available" : `${value.toFixed(1)}%`;
const date = (value: string) => new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeZone: "Africa/Gaborone" }).format(new Date(value));
const time = (value: string) => new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone" }).format(new Date(value));

export function ProgrammeInterimReportCard({ report }: { report: ProgrammeInterimReport }) {
  const [busy, setBusy] = useState(false);
  const riskTotal = report.riskDistribution.reduce((n,r) => n + r.screeningCount, 0);
  const lines = [
    `Organisation: ${report.organisationName}`, `Programme: ${report.programmeName}`,
    `Programme period: ${date(report.startsOn)} - ${date(report.endsOn)}`,
    ...(report.location ? [`Location: ${report.location}`] : []),
    `Programme status: ${report.programmeStatus}`, `As at: ${time(report.generatedAt)}`,
  ];
  async function pdf() {
    setBusy(true);
    try {
      await downloadPdf({
        title: "Interim Programme Report",
        subtitle: `${report.programmeName} | As at ${time(report.generatedAt)}`,
        client: { name: report.organisationName, logoUrl: report.organisationLogoUrl },
        sections: [
          { title: "Programme Overview", lines },
          { title: "Participation Summary", lines: [
            `Registered participants: ${report.registeredParticipants}`, `Participants screened: ${report.participantsScreened}`,
            `Participation rate: ${pct(report.participationRate)}`, `Screenings captured: ${report.screeningsCaptured}`,
            `Completed screenings: ${report.completedScreenings}`,
          ]},
          { title: "Screening Services (Activity)", lines: report.serviceActivity.length ? report.serviceActivity.map(s =>
            `${s.service}: ${s.screeningsCaptured} captured | ${s.completedScreenings} completed | ${s.participantsScreened} participants`) : ["No screening activity captured yet."] },
          { title: "Health Risk Profile", lines: riskTotal ? report.riskDistribution.map(r =>
            `${r.riskCategory}: ${r.screeningCount} (${((r.screeningCount/riskTotal)*100).toFixed(1)}%)`) : ["No completed screening risk results yet."] },
          { title: "Referrals and Escalations", lines: [`Referrals required: ${report.referralsRequired}`, `Escalations required: ${report.escalationsRequired}`] },
          { title: "Interim Notice", lines: [report.disclaimer] },
        ],
      });
    } finally { setBusy(false); }
  }
  return <article className="overflow-hidden rounded-xl border border-card-border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
    <div className="flex flex-col gap-4 border-b border-card-border bg-[#f8fafc] p-5 md:flex-row md:items-start md:justify-between">
      <div><span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Interim report</span>
        <h3 className="mt-3 text-lg font-semibold text-black">{report.programmeName}</h3>
        <p className="mt-1 text-xs text-black/55">As at {time(report.generatedAt)} · figures update as screening records are captured and completed.</p></div>
      <button type="button" disabled={busy} onClick={() => void pdf()} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Preparing…" : "Download PDF"}</button>
    </div>
    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Registered", report.registeredParticipants.toLocaleString()],
        ["Screened", report.participantsScreened.toLocaleString()],
        ["Participation", pct(report.participationRate)],
        ["Screenings captured", report.screeningsCaptured.toLocaleString()],
        ["Completed", report.completedScreenings.toLocaleString()],
      ].map(([label,value]) => <div key={label} className="rounded-lg border border-card-border p-4"><p className="text-xs text-black/55">{label}</p><p className="mt-1 text-2xl font-semibold text-black">{value}</p></div>)}
    </div>
    <div className="grid gap-6 border-t border-card-border p-5 lg:grid-cols-2">
      <section><h4 className="text-sm font-semibold">Screening activity</h4><div className="mt-3 space-y-2">{report.serviceActivity.length ? report.serviceActivity.map(s =>
        <div key={s.service} className="flex justify-between rounded-lg bg-[#f8fafc] px-3 py-2 text-xs"><span>{s.service}</span><span className="font-semibold">{s.screeningsCaptured} captured · {s.completedScreenings} completed</span></div>) : <p className="text-sm text-black/55">No screenings captured yet.</p>}</div></section>
      <section><h4 className="text-sm font-semibold">Risk and referral snapshot</h4><div className="mt-3 grid grid-cols-2 gap-2">
        {report.riskDistribution.map(r => <div key={r.riskCategory} className="rounded-lg bg-[#f8fafc] p-3 text-xs"><p className="text-black/55">{r.riskCategory}</p><p className="mt-1 text-lg font-semibold">{r.screeningCount}</p></div>)}
        <div className="rounded-lg bg-[#f8fafc] p-3 text-xs"><p className="text-black/55">Referrals required</p><p className="mt-1 text-lg font-semibold">{report.referralsRequired}</p></div>
        <div className="rounded-lg bg-[#f8fafc] p-3 text-xs"><p className="text-black/55">Escalations required</p><p className="mt-1 text-lg font-semibold">{report.escalationsRequired}</p></div>
      </div></section>
    </div>
    <p className="border-t border-card-border bg-primary/5 px-5 py-3 text-xs text-black/65">{report.disclaimer}</p>
  </article>;
}
