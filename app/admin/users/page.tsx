import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function AdminUsersPage() {
  return <PortalPlaceholderPage {...placeholderPages["/admin/users"]} />;
}
