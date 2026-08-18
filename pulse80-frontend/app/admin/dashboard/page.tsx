import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { portalConfigs, portalDashboards } from "@/data/portal-phase-two";

export default function AdminDashboardPage() {
  return (
    <PortalDashboard
      config={portalConfigs.admin}
      data={portalDashboards.admin}
    />
  );
}
