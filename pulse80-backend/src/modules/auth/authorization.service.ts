import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../generated/database.types.js";
import {
  isOrganisationRole,
  isPlatformRole,
  type OrganisationRole,
  type PlatformRole,
} from "./roles.js";

type TypedSupabase = SupabaseClient<Database>;

export interface OrganisationAccess {
  membershipId: string;
  organisationId: string;
  role: OrganisationRole;
}

export class AuthorizationService {
  constructor(private readonly supabase: TypedSupabase) {}

  async getPlatformRole(userId: string): Promise<PlatformRole | null> {
    const { data, error } = await this.supabase
      .from("platform_staff_memberships")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    if (!isPlatformRole(data.role)) {
      throw new Error(`Unsupported platform role: ${data.role}`);
    }

    return data.role;
  }

  async getOrganisationAccess(
    userId: string,
    organisationId: string,
  ): Promise<OrganisationAccess | null> {
    const { data, error } = await this.supabase
      .from("organisation_memberships")
      .select(
        `
          id,
          organisation_id,
          role
        `,
      )
      .eq("profile_id", userId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    if (!isOrganisationRole(data.role)) {
      throw new Error(`Unsupported organisation role: ${data.role}`);
    }

    return {
      membershipId: data.id,
      organisationId: data.organisation_id,
      role: data.role,
    };
  }
}
