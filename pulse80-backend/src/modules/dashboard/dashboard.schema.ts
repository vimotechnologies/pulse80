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

  enum DashboardPeriod {
    ALL_TIME
    THIS_YEAR
    THIS_QUARTER
  }
  type MonthlyParticipation {
    month: String!
    participants: Int!
  }
  type DepartmentParticipation {
    department: String!
    participants: Int!
    months: [MonthlyParticipation!]!
  }
  type OrganisationDashboardStats {
    monthlyParticipation: [MonthlyParticipation!]!
    departmentParticipation: [DepartmentParticipation!]!
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
    organisationDashboardStats(
      period: DashboardPeriod = ALL_TIME
    ): OrganisationDashboardStats!
  }
`;
