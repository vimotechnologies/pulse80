"use client";

import { Activity } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type PipelineStage = {
  name: string;
  count: number;
  tone: "blue" | "green";
};

const pipelineStages: PipelineStage[] = [
  { name: "New", count: 18, tone: "blue" },
  { name: "Discovery", count: 14, tone: "blue" },
  { name: "Proposal Sent", count: 9, tone: "blue" },
  { name: "Negotiation", count: 6, tone: "blue" },
  { name: "Closed Won", count: 7, tone: "green" },
];

const maxCount = Math.max(...pipelineStages.map((stage) => stage.count));

const toneStyles: Record<PipelineStage["tone"], string> = {
  blue: "bg-primary",
  green: "bg-success",
};

export function RequestsPipelineCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Activity className="h-5 w-5 shrink-0 text-black" aria-hidden="true" />
          <h2 className="truncate text-[14px] font-semibold leading-5 text-black">
            Requests & Proposals Pipeline
          </h2>
        </div>
        <button
          type="button"
          className="shrink-0 text-[12px] font-semibold leading-4 text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          View all
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3 px-5 pb-5">
        {pipelineStages.map((stage) => {
          const progress = Math.round((stage.count / maxCount) * 100);

          return (
            <button
              key={stage.name}
              type="button"
              onClick={() => undefined}
              className="group cursor-pointer rounded-2xl p-2 text-left transition hover:-translate-y-0.5 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 active:translate-y-0"
            >
              <p className="truncate text-[12px] font-medium leading-4 text-black/65">{stage.name}</p>
              <p className="mt-1 text-[18px] font-semibold leading-6 text-black">{stage.count}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4e7ec]">
                <div
                  className={cn("h-full rounded-full transition-all group-hover:brightness-95", toneStyles[stage.tone])}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-card-border px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <SummaryStat label="Total Active" value="54" />
          <SummaryStat label="Conversion Rate" value="13%" />
        </div>
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] leading-4 text-black/60">{label}</p>
      <p className="mt-1 text-[18px] font-semibold leading-6 text-black">{value}</p>
    </div>
  );
}
