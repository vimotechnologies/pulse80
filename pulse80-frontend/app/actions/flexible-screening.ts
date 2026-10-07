"use server";
import { revalidatePath } from "next/cache";
import { graphqlRequest } from "@/lib/graphql/client";

export type ServiceOption={id:string;code:string;name:string};
export type ResultField={id:string;serviceId:string;code:string;label:string;dataType:"number"|"text"|"boolean"|"select";unit:string|null;required:boolean;options:string[];minValue:number|null;maxValue:number|null;displayOrder:number};
export type DynamicValue={fieldId:string;valueNumber?:number|null;valueText?:string|null;valueBoolean?:boolean|null;valueCode?:string|null};
export type DynamicCapture={assignmentId:string;serviceId:string;participantReference:string;department:string;consentConfirmed:boolean;practitionerNote:string;values:DynamicValue[];outcomeSummary:string;referralRequired:boolean;escalationRequired:boolean;reportingRiskCategory:string};

export async function loadAssignmentServices(assignmentId:string){const q=`query($assignmentId:ID!){screeningServicesForAssignment(assignmentId:$assignmentId){id code name}}`;return (await graphqlRequest<{screeningServicesForAssignment:ServiceOption[]}>(q,{variables:{assignmentId}})).screeningServicesForAssignment;}
export async function loadServiceFields(serviceId:string){const q=`query($serviceId:ID!){screeningFieldsForService(serviceId:$serviceId){id serviceId code label dataType unit required options minValue maxValue displayOrder}}`;return (await graphqlRequest<{screeningFieldsForService:ResultField[]}>(q,{variables:{serviceId}})).screeningFieldsForService;}
export async function submitDynamicScreening(input:DynamicCapture){try{const q=`mutation($input:FlexibleScreeningCaptureInput!){captureFlexibleScreening(input:$input){id}}`;const result=await graphqlRequest<{captureFlexibleScreening:{id:string}}>(q,{variables:{input:{...input,department:input.department||null,practitionerNote:input.practitionerNote||null,outcomeSummary:input.outcomeSummary||null,reportingRiskCategory:input.reportingRiskCategory||null}}});revalidatePath("/practitioner/screenings");revalidatePath("/practitioner/dashboard");return{ok:true as const,id:result.captureFlexibleScreening.id};}catch(error){return{ok:false as const,error:error instanceof Error?error.message:"CAPTURE_FAILED"};}}
