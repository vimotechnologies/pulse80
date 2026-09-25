import { loadPractitionerProfile } from "@/app/actions/practitioner-profile";
import { PractitionerDocumentsPage } from "@/components/practitioner/PractitionerDocumentsPage";

export default async function PractitionerDocumentsRoute() {
  const profile = await loadPractitionerProfile();

  return <PractitionerDocumentsPage initialProfile={profile} />;
}
