import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminOrganizationsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/organizations"]} />;
}
