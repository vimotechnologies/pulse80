import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function ClientSettingsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/client/settings"]} />;
}
