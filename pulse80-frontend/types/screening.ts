export type ScreeningStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Needs Correction";

export interface ScreeningResult {
  systolicMmhg: number | null;
  diastolicMmhg: number | null;
  glucoseMmolL: number | null;
  cholesterolMmolL: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  riskLevel: "Low" | "Medium" | "High" | "Incomplete";
  escalationRequired: boolean;
}

export interface Screening {
  id: string;
  organisationId: string;
  organisationName: string;
  activationId: string | null;
  activationName: string | null;
  assignmentId: string;
  practitionerName: string;
  participantReference: string;
  department: string | null;
  status: ScreeningStatus;
  consentConfirmed: boolean;
  practitionerNote: string | null;
  capturedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  result: ScreeningResult;
}

export interface ScreeningAssignmentOption {
  id: string;
  organisationName: string;
  activationName: string | null;
  serviceName: string;
  location: string;
  startsAt: string;
  status: string;
}

export interface ScreeningCaptureForm {
  assignmentId: string;
  participantReference: string;
  department: string;
  consentConfirmed: boolean;
  practitionerNote: string;
  systolicMmhg: string;
  diastolicMmhg: string;
  glucoseMmolL: string;
  cholesterolMmolL: string;
  heightCm: string;
  weightKg: string;
}

export type ScreeningCorrectionForm = Omit<ScreeningCaptureForm, "assignmentId">;
