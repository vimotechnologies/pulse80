export const programmeTypeDefs = /* GraphQL */ `
  type Programme {
    id: ID!
    organisationId: ID!
    organisationName: String!
    name: String!
    description: String
    status: String!
    startsOn: String!
    endsOn: String!
    serviceNames: [String!]!
    targetParticipants: Int!
    activationCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type ActivationReadinessItem {
    id: ID!
    label: String!
    completed: Boolean!
    completedAt: String
  }

  type Activation {
    id: ID!
    programmeId: ID!
    programmeName: String!
    organisationId: ID!
    organisationName: String!
    title: String!
    description: String
    location: String!
    startsAt: String!
    endsAt: String!
    expectedParticipants: Int!
    serviceNames: [String!]!
    status: String!
    readinessScore: Int!
    readinessItems: [ActivationReadinessItem!]!
    practitionerCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  input ProgrammeInput {
    organisationId: ID!
    name: String!
    description: String
    status: String!
    startsOn: String!
    endsOn: String!
    serviceNames: [String!]!
    targetParticipants: Int!
  }

  input ActivationInput {
    programmeId: ID!
    title: String!
    description: String
    location: String!
    startsAt: String!
    endsAt: String!
    expectedParticipants: Int!
    serviceNames: [String!]!
    status: String!
    readinessLabels: [String!]!
  }

  type AssignmentServiceOption { id: ID! name: String! code: String! }
  type AssignmentActivationOption {
    id: ID! organisationId: ID! programmeName: String! title: String! location: String!
    startsAt: String! endsAt: String! services: [AssignmentServiceOption!]!
  }
  input ProgrammeParticipantInput {
    programmeId: ID! employeeId: ID! screeningReference: String! requiredServiceIds: [ID!]!
    eligibilityStatus: String! registrationStatus: String!
  }
  extend type Query {
    adminAssignmentActivations: [AssignmentActivationOption!]!
    adminProgrammes: [Programme!]!
    adminActivations: [Activation!]!
    adminOrganisationActivations(organisationId: ID!): [Activation!]!
    organisationActivations: [Activation!]!
  }

  extend type Mutation {
    saveProgrammeParticipant(input: ProgrammeParticipantInput!): ID!
    createProgramme(input: ProgrammeInput!): Programme!
    updateProgramme(id: ID!, input: ProgrammeInput!): Programme!
    createActivation(input: ActivationInput!): Activation!
    updateActivation(id: ID!, input: ActivationInput!): Activation!
    setActivationReadiness(id: ID!, completed: Boolean!): Activation!
  }
`;
