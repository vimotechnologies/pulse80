import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";

export const recordKinds = ["invoice", "payment", "request", "recommendation", "report"] as const;
export type RecordKind = typeof recordKinds[number];
export const recordStatuses: Record<RecordKind, readonly string[]> = {
  invoice: ["Draft", "Due", "Paid", "Cancelled", "Archived"],
  payment: ["Pending", "Approved", "Paid", "Cancelled", "Archived"],
  request: ["New", "In Review", "Approved", "Declined", "Archived"],
  recommendation: ["Draft", "Published", "In Progress", "Completed", "Archived"],
  report: ["Draft", "In Review", "Published", "Archived"],
};
export type RecordInput = {
  organisationId: string; practitionerUserId?: string | null; title: string;
  description: string; status: string; amount?: number | null; currency: string; dueOn?: string | null;
};
const selection = "*, organisations(name,logo_path), practitioner_profiles(profiles(full_name))" as const;

export class PortalRecordService {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async list(kind: RecordKind, scope: { organisationId?: string; practitionerUserId?: string; publishedOnly?: boolean } = {}) {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      let query = this.db.from("portal_records").select(selection).eq("kind", kind)
        .order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
      if (scope.organisationId) query = query.eq("organisation_id", scope.organisationId);
      if (scope.practitionerUserId) query = query.eq("practitioner_user_id", scope.practitionerUserId);
      if (scope.publishedOnly) query = query.in("status", kind === "report" ? ["Published"] : ["Published", "In Progress", "Completed"]);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    return rows.map(row => this.record(row));
  }

  async save(kind: RecordKind, id: string | undefined, input: RecordInput, actorId: string) {
    const payload = {
      organisation_id: input.organisationId, practitioner_user_id: input.practitionerUserId ?? null,
      title: input.title, description: input.description, status: input.status,
      amount: input.amount ?? null, currency: input.currency, due_on: input.dueOn ?? null,
      updated_by: actorId, updated_at: new Date().toISOString(),
    };
    const query = id
      ? this.db.from("portal_records").update(payload).eq("id", id).eq("kind", kind)
      : this.db.from("portal_records").insert({ ...payload, kind, created_by: actorId });
    const { data, error } = await query.select(selection).single();
    if (error) throw new Error(error.message);
    return this.record(data);
  }

  private record(row: Parameters<typeof toRecord>[0]) {
    return { ...toRecord(row), organisationLogoUrl: row.organisations?.logo_path
      ? this.db.storage.from("organisation-logos").getPublicUrl(row.organisations.logo_path).data.publicUrl : null };
  }

  async options(kind: RecordKind) {
    const organisations = [];
    const practitioners = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await this.db.from("organisations").select("id,name").order("id").range(offset, offset + 499);
      if (error) throw new Error(error.message);
      organisations.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    if (kind === "payment") {
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await this.db.from("practitioner_profiles").select("user_id,profiles(full_name)").order("user_id").range(offset, offset + 499);
        if (error) throw new Error(error.message);
        practitioners.push(...(data ?? []).map(row => ({ id: row.user_id, name: row.profiles?.full_name ?? "Practitioner" })));
        if (!data || data.length < 500) break;
      }
    }
    return { organisations, practitioners };
  }
}

function toRecord(row: Database["public"]["Tables"]["portal_records"]["Row"] & {
  organisations: { name: string; logo_path: string | null } | null; practitioner_profiles: { profiles: { full_name: string | null } | null } | null;
}) {
  return {
    id: row.id, kind: row.kind, organisationId: row.organisation_id,
    organisationName: row.organisations?.name ?? "Organisation",
    practitionerUserId: row.practitioner_user_id, practitionerName: row.practitioner_profiles?.profiles?.full_name ?? null,
    title: row.title, description: row.description, status: row.status, amount: row.amount,
    currency: row.currency, dueOn: row.due_on, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
