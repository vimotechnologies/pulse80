import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { portalConfigs, portalDashboards } from "@/data/portal-phase-two";

export default function ClientDashboardPage() {
  return (
    <PortalDashboard
      config={portalConfigs.client}
      data={portalDashboards.client}
    />
  );
}
