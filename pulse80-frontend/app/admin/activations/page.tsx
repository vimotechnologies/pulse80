import { loadProgrammeOperations } from "@/app/actions/programme-operations";
import { AdminActivations } from "@/components/admin/ProgrammeOperations";

export default async function AdminActivationsPage() {
  const data = await loadProgrammeOperations();
  return <AdminActivations activations={data.adminActivations} programmes={data.adminProgrammes} />;
}
