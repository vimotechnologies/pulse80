import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function ClientActivationsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/client/activations"]} />;
}
