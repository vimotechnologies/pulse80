export type EligibilityStatus = "Eligible" | "Not Eligible";
export type RegistrationStatus = "Invited" | "Registered" | "Declined" | "Withdrawn";
export type RosterEntry = { screeningReference: string; eligibilityStatus: EligibilityStatus; registrationStatus: RegistrationStatus; employeeId?: string | null };
export type RosterParticipant = Omit<RosterEntry, "screeningReference"> & { id: string; programmeId: string; screeningReference: string | null };
export type ProgrammeRoster = { programmeId: string; programmeName: string; total: number; participants: RosterParticipant[] };
