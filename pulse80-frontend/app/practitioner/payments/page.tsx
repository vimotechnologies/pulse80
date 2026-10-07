import { loadPractitionerPayments } from "@/app/actions/portal-records";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
export default async function Page() {
  const records = await loadPractitionerPayments();
  return <RecordWorkspace kind="payment" workspace={{ records, organisations: [], practitioners: [], canManage: false }} />;
}
