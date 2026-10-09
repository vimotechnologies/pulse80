"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createPractitionerAssignment, updatePractitionerAssignment } from "@/app/actions/admin-practitioner-assignments";
import { CalendarCheck, ClipboardCheck, ShieldCheck, Stethoscope } from "@/components/icons/IconsaxIcons";
import { ListSummaryMetric } from "@/components/portal/DataListPage";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastMessage } from "@/components/ui/ToastMessage";
import type { AdminPractitioner, AdminPractitionerAssignment, PractitionerAssignmentForm, AssignmentActivationOption } from "@/types/admin-practitioner";

type PractitionerOption = Pick<AdminPractitioner, "userId" | "fullName" | "profession" | "verificationStatus" | "practitionerStatus" | "capabilities">;
type OrganisationOption = { id: string; name: string; status: string };

const emptyForm: PractitionerAssignmentForm = {
  activationId: "",
  serviceIds: [],
  practitionerUserId: "",
  organisationId: "",
  programmeName: "",
  activityName: "",
  serviceName: "",
  location: "",
  startsAt: "",
  endsAt: "",
  status: "Scheduled",
};

export function AdminPractitionerAssignments({ assignments, practitioners, organisations, activations }: {
  activations: AssignmentActivationOption[];
  assignments: AdminPractitionerAssignment[];
  practitioners: PractitionerOption[];
  organisations: OrganisationOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<AdminPractitionerAssignment | null | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const filtered = useMemo(() => assignments.filter((assignment) => {
    const searchable = `${assignment.practitionerName} ${assignment.organisationName} ${assignment.programmeName} ${assignment.activityName} ${assignment.serviceName} ${assignment.location}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase()) && (status === "All" || assignment.status === status);
  }), [assignments, query, status]);
  const eligiblePractitioners = practitioners.filter((item) => item.verificationStatus === "Verified" && item.practitionerStatus === "Active");

  return <div className="space-y-6">
    <PortalPageHeader eyebrow="Admin Operations" title="Practitioner Assignments" description="Match verified practitioners to wellness work, monitor coverage, and prevent scheduling conflicts." actions={<button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white shadow-sm">Create assignment</button>} />
    <ToastMessage message={message} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ListSummaryMetric metric={{ label: "Upcoming", value: String(assignments.filter((item) => new Date(item.startsAt).getTime() >= now && item.status !== "Cancelled").length), detail: "Future assignments", tone: "primary", icon: CalendarCheck }} />
      <ListSummaryMetric metric={{ label: "Confirmed", value: String(assignments.filter((item) => item.status === "Confirmed").length), detail: "Ready for delivery", tone: "success", icon: ShieldCheck }} />
      <ListSummaryMetric metric={{ label: "Action required", value: String(assignments.filter((item) => item.status === "Action Required").length), detail: "Need operations review", tone: "warning", icon: ClipboardCheck }} />
      <ListSummaryMetric metric={{ label: "Eligible practitioners", value: String(eligiblePractitioners.length), detail: "Verified and active", tone: "primary", icon: Stethoscope }} />
    </section>
    <section className="rounded-2xl border border-card-border bg-surface p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_240px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search practitioner, organisation, programme, service" className="h-11 rounded-lg border border-card-border bg-white px-4 text-sm text-navy outline-none focus:border-primary" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border border-card-border bg-white px-3 text-sm text-navy">{["All", "Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "Action Required"].map((option) => <option key={option}>{option}</option>)}</select></div></section>
    <section className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-card-border bg-[#f8fafc] text-xs text-muted"><tr><th className="px-5 py-4">Practitioner</th><th className="px-4 py-4">Organisation</th><th className="px-4 py-4">Programme / Activity</th><th className="px-4 py-4">Service</th><th className="px-4 py-4">Date & Time</th><th className="px-4 py-4">Status</th><th className="px-4 py-4" /></tr></thead><tbody className="divide-y divide-card-border">{filtered.map((assignment) => <tr key={assignment.id} className="hover:bg-[#f8fafc]"><td className="px-5 py-4"><p className="font-semibold text-navy">{assignment.practitionerName}</p><p className="mt-1 text-xs text-muted">{assignment.practitionerProfession}</p></td><td className="px-4 py-4 text-navy">{assignment.organisationName}</td><td className="px-4 py-4"><p className="font-medium text-navy">{assignment.programmeName}</p><p className="mt-1 text-xs text-muted">{assignment.activityName}</p></td><td className="px-4 py-4 text-navy">{assignment.serviceName}</td><td className="px-4 py-4"><p className="text-navy">{formatDate(assignment.startsAt)}</p><p className="mt-1 text-xs text-muted">{assignment.location}</p></td><td className="px-4 py-4"><StatusBadge status={assignment.status} tone={statusTone(assignment.status)} /></td><td className="px-4 py-4"><button type="button" onClick={() => setEditing(assignment)} className="font-semibold text-primary">Edit</button></td></tr>)}</tbody></table></div>{!filtered.length ? <p className="p-8 text-center text-sm text-muted">No assignments match these filters.</p> : null}</section>
    {editing !== undefined ? <AssignmentModal activations={activations} assignment={editing} practitioners={eligiblePractitioners} organisations={organisations.filter((item) => !["Archived", "Contract Expired"].includes(item.status))} pending={isPending} onClose={() => setEditing(undefined)} onSave={(form) => startTransition(async () => { const result = editing ? await updatePractitionerAssignment(editing.id, form) : await createPractitionerAssignment(form); setMessage(result.ok ? `Assignment ${editing ? "updated" : "created"}.` : friendlyError(result.error)); if (result.ok) { setEditing(undefined); router.refresh(); } })} /> : null}
  </div>;
}

function AssignmentModal({ assignment, practitioners, organisations, activations, pending, onClose, onSave }: {
  assignment: AdminPractitionerAssignment | null; practitioners: PractitionerOption[]; organisations: OrganisationOption[];
  activations: AssignmentActivationOption[]; pending: boolean; onClose: () => void; onSave: (form: PractitionerAssignmentForm) => void;
}) {
  const [form, setForm] = useState<PractitionerAssignmentForm>(assignment ? {
    activationId: assignment.activationId ?? "", serviceIds: assignment.serviceIds,
    practitionerUserId: assignment.practitionerUserId, organisationId: assignment.organisationId,
    programmeName: assignment.programmeName, activityName: assignment.activityName, serviceName: assignment.serviceName,
    location: assignment.location, startsAt: localDateTime(assignment.startsAt), endsAt: assignment.endsAt ? localDateTime(assignment.endsAt) : "",
    status: assignment.status as PractitionerAssignmentForm["status"],
  } : emptyForm);
  const practitioner = practitioners.find((item) => item.userId === form.practitionerUserId);
  const activation = activations.find((item) => item.id === form.activationId && item.organisationId === form.organisationId);
  // Activation services are visible independently of practitioner approval.
  // Approval is still enforced before an assignment can be saved.
  const services = activation?.services ?? [];
  const isApprovedForService = (service: (typeof services)[number]) => Boolean(practitioner?.capabilities.some((capability) =>
    capability.approvalStatus === "Approved" && (capability.name === service.name || capability.code === service.code)));
  const approvedServices = services.filter(isApprovedForService);
  const valid = Boolean(practitioner && activation && form.serviceIds.length && form.serviceIds.every((id) => approvedServices.some((service) => service.id === id)) &&
    form.startsAt && form.endsAt && form.endsAt > form.startsAt &&
    Date.parse(form.startsAt) >= Date.parse(activation.startsAt) && Date.parse(form.endsAt) <= Date.parse(activation.endsAt));
  function set<K extends keyof PractitionerAssignmentForm>(key: K, value: PractitionerAssignmentForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function selectActivation(id: string) {
    const event = activations.find((item) => item.id === id);
    setForm((current) => ({ ...current, activationId: id, serviceIds: [], serviceName: "", programmeName: event?.programmeName ?? "",
      activityName: event?.title ?? "", location: event?.location ?? "", startsAt: event ? localDateTime(event.startsAt) : "", endsAt: event ? localDateTime(event.endsAt) : "" }));
  }
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onSave(form); }} className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between"><h2 className="text-xl font-semibold text-navy">{assignment ? "Edit assignment" : "Create assignment"}</h2><button type="button" onClick={onClose}>Close</button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Practitioner"><select value={form.practitionerUserId} onChange={(event) => { set("practitionerUserId", event.target.value); set("serviceIds", []); set("serviceName", ""); }} required className={inputClass}><option value="">Select practitioner</option>{practitioners.map((item) => <option key={item.userId} value={item.userId}>{item.fullName} · {item.profession}</option>)}</select></Field>
        <Field label="Organisation"><select value={form.organisationId} onChange={(event) => { set("organisationId", event.target.value); selectActivation(""); }} required className={inputClass}><option value="">Select organisation</option>{organisations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Activation"><select value={form.activationId} onChange={(event) => selectActivation(event.target.value)} required className={inputClass}><option value="">Select event</option>{activations.filter((item) => item.organisationId === form.organisationId).map((item) => <option key={item.id} value={item.id}>{item.programmeName} · {item.title} · {formatDate(item.startsAt)}</option>)}</select></Field>
        <Field label="Location"><input value={form.location} readOnly className={inputClass} /></Field>
        <fieldset className="space-y-2 sm:col-span-2"><legend className="text-xs font-semibold text-navy">Activation services</legend>{services.length ? services.map((service) => { const approved = isApprovedForService(service); return <label key={service.id} className={`flex items-center gap-2 text-sm ${approved ? "" : "text-muted"}`}><input type="checkbox" disabled={!approved} checked={form.serviceIds.includes(service.id)} onChange={(event) => {
          const ids = event.target.checked ? [...form.serviceIds, service.id] : form.serviceIds.filter((id) => id !== service.id);
          set("serviceIds", ids); set("serviceName", services.find((item) => item.id === ids[0])?.name ?? "");
        }} />{service.name}{!approved ? <span className="text-xs">(practitioner approval required)</span> : null}</label>; }) : <p className="text-sm text-muted">{activation ? "This activation has no screening services configured." : "Select an activation to see its screening services."}</p>}</fieldset>
        <Field label="Starts"><input type="datetime-local" step="0.001" value={form.startsAt} onChange={(event) => set("startsAt", event.target.value)} required className={inputClass} /></Field>
        <Field label="Ends"><input type="datetime-local" step="0.001" value={form.endsAt} onChange={(event) => set("endsAt", event.target.value)} required className={inputClass} /></Field>
        <Field label="Status"><select value={form.status} onChange={(event) => set("status", event.target.value as PractitionerAssignmentForm["status"])} className={inputClass}>{["Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "Action Required"].map((option) => <option key={option}>{option}</option>)}</select></Field>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose}>Cancel</button><button disabled={!valid || pending} type="submit" className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{pending ? "Saving…" : "Save assignment"}</button></div>
    </form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2 text-xs font-semibold text-navy"><span>{label}</span>{children}</label>; }
const inputClass = "h-11 w-full rounded-lg border border-card-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-primary";
function formatDate(value: string) { return new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function localDateTime(value: string) { const date = new Date(value); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 23); }
function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" { if (status === "Completed" || status === "Confirmed") return "success"; if (status === "Action Required") return "danger"; if (status === "Scheduled" || status === "In Progress") return "info"; return "neutral"; }
function friendlyError(error: string) { if (error === "INTERNAL_SERVER_ERROR") return "The assignment could not be saved. Check practitioner eligibility, capability, and scheduling conflicts."; return error.replaceAll("_", " "); }
