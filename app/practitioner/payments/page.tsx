import { PortalPlaceholderPage } from "@/components/portal/PortalPlaceholderPage";
import { placeholderPages } from "@/data/portal-phase-two";

export default function PractitionerPaymentsPage() {
  return <PortalPlaceholderPage {...placeholderPages["/practitioner/payments"]} />;
}
