import { GraphQLError } from "graphql";
import { z } from "zod";

import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser, requirePlatformPermission } from "../auth/auth.guard.js";
import { ScreeningService, type ScreeningCaptureInput } from "./screening.service.js";

const nullableNumber = (minimum: number, maximum: number) => z.number().min(minimum).max(maximum).nullish().transform((value) => value ?? null);
const captureSchema = z.object({
  assignmentId: z.uuid(),
  participantReference: z.string().trim().min(2).max(80),
  department: z.string().trim().max(120).nullish().transform((value) => value || null),
  consentConfirmed: z.literal(true),
  practitionerNote: z.string().trim().max(1000).nullish().transform((value) => value || null),
  systolicMmhg: nullableNumber(40, 300), diastolicMmhg: nullableNumber(20, 200),
  glucoseMmolL: nullableNumber(0.5, 50), cholesterolMmolL: nullableNumber(0.5, 30),
  heightCm: nullableNumber(50, 260), weightKg: nullableNumber(2, 500),
});
const correctionSchema = captureSchema.omit({ assignmentId: true });
const reviewSchema = z.object({
  status: z.enum(["Approved", "Needs Correction"]),
  reviewNote: z.string().trim().max(1000).nullish().transform((value) => value || null),
  errors: z.array(z.object({
    field: z.string().trim().min(1).max(120),
    message: z.string().trim().min(2).max(500),
  })).max(30).optional().default([]),
}).superRefine((value, context) => {
  if (value.status === "Needs Correction" && value.errors.length === 0) {
    context.addIssue({ code: "custom", message: "At least one correction error is required." });
  }
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new GraphQLError(parsed.error.issues[0]?.message ?? "Invalid screening details.", { extensions: { code: "BAD_USER_INPUT" } });
  return parsed.data;
}

type ScreeningRow = Awaited<ReturnType<ScreeningService["listAll"]>>[number];
function shape(row: ScreeningRow) {
  const result = row.screening_results;
  if (!result) throw new Error("Screening result is unavailable.");
  return {
    id: row.id, organisationId: row.organisation_id, organisationName: row.organisations?.name ?? "Organisation unavailable",
    activationId: row.activation_id, activationName: row.activations?.title ?? null, assignmentId: row.assignment_id,
    practitionerName: row.practitioner_profiles?.profiles?.full_name ?? "Practitioner unavailable",
    participantReference: row.participant_reference, department: row.department, status: row.status,
    consentConfirmed: row.consent_confirmed, practitionerNote: row.practitioner_note, capturedAt: row.captured_at,
    submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, reviewNote: row.review_note,
    result: { systolicMmhg: result.systolic_mmhg, diastolicMmhg: result.diastolic_mmhg,
      glucoseMmolL: result.glucose_mmol_l, cholesterolMmolL: result.cholesterol_mmol_l,
      heightCm: result.height_cm, weightKg: result.weight_kg, bmi: result.bmi,
      riskLevel: result.risk_level, escalationRequired: result.escalation_required },
  };
}

export const screeningResolvers = {
  Query: {
    adminScreenings: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      requirePlatformPermission(context, "screening:review");
      return (await new ScreeningService(context.adminSupabase).listAll()).map(shape);
    },
    myScreenings: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { user } = requireAuthenticatedUser(context);
      return (await new ScreeningService(context.adminSupabase).listForPractitioner(user.id)).map(shape);
    },
    myScreeningAssignments: async (_parent: unknown, _arguments: unknown, context: GraphQLContext) => {
      const { user } = requireAuthenticatedUser(context);
      return (await new ScreeningService(context.adminSupabase).listAssignmentOptions(user.id)).map((row) => ({
        id: row.id, organisationName: row.organisations?.name ?? "Organisation unavailable",
        activationName: row.activations?.title ?? null, serviceName: row.service_name, location: row.location,
        startsAt: row.starts_at, status: row.status,
      }));
    },
  },
  Mutation: {
    captureScreening: async (_parent: unknown, arguments_: { input: unknown }, context: GraphQLContext) => {
      const { user } = requireAuthenticatedUser(context);
      return shape(await new ScreeningService(context.adminSupabase).capture(user.id, parse(captureSchema, arguments_.input) as ScreeningCaptureInput));
    },
    resubmitScreening: async (_parent: unknown, arguments_: { id: string; input: unknown }, context: GraphQLContext) => {
      const { user } = requireAuthenticatedUser(context);
      return shape(await new ScreeningService(context.adminSupabase).resubmit(
        z.uuid().parse(arguments_.id),
        user.id,
        parse(correctionSchema, arguments_.input),
      ));
    },
    reviewScreening: async (_parent: unknown, arguments_: { id: string; input: unknown }, context: GraphQLContext) => {
      const { user } = requirePlatformPermission(context, "screening:review");
      const input = parse(reviewSchema, arguments_.input);
      return shape(await new ScreeningService(context.adminSupabase).review(
        z.uuid().parse(arguments_.id), user.id, input.status, input.reviewNote, input.errors,
      ));
    },
  },
};
