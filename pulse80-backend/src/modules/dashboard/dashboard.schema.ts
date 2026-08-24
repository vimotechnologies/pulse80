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
    approvedScreenings: Int!
    screeningParticipation: Int!
    upcomingActivations: Int!
  }

  extend type Query {
    adminDashboardStats: AdminDashboardStats!
    organisationDashboardStats: OrganisationDashboardStats!
  }
`;
