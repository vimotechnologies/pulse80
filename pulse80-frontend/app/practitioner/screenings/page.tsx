import { loadPractitionerScreenings } from "@/app/actions/screening-operations";
import { PractitionerScreeningWorkspace } from "@/components/screenings/PractitionerScreeningWorkspace";

export default async function PractitionerScreeningsPage() {
  const { myScreenings, myScreeningAssignments } = await loadPractitionerScreenings();
  return <PractitionerScreeningWorkspace screenings={myScreenings} assignments={myScreeningAssignments} />;
}
