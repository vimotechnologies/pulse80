"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <section role="alert" className="rounded-2xl border border-card-border bg-white p-6 text-black">
    <h1 className="text-lg font-semibold">Your dashboard could not be loaded</h1>
    <p className="mt-2 text-sm">We could not retrieve your organisation’s information. Please try again.</p>
    <button onClick={reset} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Try again</button>
  </section>;
}
