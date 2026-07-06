import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminBillingPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/billing"]} />;
}
