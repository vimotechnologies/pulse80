import { loadAdminPractitioners } from "@/app/actions/admin-practitioners";
import { AdminPractitionerVerification } from "@/components/admin/AdminPractitionerVerification";

export default async function AdminPractitionerVerificationPage() {
  const practitioners = await loadAdminPractitioners();
  return <AdminPractitionerVerification practitioners={practitioners} />;
}
