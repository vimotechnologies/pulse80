import { loadOrganisation } from "@/app/actions/organisation";
import { OrganisationSettingsForm } from "@/components/client/OrganisationSettingsForm";

export default async function ClientSettingsPage() {
  const organisation = await loadOrganisation();
  return <OrganisationSettingsForm initialOrganisation={organisation} />;
}
