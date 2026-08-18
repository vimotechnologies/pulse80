import { loadPractitionerScreenings } from "@/app/actions/screening-operations";
import { PractitionerScreeningOperations } from "@/components/screenings/ScreeningOperations";

export default async function PractitionerScreeningsPage() {
  const { myScreenings, myScreeningAssignments } = await loadPractitionerScreenings();
  return <PractitionerScreeningOperations screenings={myScreenings} assignments={myScreeningAssignments} />;
}
