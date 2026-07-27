"use client";

import { useState } from "react";
import { CloseSquare } from "@/components/icons/IconsaxIcons";
import type { Tone } from "@/data/portal-phase-two";
import { cn } from "@/lib/utils/cn";

type InsightCardProps = {
  title: string;
  detail: string;
  tone?: Tone;
};

const insightToneStyles: Record<Tone, string> = {
  primary: "border-primary/20 bg-primary/5",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/25 bg-warning/5",
  danger: "border-pulse-red/20 bg-pulse-red/5",
  neutral: "border-[#d0d5dd] bg-soft-bg",
};

export function InsightCard({ title, detail, tone = "primary" }: InsightCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full cursor-pointer rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(20,43,83,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
          insightToneStyles[tone],
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[12px] font-semibold leading-4 text-black">{title}</h3>
          <span className="text-[12px] font-semibold leading-4 text-black">Details</span>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-black/65">{detail}</p>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${title}-insight-title`}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#d0d5dd] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="border-b border-[#d0d5dd] px-5 py-4">
              <h3 id={`${title}-insight-title`} className="text-[14px] font-semibold leading-5 text-black">
                {title}
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-black">{detail}</p>
            </div>
            <div className="px-5 py-4">
              <p className="rounded-2xl border border-[#d0d5dd] bg-[#f8fafc] p-4 text-[12px] leading-5 text-black">
                Suggested next step: review the underlying cohort, compare against the previous reporting period, and assign an owner before the next activation.
              </p>
            </div>
            <div className="flex justify-end border-t border-[#d0d5dd] px-5 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-[12px] font-semibold leading-4 text-black transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-black hover:text-white active:translate-y-0"
              >
                <CloseSquare className="h-[18px] w-[18px]" aria-hidden="true" />
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
