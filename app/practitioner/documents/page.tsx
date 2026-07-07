import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function PractitionerDocumentsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/practitioner/documents"]} />;
}
