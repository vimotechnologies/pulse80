"use client";

import { useState } from "react";
import { CloseSquare } from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RiskCardProps = {
  title: string;
  detail: string;
  level: "high-risk" | "medium-risk" | "low-risk";
};

export function RiskCard({ title, detail, level }: RiskCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer rounded-lg border border-[#d0d5dd] bg-soft-bg p-4 text-left transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[12px] font-semibold leading-4 text-black">{title}</h3>
          <StatusBadge status={level} tone={level} />
        </div>
        <p className="mt-2 text-[12px] leading-5 text-black/65">{detail}</p>
        <span className="mt-3 inline-flex text-[12px] font-semibold leading-4 text-black">Details</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${title}-risk-title`}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#d0d5dd] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="border-b border-[#d0d5dd] px-5 py-4">
              <h3 id={`${title}-risk-title`} className="text-[14px] font-semibold leading-5 text-black">
                {title}
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-black">{detail}</p>
            </div>
            <div className="grid gap-3 px-5 py-4">
              <DetailRow label="Risk level" value={level} />
              <DetailRow label="Recommended action" value="Assign owner and review this signal before the next report cycle." />
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d0d5dd] bg-[#f8fafc] px-4 py-3">
      <span className="text-[12px] leading-4 text-black">{label}</span>
      <span className="text-right text-[12px] leading-4 text-black">{value}</span>
    </div>
  );
}
