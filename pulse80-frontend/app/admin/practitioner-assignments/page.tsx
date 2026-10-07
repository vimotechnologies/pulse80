import { loadPractitionerAssignmentPage } from "@/app/actions/admin-practitioner-assignments";
import { AdminPractitionerAssignments } from "@/components/admin/AdminPractitionerAssignments";

export default async function AdminPractitionerAssignmentsPage() {
  const data = await loadPractitionerAssignmentPage();
  return <AdminPractitionerAssignments activations={data.adminAssignmentActivations} assignments={data.adminPractitionerAssignments} practitioners={data.adminPractitioners} organisations={data.adminOrganisations} />;
}
