"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import {
  updatePractitionerProfile,
  uploadPractitionerPhoto,
  deletePractitionerPhoto,
  type PractitionerProfile,
} from "@/app/actions/practitioner-profile";
import { CalendarDays, Edit, Eye, Location, ShieldCheck, Stethoscope, Trash, User } from "@/components/icons/IconsaxIcons";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Props = { initialProfile: PractitionerProfile };

const professions = [
  "Neurologist", "Psychiatrist", "Neurosurgeon", "Clinical Psychologist", "Dermatologist",
  "Endocrinologist", "Nephrologist", "Urologist", "Otolaryngologist", "Oncologist",
  "Dietitian", "Physical Therapist", "Pulmonologist", "Radiologist", "Podiatrist",
  "Audiologist", "Dentist", "Optometrist", "Physiotherapist", "Orthotist",
];
const qualificationOptions = ["MBBS", "BSc Nursing", "Diploma in Nursing", "Midwifery Certificate", "MSc Clinical Psychology", "BSc Physiotherapy", "BSc Occupational Therapy", "BSc Dietetics", "Social Work Degree", "Public Health Diploma"];
const specialisationOptions = ["Primary care", "Maternal health", "Child health", "Mental health", "Occupational health", "Chronic disease management", "Emergency care", "Rehabilitation", "Nutrition", "Public health"];
const locations: Record<string, { areaLabel: string; areas: Record<string, string[]> }> = {
  Botswana: {
    areaLabel: "District",
    areas: {
      Central: ["Palapye", "Serowe", "Mahalapye", "Letlhakane", "Bobonong", "Tonota", "Tutume"],
      Chobe: ["Kasane", "Kazungula", "Kachikau"],
      Ghanzi: ["Ghanzi", "Charles Hill", "Ncojane"],
      Kgalagadi: ["Tshabong", "Hukuntsi", "Kang", "Werda"],
      Kgatleng: ["Mochudi", "Oodi", "Modipane", "Mmathubudukwane"],
      Kweneng: ["Molepolole", "Mogoditshane", "Gabane", "Thamaga", "Lentsweletau"],
      "North-East": ["Francistown", "Masunga", "Tati Siding"],
      "North-West": ["Maun", "Gumare", "Shakawe", "Etsha"],
      "South-East": ["Gaborone", "Tlokweng", "Ramotswa", "Otse"],
      Southern: ["Kanye", "Lobatse", "Jwaneng", "Moshupa", "Goodhope"],
    },
  },
  "South Africa": {
    areaLabel: "Province",
    areas: {
      "Eastern Cape": ["Gqeberha", "East London", "Mthatha", "Komani", "Makhanda"],
      "Free State": ["Bloemfontein", "Welkom", "Bethlehem", "Sasolburg", "Kroonstad"],
      Gauteng: ["Johannesburg", "Pretoria", "Soweto", "Sandton", "Midrand", "Centurion", "Germiston", "Boksburg", "Benoni", "Vereeniging"],
      "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Richards Bay", "Newcastle", "Ladysmith", "Ballito"],
      Limpopo: ["Polokwane", "Tzaneen", "Thohoyandou", "Musina", "Mokopane", "Lephalale"],
      Mpumalanga: ["Mbombela", "Emalahleni", "Middelburg", "Secunda", "Ermelo", "White River"],
      "North West": ["Mahikeng", "Rustenburg", "Klerksdorp", "Potchefstroom", "Brits"],
      "Northern Cape": ["Kimberley", "Upington", "Kuruman", "De Aar", "Springbok"],
      "Western Cape": ["Cape Town", "Stellenbosch", "Paarl", "George", "Worcester", "Mossel Bay"],
    },
  },
};
const registrationAuthorities: Record<string, string[]> = {
  Botswana: ["Botswana Health Professions Council (BHPC)", "Nurses and Midwives Council of Botswana (NMCB)", "Botswana Pharmacy Council (BPC)"],
  "South Africa": ["Health Professions Council of South Africa (HPCSA)", "South African Nursing Council (SANC)", "South African Pharmacy Council (SAPC)"],
  "Botswana and South Africa": ["Botswana Health Professions Council (BHPC)", "Health Professions Council of South Africa (HPCSA)"],
};
const serviceOptions = ["Primary healthcare", "Health screening", "Mental health support", "Nutrition counselling", "Physiotherapy", "Occupational health", "Maternal care", "Community outreach", "Health education", "Emergency response"];

