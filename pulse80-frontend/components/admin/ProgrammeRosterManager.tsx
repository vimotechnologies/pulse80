"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createRosterParticipant, importRosterParticipants, loadProgrammeRoster, updateRosterParticipantStatus } from "@/app/actions/programme-roster";
import { readRosterFile, rosterHeaders } from "@/lib/roster/import";
import type { ProgrammeRoster, RosterEntry, RosterParticipant } from "@/types/programme-roster";

const emptyEntry: RosterEntry = { screeningReference: "", eligibilityStatus: "Eligible", registrationStatus: "Registered" };
const inputClass = "w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm";
const buttonClass = "rounded-lg border border-card-border px-4 py-2 text-sm disabled:opacity-40";
export function ProgrammeRosterManager({ initialRoster }: { initialRoster: ProgrammeRoster }) {
  const [roster, setRoster] = useState(initialRoster);
  const [offset, setOffset] = useState(0);
  const [entry, setEntry] = useState<RosterEntry>(emptyEntry);
  const [editing, setEditing] = useState<RosterParticipant | null>(null);
  const [preview, setPreview] = useState<RosterEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const programmeId = roster.programmeId;
  async function refresh(nextOffset = offset) {
    setRoster(await loadProgrammeRoster(programmeId, nextOffset));
    setOffset(nextOffset);
  }
  function run(task: () => Promise<void>) {
    setMessage(null);
    start(async () => { try { await task(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load roster."); } });
  }
  const draft = editing ?? entry;
  function setStatus(key: "eligibilityStatus" | "registrationStatus", value: string) {
    if (editing) setEditing({ ...editing, [key]: value } as RosterParticipant);
    else setEntry({ ...entry, [key]: value } as RosterEntry);
  }
  return <div className="space-y-6">
    <Link href="/admin/programmes" className="text-sm text-primary">← Programmes</Link>
    <header><h1 className="text-xl font-semibold">Participant roster · {roster.programmeName}</h1>
      <p className="mt-2 text-sm text-muted">Use anonymous screening codes. Names and contact details are not required. Codes are case-sensitive and unique within this programme.</p></header>
    {message && <p role="status" className="rounded-lg border border-card-border bg-white p-3 text-sm">{message}</p>}
    <form className="space-y-4 rounded-xl border border-card-border bg-white p-5" onSubmit={event => {
      event.preventDefault(); run(async () => {
        const result = editing
          ? await updateRosterParticipantStatus(programmeId, editing.id, { eligibilityStatus: editing.eligibilityStatus, registrationStatus: editing.registrationStatus })
          : await createRosterParticipant(programmeId, entry);
        if (!result.ok) { setMessage(result.error); return; }
        setEditing(null); setEntry(emptyEntry); setMessage("Participant saved."); await refresh();
      });
    }}>
      <h2 className="font-semibold">{editing ? "Edit participant status" : "Add participant"}</h2>
      <fieldset disabled={pending} className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm">Anonymous screening code<input required={!editing} minLength={2} maxLength={80} className={inputClass} value={draft.screeningReference ?? ""} readOnly={Boolean(editing)} onChange={event => setEntry({ ...entry, screeningReference: event.target.value })} autoComplete="off" /></label>
        <label className="space-y-2 text-sm">Eligibility<select className={inputClass} value={draft.eligibilityStatus} onChange={event => setStatus("eligibilityStatus", event.target.value)}>{["Eligible", "Not Eligible"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-2 text-sm">Registration<select className={inputClass} value={draft.registrationStatus} onChange={event => setStatus("registrationStatus", event.target.value)}>{["Invited", "Registered", "Declined", "Withdrawn"].map(value => <option key={value}>{value}</option>)}</select></label>
      </fieldset>
      <div className="flex gap-3"><button disabled={pending} className={`${buttonClass} bg-primary text-white`}>{pending ? "Saving…" : editing ? "Save status" : "Add participant"}</button>{editing && <button type="button" disabled={pending} className={buttonClass} onClick={() => setEditing(null)}>Cancel</button>}</div>
    </form>
    <section className="space-y-3 rounded-xl border border-card-border bg-white p-5">
      <h2 className="font-semibold">Import participant roster</h2>
      <p className="text-sm text-muted">CSV, XLS or XLSX · up to 500 rows and 2 MB. This import creates roster entries only; upload screening results separately. Store codes as text to preserve leading zeros.</p>
      <p className="text-sm">Columns: <code>{rosterHeaders.join(", ")}</code>. Optional: <code>employee_id</code>.</p>
      <p className="text-sm text-muted">Existing codes are rejected. Use Edit status to update an existing participant. Any invalid row cancels the entire import.</p>
      <label className="block text-sm">Choose roster file<input className="mt-2 block" type="file" accept=".csv,.xls,.xlsx" disabled={pending} onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ""; setPreview([]);
        if (file) run(async () => { setPreview(await readRosterFile(file)); });
      }} /></label>
      {preview.length > 0 && <div className="space-y-3"><p className="text-sm font-semibold">Preview: {preview.length} participants for {roster.programmeName}</p>
        <div className="max-h-60 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Code</th><th>Eligibility</th><th>Registration</th><th>Employee ID (optional)</th></tr></thead><tbody>{preview.map(row => <tr key={row.screeningReference}><td>{row.screeningReference}</td><td>{row.eligibilityStatus}</td><td>{row.registrationStatus}</td><td>{row.employeeId ?? "—"}</td></tr>)}</tbody></table></div>
        <button disabled={pending} className={`${buttonClass} bg-primary text-white`} onClick={() => run(async () => {
          const result = await importRosterParticipants(programmeId, preview);
          if (!result.ok) { setMessage(result.error); return; }
          setMessage(`Imported ${preview.length} participants.`); setPreview([]); await refresh(0);
        })}>Import {preview.length} participants</button>
        <button disabled={pending} className={`${buttonClass} ml-2`} onClick={() => setPreview([])}>Cancel import</button>
      </div>}
    </section>
    <section className="space-y-3 rounded-xl border border-card-border bg-white p-5">
      <h2 className="font-semibold">Programme participants ({roster.total})</h2>
      {roster.participants.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Code</th><th>Eligibility</th><th>Registration</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{roster.participants.map(row => <tr key={row.id} className="border-t border-card-border"><td className="p-2">{row.screeningReference ?? "Code not assigned"}</td><td>{row.eligibilityStatus}</td><td>{row.registrationStatus}</td><td><button disabled={pending} className="text-primary" onClick={() => setEditing(row)}>Edit status</button></td></tr>)}</tbody></table></div> : <p className="text-sm text-muted">No participants have been added to this programme.</p>}
      <div className="flex items-center gap-3"><button className={buttonClass} disabled={pending || offset === 0} onClick={() => run(() => refresh(Math.max(0, offset - 100)))}>Previous</button><span className="text-sm">{roster.total ? offset + 1 : 0}–{offset + roster.participants.length} of {roster.total}</span><button className={buttonClass} disabled={pending || offset + roster.participants.length >= roster.total} onClick={() => run(() => refresh(offset + roster.participants.length))}>Next</button></div>
    </section>
  </div>;
}
