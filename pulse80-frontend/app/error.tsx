"use client";
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-xl font-semibold">This page could not be loaded</h1><p className="text-sm">Check your access to this workflow, then try again. If the problem continues, contact your administrator.</p><button className="rounded-lg border px-4 py-2 text-sm" onClick={reset}>Try again</button></section>;
}
