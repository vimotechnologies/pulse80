import { loadRecordWorkspace } from "@/app/actions/portal-records";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
export default async function Page() {
  const workspace = await loadRecordWorkspace("request");
  return <RecordWorkspace kind="request" workspace={workspace} />;
}
