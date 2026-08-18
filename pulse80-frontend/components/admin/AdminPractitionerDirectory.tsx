"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Building2, ClipboardCheck, ShieldCheck, Stethoscope } from "@/components/icons/IconsaxIcons";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ListSummaryMetric } from "@/components/portal/DataListPage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminPractitioner } from "@/types/admin-practitioner";

export function AdminPractitionerDirectory({ practitioners }: { practitioners: AdminPractitioner[] }) {
  const router = useRouter();
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
          <button type="button" onClick={() => router.push("/admin/practitioner-verification")} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white shadow-sm">
            Open verification queue
          </button>
        )}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ListSummaryMetric metric={{ label: "Practitioners", value: String(practitioners.length), detail: "Professional profiles", tone: "primary", icon: Stethoscope }} />
        <ListSummaryMetric metric={{ label: "Verified", value: String(practitioners.filter((item) => item.verificationStatus === "Verified").length), detail: "Approved to deliver", tone: "success", icon: ShieldCheck }} />
        <ListSummaryMetric metric={{ label: "Awaiting review", value: String(pending), detail: "Need verification action", tone: "warning", icon: ClipboardCheck }} />
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