export function PractitionerProfilePage({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [photoToCrop, setPhotoToCrop] = useState<File | null>(null);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number | null>(null);

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(null), 3200);
  };

  async function saveProfile() {
    setSaving(true);
    const result = await updatePractitionerProfile({
      fullName: draft.fullName, professionalEmail: draft.professionalEmail, phone: draft.phone ?? "",
      country: draft.country, city: draft.city ?? "", districtProvince: draft.districtProvince ?? "", clinicHospital: draft.clinicHospital ?? "", preferredContactMethod: draft.preferredContactMethod,
      profession: draft.profession, specialisation: draft.specialisation ?? "", specialisations: draft.specialisations.map((item) => item.name), yearsExperience: draft.yearsExperience,
      qualifications: draft.qualifications, registrationNumber: draft.registrationNumber ?? "", registrationAuthority: draft.registrationAuthority ?? "", registrationCountry: draft.registrationCountry ?? "", registrationExpiryDate: draft.registrationExpiryDate,
      selectedServiceCodes: draft.selectedServices.map((item) => item.code), assignmentNotifications: draft.assignmentNotifications,
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

  async function uploadCroppedPhoto(file: File) {
    setPhotoUploadProgress(12);
    const progressTimer = window.setInterval(() => setPhotoUploadProgress((current) => Math.min((current ?? 12) + 8, 88)), 180);
    const result = await uploadPractitionerPhoto({ fileName: file.name, dataUrl: await readFile(file) });
    window.clearInterval(progressTimer);
    if (result.ok) { setPhotoUploadProgress(100); setProfile(result.profile); setDraft(result.profile); showMessage("Profile photo updated."); } else { setPhotoUploadProgress(null); showMessage(result.error); }
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
            <div className="flex shrink-0 flex-col items-center gap-1">
            <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-card-border bg-soft-bg text-primary">
              {profile.profilePhotoUrl ? <Image src={profile.profilePhotoUrl} alt="" fill unoptimized className="object-cover" /> : <User className="h-10 w-10" />}
              <span className="absolute inset-x-0 bottom-0 bg-navy/75 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Change</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPhotoToCrop(file); }} />
            </label>
            {photoUploadProgress !== null ? <div className="h-2 w-20 overflow-hidden rounded-full bg-soft-bg"><div className={`h-full transition-all duration-200 ${photoUploadProgress === 100 ? "bg-success" : "bg-navy"}`} style={{ width: `${photoUploadProgress}%` }} /></div> : null}
            {profile.profilePhotoUrl ? <div className="flex gap-2"><a href={profile.profilePhotoUrl} target="_blank" rel="noreferrer" aria-label="View profile picture" className="text-muted hover:text-navy"><Eye className="h-4 w-4" /></a><button type="button" aria-label="Delete profile picture" className="text-muted hover:text-pulse-red" onClick={async () => { const result = await deletePractitionerPhoto(); if (result.ok) { setProfile(result.profile); setDraft(result.profile); showMessage("Profile photo deleted."); } else showMessage(result.error); }}><Trash className="h-4 w-4" /></button></div> : null}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-navy">{profile.fullName}</h2><StatusBadge status={profile.verificationStatus} tone={profile.verificationStatus === "Verified" ? "verified" : "warning"} /><StatusBadge status={profile.practitionerStatus} tone={profile.practitionerStatus === "Active" ? "success" : "warning"} /></div>
              <p className="mt-2 text-sm font-medium text-navy">{profile.profession}{profile.specialisations.length ? ` · ${profile.specialisations.map((item) => item.name).join(", ")}` : ""}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-subtle"><Location className="h-4 w-4" />{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          <div className="min-w-56"><div className="flex justify-between text-xs font-semibold text-navy"><span>Profile completeness</span><span>{profile.profileCompleteness}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-soft-bg"><div className="h-full rounded-full bg-success" style={{ width: `${profile.profileCompleteness}%` }} /></div></div>
        </div>
      </section>

      <div className="space-y-5">
        <Section title="Personal & contact information" icon={User}>
          <div className="grid gap-4 md:grid-cols-2"><Editable label="Full name" value={draft.fullName} editable={editing} onChange={(fullName) => setDraft({ ...draft, fullName })} /><Editable label="Professional email" type="email" value={draft.professionalEmail} editable={editing} onChange={(professionalEmail) => setDraft({ ...draft, professionalEmail })} /><Editable label="Phone number" value={draft.phone ?? ""} editable={editing} onChange={(phone) => setDraft({ ...draft, phone })} /><SelectField label="Country" value={draft.country} editable={editing} options={Object.keys(locations)} onChange={(country) => setDraft({ ...draft, country, city: "", districtProvince: "" })} /><SelectField label={locations[draft.country]?.areaLabel ?? "District / province"} value={draft.districtProvince ?? ""} editable={editing} options={Object.keys(locations[draft.country]?.areas ?? {})} onChange={(districtProvince) => setDraft({ ...draft, districtProvince, city: "" })} /><SelectField label="City / town" value={draft.city ?? ""} editable={editing} disabled={!draft.districtProvince} options={locations[draft.country]?.areas[draft.districtProvince ?? ""] ?? []} onChange={(city) => setDraft({ ...draft, city })} /><Editable label="Clinic / hospital" value={draft.clinicHospital ?? ""} editable={editing} onChange={(clinicHospital) => setDraft({ ...draft, clinicHospital })} /><SelectField label="Preferred contact method" value={draft.preferredContactMethod} editable={editing} options={["Email", "Phone", "WhatsApp"]} onChange={(preferredContactMethod) => setDraft({ ...draft, preferredContactMethod })} /></div>
        </Section>

        <Section title="Professional details" icon={Stethoscope}>
          <div className="grid gap-4 md:grid-cols-2"><SelectField label="Profession" value={draft.profession} editable={editing} options={professions} onChange={(profession) => setDraft({ ...draft, profession })} /><MultiSelectField label="Specialisations" value={draft.specialisations.map((item) => item.name)} options={specialisationOptions} editable={editing} onChange={(specialisations) => setDraft({ ...draft, specialisations: specialisations.map((name, index) => ({ id: String(index), name, sortOrder: index })) })} /><Editable label="Years of experience" type="number" value={String(draft.yearsExperience)} editable={editing} onChange={(value) => setDraft({ ...draft, yearsExperience: Number(value) || 0 })} /><Editable label="Registration number" value={draft.registrationNumber ?? ""} editable={editing} onChange={(registrationNumber) => setDraft({ ...draft, registrationNumber })} /><SelectField label="Registration body" value={draft.registrationAuthority ?? ""} editable={editing} options={registrationAuthorities[draft.registrationCountry ?? draft.country] ?? []} onChange={(registrationAuthority) => setDraft({ ...draft, registrationAuthority })} /><SelectField label="Registration country" value={draft.registrationCountry ?? ""} editable={editing} options={["Botswana", "South Africa", "Botswana and South Africa"]} onChange={(registrationCountry) => setDraft({ ...draft, registrationCountry, registrationAuthority: "" })} /><DatePickerField label="Registration expiry" value={draft.registrationExpiryDate ?? ""} editable={editing} onChange={(registrationExpiryDate) => setDraft({ ...draft, registrationExpiryDate })} /><ReadField label="Verification status" value={profile.verificationStatus} /></div>
          <div className="mt-4"><MultiSelectField label="Qualifications" value={draft.qualifications} options={qualificationOptions} editable={editing} onChange={(qualifications) => setDraft({ ...draft, qualifications })} /></div>
        </Section>

      </div>

      <div className="space-y-5">
      <Section title="Services & capabilities" icon={ShieldCheck}>
        {editing ? <MultiSelectField label="Services" value={draft.selectedServices.map((item) => item.code)} options={serviceOptions} editable onChange={(selectedServiceCodes) => setDraft({ ...draft, selectedServices: selectedServiceCodes.map((code, index) => ({ id: String(index), code, name: code, approvalStatus: "Pending" })) })} /> : <div className="grid gap-3 sm:grid-cols-2">{profile.capabilities.map((capability) => <div key={capability.id} className="rounded-lg border border-card-border bg-soft-bg px-3 py-3 text-sm"><span className="font-medium text-navy">{capability.name}</span></div>)}</div>}
      </Section>

      </div>

      {message ? <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-card-border bg-white px-4 py-3 text-sm font-semibold text-navy shadow-xl">{message}</div> : null}
      {photoToCrop ? <PhotoCropDialog file={photoToCrop} onCancel={() => setPhotoToCrop(null)} onConfirm={async (file) => { setPhotoToCrop(null); await uploadCroppedPhoto(file); }} /> : null}
    </div>
  );
}

function Section({ title, icon: Icon, action, children }: { title: string; icon: typeof User; action?: React.ReactNode; children: React.ReactNode }) { return <DashboardWidget><div className="flex items-center justify-between border-b border-card-border px-5 py-4"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-navy">{title}</h2></div>{action}</div><div className="p-5">{children}</div></DashboardWidget>; }
function ReadField({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold text-navy">{label}</p><p className="mt-2 flex min-h-11 items-center rounded-lg border border-card-border bg-soft-bg px-3 text-sm text-navy">{value || "Not provided"}</p></div>; }
function Editable({ label, value, editable, onChange, type = "text", multiline = false }: { label: string; value: string; editable: boolean; onChange: (value: string) => void; type?: string; multiline?: boolean }) { if (!editable) return <ReadField label={label} value={multiline ? value.replace(/\n/g, ", ") : value} />; return <label className="block"><span className="text-xs font-semibold text-navy">{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/10" /> : <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-primary/40 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/10" />}</label>; }
function DatePickerField({ label, value, editable, onChange }: { label: string; value: string; editable: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const displayValue = selected ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(selected) : "";
  if (!editable) return <ReadField label={label} value={displayValue} />;
  return (
    <div>
      <span className="text-xs font-semibold text-navy">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="mt-2 flex h-11 w-full items-center justify-between rounded-lg border border-primary/40 bg-white px-3 text-left text-sm text-navy outline-none transition hover:border-primary focus:ring-4 focus:ring-primary/10">
            <span className={displayValue ? "text-navy" : "text-muted"}>{displayValue || "Pick an expiry date"}</span>
            <CalendarDays className="h-4 w-4 text-primary" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar selected={selected} onSelect={(date) => { onChange(formatDateValue(date)); setOpen(false); }} />
          {value ? <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold text-subtle hover:bg-soft-bg hover:text-navy">Clear date</button> : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function SelectField({ label, value, editable, options, disabled = false, onChange }: { label: string; value: string; editable: boolean; options: string[]; disabled?: boolean; onChange: (value: string) => void }) {
  if (!editable) return <ReadField label={label} value={value} />;
  return <label><span className="text-xs font-semibold text-navy">{label}</span><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-primary/40 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-soft-bg disabled:text-muted"><option value="">{disabled ? "Select district / province first" : `Select ${label.toLowerCase()}`}</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}
function MultiSelectField({ label, value, options, editable, onChange }: { label: string; value: string[]; options: string[]; editable: boolean; onChange: (value: string[]) => void }) {
  if (!editable) return <ReadField label={label} value={value.join(", ")} />;
  return <fieldset><legend className="text-xs font-semibold text-navy">{label}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((item) => { const checked = value.includes(item); return <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? "border-primary/50 bg-primary/5 text-navy" : "border-card-border bg-white text-subtle hover:border-primary/30"}`}><input type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((selected) => selected !== item) : [...value, item])} className="h-4 w-4 accent-primary" /><span>{item}</span></label>; })}</div></fieldset>;
}
function PhotoCropDialog({ file, onCancel, onConfirm }: { file: File; onCancel: () => void; onConfirm: (file: File) => Promise<void> }) {
  const [source] = useState(() => URL.createObjectURL(file));
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => URL.revokeObjectURL(source), [source]);

  async function confirmCrop() {
    if (!canvasRef.current) return;
    const image = new globalThis.Image(); image.src = source;
    await new Promise((resolve) => { image.onload = resolve; });
    const size = 640; const scale = Math.max(size / image.width, size / image.height) * zoom;
    const canvas = canvasRef.current; canvas.width = size; canvas.height = size;
    const context = canvas.getContext("2d"); if (!context) return;
    context.drawImage(image, (size - image.width * scale) / 2 + panX, (size - image.height * scale) / 2 + panY, image.width * scale, image.height * scale);
    canvas.toBlob((blob) => { if (blob) void onConfirm(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })); }, "image/jpeg", 0.9);
  }

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/60 p-4"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-semibold text-navy">Adjust profile picture</h2><div className="relative mx-auto mt-4 aspect-square max-w-72 overflow-hidden rounded-full bg-soft-bg"><Image src={source} alt="Profile crop preview" fill unoptimized className="object-cover" style={{ transform: `translate(${panX / 8}px, ${panY / 8}px) scale(${zoom})` }} /></div><canvas ref={canvasRef} className="hidden" /><label className="mt-5 block text-xs font-semibold text-navy">Scale<input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full" /></label><label className="mt-3 block text-xs font-semibold text-navy">Horizontal position<input type="range" min="-320" max="320" value={panX} onChange={(event) => setPanX(Number(event.target.value))} className="mt-2 w-full" /></label><label className="mt-3 block text-xs font-semibold text-navy">Vertical position<input type="range" min="-320" max="320" value={panY} onChange={(event) => setPanY(Number(event.target.value))} className="mt-2 w-full" /></label><div className="mt-5 flex justify-end gap-2"><ActionButton variant="secondary" onClick={onCancel}>Cancel</ActionButton><ActionButton onClick={confirmCrop}>Use picture</ActionButton></div></div></div>;
}
