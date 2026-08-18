export const practitionerTypeDefs = /* GraphQL */ `
  type PractitionerCapability {
    id: ID!
    code: String!
    name: String!
    approvalStatus: String!
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
    preferredContactMethod: String!
    profession: String!
    specialisation: String
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
    profession: String!
    specialisation: String
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

  input UpdatePractitionerProfileInput {
    fullName: String
    professionalEmail: String
    phone: String
    country: String
    city: String
    preferredContactMethod: String
    specialisation: String
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

  extend type Query {
    practitionerProfile: PractitionerProfile!
    adminPractitioners: [AdminPractitioner!]!
  }

  extend type Mutation {
    updatePractitionerProfile(input: UpdatePractitionerProfileInput!): PractitionerProfile!
    uploadPractitionerPhoto(file: PractitionerFileInput!): PractitionerProfile!
    uploadPractitionerDocument(documentType: String!, expiryDate: String, file: PractitionerFileInput!): PractitionerDocument!
    updatePractitionerVerification(userId: ID!, input: PractitionerVerificationInput!): AdminPractitioner!
    reviewPractitionerDocument(documentId: ID!, status: String!): AdminPractitioner!
  }
`;
