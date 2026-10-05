export const rosterTypeDefs = /* GraphQL */ `
  type ProgrammeParticipant {
    id: ID!
    programmeId: ID!
    employeeId: ID
    screeningReference: String
    eligibilityStatus: String!
    registrationStatus: String!
  }
  type ProgrammeRoster {
    programmeId: ID!
    programmeName: String!
    total: Int!
    participants: [ProgrammeParticipant!]!
  }
  input RosterParticipantInput {
    screeningReference: String!
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
  }
  extend type Mutation {
    createProgrammeParticipant(programmeId: ID!, input: RosterParticipantInput!): ID!
    importProgrammeParticipants(programmeId: ID!, rows: [RosterParticipantInput!]!): [ID!]!
    updateProgrammeParticipantStatus(programmeId: ID!, id: ID!, input: ParticipantStatusInput!): ProgrammeParticipant!
  }
`;
