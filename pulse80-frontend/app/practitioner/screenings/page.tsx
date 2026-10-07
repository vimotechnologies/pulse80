import { loadPractitionerScreenings } from "@/app/actions/screening-operations";
import { UnifiedPractitionerScreenings } from "@/components/screenings/UnifiedPractitionerScreenings";

export default async function PractitionerScreeningsPage() {
  const { myScreenings, myScreeningAssignments } = await loadPractitionerScreenings();
  return <UnifiedPractitionerScreenings screenings={myScreenings} assignments={myScreeningAssignments} />;
}
