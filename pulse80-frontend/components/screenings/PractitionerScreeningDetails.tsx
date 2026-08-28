"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resubmitScreening } from "@/app/actions/screening-operations";
import { ArrowLeft2, HeartPulse, Microscope, ShieldCheck } from "@/components/icons/IconsaxIcons";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastMessage } from "@/components/ui/ToastMessage";
import type { Screening, ScreeningCorrectionForm } from "@/types/screening";

export function PractitionerScreeningDetails({ screening }: { screening: Screening }) {
  const router = useRouter();
  const [correcting, setCorrecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ScreeningCorrectionForm>(() => correctionForm(screening));

  async function submitCorrection() {
    const validationError = correctionError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await resubmitScreening(screening.id, form);
      if (!result.ok) {
        setError(friendlyError(result.error));
        return;
      }
      setMessage("Screening corrections submitted for quality assurance.");
      setCorrecting(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/practitioner/screenings" className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
        <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
        Back to screenings
      </Link>

      <PortalPageHeader
        eyebrow="Health Practitioner"
        title={`Screening ${screening.participantReference}`}
        description={`${screening.organisationName} · ${screening.activationName ?? "Assignment capture"} · ${screening.department ?? "Department not set"}`}
        actions={<div className="flex flex-wrap items-center gap-2"><RiskBadge risk={screening.result.riskLevel} /><StatusBadge status={screening.status} tone={statusTone(screening.status)} />{screening.status === "Needs Correction" && !correcting ? <button type="button" onClick={() => { setError(null); setCorrecting(true); }} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white">Correct screening</button> : null}</div>}
      />

      <ToastMessage message={message} />

      {screening.status === "Needs Correction" ? (
        <section className="rounded-lg border border-pulse-red/20 bg-pulse-red/5 px-4 py-3">
          <p className="text-xs font-semibold text-pulse-red">Correction required</p>
          <p className="mt-1 text-sm text-navy">{screening.reviewNote || "Review the screening details and correct the returned record before resubmitting."}</p>
        </section>
      ) : null}

      {correcting ? (
        <CorrectionForm
          form={form}
          saving={saving}
          error={error}
          onChange={(key, value) => { setError(null); setForm((current) => ({ ...current, [key]: value })); }}
          onCancel={() => { if (!saving) { setForm(correctionForm(screening)); setError(null); setCorrecting(false); } }}
          onSubmit={() => { void submitCorrection(); }}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Microscope} label="Risk level" value={screening.result.riskLevel} detail={screening.result.escalationRequired ? "Escalation required" : "No escalation required"} />
        <SummaryCard icon={ShieldCheck} label="Consent" value={screening.consentConfirmed ? "Confirmed" : "Not confirmed"} detail="Participant consent status" />
        <SummaryCard icon={HeartPulse} label="Captured" value={formatDate(screening.capturedAt)} detail={screening.submittedAt ? `Submitted ${formatDate(screening.submittedAt)}` : "Not yet submitted"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DetailSection title="Participant & assignment">
          <DetailRow label="Reference" value={screening.participantReference} />
          <DetailRow label="Organisation" value={screening.organisationName} />
          <DetailRow label="Activation" value={screening.activationName ?? "Assignment capture"} />
          <DetailRow label="Department" value={screening.department ?? "Not set"} />
          <DetailRow label="Practitioner" value={screening.practitionerName} />
          <DetailRow label="Consent" value={screening.consentConfirmed ? "Confirmed" : "Not confirmed"} />
        </DetailSection>

        <DetailSection title="Measurements">
          <DetailRow label="Blood pressure" value={bloodPressure(screening)} />
          <DetailRow label="Glucose" value={unit(screening.result.glucoseMmolL, "mmol/L")} />
          <DetailRow label="Cholesterol" value={unit(screening.result.cholesterolMmolL, "mmol/L")} />
          <DetailRow label="Height" value={unit(screening.result.heightCm, "cm")} />
          <DetailRow label="Weight" value={unit(screening.result.weightKg, "kg")} />
          <DetailRow label="BMI" value={screening.result.bmi === null ? "Not calculated" : String(screening.result.bmi)} />
        </DetailSection>

        <DetailSection title="Assessment">
          <DetailRow label="Risk level" value={screening.result.riskLevel} />
          <DetailRow label="Escalation required" value={screening.result.escalationRequired ? "Yes" : "No"} />
          <DetailRow label="Practitioner note" value={screening.practitionerNote || "No practitioner note"} multiline />
        </DetailSection>

        <DetailSection title="Submission & QA">
          <DetailRow label="Captured" value={formatDate(screening.capturedAt)} />
          <DetailRow label="Submitted" value={screening.submittedAt ? formatDate(screening.submittedAt) : "Not submitted"} />
          <DetailRow label="Reviewed" value={screening.reviewedAt ? formatDate(screening.reviewedAt) : "Not reviewed"} />
          <DetailRow label="Status" value={screening.status} />
          <DetailRow label="Reviewer note" value={screening.reviewNote || "No reviewer note"} multiline />
        </DetailSection>
      </section>
    </div>
  );
}

function CorrectionForm({ form, saving, error, onChange, onCancel, onSubmit }: {
  form: ScreeningCorrectionForm;
  saving: boolean;
  error: string | null;
  onChange: <Key extends keyof ScreeningCorrectionForm>(key: Key, value: ScreeningCorrectionForm[Key]) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <section className="w-full rounded-lg border border-card-border bg-white p-5 shadow-sm">
      <div><h2 className="text-sm font-semibold text-navy">Correct screening</h2><p className="mt-1 text-xs text-muted">Update the returned information and resubmit it for quality assurance.</p></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Participant reference"><input value={form.participantReference} onChange={(event) => onChange("participantReference", event.target.value)} className={inputClass} /></Field>
        <Field label="Department"><input value={form.department} onChange={(event) => onChange("department", event.target.value)} className={inputClass} /></Field>
        <Field label="Systolic (mmHg)"><input type="number" value={form.systolicMmhg} onChange={(event) => onChange("systolicMmhg", event.target.value)} className={inputClass} /></Field>
        <Field label="Diastolic (mmHg)"><input type="number" value={form.diastolicMmhg} onChange={(event) => onChange("diastolicMmhg", event.target.value)} className={inputClass} /></Field>
        <Field label="Glucose (mmol/L)"><input type="number" step="0.01" value={form.glucoseMmolL} onChange={(event) => onChange("glucoseMmolL", event.target.value)} className={inputClass} /></Field>
        <Field label="Cholesterol (mmol/L)"><input type="number" step="0.01" value={form.cholesterolMmolL} onChange={(event) => onChange("cholesterolMmolL", event.target.value)} className={inputClass} /></Field>
        <Field label="Height (cm)"><input type="number" step="0.01" value={form.heightCm} onChange={(event) => onChange("heightCm", event.target.value)} className={inputClass} /></Field>
        <Field label="Weight (kg)"><input type="number" step="0.01" value={form.weightKg} onChange={(event) => onChange("weightKg", event.target.value)} className={inputClass} /></Field>
        <Field label="Practitioner note"><input value={form.practitionerNote} onChange={(event) => onChange("practitionerNote", event.target.value)} className={inputClass} /></Field>
        <label className="flex items-center gap-3 text-sm font-semibold text-navy sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={form.consentConfirmed} onChange={(event) => onChange("consentConfirmed", event.target.checked)} />Participant consent has been confirmed</label>
      </div>
      {error ? <p role="alert" className="mt-4 text-xs font-medium text-red-600">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={saving} onClick={onCancel} className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-navy disabled:opacity-40">Cancel</button><button type="button" disabled={saving} onClick={onSubmit} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{saving ? "Resubmitting…" : "Resubmit screening"}</button></div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2 text-xs font-semibold text-navy"><span>{label}</span>{children}</label>;
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof Microscope; label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-card-border bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-navy">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></div></div></article>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-card-border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-navy">{title}</h2><div className="mt-4 divide-y divide-card-border">{children}</div></section>;
}

function DetailRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return <div className={`grid gap-2 py-3 ${multiline ? "" : "sm:grid-cols-[160px_1fr] sm:items-start"}`}><p className="text-xs font-medium text-muted">{label}</p><p className={`text-sm font-medium text-navy ${multiline ? "whitespace-pre-wrap leading-6" : ""}`}>{value}</p></div>;
}

function RiskBadge({ risk }: { risk: string }) {
  return <StatusBadge status={risk} tone={risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success"} />;
}

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "Approved") return "success";
  if (status === "Needs Correction") return "danger";
  if (status === "Submitted") return "warning";
  return "info";
}

function bloodPressure(screening: Screening) {
  const { systolicMmhg, diastolicMmhg } = screening.result;
  return systolicMmhg === null || diastolicMmhg === null ? "Not recorded" : `${systolicMmhg}/${diastolicMmhg} mmHg`;
}

function unit(value: number | null, suffix: string) {
  return value === null ? "Not recorded" : `${value} ${suffix}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone" }).format(new Date(value));
}

function correctionForm(screening: Screening): ScreeningCorrectionForm {
  const value = (measurement: number | null) => measurement === null ? "" : String(measurement);
  return {
    participantReference: screening.participantReference,
    department: screening.department ?? "",
    consentConfirmed: screening.consentConfirmed,
    practitionerNote: screening.practitionerNote ?? "",
    systolicMmhg: value(screening.result.systolicMmhg),
    diastolicMmhg: value(screening.result.diastolicMmhg),
    glucoseMmolL: value(screening.result.glucoseMmolL),
    cholesterolMmolL: value(screening.result.cholesterolMmolL),
    heightCm: value(screening.result.heightCm),
    weightKg: value(screening.result.weightKg),
  };
}

function correctionError(form: ScreeningCorrectionForm) {
  if (form.participantReference.trim().length < 2) return "Enter a participant reference with at least two characters.";
  if (!form.consentConfirmed) return "Confirm participant consent before resubmitting.";
  const measurements = [form.systolicMmhg, form.diastolicMmhg, form.glucoseMmolL, form.cholesterolMmolL, form.heightCm, form.weightKg];
  if (!measurements.some((value) => value.trim())) return "Record at least one screening measurement.";
  if (Boolean(form.systolicMmhg.trim()) !== Boolean(form.diastolicMmhg.trim())) return "Enter both systolic and diastolic blood pressure values.";
  if (Boolean(form.heightCm.trim()) !== Boolean(form.weightKg.trim())) return "Enter both height and weight to calculate BMI.";
  return null;
}

function friendlyError(error: string) {
  if (error === "INTERNAL_SERVER_ERROR") return "The screening could not be resubmitted. Confirm the record still requires correction and try again.";
  return error.replaceAll("_", " ");
}

const inputClass = "h-11 w-full rounded-lg border border-card-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
