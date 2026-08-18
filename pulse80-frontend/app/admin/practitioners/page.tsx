import { loadAdminPractitioners } from "@/app/actions/admin-practitioners";
import { AdminPractitionerDirectory } from "@/components/admin/AdminPractitionerDirectory";

export default async function AdminPractitionersPage() {
  const practitioners = await loadAdminPractitioners();
  return <AdminPractitionerDirectory practitioners={practitioners} />;
}
