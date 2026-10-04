import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export interface ContactInput {
  id?: string;
  name: string;
  roleLabel: string;
  email: string;
  phone?: string | null;
  method: string;
  primary: boolean;
  notes?: string | null;
}

export interface OrganisationInput {
  name?: string;
  slug?: string;
  industry?: string;
  country?: string;
  primaryLocation?: string;
  region?: string;
  employees?: number;
  package?: string;
  contractStart?: string;
  contractEnd?: string;
  status?: string;
  customPackageNotes?: string | null;
  logoDataUrl?: string | null;
  removeLogo?: boolean;
  contacts?: ContactInput[];
}

const organisationSelect = `
  id, name, slug, code, industry, country, primary_location, region,
  workforce_size, package_name, contract_start, contract_end, status,
  wellness_risk_score, logo_path, custom_package_notes, created_at, updated_at,
  organisation_contacts (
    id, full_name, role_label, email, phone, preferred_method,
    is_primary, notes
  )
`;

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "organisation";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ORG";
}

export class OrganisationService {
  constructor(private readonly supabase: TypedSupabase) {}

  // Branding must not join contacts: client roles can read their organisation
  // but do not have table-level access to organisation_contacts.
  async getBrandingById(organisationId: string) {
    const { data, error } = await this.supabase
      .from("organisations")
      .select("name, logo_path")
      .eq("id", organisationId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async listBranding() {
    const { data, error } = await this.supabase
      .from("organisations")
      .select("name, logo_path")
      .order("name");
    if (error) throw new Error(error.message);
    return data;
  }

  async list() {
    const { data, error } = await this.supabase
      .from("organisations")
      .select(organisationSelect)
      .order("name");
    if (error) throw new Error(error.message);
    return data;
  }

  async getById(organisationId: string) {
    const { data, error } = await this.supabase
      .from("organisations")
      .select(organisationSelect)
      .eq("id", organisationId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async create(input: Required<Omit<OrganisationInput, "slug" | "logoDataUrl" | "removeLogo" | "customPackageNotes">> & Pick<OrganisationInput, "logoDataUrl" | "customPackageNotes">) {
    const slugBase = slugify(input.name);
    const suffix = crypto.randomUUID().slice(0, 6);
    const slug = `${slugBase}-${suffix}`;
    const code = `${initials(input.name)}-${suffix.toUpperCase()}`;
    const { data, error } = await this.supabase
      .from("organisations")
      .insert({
        name: input.name,
        slug,
        code,
        industry: input.industry,
        country: input.country,
        primary_location: input.primaryLocation,
        region: input.region,
        workforce_size: input.employees,
        package_name: input.package,
        contract_start: input.contractStart,
        contract_end: input.contractEnd,
        status: input.status,
        custom_package_notes: input.customPackageNotes ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    try {
      await this.saveContacts(data.id, input.contacts);
      if (input.logoDataUrl) await this.saveLogo(data.id, input.logoDataUrl);
      return await this.getById(data.id);
    } catch (error_) {
      await this.supabase.from("organisations").delete().eq("id", data.id);
      throw error_;
    }
  }

  async update(organisationId: string, input: OrganisationInput) {
    const fields: Record<string, string | number | null> = {};
    if (input.name !== undefined) fields.name = input.name;
    if (input.slug !== undefined) fields.slug = input.slug;
    if (input.industry !== undefined) fields.industry = input.industry;
    if (input.country !== undefined) fields.country = input.country;
    if (input.primaryLocation !== undefined) fields.primary_location = input.primaryLocation;
    if (input.region !== undefined) fields.region = input.region;
    if (input.employees !== undefined) fields.workforce_size = input.employees;
    if (input.package !== undefined) fields.package_name = input.package;
    if (input.contractStart !== undefined) fields.contract_start = input.contractStart;
    if (input.contractEnd !== undefined) fields.contract_end = input.contractEnd;
    if (input.status !== undefined) fields.status = input.status;
    if (input.customPackageNotes !== undefined) fields.custom_package_notes = input.customPackageNotes;

    if (Object.keys(fields).length || input.contacts) {
      const { error } = await this.supabase.rpc("save_admin_organisation", {
        p_organisation_id: organisationId,
        p_fields: fields,
        p_contacts: input.contacts ? input.contacts.map((contact) => ({
          ...(contact.id ? { id: contact.id } : {}),
          name: contact.name,
          role_label: contact.roleLabel,
          email: contact.email,
          phone: contact.phone ?? null,
          method: contact.method,
          primary: contact.primary,
          notes: contact.notes ?? null,
        })) : null,
      });
      if (error) throw new Error(error.message);
    }
    if (input.removeLogo) await this.removeLogo(organisationId);
    if (input.logoDataUrl) await this.saveLogo(organisationId, input.logoDataUrl);
    return this.getById(organisationId);
  }

  private async saveContacts(organisationId: string, contacts: ContactInput[]) {
    const { error } = await this.supabase.rpc("save_admin_organisation", {
      p_organisation_id: organisationId,
      p_fields: {},
      p_contacts: contacts.map((contact) => ({
        ...(contact.id ? { id: contact.id } : {}),
        name: contact.name,
        role_label: contact.roleLabel,
        email: contact.email,
        phone: contact.phone ?? null,
        method: contact.method,
        primary: contact.primary,
        notes: contact.notes ?? null,
      })),
    });
    if (error) throw new Error(error.message);
  }

  private async saveLogo(organisationId: string, dataUrl: string) {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) throw new Error("Unsupported logo format.");
    const bytes = Buffer.from(match[2]!, "base64");
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) {
      throw new Error("Logo must be smaller than 2 MB.");
    }
    const extension = match[1] === "image/jpeg" ? "jpg" : match[1]!.split("/")[1]!;
    const path = `${organisationId}/logo.${extension}`;
    const { error } = await this.supabase.storage
      .from("organisation-logos")
      .upload(path, bytes, { contentType: match[1], upsert: true });
    if (error) throw new Error(error.message);
    const { error: updateError } = await this.supabase
      .from("organisations")
      .update({ logo_path: path })
      .eq("id", organisationId);
    if (updateError) throw new Error(updateError.message);
  }

  private async removeLogo(organisationId: string) {
    const { data } = await this.supabase
      .from("organisations")
      .select("logo_path")
      .eq("id", organisationId)
      .single();
    if (data?.logo_path) {
      await this.supabase.storage.from("organisation-logos").remove([data.logo_path]);
    }
    const { error } = await this.supabase
      .from("organisations")
      .update({ logo_path: null })
      .eq("id", organisationId);
    if (error) throw new Error(error.message);
  }
}
