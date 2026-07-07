import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function PractitionerAssignmentsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/practitioner/assignments"]} />;
}
