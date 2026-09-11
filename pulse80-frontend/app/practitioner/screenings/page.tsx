import Link from "next/link";
import { loadPractitionerScreenings } from "@/app/actions/screening-operations";
import { PractitionerScreeningWorkspace } from "@/components/screenings/PractitionerScreeningWorkspace";

export default async function PractitionerScreeningsPage() {
  const { myScreenings, myScreeningAssignments } = await loadPractitionerScreenings();
  return <div className="space-y-4"><div className="flex justify-end"><Link href="/practitioner/screenings/capture" className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Capture by service</Link></div><PractitionerScreeningWorkspace screenings={myScreenings} assignments={myScreeningAssignments} /></div>;
}
