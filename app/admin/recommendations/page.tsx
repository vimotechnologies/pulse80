import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminRecommendationsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/recommendations"]} />;
}
