"use client";

import { useState } from "react";
import Image from "next/image";

import {
  updatePractitionerProfile,
  uploadPractitionerDocument,
  uploadPractitionerPhoto,
  type PractitionerProfile,
} from "@/app/actions/practitioner-profile";
import { Download, Edit, FileText, Location, ShieldCheck, Stethoscope, User } from "@/components/icons/IconsaxIcons";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Props = { initialProfile: PractitionerProfile };

const documentTypes = [
  "Professional licence",
  "Qualification certificate",
  "Identity document",
  "Verification evidence",
] as const;

export function PractitionerProfilePage({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});
  const [documentExpiries, setDocumentExpiries] = useState<Record<string, string>>({});
  const documentType = documentTypes[0];
  const documentExpiry = "";
  const setDocumentType = (value: string) => { void value; };
  const setDocumentExpiry = (value: string) => { void value; };
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(null), 3200);
  };

  async function saveProfile() {
    setSaving(true);
    const result = await updatePractitionerProfile({
      fullName: draft.fullName, professionalEmail: draft.professionalEmail, phone: draft.phone ?? "",
      country: draft.country, city: draft.city ?? "", preferredContactMethod: draft.preferredContactMethod,
      specialisation: draft.specialisation ?? "", yearsExperience: draft.yearsExperience,
      qualifications: draft.qualifications, assignmentNotifications: draft.assignmentNotifications,
      documentNotifications: draft.documentNotifications, paymentNotifications: draft.paymentNotifications,
    });
    setSaving(false);
    if (!result.ok) return showMessage(result.error);
    setProfile(result.profile); setDraft(result.profile); setEditing(false); showMessage("Professional profile saved.");
  }

  async function readFile(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = () => reject(new Error("File read failed"));
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function uploadDocument(documentType: string) {
    const file = documentFiles[documentType];
    if (!file) return showMessage(`Choose a ${documentType.toLowerCase()} file to upload.`);
    setUploadingDocument(true);
    const result = await uploadPractitionerDocument({
      documentType,
      expiryDate: documentExpiries[documentType] || null,
      file: { fileName: file.name, dataUrl: await readFile(file) },
    });
    setUploadingDocument(false);
    if (!result.ok) {
      showMessage(result.error);
      return;
    }
    setProfile((current) => ({ ...current, documents: [result.document, ...current.documents] }));
    setDocumentFiles((current) => ({ ...current, [documentType]: null }));
    showMessage(`${documentType} uploaded for review.`);
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader eyebrow="Health Practitioner" title="Professional profile" description="Manage your professional identity, verified capabilities, assignments, and credential documents." actions={
        editing ? <><ActionButton variant="secondary" onClick={() => { setDraft(profile); setEditing(false); }}>Cancel</ActionButton><ActionButton loading={saving} onClick={saveProfile}>Save profile</ActionButton></> :
          <ActionButton onClick={() => setEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit profile</ActionButton>
      } />

      <section className="border-y border-card-border bg-white px-5 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-card-border bg-soft-bg text-primary">
              {profile.profilePhotoUrl ? <Image src={profile.profilePhotoUrl} alt="" fill unoptimized className="object-cover" /> : <User className="h-10 w-10" />}
              <span className="absolute inset-x-0 bottom-0 bg-navy/75 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Upload</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (event) => {
                const file = event.target.files?.[0]; if (!file) return;
                const result = await uploadPractitionerPhoto({ fileName: file.name, dataUrl: await readFile(file) });
                if (result.ok) { setProfile(result.profile); setDraft(result.profile); showMessage("Profile photo updated."); } else showMessage(result.error);
              }} />
            </label>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-navy">{profile.fullName}</h2><StatusBadge status={profile.verificationStatus} tone={profile.verificationStatus === "Verified" ? "verified" : "warning"} /><StatusBadge status={profile.practitionerStatus} tone={profile.practitionerStatus === "Active" ? "success" : "warning"} /></div>
              <p className="mt-2 text-sm font-medium text-navy">{profile.profession}{profile.specialisation ? ` · ${profile.specialisation}` : ""}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-subtle"><Location className="h-4 w-4" />{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          <div className="min-w-56"><div className="flex justify-between text-xs font-semibold text-navy"><span>Profile completeness</span><span>{profile.profileCompleteness}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-soft-bg"><div className="h-full rounded-full bg-success" style={{ width: `${profile.profileCompleteness}%` }} /></div></div>
        </div>
      </section>

      <div className="space-y-5">
        <Section title="Personal & contact information" icon={User}>
          <div className="grid gap-4 md:grid-cols-2"><Editable label="Full name" value={draft.fullName} editable={editing} onChange={(fullName) => setDraft({ ...draft, fullName })} /><Editable label="Professional email" type="email" value={draft.professionalEmail} editable={editing} onChange={(professionalEmail) => setDraft({ ...draft, professionalEmail })} /><Editable label="Phone number" value={draft.phone ?? ""} editable={editing} onChange={(phone) => setDraft({ ...draft, phone })} /><Editable label="Country" value={draft.country} editable={editing} onChange={(country) => setDraft({ ...draft, country })} /><Editable label="City / location" value={draft.city ?? ""} editable={editing} onChange={(city) => setDraft({ ...draft, city })} /><SelectField label="Preferred contact method" value={draft.preferredContactMethod} editable={editing} options={["Email", "Phone", "WhatsApp"]} onChange={(preferredContactMethod) => setDraft({ ...draft, preferredContactMethod })} /></div>
        </Section>

        <Section title="Professional details" icon={Stethoscope}>
          <div className="grid gap-4 md:grid-cols-2"><ReadField label="Profession" value={profile.profession} /><Editable label="Specialisation" value={draft.specialisation ?? ""} editable={editing} onChange={(specialisation) => setDraft({ ...draft, specialisation })} /><Editable label="Years of experience" type="number" value={String(draft.yearsExperience)} editable={editing} onChange={(value) => setDraft({ ...draft, yearsExperience: Number(value) || 0 })} /><ReadField label="Registration number" value={profile.registrationNumber ?? "Not provided"} /><ReadField label="Registration authority" value={profile.registrationAuthority ?? "Not provided"} /><ReadField label="Registration country" value={profile.registrationCountry ?? "Not provided"} /><ReadField label="Registration expiry" value={formatDate(profile.registrationExpiryDate)} /><ReadField label="Verification status" value={profile.verificationStatus} /></div>
          <div className="mt-4"><Editable label="Qualifications (one per line)" value={draft.qualifications.join("\n")} editable={editing} multiline onChange={(value) => setDraft({ ...draft, qualifications: value.split("\n").map((item) => item.trim()).filter(Boolean) })} /></div>
        </Section>

      </div>

      <div className="space-y-5">
      <Section title="Services & capabilities" icon={ShieldCheck}>
        <div className="grid gap-3 sm:grid-cols-2">{profile.capabilities.map((capability) => <div key={capability.id} className="flex items-center justify-between rounded-lg border border-card-border bg-soft-bg px-3 py-3 text-sm"><span className="font-medium text-navy">{capability.name}</span><StatusBadge status={capability.approvalStatus} tone={capability.approvalStatus === "Approved" ? "success" : "warning"} /></div>)}</div>
      </Section>

      <Section title="Documents & verification" icon={FileText}>
        <DocumentUploadList
          documentFiles={documentFiles}
          documentExpiries={documentExpiries}
          uploadingDocument={uploadingDocument}
          onFileChange={(documentType, file) => setDocumentFiles((current) => ({ ...current, [documentType]: file }))}
          onExpiryChange={(documentType, expiry) => setDocumentExpiries((current) => ({ ...current, [documentType]: expiry }))}
          onUpload={uploadDocument}
        />
        <div className="hidden">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_170px_auto]"><input type="file" id="practitioner-document" accept="application/pdf,image/png,image/jpeg" className="h-11 rounded-lg border border-card-border bg-surface px-3 py-2 text-sm" /><select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-11 rounded-lg border border-card-border bg-surface px-3 text-sm text-navy"><option>Professional licence</option><option>Qualification certificate</option><option>Identity document</option><option>Verification evidence</option></select><input type="date" value={documentExpiry} onChange={(event) => setDocumentExpiry(event.target.value)} className="h-11 rounded-lg border border-card-border bg-surface px-3 text-sm text-navy" /><ActionButton loading={uploadingDocument} onClick={async () => {
          const input = document.getElementById("practitioner-document") as HTMLInputElement | null; const file = input?.files?.[0]; if (!file) return showMessage("Choose a document to upload."); setUploadingDocument(true);
          const result = await uploadPractitionerDocument({ documentType, expiryDate: documentExpiry || null, file: { fileName: file.name, dataUrl: await readFile(file) } }); setUploadingDocument(false);
          if (result.ok) { setProfile({ ...profile, documents: [result.document, ...profile.documents] }); if (input) input.value = ""; showMessage("Document uploaded for review."); } else showMessage(result.error);
        }}>Upload document</ActionButton></div>
        <div className="mt-4 overflow-x-auto"><div className="min-w-[760px] divide-y divide-card-border rounded-lg border border-card-border">{profile.documents.map((item) => { const documentStatus = documentStatusLabel(item); return <div key={item.id} className="grid grid-cols-[1.1fr_1fr_0.7fr_0.7fr_auto] items-center gap-3 px-4 py-3 text-sm"><span className="font-semibold text-navy">{item.documentType}</span><span className="truncate text-subtle">{item.fileName}</span><span className="text-subtle">{formatDate(item.expiryDate)}</span><StatusBadge status={documentStatus.label} tone={documentStatus.tone} />{item.downloadUrl ? <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="text-primary"><Download className="h-4 w-4" /></a> : <span />}</div>; })}{!profile.documents.length ? <p className="px-4 py-5 text-sm text-subtle">No verification documents uploaded yet.</p> : null}</div></div>
        </div>
      </Section>
      </div>

      {message ? <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-card-border bg-white px-4 py-3 text-sm font-semibold text-navy shadow-xl">{message}</div> : null}
    </div>
  );
}

