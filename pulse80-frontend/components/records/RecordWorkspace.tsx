"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePortalRecord } from "@/app/actions/portal-records";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { downloadPdf } from "@/lib/pdf/download";
import { recordStatuses, type PortalRecord, type RecordInput, type RecordKind, type RecordWorkspace as Workspace } from "@/types/portal-record";

const titles: Record<RecordKind, string> = { invoice: "Billing", payment: "Practitioner payments", request: "Requests & proposals", recommendation: "Recommendations", report: "Saved reports" };
const inputClass = "w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm";
const buttonClass = "rounded-lg border border-card-border px-3 py-2 text-sm font-semibold disabled:opacity-50";

export function RecordWorkspace({ kind, workspace }: { kind: RecordKind; workspace: Workspace }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<PortalRecord | null | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const financial = kind === "invoice" || kind === "payment";
  const rows = workspace.records.filter(row => (status === "All" || row.status === status) &&
    [row.title, row.organisationName, row.practitionerName, row.description].join(" ").toLowerCase().includes(query.toLowerCase()));

  async function download(records: PortalRecord[]) {
    try {
      await downloadPdf({ title: titles[kind], sections: records.map(row => ({
        title: row.title, client: { name: row.organisationName, logoUrl: row.organisationLogoUrl },
        lines: [`Status: ${row.status}`, ...(row.practitionerName ? [`Practitioner: ${row.practitionerName}`] : []),
          ...(row.amount !== null ? [`Amount: ${row.currency} ${row.amount.toFixed(2)}`] : []),
          ...(row.dueOn ? [`Due: ${row.dueOn}`] : []), row.description, `Updated: ${row.updatedAt}`],
      })) });
    } catch { setMessage("Could not generate the PDF. Please try again."); }
  }

  return <div className="space-y-5">
    <PortalPageHeader title={titles[kind]} description={financial ? "Recorded amounts and payment status. Payments are processed separately." : kind === "report" || kind === "recommendation" ? "Staff-maintained records. Published records are available to the client organisation." : "Track requests and proposals for each organisation."}
      actions={<>{workspace.canManage && <button className={buttonClass} onClick={() => { setMessage(null); setEditing(null); }}>Create {kind}</button>}<button disabled={!rows.length} className={buttonClass} onClick={() => void download(rows)}>Download PDF</button></>} />
    {message && <p role="status" className="rounded-lg border border-card-border p-3 text-sm">{message}</p>}
    <div className="flex gap-3"><label className="flex-1"><span className="sr-only">Search records</span><input className={inputClass} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search records" /></label>
      <label><span className="sr-only">Status</span><select className={inputClass} value={status} onChange={event => setStatus(event.target.value)}>{["All", ...recordStatuses[kind]].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="overflow-x-auto rounded-lg border border-card-border bg-white"><table className="w-full text-left text-sm"><thead><tr>{["Record", "Organisation", ...(kind === "payment" ? ["Practitioner"] : []), "Status", ...(financial ? ["Amount", "Due"] : []), "Actions"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id} className="border-t border-card-border"><td className="p-3"><strong>{row.title}</strong><details className="mt-2"><summary className="cursor-pointer">Details</summary><p className="mt-2 max-w-xl whitespace-pre-wrap">{row.description || "No description provided."}</p></details></td><td className="p-3">{row.organisationName}</td>{kind === "payment" && <td className="p-3">{row.practitionerName}</td>}<td className="p-3">{row.status}</td>{financial && <><td className="p-3">{row.currency} {row.amount?.toFixed(2)}</td><td className="p-3">{row.dueOn ?? "—"}</td></>}<td className="p-3"><div className="flex gap-2">{workspace.canManage && <button className={buttonClass} onClick={() => { setMessage(null); setEditing(row); }}>Edit</button>}<button className={buttonClass} onClick={() => void download([row])}>PDF</button></div></td></tr>)}</tbody></table>
      {!rows.length && <p className="p-6 text-sm text-muted">No records match this view.</p>}</div>
    {editing !== undefined && <RecordEditor key={editing?.id ?? "new"} kind={kind} record={editing} workspace={workspace} pending={pending} onClose={() => setEditing(undefined)} onSave={input => start(async () => {
      const result = await savePortalRecord(kind, editing?.id ?? null, input);
      if (!result.ok) { setMessage(result.error); return; }
      setEditing(undefined); setMessage("Record saved."); router.refresh();
    })} error={message} />}
  </div>;
}

function RecordEditor({ kind, record, workspace, pending, onClose, onSave, error }: {
  kind: RecordKind; record: PortalRecord | null; workspace: Workspace; pending: boolean;
  onClose: () => void; onSave: (input: RecordInput) => void; error: string | null;
}) {
  const financial = kind === "invoice" || kind === "payment";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form role="dialog" aria-modal="true" aria-labelledby="record-editor-title" className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-6" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    onSave({ title: String(data.get("title")), organisationId: String(data.get("organisationId")),
      description: String(data.get("description")), status: String(data.get("status")),
      amount: financial ? Number(data.get("amount")) : null, currency: financial ? String(data.get("currency")).toUpperCase() : "BWP",
      practitionerUserId: kind === "payment" ? String(data.get("practitionerUserId")) : null,
      dueOn: String(data.get("dueOn") ?? "") || null });
  }}>
    <h2 id="record-editor-title" className="text-lg font-semibold">{record ? "Edit" : "Create"} {kind}</h2>
    <fieldset disabled={pending} className="space-y-4">
      <label className="block text-sm">Organisation<select required name="organisationId" defaultValue={record?.organisationId ?? ""} className={inputClass}><option value="">Choose organisation</option>{workspace.organisations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
      {kind === "payment" && <label className="block text-sm">Practitioner<select required name="practitionerUserId" defaultValue={record?.practitionerUserId ?? ""} className={inputClass}><option value="">Choose practitioner</option>{workspace.practitioners.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
      <label className="block text-sm">Title<input required minLength={2} maxLength={180} name="title" defaultValue={record?.title} className={inputClass} autoFocus /></label>
      <label className="block text-sm">Status<select name="status" defaultValue={record?.status ?? recordStatuses[kind][0]} className={inputClass}>{recordStatuses[kind].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="block text-sm">Description<textarea name="description" rows={6} maxLength={20000} defaultValue={record?.description} className={inputClass} /></label>
      {financial && <div className="grid grid-cols-2 gap-3"><label className="text-sm">Amount<input required type="number" min="0" max="999999999.99" step="0.01" name="amount" defaultValue={record?.amount ?? ""} className={inputClass} /></label><label className="text-sm">Currency<input required name="currency" pattern="[A-Za-z]{3}" maxLength={3} defaultValue={record?.currency ?? "BWP"} className={inputClass} /></label></div>}
      <label className="block text-sm">Due date (optional)<input type="date" name="dueOn" defaultValue={record?.dueOn ?? ""} className={inputClass} /></label>
    </fieldset>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className={buttonClass}>Cancel</button><button type="submit" disabled={pending} className={buttonClass}>{pending ? "Saving…" : "Save"}</button></div>
  </form></div>;
}
