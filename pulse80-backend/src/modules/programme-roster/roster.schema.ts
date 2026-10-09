export const rosterTypeDefs = /* GraphQL */ `
  type ProgrammeParticipant {
    id: ID!
    programmeId: ID!
    employeeId: ID
    screeningReference: String
    eligibilityStatus: String!
    registrationStatus: String!
  }
  type ProgrammeScreeningExportValue { label: String! unit: String value: String }
  type ProgrammeScreeningExportRow { screeningId: ID! participantCode: String! service: String! department: String status: String! practitioner: String! capturedAt: String! submittedAt: String reviewedAt: String systolicMmhg: Float diastolicMmhg: Float glucoseMmolL: Float cholesterolMmolL: Float heightCm: Float weightKg: Float bmi: Float riskLevel: String escalationRequired: Boolean! referralRequired: Boolean! outcomeSummary: String flexibleResults: [ProgrammeScreeningExportValue!]! }
  type ProgrammeScreeningExport { programmeName: String! rows: [ProgrammeScreeningExportRow!]! }
  type ProgrammeInterimServiceActivity { service: String! screeningsCaptured: Int! completedScreenings: Int! participantsScreened: Int! }
  type ProgrammeInterimRiskDistribution { riskCategory: String! screeningCount: Int! }
  type ProgrammeInterimReport {
    reportType: String! generatedAt: String! programmeId: ID! programmeName: String! programmeStatus: String!
    startsOn: String! endsOn: String! organisationId: ID! organisationName: String! organisationLogoUrl: String
    location: String activationStatus: String registeredParticipants: Int! participantsScreened: Int!
    participationRate: Float screeningsCaptured: Int! completedScreenings: Int!
    serviceActivity: [ProgrammeInterimServiceActivity!]! riskDistribution: [ProgrammeInterimRiskDistribution!]!
    referralsRequired: Int! escalationsRequired: Int! disclaimer: String!
  }
  type ProgrammeRoster {
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
    programmeRoster(programmeId: ID!, offset: Int = 0): ProgrammeRoster!
    programmeScreeningExport(programmeId: ID!): ProgrammeScreeningExport!
    programmeInterimReport(programmeId: ID!): ProgrammeInterimReport!
  }
  extend type Mutation {
    createProgrammeParticipant(programmeId: ID!, input: RosterParticipantInput!): ID!
    importProgrammeParticipants(programmeId: ID!, rows: [RosterParticipantInput!]!): [ID!]!
    updateProgrammeParticipantStatus(programmeId: ID!, id: ID!, input: ParticipantStatusInput!): ProgrammeParticipant!
    generateWalkInCodes(programmeId: ID!, count: Int!): [String!]!
    activateWalkInCode(programmeId: ID!, code: String!): ProgrammeParticipant!
  }
`;
