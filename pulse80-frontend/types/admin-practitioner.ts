export type AdminPractitionerDocument = {
  id: string;
  documentType: string;
  fileName: string;
  expiryDate: string | null;
  verificationStatus: string;
  uploadedAt: string;
  reviewedAt: string | null;
  downloadUrl: string | null;
};

export type AdminPractitioner = {
  userId: string;
  fullName: string;
  professionalEmail: string;
  phone: string | null;
  country: string;
  city: string | null;
  profession: string;
  specialisation: string | null;
  yearsExperience: number;
  registrationNumber: string | null;
  registrationAuthority: string | null;
  registrationCountry: string | null;
  registrationExpiryDate: string | null;
  verificationStatus: string;
  practitionerStatus: string;
  profilePhotoUrl: string | null;
  profileCompleteness: number;
  capabilities: Array<{ id: string; code: string; name: string; approvalStatus: string }>;
  assignmentCount: number;
  completedAssignmentCount: number;
  documents: AdminPractitionerDocument[];
};

export type AdminPractitionerAssignment = {
  id: string;
  practitionerUserId: string;
  practitionerName: string;
  practitionerProfession: string;
  organisationId: string;
  organisationName: string;
  programmeName: string;
  activityName: string;
  serviceName: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PractitionerAssignmentForm = {
  practitionerUserId: string;
  organisationId: string;
  programmeName: string;
  activityName: string;
  serviceName: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled" | "Action Required";
};
