export default function DashboardLoading() {
  return <div role="status" className="space-y-5 text-black">
    <p className="text-sm">Loading your organisation’s dashboard…</p>
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(index => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}</div>
  </div>;
}
