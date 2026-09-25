import { GraphQLError } from "graphql";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser, requirePlatformPermission } from "../auth/auth.guard.js";
import { ScreeningService, type ScreeningCaptureInput } from "./screening.service.js";
import { FlexibleScreeningService } from "./flexible-screening.service.js";

const nullableNumber = (minimum: number, maximum: number) => z.number().min(minimum).max(maximum).nullish().transform((value) => value ?? null);
const captureSchema = z.object({ assignmentId: z.uuid(), participantReference: z.string().trim().min(2).max(80), department: z.string().trim().max(120).nullish().transform((v)=>v||null), consentConfirmed: z.literal(true), practitionerNote: z.string().trim().max(1000).nullish().transform((v)=>v||null), systolicMmhg: nullableNumber(40,300), diastolicMmhg: nullableNumber(20,200), glucoseMmolL: nullableNumber(.5,50), cholesterolMmolL: nullableNumber(.5,30), heightCm: nullableNumber(50,260), weightKg: nullableNumber(2,500) });
const correctionSchema = captureSchema.omit({ assignmentId: true });
const reviewSchema = z.object({
  status: z.enum(["Completed", "Needs Correction"]),
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
 const result=row.screening_results;
 const safeResult = result
  ? {systolicMmhg:result.systolic_mmhg,diastolicMmhg:result.diastolic_mmhg,glucoseMmolL:result.glucose_mmol_l,cholesterolMmolL:result.cholesterol_mmol_l,heightCm:result.height_cm,weightKg:result.weight_kg,bmi:result.bmi,riskLevel:result.risk_level,escalationRequired:result.escalation_required}
  : {systolicMmhg:null,diastolicMmhg:null,glucoseMmolL:null,cholesterolMmolL:null,heightCm:null,weightKg:null,bmi:null,riskLevel:"Incomplete",escalationRequired:false};
 return {
  id:row.id,organisationId:row.organisation_id,organisationName:row.organisations?.name??"Organisation unavailable",activationId:row.activation_id,activationName:row.activations?.title??null,assignmentId:row.assignment_id,practitionerName:row.practitioner_profiles?.profiles?.full_name??"Practitioner unavailable",participantReference:row.participant_reference,department:row.department,status:row.status,consentConfirmed:row.consent_confirmed,practitionerNote:row.practitioner_note,capturedAt:row.captured_at,submittedAt:row.submitted_at,reviewedAt:row.reviewed_at,reviewNote:row.review_note,
  result:safeResult
 };
}

export const screeningResolvers = {
 Query: {
  adminScreenings: async (_p:unknown,_a:unknown,c:GraphQLContext)=>{requirePlatformPermission(c,"screening:review");return (await new ScreeningService(c.adminSupabase).listAll()).map(shape);},
  myScreenings: async (_p:unknown,_a:unknown,c:GraphQLContext)=>{const{user}=requireAuthenticatedUser(c);return (await new ScreeningService(c.adminSupabase).listForPractitioner(user.id)).map(shape);},
  myScreeningAssignments: async (_p:unknown,_a:unknown,c:GraphQLContext)=>{const{user}=requireAuthenticatedUser(c);return (await new ScreeningService(c.adminSupabase).listAssignmentOptions(user.id)).map((r)=>({id:r.id,organisationName:r.organisations?.name??"Organisation unavailable",activationName:r.activations?.title??null,serviceName:r.service_name,location:r.location,startsAt:r.starts_at,status:r.status}));},
  screeningServicesForAssignment: async (_p:unknown,a:{assignmentId:string},c:GraphQLContext)=>{const{user}=requireAuthenticatedUser(c);return flexible(c).assignmentServices(user.id,z.uuid().parse(a.assignmentId));},
  screeningFieldsForService: async (_p:unknown,a:{serviceId:string},c:GraphQLContext)=>{requireAuthenticatedUser(c);return (await flexible(c).fieldsForService(z.uuid().parse(a.serviceId))).map((f)=>({id:f.id,serviceId:f.service_id,code:f.code,label:f.label,dataType:f.data_type,unit:f.unit,required:f.required,options:Array.isArray(f.options)?f.options:[],minValue:f.min_value,maxValue:f.max_value,displayOrder:f.display_order}));}
 },
 Mutation: {
  captureScreening: async (_p:unknown,a:{input:unknown},c:GraphQLContext)=>{const{user}=requireAuthenticatedUser(c);return shape(await new ScreeningService(c.adminSupabase).capture(user.id,parse(captureSchema,a.input) as ScreeningCaptureInput));},
  captureFlexibleScreening: async (_p:unknown,a:{input:unknown},c:GraphQLContext)=>{const{user}=requireAuthenticatedUser(c);const id=await flexible(c).capture(user.id,parse(flexibleSchema,a.input));return{id};},
  resubmitScreening: async (_p:unknown,a:{id:string;input:unknown},c:GraphQLContext)=>{const{user}=requireAuthenticatedUser(c);return shape(await new ScreeningService(c.adminSupabase).resubmit(z.uuid().parse(a.id),user.id,parse(correctionSchema,a.input)));},
  reviewScreening: async (_p:unknown,a:{id:string;input:unknown},c:GraphQLContext)=>{const{user}=requirePlatformPermission(c,"screening:review");const input=parse(reviewSchema,a.input);return shape(await new ScreeningService(c.adminSupabase).review(z.uuid().parse(a.id),user.id,input.status,input.reviewNote,input.errors));}
 }
};