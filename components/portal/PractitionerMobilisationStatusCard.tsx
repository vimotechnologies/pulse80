"use client";

import { MoreHorizontal, UsersRound } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type PractitionerStatus = "Confirmed" | "Pending" | "In Progress" | "Needs Follow-up";

type PractitionerMobilisationRow = {
  name: string;
  specialisation: string;
  assignments: number;
  status: PractitionerStatus;
};

const practitioners: PractitionerMobilisationRow[] = [
  {
    name: "Dr. Mpho Dube",
    specialisation: "Occupational Health",
    assignments: 3,
    status: "Confirmed",
  },
  {
    name: "Nurse Kabelo Molefe",
    specialisation: "BP, BMI & Glucose",
    assignments: 2,
    status: "Pending",
  },
  {
    name: "Dr. Naledi Phiri",
    specialisation: "Mental Wellness",
    assignments: 1,
    status: "Confirmed",
  },
  {
    name: "Thato Mokoena",
    specialisation: "Fitness & Movement",
    assignments: 2,
    status: "In Progress",
  },
  {
    name: "Lerato Nkosi",
    specialisation: "Nutrition & Wellness",
    assignments: 1,
    status: "Needs Follow-up",
  },
];

const statusStyles: Record<PractitionerStatus, string> = {
  Confirmed: "border-success/20 bg-success/10 text-success",
  Pending: "border-warning/25 bg-warning/10 text-warning",
  "In Progress": "border-primary/25 bg-primary/10 text-primary",
  "Needs Follow-up": "border-warning/25 bg-warning/10 text-warning",
};

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s+|^Nurse\s+/u, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PractitionerMobilisationStatusCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <UsersRound className="h-[18px] w-[18px] shrink-0 text-black" aria-hidden="true" />
          <h2 className="truncate text-[14px] font-semibold leading-5 text-black">
            Practitioner Mobilisation Status
          </h2>
        </div>
        <button
          type="button"
          className="shrink-0 text-[12px] font-semibold leading-4 text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          View all
        </button>
      </div>

      <div className="px-5 pb-5">
        <div className="grid grid-cols-[1.4fr_1.1fr_0.7fr_0.9fr_40px] gap-3 border-y border-card-border bg-[#f8fafc] px-3 py-3 text-[12px] font-semibold leading-4 text-black">
          <span>Practitioner</span>
          <span>Specialisation</span>
          <span>Upcoming</span>
          <span>Status</span>
          <span className="sr-only">Actions</span>
        </div>

        <div className="divide-y divide-card-border">
          {practitioners.map((practitioner) => (
            <button
              key={practitioner.name}
              type="button"
              onClick={() => undefined}
              className="grid w-full cursor-pointer grid-cols-[1.4fr_1.1fr_0.7fr_0.9fr_40px] items-center gap-3 px-3 py-3 text-left transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-card-border bg-[#f2f4f7] text-[12px] font-semibold leading-4 text-black">
                  {getInitials(practitioner.name)}
                </span>
                <span className="min-w-0 truncate text-[12px] font-medium leading-4 text-black">
                  {practitioner.name}
                </span>
              </span>
              <span className="min-w-0 truncate text-[12px] leading-4 text-black/70">
                {practitioner.specialisation}
              </span>
              <span className="text-[12px] font-semibold leading-4 text-black">
                {practitioner.assignments}
              </span>
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[12px] font-medium leading-4",
                  statusStyles[practitioner.status],
                )}
              >
                {practitioner.status}
              </span>
              <span className="flex justify-end">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-[#e4e7ec]">
                  <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="sr-only">Open actions</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
