import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function PractitionerProfilePage() {
  return <PortalPlaceholderPage {...placeholderPages["/practitioner/profile"]} />;
}
