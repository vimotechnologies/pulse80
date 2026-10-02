import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

type PortalPlaceholderPageProps = {
  eyebrow: string;
  title: string;
};

export function PortalPlaceholderPage({
  eyebrow,
  title,
}: PortalPlaceholderPageProps) {
  return (
    <div className="space-y-7">
      <PortalPageHeader
        eyebrow={eyebrow}
        title={title}
        description="No live data source is connected for this workflow yet."
      />

      <DashboardWidget className="p-5">
        <h2 className="text-base font-semibold text-navy">Workflow not connected</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This page has no live data source yet. Demo records, metrics, and actions are hidden.
        </p>
      </DashboardWidget>
    </div>
  );
}
