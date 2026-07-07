import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { portalConfigs, portalDashboards } from "@/data/portal-phase-two";

export default function PractitionerDashboardPage() {
  return (
    <PortalDashboard
      config={portalConfigs.practitioner}
      data={portalDashboards.practitioner}
    />
  );
}
