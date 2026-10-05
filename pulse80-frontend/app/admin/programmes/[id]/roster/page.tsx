import { loadProgrammeRoster } from "@/app/actions/programme-roster";
import { ProgrammeRosterManager } from "@/components/admin/ProgrammeRosterManager";
export default async function ProgrammeRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgrammeRosterManager key={id} initialRoster={await loadProgrammeRoster(id)} />;
}
