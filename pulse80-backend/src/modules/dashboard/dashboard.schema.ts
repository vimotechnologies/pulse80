export const dashboardTypeDefs = /* GraphQL */ `
  type AdminDashboardStats {
    totalOrganisations: Int!
    representedEmployees: Int!
    verifiedPractitioners: Int!
    upcomingAssignments: Int!
  }

  type ClientUpcomingActivity {
    id: ID!
    title: String!
    startsAt: String!
    location: String!
    status: String!
  }

  type OrganisationDashboardStats {
    organisationName: String!
    refreshedAt: String!
    upcomingActivities: [ClientUpcomingActivity!]!
    workforceSize: Int!
    wellnessRiskScore: Int!
    wellnessRisk: String!
    approvedScreenings: Int!
    participantsScreened: Int!
    screeningParticipation: Int!
    upcomingActivations: Int!
  }

  extend type Query {
    adminDashboardStats: AdminDashboardStats!
    organisationDashboardStats: OrganisationDashboardStats!
  }
`;
