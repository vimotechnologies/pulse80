export const practitionerTypeDefs = /* GraphQL */ `
  type PractitionerCapability {
    id: ID!
    code: String!
    name: String!
    approvalStatus: String!
  }

  type PractitionerSpecialisation {
    id: ID!
    name: String!
    sortOrder: Int!
  }

  type PractitionerAssignment {
    id: ID!
    organisationName: String!
    programmeName: String!
    activityName: String!
    serviceName: String!
    location: String!
    startsAt: String!
    endsAt: String
    status: String!
  }

  type PractitionerDashboardStats {
    upcomingAssignments: Int!
    participantsScreened: Int!
    screeningCompletionRate: Int!
    pendingCorrections: Int!
  }

  type PractitionerDashboardAssignment {
    id: ID!
    organisationName: String!
    programmeName: String!
    activityName: String!
    location: String!
    startsAt: String!
    endsAt: String
    role: String
    services: [String!]!
    status: String!
    confirmationRequired: Boolean!
  }

  type PractitionerAssignmentAlert {
    id: ID!
    message: String!
    changeType: String!
    urgent: Boolean!
    changedAt: String!
    additionalAlertCount: Int!
  }

  type ScreeningCorrectionError {
    id: ID!
    field: String!
    message: String!
    returnedAt: String!
  }

  type PractitionerDashboardCorrection {
    id: ID!
    participantReference: String!
    assignmentName: String!
    services: [String!]!
    returnedAt: String!
    errorCount: Int!
    errors: [ScreeningCorrectionError!]!
    reviewerNote: String
  }

  type PractitionerDashboard {
    stats: PractitionerDashboardStats!
    assignmentAlert: PractitionerAssignmentAlert
    upcomingAssignments: [PractitionerDashboardAssignment!]!
    recentCorrections: [PractitionerDashboardCorrection!]!
  }

  type PractitionerAssignmentResponse {
    id: ID!
    status: String!
    respondedAt: String!
    reason: String
    urgent: Boolean!
  }

  type PractitionerAssignmentAlertAcknowledgement {
    id: ID!
    acknowledgedAt: String!
  }

  type PractitionerDocument {
    id: ID!
    documentType: String!
    fileName: String!
    expiryDate: String
    verificationStatus: String!
    uploadedAt: String!
    downloadUrl: String
  }

  type PractitionerProfile {
    userId: ID!
    fullName: String!
    professionalEmail: String!
    phone: String
    country: String!
    city: String
    districtProvince: String
    clinicHospital: String
    preferredContactMethod: String!
    profession: String!
    specialisation: String
    specialisations: [PractitionerSpecialisation!]!
    yearsExperience: Int!
    qualifications: [String!]!
    registrationNumber: String
    registrationAuthority: String
    registrationCountry: String
    registrationExpiryDate: String
    verificationStatus: String!
    practitionerStatus: String!
    profilePhotoUrl: String
    profileCompleteness: Int!
    assignmentNotifications: Boolean!
    documentNotifications: Boolean!
    paymentNotifications: Boolean!
    capabilities: [PractitionerCapability!]!
    selectedServices: [PractitionerCapability!]!
    assignments(limit: Int = 5): [PractitionerAssignment!]!
    documents: [PractitionerDocument!]!
  }

  type AdminPractitionerDocument {
    id: ID!
    documentType: String!
    fileName: String!
    expiryDate: String
    verificationStatus: String!
    uploadedAt: String!
    reviewedAt: String
    downloadUrl: String
  }

  type AdminPractitioner {
    userId: ID!
    fullName: String!
    professionalEmail: String!
    phone: String
    country: String!
    city: String
    districtProvince: String
    clinicHospital: String
    profession: String!
    specialisation: String
    specialisations: [String!]
    selectedServiceCodes: [String!]
    yearsExperience: Int!
    registrationNumber: String
    registrationAuthority: String
    registrationCountry: String
    registrationExpiryDate: String
    verificationStatus: String!
    practitionerStatus: String!
    profilePhotoUrl: String
    profileCompleteness: Int!
    capabilities: [PractitionerCapability!]!
    assignmentCount: Int!
    completedAssignmentCount: Int!
    documents: [AdminPractitionerDocument!]!
  }

  type AdminPractitionerAssignment {
    id: ID!
    practitionerUserId: ID!
    practitionerName: String!
    practitionerProfession: String!
    organisationId: ID!
    organisationName: String!
    programmeName: String!
    activityName: String!
    serviceName: String!
    location: String!
    startsAt: String!
    endsAt: String
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  input UpdatePractitionerProfileInput {
    fullName: String
    professionalEmail: String
    phone: String
    country: String
    profession: String
    registrationNumber: String
    registrationAuthority: String
    registrationCountry: String
    registrationExpiryDate: String
    city: String
    districtProvince: String
    clinicHospital: String
    preferredContactMethod: String
    specialisation: String
    specialisations: [String!]
    selectedServiceCodes: [String!]
    yearsExperience: Int
    qualifications: [String!]
    assignmentNotifications: Boolean
    documentNotifications: Boolean
    paymentNotifications: Boolean
  }

  input PractitionerFileInput {
    fileName: String!
    dataUrl: String!
  }

  input PractitionerVerificationInput {
    verificationStatus: String!
    practitionerStatus: String!
  }

  input PractitionerAssignmentInput {
    practitionerUserId: ID!
    organisationId: ID!
    programmeName: String!
    activityName: String!
    serviceName: String!
    serviceNames: [String!]
    roleName: String
    location: String!
    startsAt: String!
    endsAt: String
    status: String!
  }

  extend type Query {
    practitionerDashboard: PractitionerDashboard!
    practitionerProfile: PractitionerProfile!
    adminPractitioners: [AdminPractitioner!]!
    adminPractitionerAssignments: [AdminPractitionerAssignment!]!
  }

  extend type Mutation {
    confirmPractitionerAssignment(assignmentId: ID!): PractitionerAssignmentResponse!
    declinePractitionerAssignment(assignmentId: ID!, reason: String!): PractitionerAssignmentResponse!
    withdrawPractitionerAssignment(assignmentId: ID!, reason: String!): PractitionerAssignmentResponse!
    acknowledgePractitionerAssignmentAlert(alertId: ID!): PractitionerAssignmentAlertAcknowledgement!
    updatePractitionerProfile(input: UpdatePractitionerProfileInput!): PractitionerProfile!
    uploadPractitionerPhoto(file: PractitionerFileInput!): PractitionerProfile!
    deletePractitionerPhoto: PractitionerProfile!
    uploadPractitionerDocument(documentType: String!, expiryDate: String, file: PractitionerFileInput!): PractitionerDocument!
    updatePractitionerVerification(userId: ID!, input: PractitionerVerificationInput!): AdminPractitioner!
    reviewPractitionerDocument(documentId: ID!, status: String!): AdminPractitioner!
    createPractitionerAssignment(input: PractitionerAssignmentInput!): AdminPractitionerAssignment!
    updatePractitionerAssignment(id: ID!, input: PractitionerAssignmentInput!): AdminPractitionerAssignment!
  }
`;
