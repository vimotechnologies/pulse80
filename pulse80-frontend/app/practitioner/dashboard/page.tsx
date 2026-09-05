import { loadPractitionerDashboard } from "@/app/actions/practitioner-dashboard";
import { PractitionerDashboard } from "@/components/practitioner/PractitionerDashboard";

export default async function PractitionerDashboardPage() {
  return <PractitionerDashboard dashboard={await loadPractitionerDashboard()} />;
}
