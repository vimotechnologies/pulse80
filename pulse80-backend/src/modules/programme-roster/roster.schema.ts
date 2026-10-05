export const rosterTypeDefs = /* GraphQL */ `
  type ProgrammeParticipant {
    id: ID!
    programmeId: ID!
    employeeId: ID
    screeningReference: String
    eligibilityStatus: String!
    registrationStatus: String!
  }
  type ProgrammeScreeningExportValue { label: String! unit: String value: String }\n  type ProgrammeScreeningExportRow { screeningId: ID! participantCode: String! service: String! department: String status: String! practitioner: String! capturedAt: String! submittedAt: String reviewedAt: String systolicMmhg: Float diastolicMmhg: Float glucoseMmolL: Float cholesterolMmolL: Float heightCm: Float weightKg: Float bmi: Float riskLevel: String escalationRequired: Boolean! referralRequired: Boolean! outcomeSummary: String flexibleResults: [ProgrammeScreeningExportValue!]! }\n  type ProgrammeScreeningExport { programmeName: String! rows: [ProgrammeScreeningExportRow!]! }\n  type ProgrammeRoster {
    programmeId: ID!
    programmeName: String!
    total: Int!
    participants: [ProgrammeParticipant!]!
  }
  input RosterParticipantInput {
    screeningReference: String
    employeeId: ID
    eligibilityStatus: String!
    registrationStatus: String!
  }
  input ParticipantStatusInput {
    eligibilityStatus: String!
    registrationStatus: String!
  }
  extend type Query {
    programmeRoster(programmeId: ID!, offset: Int = 0): ProgrammeRoster!\n    programmeScreeningExport(programmeId: ID!): ProgrammeScreeningExport!
  }
  extend type Mutation {
    createProgrammeParticipant(programmeId: ID!, input: RosterParticipantInput!): ID!
    importProgrammeParticipants(programmeId: ID!, rows: [RosterParticipantInput!]!): [ID!]!
    updateProgrammeParticipantStatus(programmeId: ID!, id: ID!, input: ParticipantStatusInput!): ProgrammeParticipant!
  }
`;
