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

  type RiskDistributionEntry {
    riskCategory: String!
    participantCount: Int!
  }

  type AdminPortalAnalytics {
    participantsScreened: Int!
    eligibleParticipants: Int!
    screeningParticipationRate: Float
    completedScreenings: Int!
    expectedRequiredScreenings: Int!
    completedRequiredScreenings: Int!
    screeningCompletionRate: Float
    riskDistribution: [RiskDistributionEntry!]!
    requiredReferralCount: Int!
    missingReferralCount: Int!
    followUpCount: Int!
    followedUpReferralCount: Int!
  }

  extend type Query {
    adminRiskDistribution: [RiskDistributionEntry!]!
    organisationRiskDistribution: [RiskDistributionEntry!]!
    adminDashboardStats: AdminDashboardStats!
    organisationDashboardStats: OrganisationDashboardStats!
    adminPortalAnalytics: AdminPortalAnalytics!
  }
`;
