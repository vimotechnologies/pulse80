import { loadPractitionerProfile } from "@/app/actions/practitioner-profile";
import { PractitionerProfilePage } from "@/components/practitioner/PractitionerProfilePage";

export default async function PractitionerProfileRoute() {
  const profile = await loadPractitionerProfile();
  return <PractitionerProfilePage initialProfile={profile} />;
}
