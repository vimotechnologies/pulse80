import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function ClientInsightsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/client/insights"]} />;
}
