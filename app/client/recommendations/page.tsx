import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function ClientRecommendationsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/client/recommendations"]} />;
}
