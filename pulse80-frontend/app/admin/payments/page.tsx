import { loadRecordWorkspace } from "@/app/actions/portal-records";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
export default async function Page() {
  const workspace = await loadRecordWorkspace("payment");
  return <RecordWorkspace kind="payment" workspace={workspace} />;
}
