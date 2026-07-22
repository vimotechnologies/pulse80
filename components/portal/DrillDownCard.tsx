"use client";

import { useState } from "react";
import { CloseSquare } from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PortalListItem } from "@/data/portal-phase-two";

type DrillDownCardProps = {
  item: PortalListItem;
};

export function DrillDownCard({ item }: DrillDownCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid w-full cursor-pointer gap-3 border-b border-[#d0d5dd] p-5 text-left transition hover:bg-soft-bg/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <div>
          <h3 className="text-[12px] font-semibold leading-4 text-black">{item.title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-black/65">{item.meta}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} tone={item.tone} />
          <span className="text-[12px] font-semibold leading-4 text-black">Details</span>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${item.title}-details-title`}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#d0d5dd] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="border-b border-[#d0d5dd] px-5 py-4">
              <h3 id={`${item.title}-details-title`} className="text-[14px] font-semibold leading-5 text-black">
                {item.title}
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-black">{item.meta}</p>
            </div>
            <div className="grid gap-3 px-5 py-4">
              <DetailRow label="Status" value={item.status} />
              <DetailRow label="Signal" value="Dashboard operations detail" />
              <DetailRow label="Next step" value="Review owner, due date, source report, and action history." />
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
