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
