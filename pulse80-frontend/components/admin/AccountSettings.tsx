"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveAccount, type loadAccount } from "@/app/actions/account";
import { updatePractitionerPassword } from "@/app/actions/practitioner-profile";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
export function AccountSettings({ account }: { account: Awaited<ReturnType<typeof loadAccount>> }) {
  const [message, setMessage] = useState<string | null>(null); const [pending, start] = useTransition();
  const control = "block w-full rounded-lg border border-card-border px-3 py-2 text-sm";
  return <div className="max-w-2xl space-y-6"><PortalPageHeader title="Settings" description="Manage your account details and password." />{message && <p role="status">{message}</p>}
    <form className="space-y-4 rounded-lg border bg-white p-5" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); start(async () => { const result = await saveAccount({ fullName: String(data.get("name")), phone: String(data.get("phone")) }); setMessage(result.ok ? "Account saved." : result.error ?? "Could not save."); }); }}>
      <label className="block text-sm">Name<input required minLength={2} maxLength={160} name="name" defaultValue={account.fullName} className={control} /></label><label className="block text-sm">Phone<input name="phone" maxLength={40} defaultValue={account.phone} className={control} /></label><p className="text-sm">Email: {account.email}</p><button disabled={pending} className={control}>Save account</button>
    </form>
    <form className="space-y-4 rounded-lg border bg-white p-5" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const password = String(new FormData(form).get("password")); start(async () => { const result = await updatePractitionerPassword(password); setMessage(result.ok ? "Password updated." : result.error); if (result.ok) form.reset(); }); }}>
      <label className="block text-sm">New password<input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} className={control} /></label><button disabled={pending} className={control}>Update password</button>
    </form>
    <p className="text-sm">Manage client names and PDF logos on the <Link className="text-primary underline" href="/admin/organizations">organisations page</Link>.</p>
  </div>;
}
