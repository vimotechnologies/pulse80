import { PractitionerSettingsPage } from "@/components/practitioner/PractitionerSettingsPage";
import { loadPractitionerProfile } from "@/app/actions/practitioner-profile";

export default async function PractitionerSettingsRoute() {
  const profile = await loadPractitionerProfile();
  return <PractitionerSettingsPage initialProfile={profile} />;
}
