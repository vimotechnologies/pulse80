"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { captureScreening, reviewScreening } from "@/app/actions/screening-operations";
import { Activity, ClipboardCheck, HeartPulse, Microscope } from "@/components/icons/IconsaxIcons";
import { ListSummaryMetric } from "@/components/portal/DataListPage";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastMessage } from "@/components/ui/ToastMessage";
import type { Screening, ScreeningAssignmentOption, ScreeningCaptureForm } from "@/types/screening";

export function AdminScreeningOperations({ screenings, mode }: { screenings: Screening[]; mode: "screenings" | "results" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [reviewing, setReviewing] = useState<Screening | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const rows = useMemo(
    () => screenings.filter((item) => `${item.participantReference} ${item.organisationName} ${item.activationName} ${item.practitionerName}`.toLowerCase().includes(query.toLowerCase()) && (risk === "All" || item.result.riskLevel === risk)),
    [screenings, query, risk],
  );
  const title = mode === "screenings" ? "Screenings" : "Screening Results";
  const description = mode === "screenings"
    ? "Review anonymized screening records, incomplete submissions, and risk distribution across activations."
    : "Quality-assure anonymized result queues before reports and recommendations are generated.";

  return <Workspace title={title} description={description} message={message} metrics={[
    { label: mode === "screenings" ? "Records captured" : "Ready for QA", value: mode === "screenings" ? screenings.length : screenings.filter((item) => item.status === "Submitted").length, detail: "Real screening records", icon: Microscope },
    { label: "Needs correction", value: screenings.filter((item) => item.status === "Needs Correction").length, detail: "Returned to practitioner", icon: Activity },
    { label: "High risk", value: screenings.filter((item) => item.result.riskLevel === "High").length, detail: "Clinical escalation", icon: HeartPulse },
    { label: "Approved", value: screenings.filter((item) => item.status === "Approved").length, detail: "Quality assured", icon: ClipboardCheck },
  ]}>
    <Filters query={query} setQuery={setQuery} risk={risk} setRisk={setRisk} />
    <Table headers={mode === "screenings" ? ["Reference", "Organisation", "Activation", "Practitioner", "Risk", "Captured", "Status", ""] : ["Reference", "Blood pressure", "Glucose", "Cholesterol", "BMI", "Risk", "QA status", ""]}>
      {rows.map((item) => <tr key={item.id} className="border-t border-card-border">
        {mode === "screenings" ? <>
          <Cell><b>{item.participantReference}</b><small>{item.department ?? "Department not set"}</small></Cell>
          <Cell>{item.organisationName}</Cell>
          <Cell>{item.activationName ?? "Assignment capture"}</Cell>
          <Cell>{item.practitionerName}</Cell>
          <Risk item={item} />
          <Cell>{formatDate(item.capturedAt)}</Cell>
          <Status item={item} />
        </> : <>
          <Cell><b>{item.participantReference}</b><small>{item.organisationName}</small></Cell>
          <Cell>{measurement(item.result.systolicMmhg, item.result.diastolicMmhg)}</Cell>
          <Cell>{unit(item.result.glucoseMmolL, "mmol/L")}</Cell>
          <Cell>{unit(item.result.cholesterolMmolL, "mmol/L")}</Cell>
          <Cell>{item.result.bmi ?? "—"}</Cell>
          <Risk item={item} />
          <Status item={item} />
        </>}
        <Cell>{item.status !== "Approved" && <button onClick={() => setReviewing(item)} className="font-semibold text-primary">Review</button>}</Cell>
      </tr>)}
    </Table>
    {!rows.length && <Empty text="No screening records match these filters." />}
    {reviewing && <ReviewModal screening={reviewing} pending={pending} onClose={() => setReviewing(null)} onSave={(status, note) => startTransition(async () => {
      const result = await reviewScreening(reviewing.id, status, note);
      setMessage(result.ok ? `Screening marked ${status.toLowerCase()}.` : errorText(result.error));
      if (result.ok) {
        setReviewing(null);
        router.refresh();
      }
    })} />}
  </Workspace>;
}

export function PractitionerScreeningOperations({ screenings, assignments }: { screenings: Screening[]; assignments: ScreeningAssignmentOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const rows = screenings.filter((item) => `${item.participantReference} ${item.activationName ?? ""} ${item.organisationName} ${item.department ?? ""} ${item.status}`.toLowerCase().includes(normalizedQuery));
  const needsCorrection = screenings.filter((item) => item.status === "Needs Correction").length;
  const submitted = screenings.filter((item) => item.status === "Submitted").length;
  const escalated = screenings.filter((item) => item.result.escalationRequired).length;

  return <Workspace
    eyebrow="Health Practitioner"
    title="Screenings"
    description="Capture and manage anonymized employee wellness screening records linked to your assigned programmes."
    message={message}
    action="Capture screening"
    onAction={() => setOpen(true)}
    metrics={[
      { label: "Captured", value: screenings.length, detail: "Screening records", icon: ClipboardCheck },
      { label: "Needs correction", value: needsCorrection, detail: needsCorrection === 1 ? "Record requires action" : "Records require action", icon: Activity },
      { label: "Submitted", value: submitted, detail: "Awaiting quality assurance", icon: Microscope },
      { label: "Escalated", value: escalated, detail: "Require clinical attention", icon: HeartPulse },
    ]}
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-navy">Screening records</h2>
        <p className="mt-1 text-xs text-muted">Anonymized records captured against your practitioner assignments.</p>
      </div>
      <p className="text-xs font-medium text-muted">{rows.length} of {screenings.length} records</p>
    </div>

    <div className="mt-4">
      <label className="sr-only" htmlFor="practitioner-screening-search">Search screening records</label>
      <input
        id="practitioner-screening-search"
        className={inputClass}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search reference, organisation, activation, department or status"
      />
    </div>

    <Table headers={["Reference", "Activation", "Organisation", "Department", "Risk", "Captured", "Status"]}>
      {rows.map((item) => <tr key={item.id} className="border-t border-card-border transition-colors hover:bg-[#f8fafc]/70">
        <Cell><b>{item.participantReference}</b><small>Anonymous participant reference</small></Cell>
        <Cell>{item.activationName ?? "Assignment capture"}</Cell>
        <Cell>{item.organisationName}</Cell>
        <Cell>{item.department ?? "Not set"}</Cell>
        <Risk item={item} />
        <Cell>{formatDate(item.capturedAt)}</Cell>
        <Status item={item} />
      </tr>)}
    </Table>

    {!rows.length && <Empty text={screenings.length ? "No screening records match your search." : "No screening records have been captured yet. Use Capture screening when you are ready to record your first assigned screening."} />}

    {open && <CaptureModal assignments={assignments} pending={pending} onClose={() => setOpen(false)} onSave={(form) => startTransition(async () => {
      const result = await captureScreening(form);
      setMessage(result.ok ? "Screening submitted for quality assurance." : errorText(result.error));
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    })} />}
  </Workspace>;
}

function Workspace({ eyebrow = "Wellness Operations", title, description, message, action, onAction, metrics, children }: { eyebrow?: string; title: string; description: string; message: string | null; action?: string; onAction?: () => void; metrics: Array<{ label: string; value: number; detail: string; icon: typeof Activity }>; children: ReactNode }) {
  return <div className="space-y-6">
    <PortalPageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={action && onAction ? <button onClick={onAction} disabled={false} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">{action}</button> : undefined}
    />
    <ToastMessage message={message} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => <ListSummaryMetric key={metric.label} metric={{ ...metric, value: metric.value.toLocaleString("en-BW"), tone: "primary" }} />)}
    </section>
    <section className="rounded-lg border border-card-border bg-surface p-4 shadow-sm sm:p-5">{children}</section>
  </div>;
}

function Filters({ query, setQuery, risk, setRisk }: { query: string; setQuery: (value: string) => void; risk: string; setRisk: (value: string) => void }) {
  return <div className="grid gap-3 md:grid-cols-[1fr_220px]">
    <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, organisation, activation" />
    <select className={inputClass} value={risk} onChange={(event) => setRisk(event.target.value)}>{["All", "Low", "Medium", "High", "Incomplete"].map((value) => <option key={value}>{value}</option>)}</select>
  </div>;
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="mt-4 overflow-x-auto">
    <table className="w-full min-w-[950px] text-left text-sm">
      <thead className="bg-[#f8fafc] text-xs text-muted"><tr>{headers.map((header, index) => <th key={`${header}-${index}`} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 text-navy">{children}</td>;
}

function Risk({ item }: { item: Screening }) {
  return <Cell><StatusBadge status={item.result.riskLevel} tone={item.result.riskLevel === "High" ? "danger" : item.result.riskLevel === "Medium" ? "warning" : "success"} /></Cell>;
}

function Status({ item }: { item: Screening }) {
  return <Cell><StatusBadge status={item.status} tone={item.status === "Approved" ? "success" : item.status === "Needs Correction" ? "danger" : "warning"} /></Cell>;
}

function Empty({ text }: { text: string }) {
  return <div className="border-t border-card-border px-4 py-10 text-center">
    <p className="text-sm font-medium text-navy">No screening records</p>
    <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-muted">{text}</p>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2 text-xs font-semibold text-navy"><span>{label}</span>{children}</label>;
}

function CaptureModal({ assignments, pending, onClose, onSave }: { assignments: ScreeningAssignmentOption[]; pending: boolean; onClose: () => void; onSave: (form: ScreeningCaptureForm) => void }) {
  const [form, setForm] = useState<ScreeningCaptureForm>({ assignmentId: "", participantReference: "", department: "", consentConfirmed: false, practitionerNote: "", systolicMmhg: "", diastolicMmhg: "", glucoseMmolL: "", cholesterolMmolL: "", heightCm: "", weightKg: "" });
  const set = (key: keyof ScreeningCaptureForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const hasMeasurement = [form.systolicMmhg, form.glucoseMmolL, form.cholesterolMmolL, form.heightCm].some(Boolean);
  const valid = Boolean(form.assignmentId && form.participantReference && form.consentConfirmed && hasMeasurement && (Boolean(form.systolicMmhg) === Boolean(form.diastolicMmhg)) && (Boolean(form.heightCm) === Boolean(form.weightKg)));

  return <Modal title="Capture screening" pending={pending} valid={valid} onClose={onClose} onSubmit={() => onSave(form)}>
    {assignments.length ? <Field label="Confirmed assignment"><select className={inputClass} value={form.assignmentId} onChange={(event) => set("assignmentId", event.target.value)}><option value="">Select assignment</option>{assignments.map((item) => <option key={item.id} value={item.id}>{item.organisationName} · {item.activationName ?? item.serviceName}</option>)}</select></Field> : <p className="sm:col-span-2 rounded-lg bg-warning/10 p-3 text-sm text-navy">You need a confirmed or active assignment before capturing screenings.</p>}
    <Field label="Participant reference"><input className={inputClass} value={form.participantReference} onChange={(event) => set("participantReference", event.target.value)} placeholder="Anonymous reference only" /></Field>
    <Field label="Department"><input className={inputClass} value={form.department} onChange={(event) => set("department", event.target.value)} /></Field>
    <Field label="Systolic (mmHg)"><input type="number" min="40" max="300" className={inputClass} value={form.systolicMmhg} onChange={(event) => set("systolicMmhg", event.target.value)} /></Field>
    <Field label="Diastolic (mmHg)"><input type="number" min="20" max="200" className={inputClass} value={form.diastolicMmhg} onChange={(event) => set("diastolicMmhg", event.target.value)} /></Field>
    <Field label="Glucose (mmol/L)"><input type="number" step="0.01" min="0.5" max="50" className={inputClass} value={form.glucoseMmolL} onChange={(event) => set("glucoseMmolL", event.target.value)} /></Field>
    <Field label="Cholesterol (mmol/L)"><input type="number" step="0.01" min="0.5" max="30" className={inputClass} value={form.cholesterolMmolL} onChange={(event) => set("cholesterolMmolL", event.target.value)} /></Field>
    <Field label="Height (cm)"><input type="number" step="0.01" min="50" max="260" className={inputClass} value={form.heightCm} onChange={(event) => set("heightCm", event.target.value)} /></Field>
    <Field label="Weight (kg)"><input type="number" step="0.01" min="2" max="500" className={inputClass} value={form.weightKg} onChange={(event) => set("weightKg", event.target.value)} /></Field>
    <Field label="Practitioner note"><input className={inputClass} value={form.practitionerNote} onChange={(event) => set("practitionerNote", event.target.value)} /></Field>
    <label className="flex items-center gap-3 text-sm font-semibold text-navy sm:col-span-2"><input type="checkbox" checked={form.consentConfirmed} onChange={(event) => set("consentConfirmed", event.target.checked)} />Participant consent has been confirmed</label>
  </Modal>;
}

function ReviewModal({ screening, pending, onClose, onSave }: { screening: Screening; pending: boolean; onClose: () => void; onSave: (status: "Approved" | "Needs Correction", note: string) => void }) {
  const [status, setStatus] = useState<"Approved" | "Needs Correction">("Approved");
  const [note, setNote] = useState("");
  return <Modal title={`Review ${screening.participantReference}`} pending={pending} valid={status === "Approved" || Boolean(note.trim())} onClose={onClose} onSubmit={() => onSave(status, note)}>
    <Field label="QA decision"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>Approved</option><option>Needs Correction</option></select></Field>
    <Field label="Reviewer note"><input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder={status === "Needs Correction" ? "Required correction" : "Optional"} /></Field>
    <div className="sm:col-span-2 rounded-lg bg-[#f8fafc] p-4 text-sm text-navy">Risk: <b>{screening.result.riskLevel}</b> · Measurements: {measurementSummary(screening)}</div>
  </Modal>;
}

function Modal({ title, pending, valid, onClose, onSubmit, children }: { title: string; pending: boolean; valid: boolean; onClose: () => void; onSubmit: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/45 p-4">
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit(); }} className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex justify-between"><h2 className="text-xl font-semibold text-navy">{title}</h2><button type="button" onClick={onClose} className="text-sm font-semibold text-muted">Close</button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-navy">Cancel</button><button disabled={!valid || pending} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{pending ? "Saving…" : "Save"}</button></div>
    </form>
  </div>;
}

const inputClass = "h-11 w-full rounded-lg border border-card-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-primary";
const formatDate = (value: string) => new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const unit = (value: number | null, suffix: string) => value === null ? "—" : `${value} ${suffix}`;
const measurement = (systolic: number | null, diastolic: number | null) => systolic === null || diastolic === null ? "—" : `${systolic}/${diastolic} mmHg`;
const measurementSummary = (item: Screening) => [measurement(item.result.systolicMmhg, item.result.diastolicMmhg), unit(item.result.glucoseMmolL, "glucose"), item.result.bmi === null ? "" : `BMI ${item.result.bmi}`].filter((value) => value && value !== "—").join(" · ") || "No measurements";
const errorText = (error: string) => error === "INTERNAL_SERVER_ERROR" ? "The screening could not be saved. Check the assignment, measurements, and permissions." : error.replaceAll("_", " ");
