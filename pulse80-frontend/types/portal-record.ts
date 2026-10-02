export type RecordKind = "invoice" | "payment" | "request" | "recommendation" | "report";
export type PortalRecord = {
  id: string; kind: RecordKind; organisationId: string; organisationName: string;
  organisationLogoUrl: string | null; practitionerUserId: string | null; practitionerName: string | null;
  title: string; description: string; status: string; amount: number | null; currency: string;
  dueOn: string | null; createdAt: string; updatedAt: string;
};
export type RecordInput = Pick<PortalRecord, "organisationId" | "practitionerUserId" | "title" | "description" | "status" | "amount" | "currency" | "dueOn">;
export type RecordWorkspace = {
  records: PortalRecord[]; organisations: { id: string; name: string }[];
  practitioners: { id: string; name: string }[]; canManage: boolean;
};
export const recordStatuses: Record<RecordKind, string[]> = {
  invoice: ["Draft", "Due", "Paid", "Cancelled", "Archived"],
  payment: ["Pending", "Approved", "Paid", "Cancelled", "Archived"],
  request: ["New", "In Review", "Approved", "Declined", "Archived"],
  recommendation: ["Draft", "Published", "In Progress", "Completed", "Archived"],
  report: ["Draft", "In Review", "Published", "Archived"],
};
