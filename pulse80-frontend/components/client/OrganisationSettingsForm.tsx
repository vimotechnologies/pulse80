"use client";

import { useState } from "react";

import {
  updateOrganisationAction,
  type Organisation,
} from "@/app/actions/organisation";

export function OrganisationSettingsForm({
  initialOrganisation,
}: {
  initialOrganisation: Organisation;
}) {
  const [organisation, setOrganisation] = useState(initialOrganisation);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const result = await updateOrganisationAction(formData);

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    setOrganisation(result.organisation);
    setSuccess("Organisation profile saved successfully.");
    setPending(false);
  }

  return (
    <section className="rounded-2xl border border-card-border bg-white p-6 shadow-card">
      <div className="border-b border-card-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Organisation profile
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-navy">Manage company details</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/60">
          Changes are validated by the Pulse80 GraphQL API and protected by organisation permissions and database RLS.
        </p>
      </div>

      <form action={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-navy">
          Organisation name
          <input
            name="name"
            defaultValue={organisation.name}
            required
            minLength={2}
            maxLength={160}
            className="h-12 rounded-xl border border-card-border px-4 font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-navy">
          Organisation slug
          <input
            name="slug"
            defaultValue={organisation.slug}
            required
            minLength={2}
            maxLength={80}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="h-12 rounded-xl border border-card-border px-4 font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <span className="text-xs font-normal text-navy/45">
            Lowercase letters, numbers, and hyphens only.
          </span>
        </label>

        <div className="sm:col-span-2">
          {error ? (
            <p role="alert" className="rounded-xl border border-pulse-red/15 bg-pulse-red/5 px-4 py-3 text-sm font-medium text-pulse-red">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-card-border pt-5 sm:col-span-2">
          <p className="text-xs text-navy/45">
            Last updated {new Date(organisation.updatedAt).toLocaleString()}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save organisation"}
          </button>
        </div>
      </form>
    </section>
  );
}
