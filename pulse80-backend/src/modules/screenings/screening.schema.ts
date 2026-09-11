export const screeningTypeDefs = /* GraphQL */ `
  type ScreeningResult { systolicMmhg: Int diastolicMmhg: Int glucoseMmolL: Float cholesterolMmolL: Float heightCm: Float weightKg: Float bmi: Float riskLevel: String! escalationRequired: Boolean! }
  type Screening { id: ID! organisationId: ID! organisationName: String! activationId: ID activationName: String assignmentId: ID! practitionerName: String! participantReference: String! department: String status: String! consentConfirmed: Boolean! practitionerNote: String capturedAt: String! submittedAt: String reviewedAt: String reviewNote: String result: ScreeningResult! }
  type ScreeningAssignmentOption { id: ID! organisationName: String! activationName: String serviceName: String! location: String! startsAt: String! status: String! }

  type ScreeningServiceOption { id: ID! code: String! name: String! }
  type ServiceResultField { id: ID! serviceId: ID! code: String! label: String! dataType: String! unit: String required: Boolean! options: [String!]! minValue: Float maxValue: Float displayOrder: Int! }
  input FlexibleResultValueInput { fieldId: ID! valueNumber: Float valueText: String valueBoolean: Boolean valueCode: String }
  input FlexibleScreeningCaptureInput { assignmentId: ID! serviceId: ID! participantReference: String! department: String consentConfirmed: Boolean! practitionerNote: String values: [FlexibleResultValueInput!]! outcomeSummary: String referralRequired: Boolean escalationRequired: Boolean reportingRiskCategory: String }
  type FlexibleScreeningCaptureResult { id: ID! }

  input ScreeningCaptureInput { assignmentId: ID! participantReference: String! department: String consentConfirmed: Boolean! practitionerNote: String systolicMmhg: Int diastolicMmhg: Int glucoseMmolL: Float cholesterolMmolL: Float heightCm: Float weightKg: Float }
  input ScreeningReviewInput { status: String! reviewNote: String errors: [ScreeningCorrectionErrorInput!] }
  input ScreeningCorrectionErrorInput { field: String! message: String! }
  input ScreeningCorrectionInput { participantReference: String! department: String consentConfirmed: Boolean! practitionerNote: String systolicMmhg: Int diastolicMmhg: Int glucoseMmolL: Float cholesterolMmolL: Float heightCm: Float weightKg: Float }

  extend type Query {
    adminScreenings: [Screening!]!
    myScreenings: [Screening!]!
    myScreeningAssignments: [ScreeningAssignmentOption!]!
    screeningServicesForAssignment(assignmentId: ID!): [ScreeningServiceOption!]!
    screeningFieldsForService(serviceId: ID!): [ServiceResultField!]!
  }
  extend type Mutation {
    captureScreening(input: ScreeningCaptureInput!): Screening!
    captureFlexibleScreening(input: FlexibleScreeningCaptureInput!): FlexibleScreeningCaptureResult!
    resubmitScreening(id: ID!, input: ScreeningCorrectionInput!): Screening!
    reviewScreening(id: ID!, input: ScreeningReviewInput!): Screening!
  }
`;
