import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminScreeningsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/screenings"]} />;
}
