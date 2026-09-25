"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  acknowledgeDashboardAlert,
  confirmDashboardAssignment,
  declineDashboardAssignment,
  withdrawDashboardAssignment,
  type PractitionerDashboardData,
} from "@/app/actions/practitioner-dashboard";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { Activity, AlertCircle, CalendarCheck, ClipboardCheck, FileText, Location } from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UnifiedMetricCard } from "@/components/ui/UnifiedMetricCard";

type Assignment = PractitionerDashboardData["upcomingAssignments"][number];
type Correction = PractitionerDashboardData["recentCorrections"][number];

export function PractitionerDashboard({ dashboard }: { dashboard: PractitionerDashboardData }) {
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const metrics = [
    { label: "Upcoming Assignments", value: String(dashboard.stats.upcomingAssignments), detail: "Scheduled and confirmed", icon: CalendarCheck },
    { label: "Participants Screened", value: String(dashboard.stats.participantsScreened), detail: "All time", icon: ClipboardCheck },
    { label: "Screening Completion Rate", value: `${dashboard.stats.screeningCompletionRate}%`, detail: "All time", icon: Activity },
    { label: "Pending Corrections", value: String(dashboard.stats.pendingCorrections), detail: "Records needing attention", icon: FileText },
  ];

  function refresh() {
    setMessage(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Health Practitioner"
        title="Practitioner workspace"
        description="Review your upcoming assignments and screening corrections."
      />

      {message ? <p className="rounded-lg border border-card-border bg-white px-4 py-3 text-sm text-navy">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <UnifiedMetricCard key={metric.label} {...metric} />)}
      </section>

      {dashboard.assignmentAlert ? (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-navy">Assignment update</p>
              <p className="mt-1 text-sm text-subtle">{dashboard.assignmentAlert.message}</p>
              {dashboard.assignmentAlert.additionalAlertCount ? <p className="mt-1 text-xs font-medium text-warning">{dashboard.assignmentAlert.additionalAlertCount} more update(s)</p> : null}
            </div>
          </div>
          <ActionButton variant="secondary" loading={pending} onClick={() => startTransition(async () => {
            const result = await acknowledgeDashboardAlert(dashboard.assignmentAlert!.id);
            setMessage(result.ok ? "Assignment update acknowledged." : result.error);
            if (result.ok) refresh();
          })}>Acknowledge</ActionButton>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
        <DashboardWidget className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
            <div><h2 className="text-sm font-semibold text-navy">Upcoming Assignments</h2><p className="mt-1 text-xs text-muted">Your next five assignments</p></div>
            <Link href="/practitioner/assignments" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          {dashboard.upcomingAssignments.length ? (
            <div className="divide-y divide-card-border">
              {dashboard.upcomingAssignments.map((assignment) => (
                <button key={assignment.id} type="button" onClick={() => setSelectedAssignment(assignment)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#f8fafc] md:grid-cols-[1fr_180px_130px] md:items-center">
                  <div><p className="text-sm font-semibold text-navy">{assignment.activityName}</p><p className="mt-1 text-xs text-muted">{assignment.organisationName} · {assignment.services.join(", ") || "Services not assigned"}</p></div>
                  <div><p className="text-xs font-medium text-navy">{formatDate(assignment.startsAt)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><Location className="h-3.5 w-3.5" aria-hidden="true" />{assignment.location}</p></div>
                  <StatusBadge status={assignment.confirmationRequired ? "Confirmation required" : assignment.status} tone={assignment.confirmationRequired ? "warning" : "success"} />
                </button>
              ))}
            </div>
          ) : <p className="p-8 text-center text-sm text-muted">No upcoming assignments.</p>}
        </DashboardWidget>

        <DashboardWidget className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
            <div><h2 className="text-sm font-semibold text-navy">Pending Corrections</h2><p className="mt-1 text-xs text-muted">Five most recently returned records</p></div>
            <Link href="/practitioner/screenings" className="text-xs font-semibold text-primary">View all</Link>
          </div>
          {dashboard.recentCorrections.length ? (
            <div className="divide-y divide-card-border">
              {dashboard.recentCorrections.map((correction) => (
                <button key={correction.id} type="button" onClick={() => setSelectedCorrection(correction)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[#f8fafc]">
                  <div><p className="text-sm font-semibold text-navy">{correction.participantReference}</p><p className="mt-1 text-xs text-muted">{correction.assignmentName}</p></div>
                  <StatusBadge status={`${correction.errorCount} error${correction.errorCount === 1 ? "" : "s"}`} tone="warning" />
                </button>
              ))}
            </div>
          ) : <p className="p-8 text-center text-sm text-muted">No pending corrections.</p>}
        </DashboardWidget>
      </section>

      {selectedAssignment ? <AssignmentModal assignment={selectedAssignment} pending={pending} onClose={() => setSelectedAssignment(null)} onComplete={(action, reason) => startTransition(async () => {
        const result = action === "confirm"
          ? await confirmDashboardAssignment(selectedAssignment.id)
          : selectedAssignment.status === "Confirmed"
            ? await withdrawDashboardAssignment(selectedAssignment.id, reason)
            : await declineDashboardAssignment(selectedAssignment.id, reason);
        setMessage(result.ok ? `Assignment ${action === "confirm" ? "confirmed" : "declined"}.` : result.error);
        if (result.ok) { setSelectedAssignment(null); router.refresh(); }
      })} /> : null}

      {selectedCorrection ? <CorrectionModal correction={selectedCorrection} onClose={() => setSelectedCorrection(null)} /> : null}
    </div>
  );
}

function AssignmentModal({ assignment, pending, onClose, onComplete }: { assignment: Assignment; pending: boolean; onClose: () => void; onComplete: (action: "confirm" | "decline", reason: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  return <Modal title="Assignment details" onClose={onClose}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Detail label="Organisation" value={assignment.organisationName} /><Detail label="Programme" value={assignment.programmeName} />
      <Detail label="Assignment" value={assignment.activityName} /><Detail label="Location" value={assignment.location} />
      <Detail label="Date and time" value={formatDate(assignment.startsAt)} /><Detail label="Role" value={assignment.role ?? "Not specified"} />
      <div className="sm:col-span-2"><Detail label="Assigned services" value={assignment.services.join(", ") || "Not specified"} /></div>
    </div>
    {declining ? <label className="mt-5 block text-xs font-semibold text-navy">Reason required<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="mt-2 min-h-24 w-full rounded-lg border border-card-border p-3 text-sm font-normal" /></label> : null}
    <div className="mt-6 flex justify-end gap-3">
      <ActionButton variant="secondary" onClick={() => declining ? onComplete("decline", reason) : setDeclining(true)} loading={pending} disabled={declining && reason.trim().length < 2}>{declining ? "Submit reason" : assignment.status === "Confirmed" ? "Withdraw" : "Decline"}</ActionButton>
      {!declining && assignment.status !== "Confirmed" ? <ActionButton onClick={() => onComplete("confirm", "")} loading={pending}>Confirm Assignment</ActionButton> : null}
    </div>
  </Modal>;
}

function CorrectionModal({ correction, onClose }: { correction: Correction; onClose: () => void }) {
  return <Modal title="Screening correction" onClose={onClose}>
    <Detail label="Participant reference" value={correction.participantReference} />
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Assignment" value={correction.assignmentName} /><Detail label="Services" value={correction.services.join(", ") || "Not specified"} /></div>
    <div className="mt-5"><p className="text-xs font-semibold text-navy">Errors to correct</p><ul className="mt-2 space-y-2">{correction.errors.map((error) => <li key={error.id} className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-navy"><span className="font-semibold">{error.field}:</span> {error.message}</li>)}</ul></div>
    {correction.reviewerNote ? <p className="mt-4 text-sm text-subtle"><span className="font-semibold text-navy">Reviewer note:</span> {correction.reviewerNote}</p> : null}
    <div className="mt-6 flex justify-end"><Link href={`/practitioner/screenings/${correction.id}`} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white">Correct Screening</Link></div>
  </Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-label={title} className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">{title}</h2><button type="button" onClick={onClose} className="text-sm font-semibold text-muted">Close</button></div>{children}</section></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-sm font-medium text-navy">{value}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone" }).format(new Date(value)); }
