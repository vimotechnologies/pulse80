import { loadAdminPractitioners, loadRegisteredPractitioners } from "@/app/actions/admin-practitioners";
import { AdminPractitionerDirectory } from "@/components/admin/AdminPractitionerDirectory";

export default async function AdminPractitionersPage() {
  const [practitioners, registrations] = await Promise.all([
    loadAdminPractitioners(),
    loadRegisteredPractitioners(),
  ]);
  return <AdminPractitionerDirectory practitioners={practitioners} registrations={registrations} />;
}
