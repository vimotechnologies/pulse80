export const dashboardTypeDefs = /* GraphQL */ `
  type AdminDashboardStats {
    totalOrganisations: Int!
    representedEmployees: Int!
    verifiedPractitioners: Int!
    upcomingAssignments: Int!
  }

  type OrganisationDashboardStats {
    workforceSize: Int!
    wellnessRiskScore: Int!
    wellnessRisk: String!
    completedScreenings: Int!
    participantsScreened: Int!
    eligibleParticipants: Int!
    screeningParticipation: Float!
    expectedRequiredScreenings: Int!
    completedRequiredScreenings: Int!
    screeningCompletionRate: Float!
    upcomingActivations: Int!
  }

  extend type Query {
    adminDashboardStats: AdminDashboardStats!
    organisationDashboardStats: OrganisationDashboardStats!
  }
`;
