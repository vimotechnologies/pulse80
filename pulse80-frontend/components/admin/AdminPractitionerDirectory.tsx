"use client";

import { useMemo, useState, useTransition } from "react";
import { registerPractitioner, setPractitionerRegistrationStatus, inviteRegisteredPractitioner, type RegisteredPractitioner } from "@/app/actions/admin-practitioners";
import { useRouter } from "next/navigation";

import { Building2, ClipboardCheck, ShieldCheck, Stethoscope } from "@/components/icons/IconsaxIcons";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ListSummaryMetric } from "@/components/portal/DataListPage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminPractitioner } from "@/types/admin-practitioner";

export function AdminPractitionerDirectory({ practitioners, registrations }: { practitioners: AdminPractitioner[]; registrations: RegisteredPractitioner[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ fullName: "", email: "", profession: "", country: "Botswana", city: "", capabilities: [] as string[] });
  const options = ["Blood Pressure", "BMI", "Glucose", "Cholesterol", "HIV Testing", "Eye Screening", "Dental Screening", "Physiotherapy"];
  const [query, setQuery] = useState("");
  const [verification, setVerification] = useState("All");
  const [selected, setSelected] = useState<AdminPractitioner | null>(null);
  const filtered = useMemo(() => practitioners.filter((practitioner) => {
    const searchable = `${practitioner.fullName} ${practitioner.professionalEmail} ${practitioner.profession} ${practitioner.specialisation ?? ""} ${practitioner.city ?? ""}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase()) &&
      (verification === "All" || practitioner.verificationStatus === verification);
  }), [practitioners, query, verification]);
  const pending = practitioners.filter((item) => item.verificationStatus !== "Verified").length;

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Admin Operations"
        title="Practitioners"
        description="Manage the verified practitioner network, credentials, capabilities, and delivery readiness."
        actions={(
          <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setError(""); setAdding(true); }} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Add Practitioner</button>
          <button type="button" onClick={() => router.push("/admin/practitioner-verification")} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white shadow-sm">
            Open verification queue
          </button></div>
        )}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ListSummaryMetric metric={{ label: "Practitioners", value: String(practitioners.length + registrations.length), detail: "Professional profiles", tone: "primary", icon: Stethoscope }} />
        <ListSummaryMetric metric={{ label: "Verified", value: String(practitioners.filter((item) => item.verificationStatus === "Verified").length), detail: "Approved to deliver", tone: "success", icon: ShieldCheck }} />
        <ListSummaryMetric metric={{ label: "Awaiting review", value: String(pending + registrations.length), detail: "Need verification action", tone: "warning", icon: ClipboardCheck }} />
        <ListSummaryMetric metric={{ label: "Assignments", value: String(practitioners.reduce((total, item) => total + item.assignmentCount, 0)), detail: "Across the network", tone: "primary", icon: Building2 }} />
      </section>
      <section className="rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search practitioners, professions, locations" className="h-11 rounded-lg border border-card-border bg-white px-4 text-sm text-navy outline-none focus:border-primary" />
          <select value={verification} onChange={(event) => setVerification(event.target.value)} className="h-11 rounded-lg border border-card-border bg-white px-3 text-sm text-navy">
            {["All", "Verified", "Under Review", "Pending Verification", "Action Required", "Expired"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-card-border bg-[#f8fafc] text-xs text-muted"><tr><th className="px-5 py-4">Practitioner</th><th className="px-4 py-4">Profession</th><th className="px-4 py-4">Location</th><th className="px-4 py-4">Capabilities</th><th className="px-4 py-4">Verification</th><th className="px-4 py-4">Assignments</th><th className="px-4 py-4" /></tr></thead>
            <tbody className="divide-y divide-card-border">
              {filtered.map((practitioner) => (
                <tr key={practitioner.userId} className="hover:bg-[#f8fafc]">
                  <td className="px-5 py-4"><p className="font-semibold text-navy">{practitioner.fullName}</p><p className="mt-1 text-xs text-muted">{practitioner.professionalEmail}</p></td>
                  <td className="px-4 py-4 text-navy">{practitioner.profession}</td>
                  <td className="px-4 py-4 text-navy">{[practitioner.city, practitioner.country].filter(Boolean).join(", ")}</td>
                  <td className="px-4 py-4 text-navy">{practitioner.capabilities.filter((item) => item.approvalStatus === "Approved").length}</td>
                  <td className="px-4 py-4"><StatusBadge status={practitioner.verificationStatus} tone={tone(practitioner.verificationStatus)} /></td>
                  <td className="px-4 py-4 text-navy">{practitioner.assignmentCount}</td>
                  <td className="px-4 py-4"><button type="button" onClick={() => setSelected(practitioner)} className="font-semibold text-primary">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <p className="p-8 text-center text-sm text-muted">No practitioners match these filters.</p> : null}
      </section>
      {(["Awaiting Onboarding", "Active", "Disabled"] as const).map((status) => {
        const group = registrations.filter((item) => item.accountStatus === status);
        if (!group.length) return null;
        return <section key={status} className="rounded-2xl border border-card-border bg-surface p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-navy">{status === "Active" ? "Existing practitioners" : status === "Disabled" ? "Disabled practitioners" : "Practitioners awaiting onboarding"}</h2>
          <div className="space-y-2">{group.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border py-3 text-sm">
            <div><p className="font-semibold text-navy">{item.fullName}</p><p className="text-muted">{item.email} · {item.profession} · {item.city}, {item.country}</p><p className="text-muted">{item.capabilities.join(", ")}</p><p className="text-muted">Account: {item.accountStatus} · Verification: {item.verificationStatus} · {item.invitedAt ? "Invitation sent" : "Not invited"}</p></div>
            <div className="flex flex-wrap gap-2">
              {status !== "Active" ? <button type="button" disabled={saving} className="rounded-lg border px-3 py-2" onClick={() => startSaving(async () => { const result = await setPractitionerRegistrationStatus(item.id, "Active"); if (!result.ok) setError(result.error); else { setError(""); router.refresh(); } })}>Activate</button> : null}
              {status !== "Disabled" ? <button type="button" disabled={saving} className="rounded-lg border px-3 py-2" onClick={() => startSaving(async () => { const result = await setPractitionerRegistrationStatus(item.id, "Disabled"); if (!result.ok) setError(result.error); else { setError(""); router.refresh(); } })}>Disable</button> : null}
              {status === "Active" ? <button type="button" disabled={saving} className="rounded-lg bg-primary px-3 py-2 text-white" onClick={() => startSaving(async () => { const result = await inviteRegisteredPractitioner(item.id); if (!result.ok) setError(result.error); else { setError(""); router.refresh(); } })}>{item.invitedAt ? "Resend Invitation" : "Send Invitation"}</button> : null}
            </div>
          </div>)}</div>
        </section>;
      })}
      {error && !adding ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {adding ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/45 p-4">
        <form onSubmit={(event) => { event.preventDefault(); setError(""); startSaving(async () => {
          const result = await registerPractitioner(draft);
          if (!result.ok) { setError(result.error); return; }
          setAdding(false); setDraft({ fullName: "", email: "", profession: "", country: "Botswana", city: "", capabilities: [] }); router.refresh();
        }); }} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-navy">Add Practitioner</h2>
          <p className="text-sm text-muted">Register an active practitioner pending credential verification. Invitation and login access are managed separately.</p>
          <label className="block text-sm font-medium">Name<input required minLength={2} maxLength={160} value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} className="mt-1 w-full rounded-lg border p-3" /></label>
          <label className="block text-sm font-medium">Email<input type="email" required value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} className="mt-1 w-full rounded-lg border p-3" /></label>
          <label className="block text-sm font-medium">Profession<select required value={draft.profession} onChange={e => setDraft({ ...draft, profession: e.target.value })} className="mt-1 w-full rounded-lg border p-3"><option value="">Select profession</option>{["Nurse","Doctor","Physiotherapist","Phlebotomist","Optometrist","Dentist","Dietitian","Psychologist","Counsellor","Fitness Coach","Occupational Health Practitioner"].map(v => <option key={v}>{v}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Country<input required value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })} className="mt-1 w-full rounded-lg border p-3" /></label>
            <label className="block text-sm font-medium">City/Town<input required value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} className="mt-1 w-full rounded-lg border p-3" /></label>
          </div>
          <fieldset><legend className="text-sm font-medium">Capabilities (choose at least one)</legend><div className="mt-2 grid grid-cols-2 gap-2">{options.map(v => <label key={v} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.capabilities.includes(v)} onChange={e => setDraft({ ...draft, capabilities: e.target.checked ? [...draft.capabilities,v] : draft.capabilities.filter(x => x !== v) })}/>{v}</label>)}</div></fieldset>
          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setAdding(false)} className="rounded-lg border px-4 py-2">Cancel</button><button type="submit" disabled={saving || !draft.capabilities.length} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Practitioner"}</button></div>
        </form>
      </div> : null}
      {selected ? <PractitionerDetail practitioner={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function PractitionerDetail({ practitioner, onClose }: { practitioner: AdminPractitioner; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-primary">Practitioner details</p><h2 className="mt-2 text-xl font-semibold text-navy">{practitioner.fullName}</h2><p className="mt-1 text-sm text-muted">{practitioner.profession} · {practitioner.specialisation ?? "General practice"}</p></div><button type="button" onClick={onClose} className="text-sm font-semibold text-muted">Close</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{[["Email", practitioner.professionalEmail], ["Phone", practitioner.phone ?? "Not provided"], ["Registration", [practitioner.registrationAuthority, practitioner.registrationNumber].filter(Boolean).join(" · ") || "Not provided"], ["Registration expiry", practitioner.registrationExpiryDate ?? "Not provided"], ["Experience", `${practitioner.yearsExperience} years`], ["Profile completeness", `${practitioner.profileCompleteness}%`]].map(([label, value]) => <div key={label} className="rounded-xl border border-card-border p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-navy">{value}</p></div>)}</div><div className="mt-5"><h3 className="text-sm font-semibold text-navy">Approved capabilities</h3><p className="mt-2 text-sm text-muted">{practitioner.capabilities.filter((item) => item.approvalStatus === "Approved").map((item) => item.name).join(", ") || "No approved capabilities"}</p></div></section></div>;
}

function tone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "Verified") return "success";
  if (status === "Action Required" || status === "Expired") return "danger";
  if (status === "Under Review" || status === "Pending Verification") return "warning";
  return "neutral";
}
