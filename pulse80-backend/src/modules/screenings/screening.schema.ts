export const screeningTypeDefs = /* GraphQL */ `
  type ScreeningResult {
    systolicMmhg: Int
    diastolicMmhg: Int
    glucoseMmolL: Float
    cholesterolMmolL: Float
    heightCm: Float
    weightKg: Float
    bmi: Float
    riskLevel: String!
    escalationRequired: Boolean!
  }

  type Screening {
    id: ID!
    organisationId: ID!
    organisationName: String!
    activationId: ID
    activationName: String
    assignmentId: ID!
    practitionerName: String!
    participantReference: String!
    department: String
    status: String!
    consentConfirmed: Boolean!
    practitionerNote: String
    capturedAt: String!
    submittedAt: String
    reviewedAt: String
    reviewNote: String
    result: ScreeningResult!
  }

  type ScreeningAssignmentOption {
    id: ID!
    organisationName: String!
    activationName: String
    serviceName: String!
    location: String!
    startsAt: String!
    status: String!
  }

  input ScreeningCaptureInput {
    assignmentId: ID!
    participantReference: String!
    department: String
    consentConfirmed: Boolean!
    practitionerNote: String
    systolicMmhg: Int
    diastolicMmhg: Int
    glucoseMmolL: Float
    cholesterolMmolL: Float
    heightCm: Float
    weightKg: Float
  }

  input ScreeningReviewInput {
    status: String!
    reviewNote: String
  }

  extend type Query {
    adminScreenings: [Screening!]!
    myScreenings: [Screening!]!
    myScreeningAssignments: [ScreeningAssignmentOption!]!
  }

  extend type Mutation {
    captureScreening(input: ScreeningCaptureInput!): Screening!
    reviewScreening(id: ID!, input: ScreeningReviewInput!): Screening!
  }
`;
