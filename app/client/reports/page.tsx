import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function ClientReportsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/client/reports"]} />;
}
