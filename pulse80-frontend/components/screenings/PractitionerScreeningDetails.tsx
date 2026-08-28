"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resubmitScreening } from "@/app/actions/screening-operations";
import {
  AlertCircle,
  ArrowLeft2,
  CalendarCheck,
  ClipboardCheck,
  Edit,
  HeartPulse,
  Microscope,
  ProfileCircle,
  ShieldCheck,
  Stethoscope,
  User,
} from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastMessage } from "@/components/ui/ToastMessage";
import type { Screening, ScreeningCorrectionForm } from "@/types/screening";

export function PractitionerScreeningDetails({ screening }: { screening: Screening }) {
  const router = useRouter();
  const highRisk = screening.result.riskLevel === "High";
  const abnormalMeasurements = getAbnormalMeasurements(screening);
  const [correcting, setCorrecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ScreeningCorrectionForm>(() => correctionForm(screening));

  async function submitCorrection() {
    const validationError = correctionError(form);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    try {
      const result = await resubmitScreening(screening.id, form);
      if (!result.ok) { setError(friendlyError(result.error)); return; }
      setMessage("Screening corrections submitted for quality assurance.");
      setCorrecting(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/practitioner/screenings"
        className="inline-flex items-center gap-2 text-xs font-semibold text-black transition-opacity hover:opacity-70"
      >
        <ArrowLeft2 className="h-4 w-4 text-black" aria-hidden="true" />
        Back to screenings
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium text-muted">Health Practitioner</p>
          <h1 className="mt-1 text-2xl font-semibold text-black">Screening Record</h1>
          <p className="mt-2 text-xs text-muted">
            {screening.activationName ?? "Assignment capture"} · {formatDate(screening.capturedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {highRisk ? <RiskBadge risk={screening.result.riskLevel} /> : null}
          <StatusBadge status={screening.status} tone={statusTone(screening.status)} />
          {screening.status === "Needs Correction" && !correcting ? <button type="button" onClick={() => { setError(null); setCorrecting(true); }} className="rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-85">Correct screening</button> : null}
        </div>
      </div>

      <ToastMessage message={message} />

      {screening.status === "Needs Correction" ? <section className="rounded-2xl border border-red-200 bg-red-50/70 p-4"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" /><div><p className="text-sm font-semibold text-red-700">Correction required</p><p className="mt-1 text-xs leading-5 text-red-700/90">{screening.reviewNote || "Review the screening details and correct the returned record before resubmitting."}</p></div></div></section> : null}

      {correcting ? <CorrectionForm
        form={form}
        saving={saving}
        error={error}
        onChange={(key, value) => { setError(null); setForm((current) => ({ ...current, [key]: value })); }}
        onCancel={() => { if (!saving) { setForm(correctionForm(screening)); setError(null); setCorrecting(false); } }}
        onSubmit={() => { void submitCorrection(); }}
      /> : null}

      <section className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-black">Participant</h2>
          <span className="text-xs text-muted">Reference {screening.participantReference}</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:divide-x lg:divide-card-border">
          <ParticipantIdentity screening={screening} />
          <InfoBlock label="Activation" value={screening.activationName ?? "Assignment capture"} />
          <InfoBlock label="Department" value={screening.department ?? "Not set"} />
          <InfoBlock
            label="Consent"
            value={screening.consentConfirmed ? "Confirmed" : "Not confirmed"}
            status={screening.consentConfirmed ? "confirmed" : undefined}
          />
        </div>
      </section>

      {highRisk ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-red-700">High risk</p>
              <p className="mt-1 text-xs leading-5 text-red-700/90">
                {abnormalMeasurements.length > 0
                  ? `${abnormalMeasurements.length} measurement${abnormalMeasurements.length === 1 ? "" : "s"} outside configured thresholds (${abnormalMeasurements.join(", ")}).`
                  : "This screening requires practitioner attention and follow-up."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-black">Screening Results</h2>
          <span className="text-[11px] text-muted">Participant measurements</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MeasurementCard
            icon={HeartPulse}
            label="Blood Pressure"
            value={bloodPressureValue(screening)}
            unit="mmHg"
          />
          <MeasurementCard
            icon={Stethoscope}
            label="Glucose"
            value={numberValue(screening.result.glucoseMmolL)}
            unit="mmol/L"
            alert={isHighGlucose(screening.result.glucoseMmolL)}
          />
          <MeasurementCard
            icon={Microscope}
            label="Cholesterol"
            value={numberValue(screening.result.cholesterolMmolL)}
            unit="mmol/L"
            alert={isHighCholesterol(screening.result.cholesterolMmolL)}
          />
          <MeasurementCard
            icon={ClipboardCheck}
            label="BMI"
            value={numberValue(screening.result.bmi)}
            unit=""
          />
          <MeasurementCard
            icon={ProfileCircle}
            label="Weight"
            value={numberValue(screening.result.weightKg)}
            unit="kg"
          />
          <MeasurementCard
            icon={User}
            label="Height"
            value={numberValue(screening.result.heightCm)}
            unit="cm"
          />
        </div>
      </section>

      <section className={`rounded-2xl border bg-white p-5 shadow-sm ${highRisk ? "border-red-200" : "border-card-border"}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Assessment</p>
            <div className="mt-3 flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${highRisk ? "bg-red-50 text-red-600" : "bg-slate-50 text-black"}`}>
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className={`text-sm font-semibold ${highRisk ? "text-red-700" : "text-black"}`}>{screening.result.riskLevel} risk</p>
                <p className="mt-1 text-xs text-muted">
                  {screening.result.escalationRequired ? "Escalation required" : "No escalation required"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-black">
              {assessmentCopy(screening, abnormalMeasurements)}
            </p>

            <div className="mt-5 border-t border-card-border pt-4">
              <p className="text-xs font-semibold text-black">Practitioner note</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {screening.practitionerNote || "No practitioner note recorded."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-white px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-slate-50"
            >
              <Edit className="h-4 w-4 text-black" aria-hidden="true" />
              Add note
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
            >
              <AlertCircle className="h-4 w-4 text-white" aria-hidden="true" />
              Escalate
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-black">Record Details</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <DetailRow icon={ProfileCircle} label="Practitioner" value={screening.practitionerName} />
          <DetailRow icon={CalendarCheck} label="Captured" value={formatDate(screening.capturedAt)} />
          <DetailRow
            icon={ClipboardCheck}
            label="Submitted"
            value={screening.submittedAt ? formatDate(screening.submittedAt) : "Not submitted"}
            status={screening.submittedAt ? "submitted" : undefined}
          />
          <DetailRow
            icon={ShieldCheck}
            label="QA Review"
            value={screening.reviewedAt ? formatDate(screening.reviewedAt) : "Pending"}
            status={screening.reviewedAt ? undefined : "warning"}
          />
          <DetailRow icon={User} label="Reviewed" value={screening.reviewedAt ? formatDate(screening.reviewedAt) : "—"} />
          <DetailRow icon={ClipboardCheck} label="Reviewer note" value={screening.reviewNote || "—"} />
        </div>
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
    <section className="w-full rounded-2xl border border-card-border bg-white p-5 shadow-sm">
      <div><h2 className="text-sm font-semibold text-black">Correct screening</h2><p className="mt-1 text-xs text-muted">Update the returned information and resubmit it for quality assurance.</p></div>
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
        <label className="flex items-center gap-3 text-sm font-semibold text-black sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={form.consentConfirmed} onChange={(event) => onChange("consentConfirmed", event.target.checked)} />Participant consent has been confirmed</label>
      </div>
      {error ? <p role="alert" className="mt-4 text-xs font-medium text-red-600">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={saving} onClick={onCancel} className="rounded-xl border border-card-border bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-40">Cancel</button><button type="button" disabled={saving} onClick={onSubmit} className="rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{saving ? "Resubmitting…" : "Resubmit screening"}</button></div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2 text-xs font-semibold text-black"><span>{label}</span>{children}</label>;
}

function ParticipantIdentity({ screening }: { screening: Screening }) {
  return (
    <div className="flex items-start gap-3 pr-0 lg:pr-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-card-border bg-white">
        <User className="h-5 w-5 text-black" aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-semibold text-black">{screening.participantReference}</p>
        <p className="mt-1 text-sm text-black">{screening.organisationName}</p>
        <p className="mt-1 text-xs text-muted">{screening.practitionerName}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, status }: { label: string; value: string; status?: "confirmed" }) {
  return (
    <div className="lg:px-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {status === "confirmed" ? <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : null}
        <p className={`text-sm font-medium ${status === "confirmed" ? "text-emerald-700" : "text-black"}`}>{value}</p>
      </div>
    </div>
  );
}

function MeasurementCard({
  icon: Icon,
  label,
  value,
  unit,
  alert = false,
}: {
  icon: typeof Microscope;
  label: string;
  value: string;
  unit: string;
  alert?: boolean;
}) {
  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? "border-red-200" : "border-card-border"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-black" aria-hidden="true" />
          <p className="text-xs font-semibold text-black">{label}</p>
        </div>
        {alert ? <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" /> : null}
      </div>
      <div className="mt-6">
        <p className="text-3xl font-semibold tracking-tight text-black">{value}</p>
        {unit ? <p className="mt-1 text-xs text-muted">{unit}</p> : null}
      </div>
      {alert ? <p className="mt-4 text-xs font-semibold text-red-700">High</p> : null}
    </article>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: typeof Microscope;
  label: string;
  value: string;
  status?: "submitted" | "warning";
}) {
  const tone = status === "submitted" ? "text-emerald-700" : status === "warning" ? "text-amber-700" : "text-black";

  return (
    <div className="flex items-start gap-3 border-b border-card-border pb-4 last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-black" aria-hidden="true" />
      <div className="grid flex-1 gap-1 sm:grid-cols-[120px_1fr] sm:items-start">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className={`text-sm font-medium ${tone}`}>{value}</p>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  return <StatusBadge status={risk} tone={risk === "High" ? "danger" : risk === "Medium" ? "warning" : "neutral"} />;
}

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "Submitted") return "success";
  if (status === "Needs Correction") return "danger";
  if (status === "Pending") return "warning";
  return "neutral";
}

function getAbnormalMeasurements(screening: Screening) {
  const abnormal: string[] = [];
  if (isHighGlucose(screening.result.glucoseMmolL)) abnormal.push("Glucose");
  if (isHighCholesterol(screening.result.cholesterolMmolL)) abnormal.push("Cholesterol");
  return abnormal;
}

function isHighGlucose(value: number | null) {
  return value !== null && value >= 11.1;
}

function isHighCholesterol(value: number | null) {
  return value !== null && value >= 6.2;
}

function assessmentCopy(screening: Screening, abnormalMeasurements: string[]) {
  if (screening.result.riskLevel === "High" && abnormalMeasurements.length > 0) {
    return `Abnormal ${abnormalMeasurements.join(" and ").toLowerCase()} readings require follow-up${screening.result.escalationRequired ? " and possible escalation" : ""}.`;
  }
  if (screening.result.escalationRequired) return "This screening requires follow-up and escalation.";
  return "No immediate escalation is required based on the available measurements.";
}

function bloodPressureValue(screening: Screening) {
  const { systolicMmhg, diastolicMmhg } = screening.result;
  return systolicMmhg === null || diastolicMmhg === null ? "—" : `${systolicMmhg}/${diastolicMmhg}`;
}

function numberValue(value: number | null) {
  return value === null ? "—" : String(value);
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

const inputClass = "h-11 w-full rounded-xl border border-card-border bg-white px-3 text-sm font-normal text-black outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
