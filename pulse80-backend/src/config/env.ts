import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  SUPABASE_URL: z.string().url(),

  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("sb_publishable_", "Must start with sb_publishable_"),

  SUPABASE_SECRET_KEY: z
    .string()
    .startsWith("sb_secret_", "Must start with sb_secret_"),
});

const parsedEnvironment = envSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error("Invalid environment configuration:");
  console.error(
    parsedEnvironment.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsedEnvironment.data;
