import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { FilterTabs } from "@/components/portal/FilterTabs";
import { FormInput } from "@/components/portal/FormInput";
import { ProgressWidget } from "@/components/portal/ProgressWidget";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
        actions={<FilterTabs tabs={["Overview", "Review", "Activity"]} />}
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardWidget className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-navy">Workspace preview</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                Dummy workflow surface for the next implementation phase. It keeps
                the page useful without exposing low-level details too early.
              </p>
            </div>
            <ActionButton variant="secondary">Prepare workflow</ActionButton>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {focus.map((item, index) => (
              <div
                key={item}
                className="rounded-lg border border-[#d0d5dd] bg-soft-bg p-4 transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-navy">{item}</p>
                  <StatusBadge
                    status={index === 0 ? "ready" : index === 1 ? "pending" : "draft"}
                    tone={index === 0 ? "success" : index === 1 ? "warning" : "neutral"}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Supports review queues, ownership, and role-specific actions.
                </p>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget className="p-5">
          <h2 className="text-lg font-semibold text-navy">Readiness status</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Placeholder data quality and workflow readiness.
          </p>
          <div className="mt-5 space-y-5">
            <ProgressWidget value={78} label="Content readiness" tone="primary" />
            <ProgressWidget value={64} label="Workflow coverage" tone="warning" />
            <ProgressWidget value={92} label="Design consistency" tone="success" />
          </div>
        </DashboardWidget>
      </section>

      <DashboardWidget className="p-5">
        <div className="grid gap-5 lg:grid-cols-3">
          <FormInput
            label="Default input"
            placeholder="Search workflow items"
            message="Clean default input state."
          />
          <FormInput
            label="Warning input"
            placeholder="Missing owner"
            state="warning"
            message="Add an owner before moving this item forward."
          />
          <FormInput
            label="Error input"
            placeholder="Invalid status"
            state="error"
            message="Select a valid workflow status."
          />
        </div>
      </DashboardWidget>
    </div>
  );
}
