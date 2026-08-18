"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { reviewPractitionerDocument, updatePractitionerVerification } from "@/app/actions/admin-practitioners";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminPractitioner } from "@/types/admin-practitioner";

export function AdminPractitionerVerification({ practitioners }: { practitioners: AdminPractitioner[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const queue = useMemo(() => practitioners.filter((item) => item.verificationStatus !== "Verified" || item.documents.some((document) => document.verificationStatus !== "Verified")), [practitioners]);

  function decide(practitioner: AdminPractitioner, approved: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePractitionerVerification(practitioner.userId, approved ? "Verified" : "Action Required", approved ? "Active" : "Pending Verification");
      setMessage(result.ok ? `${practitioner.fullName} was ${approved ? "verified" : "sent for updates"}.` : "The verification decision could not be saved.");
      if (result.ok) router.refresh();
    });
  }

  function reviewDocument(documentId: string, approved: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await reviewPractitionerDocument(documentId, approved ? "Verified" : "Action Required");
      setMessage(result.ok ? "Document review saved." : "The document review could not be saved.");
      if (result.ok) router.refresh();
    });
  }

  return <div className="space-y-6"><PortalPageHeader eyebrow="Admin Operations" title="Practitioner Verification" description="Review practitioner identity, professional registration, qualifications, and supporting documents before activation." />{message ? <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-navy">{message}</div> : null}<section className="space-y-4">{queue.map((practitioner) => {
    const registrationCurrent = Boolean(practitioner.registrationExpiryDate && practitioner.registrationExpiryDate >= new Date().toISOString().slice(0, 10));
    const verificationReady = Boolean(practitioner.registrationAuthority && practitioner.registrationNumber && registrationCurrent && practitioner.documents.length && practitioner.documents.every((document) => document.verificationStatus === "Verified"));
    return <article key={practitioner.userId} className="rounded-2xl border border-card-border bg-surface p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-navy">{practitioner.fullName}</h2><StatusBadge status={practitioner.verificationStatus} tone={practitioner.verificationStatus === "Action Required" ? "danger" : "warning"} /></div><p className="mt-2 text-sm text-muted">{practitioner.profession} · {practitioner.specialisation ?? "General practice"}</p><p className="mt-1 text-xs text-muted">{practitioner.registrationAuthority ?? "Registration authority not provided"} · {practitioner.registrationNumber ?? "Number not provided"} · expires {practitioner.registrationExpiryDate ?? "not provided"}</p>{!verificationReady ? <p className="mt-2 text-xs font-semibold text-warning">Verify current registration details and all supporting documents before approval.</p> : null}</div><div className="flex flex-wrap gap-2"><button disabled={isPending} type="button" onClick={() => decide(practitioner, false)} className="rounded-lg border border-danger/25 px-4 py-2 text-xs font-semibold text-danger disabled:opacity-50">Request changes</button><button disabled={isPending || !verificationReady} type="button" onClick={() => decide(practitioner, true)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Verify practitioner</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{practitioner.documents.map((document) => <div key={document.id} className="rounded-xl border border-card-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-navy">{document.documentType}</p><p className="mt-1 text-xs text-muted">{document.fileName}</p></div><StatusBadge status={document.verificationStatus} tone={document.verificationStatus === "Verified" ? "success" : document.verificationStatus === "Action Required" ? "danger" : "warning"} /></div><div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">{document.downloadUrl ? <a href={document.downloadUrl} target="_blank" rel="noreferrer" className="text-primary">View document</a> : <span className="text-muted">Document unavailable</span>}<button disabled={isPending} type="button" onClick={() => reviewDocument(document.id, true)} className="text-success">Approve</button><button disabled={isPending} type="button" onClick={() => reviewDocument(document.id, false)} className="text-danger">Request replacement</button></div></div>)}{!practitioner.documents.length ? <p className="rounded-xl border border-dashed border-card-border p-4 text-sm text-muted">No verification documents have been uploaded.</p> : null}</div></article>;
  })}{!queue.length ? <div className="rounded-2xl border border-card-border bg-surface p-10 text-center"><h2 className="font-semibold text-navy">Verification queue is clear</h2><p className="mt-2 text-sm text-muted">All practitioner profiles and documents are verified.</p></div> : null}</section></div>;
}
