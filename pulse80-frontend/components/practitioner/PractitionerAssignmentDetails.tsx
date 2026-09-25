import Link from "next/link";

import type { PractitionerAssignment } from "@/app/actions/practitioner-profile";
import { CalendarDays, Clock, Location, Stethoscope } from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";

export function PractitionerAssignmentDetails({ assignment }: { assignment: PractitionerAssignment }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[16px] font-medium leading-5">
        <Link href="/practitioner/assignments" className="text-black transition hover:text-primary">Assignments</Link>
        <span className="text-black/35">/</span>
        <span className="truncate text-black">{assignment.activityName}</span>
      </div>

      <section className="rounded-lg border border-card-border bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-card-border bg-white text-primary shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
              <CalendarDays className="h-8 w-8" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-[14px] font-semibold leading-5 text-black">{assignment.activityName}</h1>
              <div className="mt-3 grid gap-x-6 gap-y-2 text-[12px] text-black md:grid-cols-2 xl:grid-cols-3">
                <HeaderMeta icon={Stethoscope} label="Programme:" value={assignment.programmeName} />
                <span className="inline-flex items-center gap-2"><StatusBadge status={assignment.status} tone={statusTone(assignment.status)} /></span>
                <HeaderMeta icon={Stethoscope} label="Service:" value={assignment.serviceName} />
                <HeaderMeta icon={Location} label="Location:" value={assignment.location} />
                <HeaderMeta icon={Clock} label="Starts:" value={formatDate(assignment.startsAt)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <section className="w-full rounded-2xl border border-card-border bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.055)]">
          <Overview assignment={assignment} />
        </section>
        <section className="w-full rounded-2xl border border-card-border bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.055)]">
          <Schedule assignment={assignment} />
        </section>
      </div>
    </div>
  );
}

function Overview({ assignment }: { assignment: PractitionerAssignment }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-4 w-4 text-black" aria-hidden="true" />
        <h2 className="text-[14px] font-semibold text-black">Assignment Overview</h2>
      </div>
      <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        <ReadonlyField label="Organisation" value={assignment.organisationName} />
        <ReadonlyField label="Programme" value={assignment.programmeName} />
        <ReadonlyField label="Activity" value={assignment.activityName} />
        <ReadonlyField label="Assigned Service" value={assignment.serviceName} />
        <ReadonlyField label="Status" value={assignment.status} />
        <ReadonlyField label="Assignment ID" value={assignment.id} muted />
      </div>
    </div>
  );
}

function Schedule({ assignment }: { assignment: PractitionerAssignment }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-black" aria-hidden="true" />
        <h2 className="text-[14px] font-semibold text-black">Schedule & Location</h2>
      </div>
      <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        <ReadonlyField label="Starts" value={formatDate(assignment.startsAt)} icon={CalendarDays} />
        <ReadonlyField label="Ends" value={assignment.endsAt ? formatDate(assignment.endsAt) : "Not set"} icon={CalendarDays} />
        <ReadonlyField label="Duration" value={formatDuration(assignment.startsAt, assignment.endsAt)} icon={Clock} />
        <ReadonlyField label="Location" value={assignment.location} icon={Location} />
        <ReadonlyField label="Time Zone" value="Africa/Gaborone" />
      </div>
    </div>
  );
}

function HeaderMeta({ icon: Icon, label, value }: { icon: typeof Stethoscope; label: string; value: string }) {
  return <span className="inline-flex min-w-0 items-center gap-2 text-[12px] leading-4"><Icon className="h-3.5 w-3.5 shrink-0 text-[#475467]" aria-hidden="true" /><span className="shrink-0 text-black/70">{label}</span><span className="min-w-0 truncate text-black">{value}</span></span>;
}

function ReadonlyField({ label, value, muted = false, icon: Icon }: { label: string; value: string; muted?: boolean; icon?: typeof Stethoscope }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-black/70">{label}</span>
      <span className={cn("flex h-9 items-center gap-2 rounded-lg border border-card-border px-3 text-[12px] text-black", muted ? "bg-[#f2f4f7] text-black/55" : "bg-white")}>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#475467]" aria-hidden="true" /> : null}
        <span className="min-w-0 flex-1 truncate" title={value}>{value}</span>
      </span>
    </label>
  );
}

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "Confirmed" || status === "Completed") return "success";
  if (status === "Cancelled") return "danger";
  if (status === "Action Required") return "warning";
  return "info";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone" }).format(new Date(value));
}

function formatDuration(startsAt: string, endsAt: string | null) {
  if (!endsAt) return "Not set";
  const durationMinutes = Math.max(0, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}
