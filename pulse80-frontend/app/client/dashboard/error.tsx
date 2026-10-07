"use client";

export default function ClientDashboardError({ reset }: { reset: () => void }) {
  return <section className="space-y-4 rounded-2xl border border-card-border bg-white p-5">
    <h1 className="text-xl font-semibold">Dashboard unavailable</h1>
    <p role="alert">Your organisation’s metrics could not be loaded.</p>
    <button type="button" onClick={reset} className="rounded-xl bg-primary px-4 py-2 text-white">Try again</button>
  </section>;
}
