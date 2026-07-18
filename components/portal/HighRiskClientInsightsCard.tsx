"use client";

import { AlertCircle, ArrowLeft2 } from "@/components/icons/IconsaxIcons";

type ClientInsight = {
  organization: string;
  riskLabel: string;
  detail: string;
  logo: string;
};

const insights: ClientInsight[] = [
  {
    organization: "Wayne Enterprises",
    riskLabel: "Low Engagement",
    detail: "18% participation",
    logo: "WE",
  },
  {
    organization: "Hooli Technologies",
    riskLabel: "Pending Approvals",
    detail: "Proposal pending 12 days",
    logo: "HT",
  },
  {
    organization: "Oscorp Industries",
    riskLabel: "High Cancellation",
    detail: "2 events cancelled",
    logo: "OI",
  },
];

export function HighRiskClientInsightsCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <AlertCircle className="h-[18px] w-[18px] shrink-0 text-black" aria-hidden="true" />
          <h2 className="truncate text-[14px] font-semibold leading-5 text-black">
            High-Risk Client Insights
          </h2>
        </div>
        <button
          type="button"
          className="shrink-0 text-[14px] font-medium leading-5 text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          View all insights
        </button>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-2xl border border-pulse-red/20 bg-pulse-red/5 px-4 py-3">
          <div>
            <p className="text-[12px] font-semibold leading-4 text-pulse-red">
              3 organisations show elevated risk
            </p>
            <p className="mt-1 text-[12px] leading-4 text-black/60">
              Based on low engagement, cancellations, or pending approvals.
            </p>
          </div>
        </div>

        <div className="mt-3 divide-y divide-card-border">
          {insights.map((insight) => (
            <button
              key={insight.organization}
              type="button"
              onClick={() => undefined}
              className="grid w-full cursor-pointer grid-cols-1 items-center gap-2 py-3 text-left transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 sm:grid-cols-[minmax(0,1.35fr)_145px_120px_20px] sm:gap-4"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-card-border bg-[#f2f4f7] text-[12px] font-semibold leading-4 text-black">
                  {insight.logo}
                </span>
                <span className="min-w-0 truncate text-[12px] font-semibold leading-4 text-black">
                  {insight.organization}
                </span>
              </span>
              <span className="inline-flex w-fit items-center rounded-full bg-pulse-red/10 px-2.5 py-1 text-[12px] font-medium leading-4 text-pulse-red">
                {insight.riskLabel}
              </span>
              <span className="text-[12px] leading-4 text-black/65 sm:text-right">
                {insight.detail}
              </span>
              <ArrowLeft2 className="hidden h-[18px] w-[18px] rotate-180 justify-self-end text-black/45 sm:block" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
