import { loadClientDashboardStats } from "@/app/actions/client-dashboard";
import { PortalMetricCard } from "@/components/portal/PortalMetricCard";
import { CalendarCheck, ClipboardCheck, FileText, UsersRound } from "@/components/icons/IconsaxIcons";

const formatNumber = (value: number) => value.toLocaleString("en-BW");
const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone",
});

export default async function ClientDashboardPage() {
  const stats = await loadClientDashboardStats();
  const hasWorkforce = stats.workforceSize > 0;
  const exceedsWorkforce = hasWorkforce && stats.participantsScreened > stats.workforceSize;
  const participationAvailable = hasWorkforce && !exceedsWorkforce;
  const attention = !hasWorkforce
    ? { title: "Confirm your workforce size", description: "Ask your Pulse80 coordinator to update your employee count so participation can be calculated." }
    : exceedsWorkforce
      ? { title: "Check the workforce and participant counts", description: "The all-time participant count is higher than the current workforce. Ask your Pulse80 coordinator to review the figures before using a participation percentage." }
      : stats.participantsScreened === 0
        ? { title: "No approved screening results yet", description: "If screening has taken place, ask your Pulse80 coordinator when the results will be reviewed. Employees appear here after their results are approved." }
        : { title: "Review your screening reach", description: `${formatNumber(stats.participantsScreened)} unique participants have approved results against a current workforce of ${formatNumber(stats.workforceSize)}. Discuss participation gaps with your Pulse80 coordinator before planning the next session.` };

  return (
    <div className="space-y-6 text-black">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-black/60">{stats.organisationName}</p>
          <h1 className="mt-1 text-2xl font-semibold">Your workforce wellness overview</h1>
          <p className="mt-2 text-sm text-black/65">Understand your screening reach and prepare for what comes next.</p>
        </div>
        <div className="text-xs text-black/60">
          <p className="inline-flex rounded-full border border-card-border bg-white px-3 py-1.5 font-medium text-black">Screening period: All time</p>
          <p className="mt-2">Retrieved {dateTime.format(new Date(stats.refreshedAt))} CAT</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalMetricCard label="Employees Screened" value={formatNumber(stats.participantsScreened)} detail="Unique participants with approved results · all time" icon={UsersRound} />
        <PortalMetricCard label="Screening Participation" value={participationAvailable ? `${stats.screeningParticipation}%` : "Unavailable"} detail={participationAvailable ? `Against ${formatNumber(stats.workforceSize)} employees in the current workforce` : "Workforce count needs review"} icon={ClipboardCheck} />
        <PortalMetricCard label="Upcoming Activities" value={formatNumber(stats.upcomingActivations)} detail="Future activities · scheduled or in planning" icon={CalendarCheck} />
        <PortalMetricCard label="Reports Available" value="Not available yet" detail="Published reports are not connected to this dashboard" icon={FileText} />
      </div>

      <section className="rounded-2xl border border-card-border bg-white p-5 sm:p-6" aria-labelledby="attention-title">
        <p className="text-xs font-semibold uppercase tracking-wider text-black/55">Your next step</p>
        <h2 id="attention-title" className="mt-2 text-sm font-semibold">{attention.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/70">{attention.description}</p>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-card-border bg-white p-5 sm:p-6 lg:col-span-3" aria-labelledby="reach-title">
          <h2 id="reach-title" className="text-sm font-semibold">Screening reach</h2>
          <p className="mt-1 text-xs text-black/60">Each participant is counted once, even when they receive several services.</p>
          <div className="my-6 flex items-end justify-between gap-4">
            <p><span className="text-3xl font-semibold">{formatNumber(stats.participantsScreened)}</span><span className="ml-2 text-xs text-black/60">participants screened</span></p>
            <p className="text-sm font-medium">{participationAvailable ? `${stats.screeningParticipation}%` : "Percentage unavailable"}</p>
          </div>
          {participationAvailable ? <div role="progressbar" aria-label="Screening participation against current workforce" aria-valuenow={stats.screeningParticipation} aria-valuemin={0} aria-valuemax={100} className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${stats.screeningParticipation}%` }} /></div> : null}
          <p className="mt-4 text-xs leading-5 text-black/60">All-time approved participants are compared with the current workforce size. This is not a quarterly measure and may include employees who have since left.</p>
          <div className="mt-6 border-t border-card-border pt-4">
            <h3 className="text-xs font-semibold">Department and branch comparisons</h3>
            <p className="mt-1 text-xs leading-5 text-black/60">Not available yet. No department risk or participation conclusions are shown until supporting information is available.</p>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-card-border bg-white p-5 sm:p-6" aria-labelledby="activities-title">
            <h2 id="activities-title" className="text-sm font-semibold">Upcoming activities</h2>
            <p className="mt-1 text-xs text-black/60">Next five scheduled activities or activities in planning.</p>
            {stats.upcomingActivities.length ? <ul className="mt-4 divide-y divide-card-border">{stats.upcomingActivities.map(activity => <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">{activity.title}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{activity.status}</span></div>
              <p className="mt-2 text-xs text-black/70"><time dateTime={activity.startsAt}>{dateTime.format(new Date(activity.startsAt))} CAT</time></p>
              <p className="mt-1 text-xs text-black/60">{activity.location || "Location to be confirmed"}</p>
            </li>)}</ul> : <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-sm font-medium">No upcoming activities recorded</p><p className="mt-2 text-xs leading-5 text-black/60">Contact your Pulse80 coordinator to discuss your next wellness activity.</p></div>}
          </section>
          <section className="rounded-2xl border border-card-border bg-white p-5 sm:p-6" aria-labelledby="reports-title">
            <h2 id="reports-title" className="text-sm font-semibold">Latest reports</h2>
            <p className="mt-3 text-sm">Reports are not available here yet.</p>
            <p className="mt-2 text-xs leading-5 text-black/60">Contact your Pulse80 coordinator if you need a screening summary or an existing published report.</p>
          </section>
        </div>
      </div>
      <p className="text-xs text-black/55">Organisation-level summary. Individual health results are not displayed on this dashboard.</p>
    </div>
  );
}
