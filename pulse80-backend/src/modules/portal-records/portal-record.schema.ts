export const portalRecordTypeDefs = /* GraphQL */ `
  type PortalRecord {
    id: ID!
    kind: String!
    organisationId: ID!
    organisationName: String!
    organisationLogoUrl: String
    practitionerUserId: ID
    practitionerName: String
    title: String!
    description: String!
    status: String!
    amount: Float
    currency: String!
    dueOn: String
    createdAt: String!
    updatedAt: String!
  }
  type PortalRecordOption { id: ID!, name: String! }
  type PortalRecordWorkspace {
    records: [PortalRecord!]!
    organisations: [PortalRecordOption!]!
    practitioners: [PortalRecordOption!]!
    canManage: Boolean!
  }
  input SavePortalRecordInput {
    organisationId: ID!
    practitionerUserId: ID
    title: String!
    description: String!
    status: String!
    amount: Float
    currency: String!
    dueOn: String
  }
  extend type Query {
    adminRecordWorkspace(kind: String!): PortalRecordWorkspace!
    adminOrganisationRecords(kind: String!, organisationId: ID!): [PortalRecord!]!
    organisationRecords(kind: String!): [PortalRecord!]!
    practitionerPayments: [PortalRecord!]!
  }
  extend type Mutation {
    savePortalRecord(kind: String!, id: ID, input: SavePortalRecordInput!): PortalRecord!
  }
`;
