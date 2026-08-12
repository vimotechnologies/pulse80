export const authTypeDefs = /* GraphQL */ `
  type Viewer {
    id: ID!
    email: String
    platformRole: String
    organisationId: ID
    organisationRole: String
    permissions: [String!]!
  }

  extend type Query {
    me: Viewer!
  }
`;
