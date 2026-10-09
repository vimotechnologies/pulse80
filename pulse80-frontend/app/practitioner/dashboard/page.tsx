import { redirect } from "next/navigation";
import { loadPractitionerProfile } from "@/app/actions/practitioner-profile";
import { loadPractitionerDashboard } from "@/app/actions/practitioner-dashboard";
import { PractitionerDashboard } from "@/components/practitioner/PractitionerDashboard";

export default async function PractitionerDashboardPage() {
  const profile = await loadPractitionerProfile();
  if (profile.verificationStatus !== "Verified") {
    redirect("/practitioner/documents");
  }
  return <PractitionerDashboard dashboard={await loadPractitionerDashboard()} />;
}
