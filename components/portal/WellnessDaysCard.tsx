import { CalendarCheck } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type WellnessDay = {
  date: string;
  organization: string;
  activationType: string;
  location: string;
  expectedEmployees: number;
  readiness: number;
  status: "Confirmed" | "Mobilising" | "3-Day Confirmation Due" | "Scheduled" | "Needs Attention";
};

const wellnessDays: WellnessDay[] = [
  {
    date: "May 20",
    organization: "De Beers",
    activationType: "Onsite Preventive Screening",
    location: "Gaborone HQ",
    expectedEmployees: 180,
    readiness: 86,
    status: "Confirmed",
  },
  {
    date: "May 22",
    organization: "Delta Mining Group",
    activationType: "Fitness / Smartwatch Activation",
    location: "Jwaneng Site",
    expectedEmployees: 240,
    readiness: 62,
    status: "Mobilising",
  },
  {
    date: "May 24",
    organization: "Sandfire Motheo",
    activationType: "Mental Wellness Activation",
    location: "CBD Branch",
    expectedEmployees: 90,
    readiness: 45,
    status: "3-Day Confirmation Due",
  },
  {
    date: "May 27",
    organization: "Lucara Mine",
    activationType: "Health Awareness Day",
    location: "Main Campus",
    expectedEmployees: 120,
    readiness: 72,
    status: "Scheduled",
  },
  {
    date: "May 29",
    organization: "BTCL",
    activationType: "BP, BMI & Glucose Screening",
    location: "Gaborone Office",
    expectedEmployees: 210,
    readiness: 58,
    status: "Needs Attention",
  },
];

const statusStyles: Record<WellnessDay["status"], string> = {
  Confirmed: "border-success/20 bg-success/10 text-success",
  Mobilising: "border-warning/25 bg-warning/10 text-warning",
  "3-Day Confirmation Due": "border-warning/25 bg-warning/10 text-warning",
  Scheduled: "border-primary/20 bg-primary/10 text-primary",
  "Needs Attention": "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
};

function readinessTone(readiness: number) {
  if (readiness >= 75) return "bg-success";
  if (readiness >= 50) return "bg-warning";
  return "bg-pulse-red";
}

export function WellnessDaysCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-card-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <CalendarCheck className="mt-1 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold leading-6 text-black">This Week&apos;s Wellness Days</h2>
            <p className="mt-1 text-sm leading-5 text-black/65">
              Upcoming confirmed and pending wellness activities.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[0.7fr_1.1fr_1.45fr_1.1fr_0.95fr_1fr_1.25fr] gap-4 border-b border-card-border bg-[#f8fafc] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-black/55">
            <span>Date</span>
            <span>Organization</span>
            <span>Activation Type</span>
            <span>Location / Branch</span>
            <span>Expected Employees</span>
            <span>Readiness</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-card-border">
            {wellnessDays.map((day) => (
              <button
                key={`${day.date}-${day.organization}`}
                type="button"
                className="grid w-full grid-cols-[0.7fr_1.1fr_1.45fr_1.1fr_0.95fr_1fr_1.25fr] items-center gap-4 px-5 py-4 text-left text-sm text-black transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                aria-label={`View ${day.organization} wellness day details`}
              >
                <span className="font-semibold">{day.date}</span>
                <span className="font-semibold">{day.organization}</span>
                <span className="text-black/70">{day.activationType}</span>
                <span className="text-black/70">{day.location}</span>
                <span className="font-semibold">{day.expectedEmployees}</span>
                <span>
                  <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-black">
                    {day.readiness}%
                  </span>
                  <span className="block h-2 overflow-hidden rounded-full bg-[#e4e7ec]">
                    <span
                      className={cn("block h-full rounded-full", readinessTone(day.readiness))}
                      style={{ width: `${day.readiness}%` }}
                    />
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                    statusStyles[day.status],
                  )}
                >
                  {day.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-card-border px-5 py-4">
        <button
          type="button"
          className="text-sm font-semibold text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          View calendar
        </button>
      </div>
    </section>
  );
}
