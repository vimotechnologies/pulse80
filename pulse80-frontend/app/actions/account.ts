"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function loadAccount() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new Error("UNAUTHENTICATED");
  const profile = await db.from("profiles").select("full_name,phone,avatar_url").eq("id", user.id).single();
  if (profile.error) throw new Error("Could not load your account.");
  return { fullName: profile.data.full_name ?? "", phone: profile.data.phone ?? "", avatarUrl: profile.data.avatar_url, email: user.email ?? "" };
}
export async function saveAccount(input: { fullName: string; phone: string }) {
  const parsed = z.object({ fullName: z.string().trim().min(2).max(160), phone: z.string().trim().max(40) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a name of 2–160 characters and a valid phone number." };
  const db = await createClient(); const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { ok: false, error: "Please sign in again." };
  const result = await db.from("profiles").update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null }).eq("id", user.id).select("id").single();
  if (result.error) return { ok: false, error: "Your account could not be updated." };
  revalidatePath("/admin", "layout"); revalidatePath("/client", "layout");
  return { ok: true };
}
