import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. Proxy refreshes sessions.
        }
      },
    },
  });
}

export async function getVerifiedSession() {
  const supabase = await createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.auth.getClaims(session.access_token);
  const claims = data?.claims;
  if (error || typeof claims?.sub !== "string") throw new Error("UNAUTHENTICATED");

  return {
    accessToken: session.access_token,
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
  };
}
