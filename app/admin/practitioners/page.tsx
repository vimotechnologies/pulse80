import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminPractitionersPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/practitioners"]} />;
}
