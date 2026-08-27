import { PractitionerWorkspacePage } from "@/components/practitioner/PractitionerWorkspacePage";
import { loadPractitionerProfile, type PractitionerAssignment } from "@/app/actions/practitioner-profile";
import type { PractitionerRecord } from "@/data/practitioner-portal-ui";

export default async function PractitionerAssignmentsPage() {
  const profile = await loadPractitionerProfile();
  return <PractitionerWorkspacePage configId="assignments" records={profile.assignments.map(toAssignmentRecord)} />;
}

function toAssignmentRecord(assignment: PractitionerAssignment): PractitionerRecord {
  const startsAt = new Date(assignment.startsAt);
  const date = new Intl.DateTimeFormat("en-BW", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Gaborone" }).format(startsAt);
  const time = new Intl.DateTimeFormat("en-BW", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Gaborone" }).format(startsAt);
  const statusTone = assignment.status === "Confirmed" || assignment.status === "Completed"
    ? "success"
    : assignment.status === "Action Required" || assignment.status === "Cancelled"
      ? "warning"
      : "info";

  return {
    id: assignment.id,
    title: assignment.activityName,
    subtitle: `${date} · ${time}`,
    meta: assignment.programmeName,
    status: assignment.status,
    statusTone,
    search: [assignment.activityName, assignment.organisationName, assignment.programmeName, assignment.serviceName, assignment.location, assignment.status].join(" ").toLowerCase(),
    filters: { status: assignment.status, location: assignment.location },
    fields: [],
    details: [
      { label: "Organisation", value: assignment.organisationName },
      { label: "Programme", value: assignment.programmeName },
      { label: "Service", value: assignment.serviceName },
    ],
  };
}
