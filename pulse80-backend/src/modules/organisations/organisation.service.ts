import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export interface UpdateOrganisationInput {
  name?: string;
  slug?: string;
}

export class OrganisationService {
  constructor(private readonly supabase: TypedSupabase) {}

  async getById(organisationId: string) {
    const { data, error } = await this.supabase
      .from("organisations")
      .select("id, name, slug, created_at, updated_at")
      .eq("id", organisationId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(organisationId: string, input: UpdateOrganisationInput) {
    const { data, error } = await this.supabase
      .from("organisations")
      .update(input)
      .eq("id", organisationId)
      .select("id, name, slug, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
