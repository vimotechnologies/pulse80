import { loadProgrammeOperations } from "@/app/actions/programme-operations";
import { AdminProgrammes } from "@/components/admin/ProgrammeOperations";

export default async function AdminProgrammesPage() {
  const data = await loadProgrammeOperations();
  return <AdminProgrammes programmes={data.adminProgrammes} organisations={data.adminOrganisations} />;
}
