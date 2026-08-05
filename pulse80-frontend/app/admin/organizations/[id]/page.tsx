import { AdminOrganizationDetails } from "@/components/admin/AdminOrganizations";

export default async function AdminOrganizationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminOrganizationDetails organizationId={id} />;
}
