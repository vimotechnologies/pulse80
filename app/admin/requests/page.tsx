import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminRequestsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/requests"]} />;
}
