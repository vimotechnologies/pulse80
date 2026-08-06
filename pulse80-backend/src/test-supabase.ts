import { env } from "./config/env.js";

async function testSupabaseConnection(): Promise<void> {
  const restEndpoint = new URL("/rest/v1/", env.SUPABASE_URL);
  const response = await fetch(restEndpoint, {
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Supabase rejected the credentials. Copy the project URL and secret key from the same Supabase project.",
      );
    }

    throw new Error(
      `Supabase REST API returned ${response.status} ${response.statusText}`,
    );
  }

  await response.body?.cancel();
  console.log("Supabase connection succeeded.");
}

testSupabaseConnection().catch((error: unknown) => {
  console.error("Supabase connection test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
