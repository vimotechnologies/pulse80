"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export default function AccountSetupPage() {
  const [ready, setReady] = useState(false); const [message, setMessage] = useState("Checking your invitation…"); const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    async function verify() {
      const db = createClient(); const hash = new URLSearchParams(window.location.hash.slice(1)); const query = new URLSearchParams(window.location.search);
      const access = hash.get("access_token"); const refresh = hash.get("refresh_token"); const code = query.get("code");
      window.history.replaceState(null, "", "/auth/setup");
      if (hash.get("error") || query.get("error")) throw new Error("This invitation is invalid or expired.");
      if (access && refresh) { const { error } = await db.auth.setSession({ access_token: access, refresh_token: refresh }); if (error) throw error; }
      else if (code) { const { error } = await db.auth.exchangeCodeForSession(code); if (error) throw error; }
      const { data: { user }, error } = await db.auth.getUser();
      if (error || !user) throw new Error("This invitation is invalid or expired.");
      if (active) { setReady(true); setMessage("Choose a password to finish setting up your account."); }
    }
    void verify().catch(() => { if (active) setMessage("This invitation is invalid or expired. Ask your administrator for help."); });
    return () => { active = false; };
  }, []);
  return <main className="mx-auto max-w-md space-y-5 p-8"><h1 className="text-xl font-semibold">Set up your Pulse80 account</h1><p role="status" className="text-sm">{message}</p>{ready && <form className="space-y-4" onSubmit={async event => { event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get("password")); if (password !== data.get("confirmation")) { setMessage("Passwords must match."); return; } setSaving(true); try { const db = createClient(); const { error } = await db.auth.updateUser({ password }); if (error) throw error; await db.auth.signOut(); setReady(false); setMessage("Password saved. Sign in to access your workspace."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your password. Please try again."); } finally { setSaving(false); } }}>
    <label className="block text-sm">New password<input className="mt-2 w-full rounded border p-2" required name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" /></label><label className="block text-sm">Confirm password<input className="mt-2 w-full rounded border p-2" required name="confirmation" type="password" minLength={8} maxLength={128} autoComplete="new-password" /></label><button disabled={saving} className="rounded bg-primary px-4 py-2 text-white">{saving ? "Saving…" : "Save password"}</button></form>}<Link className="inline-block text-primary underline" href="/login">Sign in</Link></main>;
}
