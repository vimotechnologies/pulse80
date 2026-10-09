"use server";
import { graphqlRequest } from "@/lib/graphql/client";

export async function generateWalkInCodes(programmeId: string, count: number) {
  try {
    const query = `mutation($programmeId:ID!,$count:Int!){generateWalkInCodes(programmeId:$programmeId,count:$count)}`;
    const data = await graphqlRequest<{generateWalkInCodes:string[]}>(query,{variables:{programmeId,count}});
    return {ok:true as const,codes:data.generateWalkInCodes};
  } catch(error) {return {ok:false as const,error:error instanceof Error?error.message:"Could not generate codes."};}
}
export async function activateWalkInCode(programmeId: string, code: string) {
  try {
    const query = `mutation($programmeId:ID!,$code:String!){activateWalkInCode(programmeId:$programmeId,code:$code){id screeningReference registrationStatus}}`;
    const data = await graphqlRequest<{activateWalkInCode:{id:string;screeningReference:string;registrationStatus:string}}>(query,{variables:{programmeId,code}});
    return {ok:true as const,participant:data.activateWalkInCode};
  } catch(error) {return {ok:false as const,error:error instanceof Error?error.message:"Could not activate code."};}
}
