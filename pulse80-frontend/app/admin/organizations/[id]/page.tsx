import { AdminOrganizationDetails } from "@/components/admin/AdminOrganizations";
import { loadAdminOrganisation } from "@/app/actions/admin-organisations";

export default async function AdminOrganizationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisation = await loadAdminOrganisation(id);

  return <AdminOrganizationDetails organizationId={id} initialOrganization={organisation} />;
}
