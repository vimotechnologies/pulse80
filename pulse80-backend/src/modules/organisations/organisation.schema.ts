export const organisationTypeDefs = /* GraphQL */ `
  type Organisation {
    id: ID!
    name: String!
    slug: String!
    createdAt: String!
    updatedAt: String!
  }

  input UpdateOrganisationInput {
    name: String
    slug: String
  }

  extend type Query {
    organisation: Organisation!
  }

  extend type Mutation {
    updateOrganisation(input: UpdateOrganisationInput!): Organisation!
  }
`;
