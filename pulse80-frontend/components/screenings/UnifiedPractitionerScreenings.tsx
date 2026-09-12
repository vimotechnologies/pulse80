"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ToastMessage } from "@/components/ui/ToastMessage";
import { DynamicScreeningCapture } from "@/components/screenings/DynamicScreeningCapture";
import { PractitionerScreeningWorkspace } from "@/components/screenings/PractitionerScreeningWorkspace";
import type { Screening, ScreeningAssignmentOption } from "@/types/screening";

export function UnifiedPractitionerScreenings({ screenings, assignments }: { screenings: Screening[]; assignments: ScreeningAssignmentOption[] }) {
  const router = useRouter();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Health Practitioner"
        title="Screenings"
        description="Capture and manage anonymized employee wellness screening records linked to your assigned programmes."
        actions={
          <button type="button" onClick={() => setCaptureOpen(true)} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">
            Capture screening
          </button>
        }
      />
      <ToastMessage message={message} />

      {/* Keep the existing records, filters, pagination and bulk import workspace. Its old
          fixed-measurement capture header is hidden because capture now has one service-aware flow. */}
      <div className="[&>div>div:first-child]:hidden">
        <PractitionerScreeningWorkspace screenings={screenings} assignments={assignments} />
      </div>

      {captureOpen ? (
        <DynamicScreeningCapture
          assignments={assignments}
          onClose={() => setCaptureOpen(false)}
          onSaved={() => {
            setCaptureOpen(false);
            setMessage("Screening submitted for quality assurance.");
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
