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

  extend type Query {
    practitionerProfile: PractitionerProfile!
  }

  extend type Mutation {
    updatePractitionerProfile(input: UpdatePractitionerProfileInput!): PractitionerProfile!
    uploadPractitionerPhoto(file: PractitionerFileInput!): PractitionerProfile!
    uploadPractitionerDocument(documentType: String!, expiryDate: String, file: PractitionerFileInput!): PractitionerDocument!
  }
`;
