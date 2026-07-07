import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminActivationsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/activations"]} />;
}
