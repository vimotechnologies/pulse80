import { loadProgrammeOperations } from "@/app/actions/programme-operations";
import { AdminMobilisation } from "@/components/admin/ProgrammeOperations";

export default async function AdminMobilisationPage() {
  const data = await loadProgrammeOperations();

  return <AdminMobilisation activations={data.adminActivations} />;
}
