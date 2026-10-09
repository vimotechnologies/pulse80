"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CloseSquare,
  Edit,
} from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

export type WellnessDay = {
  id: string;
  date: string;
  eventDate: string;
  organization: string;
  activationType: string;
  location: string;
  expectedEmployees: number;
  readiness: number;
  logo: string;
  status: string;
};

type WellnessProps = { events: WellnessDay[]; today: string };

const statusStyles: Record<string, string> = {
  Draft: "border-slate-300 bg-slate-100 text-black",
  Scheduled: "border-primary/20 bg-primary/10 text-black",
  "In Progress": "border-warning/25 bg-warning/10 text-black",
  Completed: "border-success/20 bg-success/10 text-black",
  Cancelled: "border-slate-300 bg-slate-100 text-black",
  "Action Required": "border-pulse-red/20 bg-pulse-red/10 text-black",
};

function readinessTone(readiness: number) {
  if (readiness >= 75) return "bg-success";
  if (readiness >= 50) return "bg-warning";
  return "bg-pulse-red";
}

export function WellnessDaysCard(props: WellnessProps) {
  return (
    <>
      <ThisWeeksWellnessDaysCard {...props} />
      <WellnessCalendarCard {...props} />
    </>
  );
}

export function ThisWeeksWellnessDaysCard({ events, today }: WellnessProps) {
  const [selectedDay, setSelectedDay] = useState<WellnessDay | null>(null);
  const [weekIndex, setWeekIndex] = useState(0);
  const weekStart = new Date(`${today}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7 + weekIndex * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const currentWeek = {
    label: `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    days: events.filter((event) => event.eventDate >= toDateKey(weekStart) && event.eventDate <= toDateKey(weekEnd)),
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 border-b border-card-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <CalendarCheck className="mt-1 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
            <div>
              <h2 className="text-[14px] font-semibold leading-5 text-black">{weekIndex === 0 ? "This Week’s Wellness Days" : "Wellness Days"}</h2>
              <p className="mt-1 text-[12px] leading-4 text-black/55">
                Activations scheduled for the selected week.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekIndex((value) => value - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-300 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black"
              aria-label="Previous week"
            >
              <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
            </button>
            <span className="min-w-24 text-center text-[12px] leading-4 text-black">{currentWeek.label}</span>
            <button
              type="button"
              onClick={() => setWeekIndex((value) => value + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-300 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-black"
              aria-label="Next week"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable wellness days">
          <div className="w-full min-w-[600px] sm:min-w-0">
            <div className="grid grid-cols-[0.58fr_1fr_1.35fr_1fr_1.08fr] gap-2 border-b border-card-border bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Date</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Organization</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Activation Type</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Branch</span>
              <span className="min-w-0" style={{ fontSize: "12px", lineHeight: "16px" }}>Status</span>
            </div>

            <div className="divide-y divide-card-border">
              {currentWeek.days.length === 0 ? (
                <p role="status" className="px-5 py-8 text-center text-sm text-subtle">No activations to display for this week.</p>
              ) : null}
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

      {selectedDay ? <WellnessDayModal day={selectedDay} onClose={() => setSelectedDay(null)} /> : null}
    </>
  );
}

export function WellnessCalendarCard({ events, today }: WellnessProps) {
  const [selectedDay, setSelectedDay] = useState<WellnessDay | null>(null);

  return (
    <>
      <WellnessCalendarView events={events} today={today} onSelect={setSelectedDay} />
      {selectedDay ? <WellnessDayModal day={selectedDay} onClose={() => setSelectedDay(null)} /> : null}
    </>
  );
}

function WellnessCalendarView({
  events,
  today,
  onSelect,
}: {
  events: WellnessDay[];
  today: string;
  onSelect: (event: WellnessDay) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(`${today.slice(0, 7)}-01T12:00:00`));
  const monthEvents = useMemo(() => groupEventsByDay(events), [events]);
  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const monthLabel = visibleMonth.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-card-border px-5 py-4">
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
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
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
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable wellness calendar"><div className="min-w-[540px] p-5">
        {!events.some((event) => event.eventDate.slice(0, 7) === toDateKey(visibleMonth).slice(0, 7)) ? (
          <p role="status" className="mb-4 text-center text-sm text-subtle">No activations to display for this month.</p>
        ) : null}
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
                      aria-label={`Open ${event.organization}: ${event.activationType} on ${event.date}`}
                    >
                      {event.logo}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div></div>
    </section>
  );
}

function WellnessDayModal({ day, onClose }: { day: WellnessDay; onClose: () => void }) {
  return (
    <div
      className="pulse-modal fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
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
