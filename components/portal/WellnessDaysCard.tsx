"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft2,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CloseSquare,
  Edit,
} from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type WellnessDay = {
  id: string;
  date: string;
  eventDate: string;
  organization: string;
  activationType: string;
  location: string;
  expectedEmployees: number;
  readiness: number;
  logo: string;
  contact: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  status: "Confirmed" | "Mobilising" | "3-Day Confirmation Due" | "Scheduled" | "Needs Attention";
};

const weekSets: Array<{ label: string; days: WellnessDay[] }> = [
  {
    label: "May 20 - May 29",
    days: [
      {
        id: "de-beers-may-20",
        date: "May 20",
        eventDate: "2026-05-20",
        organization: "De Beers",
        activationType: "Onsite Preventive Screening",
        location: "Gaborone HQ",
        expectedEmployees: 180,
        readiness: 86,
        logo: "DB",
        contact: {
          name: "Naledi Molefe",
          role: "HR Wellness Lead",
          email: "naledi.molefe@debeers.co.bw",
          phone: "+267 391 2400",
        },
        status: "Confirmed",
      },
      {
        id: "delta-mining-may-22",
        date: "May 22",
        eventDate: "2026-05-22",
        organization: "Delta Mining Group",
        activationType: "Fitness / Smartwatch Activation",
        location: "Jwaneng Site",
        expectedEmployees: 240,
        readiness: 62,
        logo: "DM",
        contact: {
          name: "Kabo Motsumi",
          role: "HR Operations Partner",
          email: "kabo.motsumi@deltamining.co.bw",
          phone: "+267 588 0142",
        },
        status: "Mobilising",
      },
      {
        id: "sandfire-may-24",
        date: "May 24",
        eventDate: "2026-05-24",
        organization: "Sandfire Motheo",
        activationType: "Mental Wellness Activation",
        location: "CBD Branch",
        expectedEmployees: 90,
        readiness: 45,
        logo: "SM",
        contact: {
          name: "Amantle Dube",
          role: "HR Coordinator",
          email: "amantle.dube@sandfiremotheo.co.bw",
          phone: "+267 370 1188",
        },
        status: "3-Day Confirmation Due",
      },
      {
        id: "lucara-may-27",
        date: "May 27",
        eventDate: "2026-05-27",
        organization: "Lucara Mine",
        activationType: "Health Awareness Day",
        location: "Main Campus",
        expectedEmployees: 120,
        readiness: 72,
        logo: "LM",
        contact: {
          name: "Neo Kgosi",
          role: "People & Culture Manager",
          email: "neo.kgosi@lucaramine.co.bw",
          phone: "+267 297 3000",
        },
        status: "Scheduled",
      },
      {
        id: "btcl-may-29",
        date: "May 29",
        eventDate: "2026-05-29",
        organization: "BTCL",
        activationType: "BP, BMI & Glucose Screening",
        location: "Gaborone Office",
        expectedEmployees: 210,
        readiness: 58,
        logo: "BT",
        contact: {
          name: "Boitumelo Ramoroka",
          role: "HR Business Partner",
          email: "boitumelo.ramoroka@btcl.co.bw",
          phone: "+267 395 8000",
        },
        status: "Needs Attention",
      },
    ],
  },
  {
    label: "Jun 1 - Jun 5",
    days: [
      {
        id: "orange-jun-1",
        date: "Jun 1",
        eventDate: "2026-06-01",
        organization: "Orange Botswana",
        activationType: "Digital Health Screening",
        location: "Main Mall Office",
        expectedEmployees: 160,
        readiness: 78,
        logo: "OB",
        contact: {
          name: "Tshiamo Keitseng",
          role: "HR Manager",
          email: "tshiamo.keitseng@orange.co.bw",
          phone: "+267 360 9000",
        },
        status: "Confirmed",
      },
      {
        id: "fnb-jun-3",
        date: "Jun 3",
        eventDate: "2026-06-03",
        organization: "FNB Botswana",
        activationType: "Financial Wellness Day",
        location: "CBD Campus",
        expectedEmployees: 300,
        readiness: 66,
        logo: "FN",
        contact: {
          name: "Lesedi Phiri",
          role: "People Partner",
          email: "lesedi.phiri@fnb.co.bw",
          phone: "+267 364 2600",
        },
        status: "Mobilising",
      },
    ],
  },
  {
    label: "Jun 8 - Jun 12",
    days: [
      {
        id: "bpc-jun-8",
        date: "Jun 8",
        eventDate: "2026-06-08",
        organization: "Botswana Power Corporation",
        activationType: "Occupational Health Screening",
        location: "Gaborone Depot",
        expectedEmployees: 260,
        readiness: 82,
        logo: "BP",
        contact: {
          name: "Mpho Radipotsane",
          role: "HR Wellness Coordinator",
          email: "mpho.radipotsane@bpc.bw",
          phone: "+267 360 3000",
        },
        status: "Scheduled",
      },
      {
        id: "mascom-jun-10",
        date: "Jun 10",
        eventDate: "2026-06-10",
        organization: "Mascom",
        activationType: "Preventive Screening",
        location: "Head Office",
        expectedEmployees: 185,
        readiness: 49,
        logo: "MS",
        contact: {
          name: "Kgomotso Moremi",
          role: "HR Lead",
          email: "kgomotso.moremi@mascom.bw",
          phone: "+267 390 3396",
        },
        status: "Needs Attention",
      },
    ],
  },
];

