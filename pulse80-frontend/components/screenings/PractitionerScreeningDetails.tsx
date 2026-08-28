import type { ReactNode } from "react";
import Link from "next/link";
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
import type { Screening } from "@/types/screening";

export function PractitionerScreeningDetails({ screening }: { screening: Screening }) {
  const highRisk = screening.result.riskLevel === "High";
  const abnormalMeasurements = getAbnormalMeasurements(screening);

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
        </div>
      </div>

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
        <section className="rounded-2xl border border-card-border bg-red-50/70 p-4">
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

      <section className={`rounded-2xl border border-card-border p-5 shadow-sm ${assessmentBackground(screening.result.riskLevel)}`}>
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
    <article className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
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

function assessmentBackground(riskLevel: string) {
  if (riskLevel === "High") return "bg-red-50/70";
  if (riskLevel === "Medium" || riskLevel === "Moderate") return "bg-orange-50/70";
  return "bg-yellow-50/70";
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
