export const organisationTypeDefs = /* GraphQL */ `
  type OrganisationContact {
    id: ID!
    name: String!
    roleLabel: String!
    email: String!
    phone: String
    method: String!
    primary: Boolean!
    notes: String
  }

  type Organisation {
    id: ID!
    name: String!
    slug: String!
    code: String!
    logoUrl: String
    industry: String!
    country: String!
    primaryLocation: String!
    region: String!
    employees: Int!
    package: String!
    contractStart: String!
    contractEnd: String!
    wellnessRiskScore: Int!
    wellnessRisk: String!
    status: String!
    customPackageNotes: String
    contacts: [OrganisationContact!]!
    createdAt: String!
    updatedAt: String!
  }

  input OrganisationContactInput {
    id: ID
    name: String!
    roleLabel: String!
    email: String!
    phone: String
    method: String!
    primary: Boolean!
    notes: String
  }

  input CreateOrganisationInput {
    name: String!
    industry: String!
    country: String!
    primaryLocation: String!
    region: String!
    employees: Int!
    package: String!
    contractStart: String!
    contractEnd: String!
    status: String!
    customPackageNotes: String
    logoDataUrl: String
    contacts: [OrganisationContactInput!]!
  }

  input UpdateOrganisationInput {
    name: String
    slug: String
    industry: String
    country: String
    primaryLocation: String
    region: String
    employees: Int
    package: String
    contractStart: String
    contractEnd: String
    status: String
    customPackageNotes: String
    logoDataUrl: String
    removeLogo: Boolean
    contacts: [OrganisationContactInput!]
  }

  extend type Query {
    organisation: Organisation!
    adminOrganisations: [Organisation!]!
    adminOrganisation(id: ID!): Organisation!
  }

  extend type Mutation {
    createOrganisation(input: CreateOrganisationInput!): Organisation!
    updateOrganisation(input: UpdateOrganisationInput!): Organisation!
    updateAdminOrganisation(id: ID!, input: UpdateOrganisationInput!): Organisation!
  }
`;