const calendarOnlyEvents: WellnessDay[] = [
  {
    id: "prime-bank-mar-14",
    date: "Mar 14",
    eventDate: "2026-03-14",
    organization: "Prime Bank",
    activationType: "Cardiometabolic Screening",
    location: "Fairgrounds Branch",
    expectedEmployees: 140,
    readiness: 100,
    logo: "PB",
    contact: {
      name: "Karabo Pule",
      role: "HR Officer",
      email: "karabo.pule@primebank.co.bw",
      phone: "+267 318 4400",
    },
    status: "Confirmed",
  },
  {
    id: "gaborone-textiles-apr-9",
    date: "Apr 9",
    eventDate: "2026-04-09",
    organization: "Gaborone Textiles",
    activationType: "Workforce Wellness Day",
    location: "Factory Floor",
    expectedEmployees: 320,
    readiness: 100,
    logo: "GT",
    contact: {
      name: "Ontiretse Tlale",
      role: "HR Supervisor",
      email: "ontiretse.tlale@gabtextiles.co.bw",
      phone: "+267 392 1140",
    },
    status: "Confirmed",
  },
  {
    id: "air-botswana-aug-18",
    date: "Aug 18",
    eventDate: "2026-08-18",
    organization: "Air Botswana",
    activationType: "Mental Wellness Activation",
    location: "Airport Office",
    expectedEmployees: 125,
    readiness: 35,
    logo: "AB",
    contact: {
      name: "Thabo Modise",
      role: "HR Business Partner",
      email: "thabo.modise@airbotswana.co.bw",
      phone: "+267 368 8400",
    },
    status: "3-Day Confirmation Due",
  },
];

const allWellnessDays = [...weekSets.flatMap((week) => week.days), ...calendarOnlyEvents];

const statusStyles: Record<WellnessDay["status"], string> = {
  Confirmed: "border-success/20 bg-success/10 text-black",
  Mobilising: "border-warning/25 bg-warning/10 text-black",
  "3-Day Confirmation Due": "border-warning/25 bg-warning/10 text-black",
  Scheduled: "border-primary/20 bg-primary/10 text-black",
  "Needs Attention": "border-pulse-red/20 bg-pulse-red/10 text-black",
};

function readinessTone(readiness: number) {
  if (readiness >= 75) return "bg-success";
  if (readiness >= 50) return "bg-warning";
  return "bg-pulse-red";
}

export function WellnessDaysCard() {
  const [selectedDay, setSelectedDay] = useState<WellnessDay | null>(null);
  const [weekIndex, setWeekIndex] = useState(0);
  const currentWeek = weekSets[weekIndex];

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 border-b border-card-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <CalendarCheck className="mt-1 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
            <div>
              <h2 className="text-[14px] font-semibold leading-5 text-black">This Week&apos;s Wellness Days</h2>
              <p className="mt-1 text-[12px] leading-4 text-black/55">
                Upcoming confirmed and pending wellness activities.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekIndex((value) => Math.max(0, value - 1))}
              disabled={weekIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-300 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black"
              aria-label="Previous week"
            >
              <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-24 text-center text-[12px] leading-4 text-black">{currentWeek.label}</span>
            <button
              type="button"
              onClick={() => setWeekIndex((value) => Math.min(2, value + 1))}
              disabled={weekIndex === 2}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-300 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black"
              aria-label="Next week"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div>
          <div className="w-full">
            <div className="grid grid-cols-[0.58fr_1fr_1.35fr_1fr_1.08fr] gap-2 border-b border-card-border bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Date</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Organization</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Activation Type</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Location / Branch</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Status</span>
            </div>

            <div className="divide-y divide-card-border">
              {currentWeek.days.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className="grid w-full cursor-pointer grid-cols-[0.58fr_1fr_1.35fr_1fr_1.08fr] items-center gap-2 px-4 py-4 text-left text-[12px] text-black transition hover:-translate-y-0.5 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 active:translate-y-0"
                  style={{ fontSize: "12px", lineHeight: "16px" }}
                  aria-label={`View ${day.organization} wellness day details`}
                >
                  <span className="min-w-0 font-normal" style={{ fontSize: "12px", lineHeight: "16px" }}>{day.date}</span>
                  <span className="min-w-0 break-words font-normal" style={{ fontSize: "12px", lineHeight: "16px" }}>{day.organization}</span>
                  <span className="min-w-0 break-words text-black" style={{ fontSize: "12px", lineHeight: "16px" }}>{day.activationType}</span>
                  <span className="min-w-0 break-words text-black" style={{ fontSize: "12px", lineHeight: "16px" }}>{day.location}</span>
                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[12px] font-normal leading-4",
                      statusStyles[day.status],
                    )}
                    style={{ fontSize: "12px", lineHeight: "16px" }}
                  >
                    {day.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WellnessCalendarCard events={allWellnessDays} onSelect={setSelectedDay} />
      {selectedDay ? <WellnessDayModal day={selectedDay} onClose={() => setSelectedDay(null)} /> : null}
    </>
  );
}

