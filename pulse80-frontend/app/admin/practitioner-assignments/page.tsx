import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminPractitionerAssignmentsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/practitioner-assignments"]} />;
}
