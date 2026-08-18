export type Programme = {
  id: string; organisationId: string; organisationName: string; name: string;
  description: string | null; status: string; startsOn: string; endsOn: string;
  serviceNames: string[]; targetParticipants: number; activationCount: number;
  createdAt: string; updatedAt: string;
};

export type ActivationReadinessItem = { id: string; label: string; completed: boolean; completedAt: string | null };
export type Activation = {
  id: string; programmeId: string; programmeName: string; organisationId: string;
  organisationName: string; title: string; description: string | null; location: string;
  startsAt: string; endsAt: string; expectedParticipants: number; serviceNames: string[];
  status: string; readinessScore: number; readinessItems: ActivationReadinessItem[];
  practitionerCount: number; createdAt: string; updatedAt: string;
};

export type ProgrammeForm = {
  organisationId: string; name: string; description: string;
  status: "Planned" | "Active" | "Paused" | "Completed" | "Cancelled";
  startsOn: string; endsOn: string; serviceNames: string; targetParticipants: string;
};

export type ActivationForm = {
  programmeId: string; title: string; description: string; location: string;
  startsAt: string; endsAt: string; expectedParticipants: string; serviceNames: string;
  status: "Draft" | "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Action Required";
  readinessLabels: string;
};
