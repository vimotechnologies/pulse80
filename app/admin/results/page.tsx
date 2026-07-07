import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminResultsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/results"]} />;
}
