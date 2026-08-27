import Link from "next/link";
import { ArrowLeft2, HeartPulse, Microscope, ShieldCheck } from "@/components/icons/IconsaxIcons";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Screening } from "@/types/screening";

export function PractitionerScreeningDetails({ screening }: { screening: Screening }) {
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
        actions={<div className="flex flex-wrap gap-2"><RiskBadge risk={screening.result.riskLevel} /><StatusBadge status={screening.status} tone={statusTone(screening.status)} /></div>}
      />

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

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof Microscope; label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-card-border bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-navy">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></div></div></article>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
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
