import { notFound } from "next/navigation";
import { loadPractitionerScreenings } from "@/app/actions/screening-operations";
import { PractitionerScreeningDetails } from "@/components/screenings/PractitionerScreeningDetails";

export default async function PractitionerScreeningDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { myScreenings } = await loadPractitionerScreenings();
  const screening = myScreenings.find((item) => item.id === id);

  if (!screening) notFound();

  return <PractitionerScreeningDetails screening={screening} />;
}
