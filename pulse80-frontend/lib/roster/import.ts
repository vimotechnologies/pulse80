import type { RosterEntry, EligibilityStatus, RegistrationStatus } from "@/types/programme-roster";

export const rosterHeaders = ["screening_reference", "eligibility_status", "registration_status"] as const;
export function parseRosterRows(rows: unknown[][]): RosterEntry[] {
  const headers = rows[0]?.map(value => String(value ?? "").trim());
  if (!headers || rosterHeaders.some(header => !headers.includes(header)) || headers.some(header => ![...rosterHeaders, "employee_id"].includes(header)) || new Set(headers).size !== headers.length) {
    throw new Error("Use screening_reference, eligibility_status, registration_status, and optionally employee_id columns only. Do not include names or screening results.");
  }
  const content = rows.slice(1).filter(row => row.some(value => value !== "" && value !== null && value !== undefined));
  if (!content.length || content.length > 500) throw new Error("Import between 1 and 500 participants at a time.");
  const seen = new Set<string>();
  return content.map((row, index) => {
    const field = (name: string) => row[headers.indexOf(name)];
    const rawCode = field("screening_reference");
    if (typeof rawCode !== "string") throw new Error(`Row ${index + 2}: format the screening code as text to preserve leading zeros.`);
    const screeningReference = rawCode.trim();
    if (screeningReference.length < 2 || screeningReference.length > 80) throw new Error(`Row ${index + 2}: code must be 2–80 characters.`);
    if (seen.has(screeningReference)) throw new Error(`Row ${index + 2}: duplicate screening code.`);
    seen.add(screeningReference);
    const eligibilityStatus = String(field("eligibility_status") ?? "").trim() as EligibilityStatus;
    const registrationStatus = String(field("registration_status") ?? "").trim() as RegistrationStatus;
    if (!["Eligible", "Not Eligible"].includes(eligibilityStatus) || !["Invited", "Registered", "Declined", "Withdrawn"].includes(registrationStatus)) throw new Error(`Row ${index + 2}: choose a valid eligibility and registration status.`);
    const employeeId = String(field("employee_id") ?? "").trim();
    if (employeeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) throw new Error(`Row ${index + 2}: employee_id must be a UUID or empty.`);
    return { screeningReference, eligibilityStatus, registrationStatus, ...(employeeId ? { employeeId } : {}) };
  });
}

export async function readRosterFile(file: File): Promise<RosterEntry[]> {
  if (!/\.(csv|xls|xlsx)$/i.test(file.name)) throw new Error("Choose a CSV, XLS or XLSX file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Roster files must be at most 2 MB.");
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", raw: true, cellFormula: true });
  if (workbook.SheetNames.length !== 1) throw new Error("Use a workbook with one roster sheet.");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The roster sheet is empty.");
  if (Object.entries(sheet).some(([key, cell]) => !key.startsWith("!") && cell?.f)) throw new Error("Use plain values in roster cells, not formulas.");
  return parseRosterRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" }));
}
