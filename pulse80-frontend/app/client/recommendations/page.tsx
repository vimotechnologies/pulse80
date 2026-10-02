import { loadOrganisationRecords } from "@/app/actions/portal-records";
import { RecordWorkspace } from "@/components/records/RecordWorkspace";
export default async function Page() {
  const records = await loadOrganisationRecords("recommendation");
  return <RecordWorkspace kind="recommendation" workspace={{ records, organisations: [], practitioners: [], canManage: false }} />;
}
