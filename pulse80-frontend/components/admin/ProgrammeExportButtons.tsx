"use client";
import * as XLSX from "xlsx";
import type { ProgrammeRoster } from "@/types/programme-roster";
import type { ProgrammeScreeningExportRow } from "@/app/actions/programme-roster";
type Props={roster:ProgrammeRoster;screenings:ProgrammeScreeningExportRow[]};
const button="rounded-lg border border-card-border px-4 py-2 text-sm";
const safe=(name:string)=>name.replace(/[^a-z0-9-_]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()||"programme";
function detailedRows(rows:ProgrammeScreeningExportRow[]){
 const flexible=[...new Set(rows.flatMap(r=>r.flexibleResults.map(v=>v.unit?(v.label+" ("+v.unit+")"):v.label)))];
 return rows.map(r=>{const extra=Object.fromEntries(flexible.map(k=>[k,""]));for(const v of r.flexibleResults)extra[v.unit?(v.label+" ("+v.unit+")"):v.label]=v.value??"";
 return {"Participant Code":r.participantCode,"Service":r.service,"Status":r.status,"Practitioner":r.practitioner,"Department":r.department??"","Captured At":r.capturedAt,"Submitted At":r.submittedAt??"","Reviewed At":r.reviewedAt??"","Systolic (mmHg)":r.systolicMmhg??"","Diastolic (mmHg)":r.diastolicMmhg??"","Glucose (mmol/L)":r.glucoseMmolL??"","Cholesterol (mmol/L)":r.cholesterolMmolL??"","Height (cm)":r.heightCm??"","Weight (kg)":r.weightKg??"","BMI":r.bmi??"","Risk Level":r.riskLevel??"","Escalation Required":r.escalationRequired?"Yes":"No","Referral Required":r.referralRequired?"Yes":"No","Outcome Summary":r.outcomeSummary??"",...extra};});
}
function summaryRows(roster:ProgrammeRoster,rows:ProgrammeScreeningExportRow[]){
 const byCode=new Map<string,ProgrammeScreeningExportRow[]>();for(const row of rows){const current=byCode.get(row.participantCode)??[];current.push(row);byCode.set(row.participantCode,current);}
 return roster.participants.map(p=>{const screens=p.screeningReference?byCode.get(p.screeningReference)??[]:[];const completed=screens.filter(s=>s.status==="Completed");return {"Participant Code":p.screeningReference??"","Eligibility":p.eligibilityStatus,"Registration":p.registrationStatus,"Screened":screens.length?"Yes":"No","Screenings Captured":screens.length,"Completed Screenings":completed.length,"Services Completed":[...new Set(completed.map(s=>s.service).filter(Boolean))].join(", ")};});
}
function csv(rows:Record<string,unknown>[]){if(!rows.length)return "";const headers=Object.keys(rows[0]);const q=(v:unknown)=>'"'+String(v??"").replaceAll('"','""')+'"';return [headers.map(q).join(","),...rows.map(r=>headers.map(h=>q(r[h])).join(","))].join("\r\n");}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function csvDownload(rows:Record<string,unknown>[],name:string){download(new Blob(["\uFEFF",csv(rows)],{type:"text/csv;charset=utf-8"}),name);}
function excelDownload(detail:Record<string,unknown>[],summary:Record<string,unknown>[],name:string){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(detail),"Detailed Screenings");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),"Participant Summary");XLSX.writeFile(wb,name);}
export function ProgrammeExportButtons({roster,screenings}:Props){const detail=detailedRows(screenings),summary=summaryRows(roster,screenings),base=safe(roster.programmeName);return <section className="space-y-3 rounded-xl border border-card-border bg-white p-5">
 <div><h2 className="font-semibold">Export programme data</h2><p className="mt-1 text-sm text-muted">Download anonymous screening data for this programme. No participant names or contact details are included.</p></div>
 <div className="flex flex-wrap gap-3"><button className={button} onClick={()=>csvDownload(detail,base+"-detailed-screenings.csv")}>Detailed screenings CSV</button><button className={button} onClick={()=>csvDownload(summary,base+"-participant-summary.csv")}>Participant summary CSV</button><button className={button} onClick={()=>excelDownload(detail,summary,base+"-screening-export.xlsx")}>Excel workbook</button></div>
 <p className="text-sm text-muted">{screenings.length} screening record{screenings.length===1?"":"s"} available for export.</p>
 </section>;}
