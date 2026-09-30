export const analyticsTypeDefs = /* GraphQL */ `
  input AnalyticsFiltersInput {
    organisationId: ID
    programmeId: ID
    branch: String
    department: String
    from: String
    to: String
  }

  type ParticipantsScreenedAnalytics {
    organisationId: ID!
    programmeId: ID
    screeningEvents: Int!
    participantsScreened: Int!
    completedScreeningEvents: Int!
  }

  type ScreeningCompletionAnalytics {
    organisationId: ID!
    expectedRequiredScreenings: Int!
    completedRequiredScreenings: Int!
    screeningCompletionRate: Float!
  }

  type ScreeningParticipationAnalytics {
    organisationId: ID!
    eligibleParticipantCount: Int!
    participantsScreened: Int!
    participationRate: Float!
  }

  type PendingCorrectionsAnalytics {
    organisationId: ID!
    practitionerUserId: ID
    pendingCorrections: Int!
  }

  type RiskMetricsAnalytics {
    organisationId: ID!
    riskCategory: String!
    participantCount: Int!
    totalParticipants: Int!
    percentage: Float
  }

  type ReferralAnalytics {
    organisationId: ID!
    screeningId: ID!
    screeningDate: String!
    referralRequired: Boolean!
    referralCreated: Boolean!
    referralMissing: Boolean!
    referralId: ID
    referralStatus: String
    urgency: String
    referredAt: String
    dueAt: String
    completedAt: String
  }

  type ReferralFollowupAnalytics {
    organisationId: ID!
    referralId: ID!
    screeningId: ID!
    referralStatus: String
    referredAt: String!
    followUpCount: Int!
    followUpCompleted: Boolean!
    latestFollowUpAt: String
    nextFollowUpAt: String
  }

  extend type Query {
    participantsScreenedAnalytics(filters: AnalyticsFiltersInput): [ParticipantsScreenedAnalytics!]!
    screeningCompletionAnalytics(filters: AnalyticsFiltersInput): [ScreeningCompletionAnalytics!]!
    screeningParticipationAnalytics(filters: AnalyticsFiltersInput): [ScreeningParticipationAnalytics!]!
    pendingCorrectionsAnalytics(filters: AnalyticsFiltersInput): [PendingCorrectionsAnalytics!]!
    riskMetricsAnalytics(filters: AnalyticsFiltersInput): [RiskMetricsAnalytics!]!
    referralAnalytics(filters: AnalyticsFiltersInput): [ReferralAnalytics!]!
    referralFollowupAnalytics(filters: AnalyticsFiltersInput): [ReferralFollowupAnalytics!]!
  }
`;
