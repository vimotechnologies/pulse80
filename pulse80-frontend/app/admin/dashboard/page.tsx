import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { WellnessDaysCard } from "@/components/portal/WellnessDaysCard";
import { portalConfigs } from "@/data/portal-phase-two";
import { loadAdminDashboardMetrics, loadAdminDashboardActivations } from "@/app/actions/admin-dashboard";

const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit",
}).format(date);

export default async function AdminDashboardPage() {
  const [metrics, activations] = await Promise.all([
    loadAdminDashboardMetrics(), loadAdminDashboardActivations(),
  ]);
  const events = [...activations]
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((activation) => ({
      id: activation.id,
      eventDate: dateKey(new Date(activation.startsAt)),
      date: new Date(activation.startsAt).toLocaleDateString("en-GB", {
        timeZone: "Africa/Gaborone", day: "numeric", month: "short", year: "numeric",
      }),
      organization: activation.organisationName,
      activationType: activation.title,
      location: activation.location,
      expectedEmployees: activation.expectedParticipants,
      readiness: activation.readinessScore,
      status: activation.status,
      logo: activation.organisationName.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase(),
    }));

  return (
    <div className="space-y-7">
      <PortalDashboard config={portalConfigs.admin} data={{ metrics }} />
      <section className="grid items-start gap-5 xl:grid-cols-2">
        <WellnessDaysCard events={events} today={dateKey(new Date())} />
      </section>
    </div>
  );
}