function Section({ title, icon: Icon, action, children }: { title: string; icon: typeof User; action?: React.ReactNode; children: React.ReactNode }) { return <DashboardWidget><div className="flex items-center justify-between border-b border-card-border px-5 py-4"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-navy">{title}</h2></div>{action}</div><div className="p-5">{children}</div></DashboardWidget>; }
function ReadField({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold text-navy">{label}</p><p className="mt-2 flex min-h-11 items-center rounded-lg border border-card-border bg-soft-bg px-3 text-sm text-navy">{value || "Not provided"}</p></div>; }
function Editable({ label, value, editable, onChange, type = "text", multiline = false }: { label: string; value: string; editable: boolean; onChange: (value: string) => void; type?: string; multiline?: boolean }) { if (!editable) return <ReadField label={label} value={multiline ? value.replace(/\n/g, ", ") : value} />; return <label className="block"><span className="text-xs font-semibold text-navy">{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/10" /> : <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-primary/40 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/10" />}</label>; }
function SelectField({ label, value, editable, options, onChange }: { label: string; value: string; editable: boolean; options: string[]; onChange: (value: string) => void }) { if (!editable) return <ReadField label={label} value={value} />; return <label><span className="text-xs font-semibold text-navy">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-primary/40 bg-white px-3 text-sm">{options.map((item) => <option key={item}>{item}</option>)}</select></label>; }
function DocumentUploadList({ documentFiles, documentExpiries, uploadingDocument, onFileChange, onExpiryChange, onUpload }: { documentFiles: Record<string, File | null>; documentExpiries: Record<string, string>; uploadingDocument: boolean; onFileChange: (documentType: string, file: File | null) => void; onExpiryChange: (documentType: string, expiry: string) => void; onUpload: (documentType: string) => void }) {
  return <div className="space-y-3">{documentTypes.map((documentType) => <div key={documentType} className="grid gap-2 rounded-lg border border-card-border bg-soft-bg p-3 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center"><div className="min-w-0"><p className="text-xs font-semibold text-navy">{documentType}</p><input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => onFileChange(documentType, event.target.files?.[0] ?? null)} className="mt-2 h-10 min-w-0 w-full rounded-lg border border-card-border bg-surface px-2 py-2 text-xs" /></div><input type="date" aria-label={`${documentType} expiry date`} value={documentExpiries[documentType] ?? ""} onChange={(event) => onExpiryChange(documentType, event.target.value)} className="h-10 min-w-0 rounded-lg border border-card-border bg-surface px-2 text-xs text-navy" /><ActionButton loading={uploadingDocument} onClick={() => onUpload(documentType)} className="w-full sm:w-auto">Upload</ActionButton><span className="sr-only">{documentFiles[documentType]?.name ?? "No file selected"}</span></div>)}</div>;
}
function formatDate(value: string | null) { if (!value) return "Not provided"; return new Intl.DateTimeFormat("en-BW", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function documentStatusLabel(document: PractitionerProfile["documents"][number]) {
  if (document.verificationStatus === "Verified" && document.expiryDate) {
    const daysRemaining = Math.ceil((new Date(`${document.expiryDate}T00:00:00`).getTime() - Date.now()) / 86_400_000);
    if (daysRemaining < 0) return { label: "Expired", tone: "danger" as const };
    if (daysRemaining <= 60) return { label: "Expiring Soon", tone: "warning" as const };
  }
  if (document.verificationStatus === "Verified") return { label: "Verified", tone: "success" as const };
  if (document.verificationStatus === "Expired") return { label: "Expired", tone: "danger" as const };
  return { label: document.verificationStatus, tone: "warning" as const };
}
