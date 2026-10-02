"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteOrganisationUser, updateMemberRole, removeMember, updatePlatformRole, type Directory } from "@/app/actions/users";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
const control = "rounded-lg border border-card-border bg-white px-3 py-2 text-sm disabled:opacity-50";
const roles = ["client_admin", "hr", "occupational_health", "executive"];
export function UserDirectory({ directory }: { directory: Directory }) {
  const router = useRouter(); const [query, setQuery] = useState(""); const [message, setMessage] = useState<string | null>(null); const [pending, start] = useTransition();
  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => { const result = await action(); setMessage(result.ok ? "User access saved." : result.error ?? "Could not save."); if (result.ok) router.refresh(); });
  }
  return <div className="space-y-6"><PortalPageHeader title="Users & Roles" description="Manage organisation memberships and view registered users." />
    {message && <p role="status" className="rounded-lg border p-3 text-sm">{message}</p>}
    <form className="grid gap-3 rounded-lg border border-card-border bg-white p-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); run(() => inviteOrganisationUser({ organisationId: String(data.get("organisation")), email: String(data.get("email")), fullName: String(data.get("name")), role: String(data.get("role")) })); }}>
      <h2 className="font-semibold md:col-span-2">Invite or add an organisation user</h2><p className="text-sm text-muted md:col-span-2">New users receive a setup email. Existing users are added to the selected organisation.</p>
      <label className="grid gap-1 text-sm">Full name<input required name="name" minLength={2} maxLength={160} className={control} /></label><label className="grid gap-1 text-sm">Email<input required name="email" type="email" className={control} /></label>
      <label className="grid gap-1 text-sm">Organisation<select required name="organisation" className={control} defaultValue=""><option value="">Choose organisation</option>{directory.organisations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Role<select name="role" className={control}>{roles.map(role => <option key={role}>{role}</option>)}</select></label><button disabled={pending} className={control}>{pending ? "Saving…" : "Add user"}</button>
    </form>
    <label className="block"><span className="sr-only">Search users</span><input className={`${control} w-full`} placeholder="Search name or email" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {directory.users.filter(user => `${user.fullName} ${user.email}`.toLowerCase().includes(query.toLowerCase())).map(user => <section key={user.id} className="space-y-3 rounded-lg border border-card-border bg-white p-4"><h2 className="font-semibold">{user.fullName}</h2><p className="text-sm">{user.email} · {user.confirmed ? "Confirmed" : "Awaiting confirmation"}</p>
      {user.platformRole && <label className="flex items-center gap-3 text-sm">Platform role {directory.canManagePlatform && user.platformRole !== "super_admin" ? <select aria-label={`Platform role for ${user.fullName}`} className={control} disabled={pending} value={user.platformRole} onChange={event => run(() => updatePlatformRole(user.id, event.target.value))}>{["super_admin", "operations", "business_development", "finance", "wellness_coordinator"].map(role => <option key={role}>{role}</option>)}</select> : <span>{user.platformRole}</span>}</label>}
      {user.memberships.map(member => <div key={member.id} className="flex flex-wrap items-center gap-3 text-sm"><span>{member.organisationName}</span>{roles.includes(member.role) ? <><select aria-label={`Role for ${user.fullName} at ${member.organisationName}`} className={control} disabled={pending} value={member.role} onChange={event => run(() => updateMemberRole(member.id, event.target.value))}>{roles.map(role => <option key={role}>{role}</option>)}</select><button className={control} disabled={pending} onClick={() => { if (window.confirm(`Remove ${user.fullName}'s access to ${member.organisationName}?`)) run(() => removeMember(member.id)); }}>Remove access</button></> : <span>{member.role}</span>}</div>)}
    </section>)}
  </div>;
}
