import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { portalConfigs, portalDashboards } from "@/data/portal-phase-two";
import { loadAdminDashboardMetrics } from "@/app/actions/admin-dashboard";

export default async function AdminDashboardPage() {
  const metrics = await loadAdminDashboardMetrics();

  return (
    <PortalDashboard
      config={portalConfigs.admin}
      data={{ ...portalDashboards.admin, metrics }}
    />
  );
}
