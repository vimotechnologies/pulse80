"use client";

import { useState } from "react";
import Image from "next/image";

import {
  updatePractitionerProfile,
  uploadPractitionerDocument,
  uploadPractitionerPhoto,
  type PractitionerProfile,
} from "@/app/actions/practitioner-profile";
import { CloudUpload, Edit, FileText, Location, ShieldCheck, Stethoscope, User } from "@/components/icons/IconsaxIcons";
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
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>(documentTypes[0]);
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

  async function uploadDocument() {
    const file = documentFiles[selectedDocumentType];
    if (!file) return showMessage(`Choose a ${selectedDocumentType.toLowerCase()} file to upload.`);
    setUploadingDocument(true);
    const result = await uploadPractitionerDocument({
      documentType: selectedDocumentType,
      expiryDate: null,
      file: { fileName: file.name, dataUrl: await readFile(file) },
    });
    setUploadingDocument(false);
    if (!result.ok) {
      showMessage(result.error);
      return;
    }
    setProfile((current) => ({ ...current, documents: [result.document, ...current.documents] }));
    setDocumentFiles((current) => ({ ...current, [selectedDocumentType]: null }));
    showMessage(`${selectedDocumentType} uploaded successfully.`);
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
          documents={profile.documents}
          documentFiles={documentFiles}
          selectedDocumentType={selectedDocumentType}
          uploadingDocument={uploadingDocument}
          onDocumentTypeChange={setSelectedDocumentType}
          onFileChange={(file) => setDocumentFiles((current) => ({ ...current, [selectedDocumentType]: file }))}
          onUpload={uploadDocument}
        />
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
function DocumentUploadList({ documents, documentFiles, selectedDocumentType, uploadingDocument, onDocumentTypeChange, onFileChange, onUpload }: { documents: PractitionerProfile["documents"]; documentFiles: Record<string, File | null>; selectedDocumentType: string; uploadingDocument: boolean; onDocumentTypeChange: (documentType: string) => void; onFileChange: (file: File | null) => void; onUpload: () => void }) {
  const selectedFile = documentFiles[selectedDocumentType];
  const hasDocument = (documentType: string) => documents.some((document) => document.documentType === documentType);

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2">{documentTypes.map((documentType) => <div key={documentType} className="flex items-center justify-between rounded-lg border border-card-border bg-soft-bg px-3 py-3"><span className="text-sm font-medium text-navy">{documentType}</span><StatusBadge status={hasDocument(documentType) ? "Completed" : "Missing"} tone={hasDocument(documentType) ? "success" : "danger"} /></div>)}</div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div>
        <label className="text-xs font-semibold text-navy" htmlFor="practitioner-document-type">Document type</label>
        <select id="practitioner-document-type" value={selectedDocumentType} onChange={(event) => onDocumentTypeChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-card-border bg-surface px-3 text-sm text-navy">{documentTypes.map((documentType) => <option key={documentType}>{documentType}</option>)}</select>
        <label htmlFor="practitioner-document-file" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFileChange(event.dataTransfer.files[0] ?? null); }} className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-soft-bg px-4 py-4 text-center text-sm text-subtle hover:border-primary hover:bg-primary/5"><CloudUpload className="mb-2 h-7 w-7 text-primary" /><span className="font-semibold text-navy">{selectedFile?.name ?? "Drop a document here or choose a file"}</span><span className="mt-1 text-xs">PDF, PNG, or JPEG</span></label>
        <input id="practitioner-document-file" type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
      </div>
      <ActionButton loading={uploadingDocument} onClick={onUpload} className="w-full sm:w-auto">Upload document</ActionButton>
    </div>
  </div>;
}
function formatDate(value: string | null) { if (!value) return "Not provided"; return new Intl.DateTimeFormat("en-BW", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
