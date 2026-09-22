import { notFound } from "next/navigation";

import { loadPractitionerAssignments } from "@/app/actions/practitioner-profile";
import { PractitionerAssignmentDetails } from "@/components/practitioner/PractitionerAssignmentDetails";

export default async function PractitionerAssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assignments = await loadPractitionerAssignments();
  const assignment = assignments.find((item) => item.id === id);

  if (!assignment) notFound();

  return <PractitionerAssignmentDetails assignment={assignment} />;
}
