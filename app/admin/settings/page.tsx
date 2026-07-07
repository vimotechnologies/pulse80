import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminSettingsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/settings"]} />;
}
