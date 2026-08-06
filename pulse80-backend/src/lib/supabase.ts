import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "../config/env.js";

type SupabaseClientOptions = NonNullable<Parameters<typeof createClient>[2]>;
type RealtimeTransport = NonNullable<
  NonNullable<SupabaseClientOptions["realtime"]>["transport"]
>;

// Supabase supports `ws` on Node 20, but its constructor interface is narrower
// than the overloads exposed by @types/ws. The runtime APIs are compatible.
const websocketTransport = WebSocket as unknown as RealtimeTransport;

/**
 * Used for requests executed on behalf of an authenticated user.
 *
 * Later, the user's access token will be added to a request-scoped client
 * so Supabase Row-Level Security can identify the current user.
 */
export const publicSupabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_PUBLISHABLE_KEY,
  {
    realtime: {
      transport: websocketTransport,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

/**
 * Administrative server-only client.
 *
 * This client may bypass Row-Level Security depending on the key being used.
 * It must never be imported into the frontend.
 */
export const adminSupabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  {
    realtime: {
      transport: websocketTransport,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
