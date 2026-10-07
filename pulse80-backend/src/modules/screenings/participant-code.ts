import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../generated/database.types.js";
import { rosterDatabaseError } from "../programme-roster/roster.service.js";

// Shared preflight for both capture paths. The insert trigger repeats validation
// inside the write transaction so a concurrent roster change cannot bypass it.
export async function resolveScreeningParticipant(db: SupabaseClient<Database>, assignmentId: string, userId: string, reference: string) {
  const { data, error } = await db.rpc("resolve_programme_screening_participant", {
    p_assignment_id: assignmentId, p_practitioner_user_id: userId, p_participant_reference: reference.trim(),
  });
  if (error) rosterDatabaseError(error);
  if (!data) throw new Error("Participant code could not be validated.");
  return data;
}
