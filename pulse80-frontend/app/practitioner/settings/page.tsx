import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function PractitionerSettingsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/practitioner/settings"]} />;
}
