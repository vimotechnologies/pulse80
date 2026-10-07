import { loadClientActivations } from "@/app/actions/client-dashboard";
import { ClientExecutivePage } from "@/components/client/ClientExecutivePage";

export default async function ClientActivationsPage() {
  const activations = await loadClientActivations();

  return <ClientExecutivePage configId="activations" activations={activations} />;
}
