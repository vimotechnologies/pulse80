export const userTypeDefs = /* GraphQL */ `
  type PortalUserMembership { id: ID!, organisationId: ID!, organisationName: String!, role: String! }
  type PortalUser {
    id: ID!, fullName: String!, email: String, platformRole: String,
    confirmed: Boolean!, lastSignInAt: String, memberships: [PortalUserMembership!]!
  }
  type UserDirectory { users: [PortalUser!]!, organisations: [PortalRecordOption!]!, canManagePlatform: Boolean! }
  extend type Query { adminUserDirectory: UserDirectory! }
  extend type Mutation {
    inviteOrganisationUser(organisationId: ID!, email: String!, fullName: String!, role: String!): Boolean!
    updateOrganisationMemberRole(id: ID!, role: String!): Boolean!
    removeOrganisationMember(id: ID!): Boolean!
    updatePlatformUserRole(userId: ID!, role: String!): Boolean!
  }
`;
