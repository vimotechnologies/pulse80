import { PortalContentCard } from "@/components/portal/PortalContentCard";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

type PortalPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  focus: string[];
};

export function PortalPlaceholderPage({
  eyebrow,
  title,
  description,
  focus,
}: PortalPlaceholderPageProps) {
  return (
    <div className="space-y-7">
      <PortalPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <PortalContentCard
        title="Phase 2 workspace"
        description="Placeholder experience using dummy data only. Detailed workflows will be connected in later phases."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {focus.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-card-border bg-soft-bg p-4"
            >
              <p className="text-sm font-semibold text-navy">{item}</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                Ready for workflow, filtering, and role-specific actions.
              </p>
            </div>
          ))}
        </div>
      </PortalContentCard>
    </div>
  );
}
