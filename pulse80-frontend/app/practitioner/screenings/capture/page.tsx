import { loadPractitionerScreenings } from "@/app/actions/screening-operations";
import { DynamicScreeningCapture } from "@/components/screenings/DynamicScreeningCapture";
export default async function CaptureScreeningPage(){const{myScreeningAssignments}=await loadPractitionerScreenings();return <DynamicScreeningCapture assignments={myScreeningAssignments}/>;}
