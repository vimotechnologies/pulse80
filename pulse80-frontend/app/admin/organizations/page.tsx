import { AdminOrganizations } from "@/components/admin/AdminOrganizations";
import { loadAdminOrganisations } from "@/app/actions/admin-organisations";

export default async function AdminOrganizationsPage() {
  const organisations = await loadAdminOrganisations();
  return <AdminOrganizations initialOrganizations={organisations} />;
}
