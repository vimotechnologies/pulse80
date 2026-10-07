"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, getVerifiedSession } from "@/lib/supabase/server";
export async function loadAccount() {
  const { userId, email } = await getVerifiedSession();
  const db = await createClient();
  const profile = await db.from("profiles").select("full_name,phone,avatar_url").eq("id", userId).single();
  if (profile.error) throw new Error("Could not load your account.");
  return { fullName: profile.data.full_name ?? "", phone: profile.data.phone ?? "", avatarUrl: profile.data.avatar_url, email };
}
export async function saveAccount(input: { fullName: string; phone: string }) {
  const parsed = z.object({ fullName: z.string().trim().min(2).max(160), phone: z.string().trim().max(40) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a name of 2–160 characters and a valid phone number." };
  let userId: string;
  try { userId = (await getVerifiedSession()).userId; }
  catch { return { ok: false, error: "Please sign in again." }; }
  const db = await createClient();
  const result = await db.from("profiles").update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null }).eq("id", userId).select("id").single();
  if (result.error) return { ok: false, error: "Your account could not be updated." };
  revalidatePath("/admin", "layout"); revalidatePath("/client", "layout");
  return { ok: true };
}
