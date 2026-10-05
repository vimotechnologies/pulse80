import { loadProgrammeRoster, loadProgrammeScreeningExport } from "@/app/actions/programme-roster";
import { ProgrammeRosterManager } from "@/components/admin/ProgrammeRosterManager";
import { ProgrammeExportButtons } from "@/components/admin/ProgrammeExportButtons";
export default async function ProgrammeRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [roster, screeningExport] = await Promise.all([loadProgrammeRoster(id), loadProgrammeScreeningExport(id)]);
  return <div className="space-y-6"><ProgrammeRosterManager key={id} initialRoster={roster} /><ProgrammeExportButtons roster={roster} screenings={screeningExport.rows} /></div>;
}
