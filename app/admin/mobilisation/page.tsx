import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminMobilisationPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/mobilisation"]} />;
}