function WellnessCalendarCard({
  events,
  onSelect,
}: {
  events: WellnessDay[];
  onSelect: (event: WellnessDay) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(2026, 4, 1));
  const monthEvents = useMemo(() => groupEventsByDay(events), [events]);
  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const monthLabel = visibleMonth.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-card-border px-5 py-4">
        <div className="flex gap-3">
          <CalendarDays className="mt-1 h-5 w-5 text-black" aria-hidden="true" />
          <div>
            <h2 className="text-[14px] font-semibold leading-5 text-black">Calendar</h2>
            <p className="mt-1 text-[12px] leading-4 text-black/55">Wellness days by month.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white text-black transition hover:bg-black hover:text-white"
            aria-label="Previous month"
          >
            <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-28 text-center text-[12px] leading-4 text-black">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white text-black transition hover:bg-black hover:text-white"
            aria-label="Next month"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-7 gap-2 text-center text-[12px] leading-4 text-black">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {Array.from({ length: cells.startOffset }, (_, index) => (
            <div key={`empty-${index}`} aria-hidden="true" />
          ))}
          {cells.days.map((cell) => {
            const dayEvents = monthEvents.get(toDateKey(cell.date)) ?? [];
            return (
              <div
                key={cell.date.toISOString()}
                className="min-h-16 rounded-2xl border border-card-border bg-white p-2"
              >
                <span className="text-[12px] leading-4 text-black">{cell.date.getDate()}</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelect(event)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-card-border bg-[#e4e7ec] text-[10px] font-semibold leading-none text-black transition hover:-translate-y-0.5 hover:bg-black hover:text-white active:translate-y-0"
                      aria-label={`Open ${event.organization}`}
                    >
                      {event.logo}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WellnessDayModal({ day, onClose }: { day: WellnessDay; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wellness-day-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-card-border bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
        <div className="border-b border-card-border px-5 py-4">
          <p className="text-[12px] leading-4 text-black">{day.date}</p>
          <h3 id="wellness-day-modal-title" className="mt-1 text-[14px] font-semibold leading-5 text-black">
            {day.organization}
          </h3>
          <p className="mt-1 text-[12px] leading-4 text-black">{day.activationType}</p>
        </div>

        <div className="grid gap-3 px-5 py-4 text-[12px] text-black">
          <DetailRow label="Location / Branch" value={day.location} />
          <DetailRow label="Expected Employees" value={String(day.expectedEmployees)} />
          <div className="rounded-2xl border border-card-border bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] leading-4 text-black">Readiness</span>
              <span className="text-[12px] leading-4 text-black">{day.readiness}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e7ec]">
              <div
                className={cn("h-full rounded-full", readinessTone(day.readiness))}
                style={{ width: `${day.readiness}%` }}
              />
            </div>
          </div>
          <DetailRow label="Status" value={day.status} />
          <DetailRow label="Contact Role" value={day.contact.role} />
          <DetailRow label="HR Contact Name" value={day.contact.name} />
          <DetailRow label="Email" value={day.contact.email} />
          <DetailRow label="Contact Number" value={day.contact.phone} />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-card-border px-5 py-4">
          <Link
            href="/admin/activations"
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-[12px] font-semibold leading-4 text-black transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-black hover:text-white active:translate-y-0"
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-[12px] font-semibold leading-4 text-black transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-black hover:text-white active:translate-y-0"
          >
            <CloseSquare className="h-4 w-4" aria-hidden="true" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-card-border bg-white px-4 py-3">
      <span className="text-[12px] leading-4 text-black">{label}</span>
      <span className="text-right text-[12px] leading-4 text-black">{value}</span>
    </div>
  );
}

function groupEventsByDay(events: WellnessDay[]) {
  const grouped = new Map<string, WellnessDay[]>();
  events.forEach((event) => {
    const current = grouped.get(event.eventDate) ?? [];
    grouped.set(event.eventDate, [...current, event]);
  });
  return grouped;
}

function buildMonthCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => ({
    date: new Date(month.getFullYear(), month.getMonth(), index + 1),
  }));

  return { startOffset, days };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
