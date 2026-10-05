import type { SupabaseClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { GraphQLError } from "graphql";
import { z } from "zod";
import type { Database } from "../../generated/database.types.js";

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;

export const rosterStatusSchema = z.object({
  eligibilityStatus: z.enum(["Eligible", "Not Eligible"]),
  registrationStatus: z.enum(["Invited", "Registered", "Declined", "Withdrawn"]),
}).strict();
export const rosterEntrySchema = rosterStatusSchema.extend({
  screeningReference: z.string().trim().min(2).max(80).optional(),
  employeeId: z.uuid().nullish(),
});
export const rosterImportSchema = z.array(rosterEntrySchema).min(1).max(500).superRefine((rows, context) => {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (!row.screeningReference) return;
    if (seen.has(row.screeningReference)) context.addIssue({ code: "custom", path: [index, "screeningReference"], message: `Row ${index + 1}: duplicate screening code.` });
    seen.add(row.screeningReference);
  });
});
export type RosterEntry = z.infer<typeof rosterEntrySchema>;
export function parseRoster<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new GraphQLError(result.error.issues[0]?.message ?? "Invalid roster entry.", { extensions: { code: "BAD_USER_INPUT" } });
  return result.data;
}
export function rosterDatabaseError(error: { message: string; code?: string }): never {
  if (["23505", "23514", "P0001"].includes(error.code ?? "")) {
    throw new GraphQLError(error.code === "23505" ? "A screening code or employee already exists in this programme. No rows were imported." : error.message, { extensions: { code: "BAD_USER_INPUT" } });
  }
  throw new Error(error.message);
}
const fields = "id, programme_id, employee_id, screening_reference, eligibility_status, registration_status";
const shape = (row: Database["public"]["Tables"]["programme_participants"]["Row"]) => ({
  id: row.id, programmeId: row.programme_id, employeeId: row.employee_id,
  screeningReference: row.screening_reference, eligibilityStatus: row.eligibility_status, registrationStatus: row.registration_status,
});
const randomCode = () => Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export class ProgrammeRosterService {
  constructor(private readonly db: SupabaseClient<Database>, private readonly organisationId?: string) {}

  private async programme(id: string) {
    let query = this.db.from("programmes").select("id, organisation_id, name").eq("id", id);
    if (this.organisationId !== undefined) query = query.eq("organisation_id", this.organisationId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new GraphQLError("Programme is unavailable.", { extensions: { code: "FORBIDDEN" } });
    return data;
  }

  private async existingCodes(programmeId: string) {
    const codes = new Set<string>();
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await this.db.from("programme_participants").select("screening_reference")
        .eq("programme_id", programmeId).range(offset, offset + 999);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) if (row.screening_reference) codes.add(row.screening_reference);
      if ((data?.length ?? 0) < 1000) break;
    }
    return codes;
  }

  private async withGeneratedCodes(programmeId: string, entries: RosterEntry[]) {
    const used = await this.existingCodes(programmeId);
    for (const entry of entries) if (entry.screeningReference) used.add(entry.screeningReference);
    return entries.map(entry => {
      if (entry.screeningReference) return entry;
      let screeningReference = randomCode();
      while (used.has(screeningReference)) screeningReference = randomCode();
      used.add(screeningReference);
      return { ...entry, screeningReference };
    });
  }

  async list(programmeId: string, offset: number) {
    const programme = await this.programme(programmeId);
    const { data, error, count } = await this.db.from("programme_participants").select(fields, { count: "exact" })
      .eq("programme_id", programme.id).order("id").range(offset, offset + 99);
    if (error) throw new Error(error.message);
    return { programmeId, programmeName: programme.name, total: count ?? 0, participants: (data ?? []).map(shape) };
  }

  async import(programmeId: string, entries: RosterEntry[]) {
    const programme = await this.programme(programmeId);
    const prepared = await this.withGeneratedCodes(programme.id, entries);
    const { data, error } = await this.db.rpc("import_programme_roster", {
      p_programme_id: programme.id, p_organisation_id: programme.organisation_id,
      p_rows: prepared.map(row => ({ screening_reference: row.screeningReference, employee_id: row.employeeId ?? null,
        eligibility_status: row.eligibilityStatus, registration_status: row.registrationStatus })),
    });
    if (error) rosterDatabaseError(error);
    return data;
  }

  async updateStatus(programmeId: string, id: string, status: z.infer<typeof rosterStatusSchema>) {
    const programme = await this.programme(programmeId);
    const { data, error } = await this.db.rpc("set_programme_roster_status", {
      p_programme_id: programmeId, p_organisation_id: programme.organisation_id, p_participant_id: id,
      p_eligibility_status: status.eligibilityStatus, p_registration_status: status.registrationStatus,
    }).single();
    if (error) rosterDatabaseError(error);
    if (!data) throw new GraphQLError("Participant is unavailable.", { extensions: { code: "BAD_USER_INPUT" } });
    return shape(data);
  }
}
